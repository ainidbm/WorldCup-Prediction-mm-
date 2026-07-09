"""
JSON 输出生成模块

生成 predictions.json 和 accuracy.json，全中文字段。
"""
import math
from datetime import datetime, timezone
from typing import Dict, List, Any, Callable, Tuple

# 前瞻数据辅助函数（避免循环导入）
from looking_ahead import get_match_analysis_for_match


def generate_predictions_json(
    stage_probs: Dict[str, Dict[str, float]],
    match_predictions: List[Dict],
    top_scorers: List[Dict],
    feature_engine: Any = None,
    bracket: Dict = None,
    actual_results: Dict[str, str] = None,
    predictor: Any = None,
    match_analysis: List[Dict[str, Any]] | None = None,
) -> Dict[str, Any]:
    """生成 predictions.json 的完整数据结构"""
    if match_analysis is None:
        match_analysis = []

    # 夺冠概率排行（降序），过滤已淘汰球队（prob == 0）
    champion_prob = sorted(
        [{"team": team, "prob": round(probs["champion"], 4)}
         for team, probs in stage_probs.items()
         if probs["champion"] > 0],
        key=lambda x: x["prob"],
        reverse=True,
    )

    # 各阶段晋级概率（排除已淘汰球队）
    stage_prob_detail = {}
    for team, probs in stage_probs.items():
        if probs["champion"] == 0 and probs["roundOf16"] > 0:
            # 已淘汰：roundOf16 > 0 但 champion == 0
            continue
        stage_prob_detail[team] = {
            "roundOf16": round(probs["roundOf16"], 4),
            "quarter": round(probs["quarter"], 4),
            "semi": round(probs["semi"], 4),
            "final": round(probs["final"], 4),
            "champion": round(probs["champion"], 4),
        }

    # 为比赛预测添加关键因素
    enriched_matches = []
    for match in match_predictions:
        key_factors = []
        if feature_engine is not None:
            key_factors = feature_engine.get_key_factors(match["teamA"], match["teamB"])

        enriched_match = {
            "matchId": match["matchId"],
            "round": match["round"],
            "teamA": match["teamA"],
            "teamB": match["teamB"],
            "probA": match["probA"],
            "probDraw": match["probDraw"],
            "probB": match["probB"],
            "keyFactors": key_factors,
        }
        enriched_matches.append(enriched_match)

    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "championProb": champion_prob,
        "stageProb": stage_prob_detail,
        "matches": enriched_matches,
        "topScorers": top_scorers,
        "knockoutBracket": _build_knockout_bracket(
            bracket, actual_results, predictor, feature_engine, match_analysis
        ),
        "matchAnalysis": match_analysis,
    }


def _poisson_pmf(k: int, lam: float) -> float:
    """Poisson 概率质量函数 P(X=k | lambda=lam)"""
    if k < 0:
        return 0.0
    if lam <= 0:
        return 1.0 if k == 0 else 0.0
    return (lam ** k) * math.exp(-lam) / math.factorial(k)


