"""
蒙特卡洛赛程模拟模块

10000 次完整淘汰赛模拟，统计每支球队在各阶段的晋级概率。
平局时模拟加时/点球（各 50% 概率）。
"""
import random
from typing import Callable, Tuple, Dict, List, Any

from config import MONTE_CARLO_ITERATIONS, RANDOM_SEED


def _precompute_probabilities(
    teams: List[str],
    predictor: Callable[[str, str], Tuple[float, float, float]],
) -> Dict[Tuple[str, str], Tuple[float, float, float]]:
    """预计算所有可能对阵的概率，避免在模拟循环中重复调用模型"""
    cache = {}
    for i, team_a in enumerate(teams):
        for team_b in teams[i + 1:]:
            probs = predictor(team_a, team_b)
            cache[(team_a, team_b)] = probs
            # 反方向也用同一组概率
            cache[(team_b, team_a)] = (probs[2], probs[1], probs[0])
    return cache


def _simulate_match_cached(
    team_a: str,
    team_b: str,
    prob_cache: Dict[Tuple[str, str], Tuple[float, float, float]],
    rng: random.Random,
) -> str:
    """使用预计算概率模拟单场淘汰赛"""
    p_win_a, p_draw, p_win_b = prob_cache[(team_a, team_b)]

    roll = rng.random()
    if roll < p_win_a:
        return team_a
    elif roll < p_win_a + p_draw:
        # 平局 -> 点球大战（各 50%）
        return team_a if rng.random() < 0.5 else team_b
    else:
        return team_b


def _simulate_one_tournament(
    bracket: Dict,
    prob_cache: Dict,
    rng: random.Random,
    actual_results: Dict[str, str],
) -> Dict[str, str]:
    """
    模拟一次完整淘汰赛。

    actual_results: 已有真实赛果 {match_id: winner}，优先使用。

    返回:
        {match_id: winner_team} 所有比赛的结果
    """
    results = {}

    # 16 强赛
    for match in bracket["round_of_16"]:
        mid = match["id"]
        if mid in actual_results:
            results[mid] = actual_results[mid]
        else:
            results[mid] = _simulate_match_cached(
                match["teamA"], match["teamB"], prob_cache, rng
            )

    # 按 bracket_structure 逐轮模拟
    structure = bracket["bracket_structure"]

    for round_name in ["quarter", "semi", "final", "championship"]:
        for match in structure[round_name]:
            mid = match["id"]
            from_matches = match["from"]
            team_a = results[from_matches[0]]
            team_b = results[from_matches[1]]
            if mid in actual_results:
                results[mid] = actual_results[mid]
            else:
                results[mid] = _simulate_match_cached(
                    team_a, team_b, prob_cache, rng
                )

    return results


def run_monte_carlo_simulation(
    bracket: Dict,
    predictor: Callable,
    teams: Dict,
) -> Tuple[Dict[str, Dict[str, float]], List[Dict]]:
    """
    运行蒙特卡洛模拟。

    返回:
        stage_probs: {team: {roundOf16, quarter, semi, final, champion}}
        match_predictions: 16 强各场比赛的预测详情
    """
    rng = random.Random(RANDOM_SEED)

    # 从 bracket["results"] 中提取已有真实赛果
    actual_results: Dict[str, str] = {}
    for r in bracket.get("results", []):
        if "winner" in r:
            actual_results[r["id"]] = r["winner"]
    print(f"  - 已有 {len(actual_results)} 场真实赛果")

    # 收集所有淘汰赛参赛队
    knockout_teams = set()
    for match in bracket["round_of_16"]:
        knockout_teams.add(match["teamA"])
        knockout_teams.add(match["teamB"])

    knockout_list = sorted(knockout_teams)

    # 预计算所有可能对阵的概率（最多 496 对）
    print(f"  - 预计算 {len(knockout_list)} 队对阵概率...")
    prob_cache = _precompute_probabilities(knockout_list, predictor)
    print(f"  - 已缓存 {len(prob_cache)} 组对阵概率")

    # 初始化统计
    counters = {
        team: {"round_of_16": 0, "quarter": 0, "semi": 0, "final": 0, "champion": 0}
        for team in knockout_teams
    }

    structure = bracket["bracket_structure"]

    # 运行 N 次模拟
    for _ in range(MONTE_CARLO_ITERATIONS):
        results = _simulate_one_tournament(bracket, prob_cache, rng, actual_results)

        # 16 强：所有参赛队
        for team in knockout_teams:
            counters[team]["round_of_16"] += 1

        # 8 强
        for match in structure["quarter"]:
            for from_id in match["from"]:
                counters[results[from_id]]["quarter"] += 1

        # 4 强
        for match in structure["semi"]:
            for from_id in match["from"]:
                counters[results[from_id]]["semi"] += 1

        # 决赛
        for match in structure["final"]:
            for from_id in match["from"]:
                counters[results[from_id]]["final"] += 1

        # 冠军
        for match in structure["championship"]:
            winner = results[match["id"]]
            counters[winner]["champion"] += 1

    # 转换为概率
    n = MONTE_CARLO_ITERATIONS
    stage_probs = {}
    for team, counts in counters.items():
        stage_probs[team] = {
            "roundOf16": counts["round_of_16"] / n,
            "quarter": counts["quarter"] / n,
            "semi": counts["semi"] / n,
            "final": counts["final"] / n,
            "champion": counts["champion"] / n,
        }

    # 生成各轮次比赛预测（仅未完成的比赛）
    match_predictions = []
    # R16 已完成则跳过
    for match in bracket["round_of_16"]:
        if match["id"] in actual_results:
            continue
        p_a, p_draw, p_b = prob_cache[(match["teamA"], match["teamB"])]
        match_predictions.append({
            "matchId": match["id"],
            "round": "16强",
            "teamA": match["teamA"],
            "teamB": match["teamB"],
            "probA": round(p_a, 4),
            "probDraw": round(p_draw, 4),
            "probB": round(p_b, 4),
        })

    return stage_probs, match_predictions, actual_results


