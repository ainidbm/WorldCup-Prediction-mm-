"""
JSON 输出生成模块

生成 predictions.json 和 accuracy.json，全中文字段。
"""
from datetime import datetime
from typing import Dict, List, Any, Callable


def generate_predictions_json(
    stage_probs: Dict[str, Dict[str, float]],
    match_predictions: List[Dict],
    top_scorers: List[Dict],
    feature_engine: Any = None,
    bracket: Dict = None,
    actual_results: Dict[str, str] = None,
    predictor: Any = None,
) -> Dict[str, Any]:
    """生成 predictions.json 的完整数据结构"""

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
        "generatedAt": datetime.now().isoformat(),
        "championProb": champion_prob,
        "stageProb": stage_prob_detail,
        "matches": enriched_matches,
        "topScorers": top_scorers,
        "knockoutBracket": _build_knockout_bracket(bracket, actual_results, predictor),
    }


def _build_knockout_bracket(
    bracket: Dict,
    actual_results: Dict[str, str],
    predictor: Any,
) -> Dict[str, Any]:
    """构建淘汰赛晋级图数据"""
    if not bracket or not actual_results:
        return {}

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
            elif team_a and team_b and team_a != "待定" and team_b != "待定" and predictor:
                try:
                    p_a, p_draw, p_b = predictor(team_a, team_b)
                    entry["probA"] = round(p_a, 4)
                    entry["probB"] = round(p_b, 4)
                except Exception:
                    pass

            # 记录胜者用于后续轮次推导
            if completed:
                winners[mid] = actual_results[mid]

            matches_out.append(entry)

        rounds.append({"name": stage_names[stage_key], "matches": matches_out})

    return {"rounds": rounds}


def generate_accuracy_json(
    model_accuracy: float,
    group_results: list,
    predictor: Callable,
) -> Dict[str, Any]:
    """生成 accuracy.json"""

    # 用小组赛结果做简单回测
    correct = 0
    total = 0

    for match in group_results:
        team_a, team_b = match["teamA"], match["teamB"]
        score_a, score_b = match["scoreA"], match["scoreB"]

        # 实际结果
        if score_a > score_b:
            actual = "A"
        elif score_a < score_b:
            actual = "B"
        else:
            actual = "D"

        # 模型预测
        try:
            p_a, p_draw, p_b = predictor(team_a, team_b)
            if p_a > p_b and p_a > p_draw:
                predicted = "A"
            elif p_b > p_a and p_b > p_draw:
                predicted = "B"
            else:
                predicted = "D"

            if predicted == actual:
                correct += 1
            total += 1
        except Exception:
            pass

    group_accuracy = correct / total if total > 0 else 0.0

    return {
        "modelAccuracy": round(model_accuracy, 4),
        "groupStageAccuracy": round(group_accuracy, 4),
        "totalMatchesEvaluated": total,
        "correctPredictions": correct,
        "calibrationNote": "基于小组赛结果的回测准确率。模型使用历史赛事数据训练，小组赛结果作为独立验证集。",
    }