def _predict_score(
    team_a: str,
    team_b: str,
    feature_engine: Any,
    prob_a: float,
    prob_b: float,
) -> Tuple[int, int]:
    """
    基于小组赛统计数据 + 胜率概率，预测最可能的比分。

    改进版算法 v3（基于实际赛果校准）：

    根本问题分析：
    - v2 的 30/70 统计/概率混合导致概率偏差直接传导到比分
    - 概率基线 3.5 过高，过度放大强队预期进球
    - 强弱悬殊阈值 0.75 太高，导致 60-75% 区间的非对称放大不触发

    核心改进：
    1. 统计/概率混合 30/70→40/60（统计权重提高，降低概率偏差影响）
    2. 概率基线 3.5→3.0（更保守的预期进球）
    3. 强弱悬殊阈值 0.75→0.65（更早触发非对称调整）
    4. 淘汰赛衰减 0.85→0.88（淘汰赛进球数略高于预期）
    5. Poisson MAP 搜索范围扩展至 0-7 球
    6. 平局修正阈值 0.15→0.12（更积极地打破平局）
    """
    stats_a = feature_engine.group_stats.get(team_a, {})
    stats_b = feature_engine.group_stats.get(team_b, {})

    games_a = max(stats_a.get("played", 3), 1)
    games_b = max(stats_b.get("played", 3), 1)

    # 场均进球 / 失球
    gpg_a = stats_a.get("goals_for", 4) / games_a
    gpg_b = stats_b.get("goals_for", 4) / games_b
    gapg_a = stats_a.get("goals_against", 2) / games_a
    gapg_b = stats_b.get("goals_against", 2) / games_b

    # 交叉预期进球：A 进攻力 vs B 防守力（偏重进攻 55:45）
    xg_a = gpg_a * 0.55 + gapg_b * 0.45
    xg_b = gpg_b * 0.55 + gapg_a * 0.45

    # 淘汰赛微调（0.88）
    xg_a *= 0.88
    xg_b *= 0.88

    # 胜率比例
    total_prob = prob_a + prob_b
    if total_prob > 0:
        ratio_a = prob_a / total_prob
        ratio_b = prob_b / total_prob
    else:
        ratio_a = ratio_b = 0.5

    # 混合：40% 统计 + 60% 概率（提高统计权重，降低概率偏差影响）
    xg_a = xg_a * 0.40 + ratio_a * 3.0 * 0.60
    xg_b = xg_b * 0.40 + ratio_b * 3.0 * 0.60

    # 总进球下限 2.2（淘汰赛场均 2.5 球，但允许稍低）
    xg_total = xg_a + xg_b
    if xg_total < 2.2:
        scale = 2.2 / xg_total
        xg_a *= scale
        xg_b *= scale

    # 强弱悬殊时非对称放大（阈值降低 0.75→0.65）
    if ratio_a > 0.65:
        xg_a = min(xg_a * 1.10, 3.0)
        xg_b = max(xg_b * 0.85, 0.3)
    elif ratio_b > 0.65:
        xg_b = min(xg_b * 1.10, 3.0)
        xg_a = max(xg_a * 0.85, 0.3)

    # 限制范围
    xg_a = max(0.3, min(xg_a, 3.0))
    xg_b = max(0.3, min(xg_b, 3.0))

    # Poisson PMF 搜索最可能的比分（0-7 球范围）
    best_score = (1, 0)
    best_prob = 0.0

    for sa in range(8):
        for sb in range(8):
            p = _poisson_pmf(sa, xg_a) * _poisson_pmf(sb, xg_b)
            if p > best_prob:
                best_prob = p
                best_score = (sa, sb)

    # 避免 0-0（淘汰赛不会 0-0 永远下去）
    if best_score == (0, 0):
        if ratio_a >= ratio_b:
            best_score = (1, 0)
        else:
            best_score = (0, 1)

    # 平局修正：当 MAP 给出平局但胜率差异显著（>12%）时，
    # 给胜率高的一方加 1 球，打破平局
    prob_diff = abs(ratio_a - ratio_b)
    if best_score[0] == best_score[1] and prob_diff > 0.12:
        if ratio_a > ratio_b:
            best_score = (best_score[0] + 1, best_score[1])
        else:
            best_score = (best_score[0], best_score[1] + 1)

    return best_score