def compute_remaining_matches(
    bracket: Dict,
    stage_probs: Dict,
    actual_results: Dict[str, str],
) -> Dict[str, float]:
    """
    计算每支球队的条件剩余场次。

    根据实际赛果确定当前阶段，再用条件概率计算未来期望场次：
    - QF 队伍: 1(保证打QF) + P(SF|QF) + P(决赛轮|QF)
    - SF 队伍: 1(保证打SF) + P(决赛轮|SF)
    - 决赛队伍: 1(保证打冠军赛/季军赛)
    """
    results_map = {}
    for r in bracket.get("results", []):
        results_map[r["id"]] = r
    structure = bracket["bracket_structure"]

    # 确定每支球队已到达的最远已完成轮次
    team_furthest: Dict[str, str] = {}
    for stage_key, round_id in [
        ("championship", "championship"),
        ("final", "final"),
        ("semi", "semi"),
        ("quarter", "quarter"),
    ]:
        for m in structure.get(stage_key, []):
            if m["id"] in actual_results:
                winner = actual_results[m["id"]]
                # 记录该队已到达的最远轮次
                if winner not in team_furthest:
                    team_furthest[winner] = round_id
                # 负者也参与了这场比赛
                r = results_map.get(m["id"], {})
                loser = r["teamA"] if r.get("teamB") == winner else r.get("teamB")
                if loser and loser not in team_furthest:
                    team_furthest[loser] = round_id

    remaining: Dict[str, float] = {}
    for team, probs in stage_probs.items():
        furthest = team_furthest.get(team)

        # 已淘汰的队伍（实际赛果中输了 QF/SF/Final/Championship）
        if furthest in ("quarter", "semi", "final", "championship") and team not in [
            actual_results.get(m["id"])
            for stage in ("quarter", "semi", "final", "championship")
            for m in structure.get(stage, [])
            if m["id"] in actual_results
        ]:
            remaining[team] = 0.0
            continue

        if furthest == "quarter":
            # 已打完QF: 判断是胜者还是败者
            quarter_winners = {
                actual_results.get(m["id"])
                for m in structure.get("quarter", [])
                if m["id"] in actual_results
            }
            if team in quarter_winners:
                # QF 胜者：保证已打 1 场 + 条件概率
                rem = 0.0  # 还未打 SF
                rem += probs["semi"] / max(probs["quarter"], 0.01)  # 期望进 SF
                rem += probs["champion"] / max(probs["quarter"], 0.01)  # 期望最终夺冠
                # SF 阶段才算 1 场
                rem = (probs["semi"] / max(probs["quarter"], 0.01)) * 1.0  \
                    + (probs["final"] / max(probs["quarter"], 0.01)) * 1.0  \
                    + (probs["champion"] / max(probs["quarter"], 0.01)) * 1.0
            else:
                # QF 败者：已淘汰
                remaining[team] = 0.0
                continue
        elif furthest == "semi":
            # 已打完 SF
            semi_winners = {
                actual_results.get(m["id"])
                for m in structure.get("semi", [])
                if m["id"] in actual_results
            }
            if team in semi_winners:
                rem = 1.0  # 保证打 Final
                rem += probs["champion"] / max(probs["semi"], 0.01)  # 期望夺冠
            else:
                remaining[team] = 0.0
                continue
        elif furthest == "championship":
            # 冠军赛已打完，无剩余比赛
            remaining[team] = 0.0
            continue
        elif furthest == "final":
            rem = 1.0
        else:
            # 默认在 QF 阶段（R16 全部完成）
            rem = (probs["semi"] / max(probs["quarter"], 0.01)) * 1.0 \
                + (probs["final"] / max(probs["quarter"], 0.01)) * 1.0 \
                + (probs["champion"] / max(probs["quarter"], 0.01)) * 1.0

        remaining[team] = round(rem, 2)

    return remaining
