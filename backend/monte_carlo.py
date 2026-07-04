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
) -> Dict[str, str]:
    """
    模拟一次完整淘汰赛。

    返回:
        {match_id: winner_team} 所有比赛的结果
    """
    results = {}

    # 16 强赛
    for match in bracket["round_of_16"]:
        winner = _simulate_match_cached(match["teamA"], match["teamB"], prob_cache, rng)
        results[match["id"]] = winner

    # 按 bracket_structure 逐轮模拟
    structure = bracket["bracket_structure"]

    for round_name in ["quarter", "semi", "final", "championship"]:
        for match in structure[round_name]:
            from_matches = match["from"]
            team_a = results[from_matches[0]]
            team_b = results[from_matches[1]]
            winner = _simulate_match_cached(team_a, team_b, prob_cache, rng)
            results[match["id"]] = winner

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
        results = _simulate_one_tournament(bracket, prob_cache, rng)

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

    # 生成 16 强各场比赛的预测详情
    match_predictions = []
    for match in bracket["round_of_16"]:
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

    return stage_probs, match_predictions