def _build_knockout_bracket(
    bracket: Dict,
    actual_results: Dict[str, str],
    predictor: Any,
    feature_engine: Any = None,
    match_analysis: List[Dict[str, Any]] | None = None,
) -> Dict[str, Any]:
    """构建淘汰赛晋级图数据，自动关联前瞻分析"""
    if not bracket or not actual_results:
        return {}
    if match_analysis is None:
        match_analysis = []

    results_map = {}
    for r in bracket.get("results", []):
        results_map[r["id"]] = r

    rounds = []

    # --- 16强 ---
    r16_matches = []
    for m in bracket["round_of_16"]:
        mid = m["id"]
        r = results_map.get(mid, {})
        completed = mid in actual_results
        entry = {
            "id": mid,
            "teamA": m["teamA"],
            "teamB": m["teamB"],
            "completed": completed,
        }
        if completed:
            entry["scoreA"] = r.get("scoreA", 0)
            entry["scoreB"] = r.get("scoreB", 0)
            entry["winner"] = actual_results[mid]
            # 点球信息
            if "penaltyScoreA" in r:
                entry["penaltyScoreA"] = r["penaltyScoreA"]
                entry["penaltyScoreB"] = r["penaltyScoreB"]
        # 关联前瞻分析
        analysis = get_match_analysis_for_match(match_analysis, m["teamA"], m["teamB"])
        if analysis:
            entry["analysis"] = analysis["analysis"]
        r16_matches.append(entry)
    rounds.append({"name": "16强", "matches": r16_matches})

    # --- 后续轮次（8强/4强/决赛/季军赛/冠军赛）---
    structure = bracket["bracket_structure"]
    stage_names = {
        "quarter": "8强",
        "semi": "4强",
        "final": "决赛",
        "third_place": "季军赛",
        "championship": "冠军赛",
    }

    # 追踪每场比赛的胜者（用于推导后续轮次对阵）
    winners = dict(actual_results)  # 复制已有结果

    for stage_key in ["quarter", "semi", "final", "third_place", "championship"]:
        stage_matches_raw = structure.get(stage_key, [])
        if not stage_matches_raw:
            continue

        matches_out = []
        for m in stage_matches_raw:
            mid = m["id"]
            from_ids = m["from"]

            # 推导对阵双方
            team_a = winners.get(from_ids[0]) if len(from_ids) > 0 else None
            team_b = winners.get(from_ids[1]) if len(from_ids) > 1 else None

            # 特殊处理季军赛/冠军赛的 loser 引用
            for i, fid in enumerate(from_ids):
                if fid.endswith("_loser"):
                    # 从对应的比赛中取负者
                    base_id = fid.replace("_loser", "")
                    base_result = results_map.get(base_id, {})
                    if base_id in actual_results and base_result.get("teamA") and base_result.get("teamB"):
                        winner = actual_results[base_id]
                        loser = base_result["teamA"] if base_result["teamB"] == winner else base_result["teamB"]
                        if i == 0:
                            team_a = loser
                        else:
                            team_b = loser

            r = results_map.get(mid, {})
            completed = mid in actual_results

            entry = {
                "id": mid,
                "teamA": team_a or "待定",
                "teamB": team_b or "待定",
                "completed": completed,
            }

            if completed:
                entry["scoreA"] = r.get("scoreA", 0)
                entry["scoreB"] = r.get("scoreB", 0)
                entry["winner"] = actual_results[mid]
                # 点球信息
                if "penaltyScoreA" in r:
                    entry["penaltyScoreA"] = r["penaltyScoreA"]
                    entry["penaltyScoreB"] = r["penaltyScoreB"]
                # 关联前瞻分析
                if team_a and team_b and team_a != "待定" and team_b != "待定":
                    analysis = get_match_analysis_for_match(match_analysis, team_a, team_b)
                    if analysis:
                        entry["analysis"] = analysis["analysis"]
            elif team_a and team_b and team_a != "待定" and team_b != "待定" and predictor:
                try:
                    p_a, p_draw, p_b = predictor(team_a, team_b)
                    # 淘汰赛：平局概率按 50/50 分配给双方（加时/点球）
                    ko_prob_a = p_a + p_draw * 0.5
                    ko_prob_b = p_b + p_draw * 0.5
                    entry["probA"] = round(ko_prob_a, 4)
                    entry["probB"] = round(ko_prob_b, 4)
                    # 预测比分（用原始概率，保留平局可能用于 Poisson 计算）
                    if feature_engine:
                        sa, sb = _predict_score(team_a, team_b, feature_engine, p_a, p_b)
                        entry["predScoreA"] = sa
                        entry["predScoreB"] = sb
                except Exception:
                    pass
                # 关联前瞻分析
                analysis = get_match_analysis_for_match(match_analysis, team_a, team_b)
                if analysis:
                    entry["analysis"] = analysis["analysis"]

            # 记录胜者用于后续轮次推导
            if completed:
                winners[mid] = actual_results[mid]

            matches_out.append(entry)

        rounds.append({"name": stage_names[stage_key], "matches": matches_out})

    return {"rounds": rounds}


