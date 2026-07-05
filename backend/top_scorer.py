"""
射手预测模块

加权公式：
预测总进球 = 已进球 + 剩余场次 × 场均射门数 × 射门转化率 × 出场概率
"""
from typing import Dict, List, Any


# 默认射手数据（小组赛进球者汇总 + 估算属性）
DEFAULT_SHOTS_PER_GAME = {
    "姆巴佩": 5.0, "哈兰德": 4.5, "凯恩": 4.0, "梅西": 3.5,
    "维尼修斯": 4.0, "C罗": 3.0, "贝林厄姆": 3.0, "亚马尔": 3.5,
    "萨拉赫": 3.5, "劳塔罗": 3.0, "孙兴慜": 3.0, "穆夏拉": 3.0,
    "加克波": 3.0, "普利西奇": 3.0, "哲科": 2.5, "希克": 3.0,
    "久保建英": 3.0, "三笘薰": 2.5, "布拉欣·迪亚斯": 2.5,
    "恩内斯里": 3.0, "J罗": 2.5, "路易斯·迪亚斯": 3.0,
    "努涅斯": 3.5, "巴尔韦德": 2.0, "伊萨克": 3.5,
    "哲凯赖什": 3.0, "库杜斯": 3.0, "莫德里奇": 1.5,
    "德布劳内": 2.0, "多库": 3.0, "奥彭达": 3.0,
    "萨卡": 3.0, "帕尔默": 2.5, "福登": 2.5,
    "萨比策": 2.0, "扎卡": 1.5, "乔纳森·戴维": 3.0,
    "戴维斯": 1.5, "居莱尔": 2.5, "耶尔德兹": 2.5,
    "尼科·威廉姆斯": 2.5, "佩德里": 1.5, "罗德里": 1.0,
    "塔雷米": 3.0, "马赫雷斯": 2.5, "阿穆拉": 2.0,
    "莱默": 2.0, "麦肯尼": 2.0, "巴洛贡": 2.5,
}

DEFAULT_CONVERSION_RATE = 0.12  # 默认射门转化率
DEFAULT_APPEARANCE_PROB = 0.85  # 默认出场概率


def _is_excluded(scorer: str) -> bool:
    """判断进球者是否应排除（乌龙球或点球大战）"""
    return "(乌龙)" in scorer or "(点球)" in scorer


def _extract_group_scorers(group_results: list) -> Dict[str, Dict[str, Any]]:
    """从小组赛结果中提取射手统计"""
    scorers = {}

    for match in group_results:
        # 处理 A 队射手（过滤乌龙球）
        for scorer in match.get("scorersA", []):
            if _is_excluded(scorer):
                continue
            if scorer not in scorers:
                scorers[scorer] = {"goals": 0, "team": match["teamA"], "matches": 0}
            scorers[scorer]["goals"] += 1

        # 处理 B 队射手（过滤乌龙球）
        for scorer in match.get("scorersB", []):
            if _is_excluded(scorer):
                continue
            if scorer not in scorers:
                scorers[scorer] = {"goals": 0, "team": match["teamB"], "matches": 0}
            scorers[scorer]["goals"] += 1

    # 计算每人出场场次（简化：按所属球队的小赛比赛场数）
    team_matches = {}
    for match in group_results:
        for team in [match["teamA"], match["teamB"]]:
            team_matches[team] = team_matches.get(team, 0) + 1

    # 每队每场2个半场比赛，每人出场次数约等于队比赛场次 * 0.85
    for scorer, data in scorers.items():
        team = data["team"]
        total_team_matches = team_matches.get(team, 3)
        data["matches"] = total_team_matches  # 简化为全部出场

    return scorers


def _extract_knockout_scorers(bracket: dict) -> Dict[str, Dict[str, Any]]:
    """
    从淘汰赛结果中提取射手统计。

    只计入常规时间/加时赛进球（scorersA/B），
    不计入点球大战进球（penaltyA/B）。
    """
    scorers = {}
    results = bracket.get("results", [])

    for match in results:
        for scorer in match.get("scorersA", []):
            if _is_excluded(scorer):
                continue
            if scorer not in scorers:
                scorers[scorer] = {"goals": 0, "team": match["teamA"], "matches": 0}
            scorers[scorer]["goals"] += 1

        for scorer in match.get("scorersB", []):
            if _is_excluded(scorer):
                continue
            if scorer not in scorers:
                scorers[scorer] = {"goals": 0, "team": match["teamB"], "matches": 0}
            scorers[scorer]["goals"] += 1

    return scorers


def _estimate_remaining_matches(team: str, stage_probs: Dict) -> float:
    """
    估算剩余场次。
    基于蒙特卡洛模拟中的晋级概率：
    - 进入 8 强 = 额外 1 场
    - 进入 4 强 = 额外 1 场
    - 进入决赛 = 额外 1 场
    - 夺冠 = 额外 1 场（三四名决赛不计）
    """
    probs = stage_probs.get(team, {})
    remaining = 0.0
    remaining += probs.get("quarter", 0.5)   # 晋级8强的概率 = 打8强赛
    remaining += probs.get("semi", 0.25)     # 晋级4强
    remaining += probs.get("final", 0.125)   # 晋级决赛
    remaining += probs.get("champion", 0.06) # 冠军赛
    return max(remaining, 0.5)  # 至少还有 0.5 场（16强本身）


def predict_top_scorers(
    teams: Dict,
    group_results: list,
    stage_probs: Dict,
    bracket: dict = None,
) -> List[Dict[str, Any]]:
    """
    预测最佳射手 Top 10。

    公式：预测总进球 = 已进球 + 剩余场次 × 场均射门 × 转化率 × 出场概率
    """
    group_scorers = _extract_group_scorers(group_results)

    # 合并淘汰赛进球（如有）
    if bracket:
        knockout_scorers = _extract_knockout_scorers(bracket)
        for player, data in knockout_scorers.items():
            if player in group_scorers:
                group_scorers[player]["goals"] += data["goals"]
            else:
                group_scorers[player] = data

    predictions = []
    for player, data in group_scorers.items():
        existing_goals = data["goals"]
        team = data["team"]
        remaining = _estimate_remaining_matches(team, stage_probs)

        shots_per_game = DEFAULT_SHOTS_PER_GAME.get(player, 2.5)
        conversion_rate = DEFAULT_CONVERSION_RATE
        appearance_prob = DEFAULT_APPEARANCE_PROB

        predicted_additional = remaining * shots_per_game * conversion_rate * appearance_prob
        predicted_total = existing_goals + predicted_additional

        predictions.append({
            "player": player,
            "team": team,
            "existingGoals": existing_goals,
            "predictedGoals": round(predicted_total, 1),
            "remainingMatches": round(remaining, 1),
        })

    # 按预测总进球排序，取 Top 10
    predictions.sort(key=lambda x: x["predictedGoals"], reverse=True)
    return predictions[:10]