def generate_accuracy_json(
    group_results: list,
    predictor: Callable,
    bracket: dict = None,
    accuracy_cache: dict = None,
) -> Dict[str, Any]:
    """生成 accuracy.json，回测小组赛 + 淘汰赛全部已完成比赛

    accuracy_cache 允许冻结历史评估结果，避免重跑模型时改判。
    结构：{
        "group": { "<teamA>|<teamB>": { "actual": "A/B/D", "predicted": "A/B/D", "correct": bool } },
        "knockout": { "<matchId>": { "teamA": ..., "teamB": ..., "winner": ..., "predicted": ..., "correct": ... } },
    }
    """
    if accuracy_cache is None:
        accuracy_cache = {"group": {}, "knockout": {}}

    correct = 0
    total = 0
    group_correct = 0
    group_total = 0
    knockout_correct = 0
    knockout_total = 0
    group_cache = accuracy_cache.setdefault("group", {})
    knockout_cache = accuracy_cache.setdefault("knockout", {})

    # --- 小组赛回测 ---
    for match in group_results:
        team_a, team_b = match["teamA"], match["teamB"]
        score_a, score_b = match["scoreA"], match["scoreB"]
        cache_key = f"{team_a}|{team_b}"

        if score_a > score_b:
            actual = "A"
        elif score_a < score_b:
            actual = "B"
        else:
            actual = "D"

        try:
            if cache_key in group_cache:
                # 沿用缓存的预测结果
                predicted = group_cache[cache_key]["predicted"]
            else:
                p_a, p_draw, p_b = predictor(team_a, team_b)
                if p_a > p_b and p_a > p_draw:
                    predicted = "A"
                elif p_b > p_a and p_b > p_draw:
                    predicted = "B"
                else:
                    predicted = "D"
                group_cache[cache_key] = {
                    "actual": actual,
                    "predicted": predicted,
                    "correct": predicted == actual,
                }

            if predicted == actual:
                correct += 1
                group_correct += 1
            total += 1
            group_total += 1
        except Exception:
            pass

    # --- 淘汰赛回测（仅已完成比赛）---
    if bracket:
        for match in bracket.get("results", []):
            if "winner" not in match:
                continue
            match_id = match["id"]
            team_a, team_b = match["teamA"], match["teamB"]
            winner = match["winner"]

            try:
                if match_id in knockout_cache:
                    # 沿用缓存：直接用缓存的 correct 标志
                    if knockout_cache[match_id].get("correct"):
                        correct += 1
                        knockout_correct += 1
                    total += 1
                    knockout_total += 1
                else:
                    p_a, p_draw, p_b = predictor(team_a, team_b)
                    # 淘汰赛无平局，比较两队胜率
                    if p_a >= p_b:
                        predicted_winner = team_a
                    else:
                        predicted_winner = team_b
                    is_correct = predicted_winner == winner
                    knockout_cache[match_id] = {
                        "teamA": team_a,
                        "teamB": team_b,
                        "winner": winner,
                        "predicted": predicted_winner,
                        "correct": is_correct,
                    }
                    if is_correct:
                        correct += 1
                        knockout_correct += 1
                    total += 1
                    knockout_total += 1
            except Exception:
                pass

    overall_accuracy = correct / total if total > 0 else 0.0
    group_accuracy = group_correct / group_total if group_total > 0 else 0.0
    knockout_accuracy = knockout_correct / knockout_total if knockout_total > 0 else 0.0

    note = (
        f"回测范围：{group_total} 场小组赛 + {knockout_total} 场淘汰赛 = {total} 场。"
        f"小组赛准确率 {group_accuracy:.1%}，淘汰赛准确率 {knockout_accuracy:.1%}。"
        f"模型使用历史赛事数据训练，已完赛结果作为独立验证集。"
    )

    return {
        "groupStageAccuracy": round(group_accuracy, 4),
        "knockoutAccuracy": round(knockout_accuracy, 4),
        "overallAccuracy": round(overall_accuracy, 4),
        "totalMatchesEvaluated": total,
        "correctPredictions": correct,
        "groupMatches": group_total,
        "knockoutMatches": knockout_total,
        "calibrationNote": note,
        "evaluationCache": accuracy_cache,
    }
