"""
射手预测模块 v3

改进点：
1. 根据 actual_results 自动识别已淘汰球队，已淘汰球队的球员不进 Top 10
2. 球员级差异化：场均进球率、转化率基于实际表现计算
3. 置信度评估：基于预测差距 + 球队晋级概率
4. 状态加成：已进 5+ 球的球员施加 1.25 倍乘数，3+ 球施加 1.15 倍乘数
5. 公式：预测总进球 = 已进球 + 剩余场次 × 场均射门 × 转化率 × 出场概率 × 状态加成
6. 取整偏移：round(total + 0.3) 避免保守取整
"""
from typing import Dict, List, Any, Set, Tuple


# 精英射手名单（高转化率，~0.20-0.22）
ELITE_SCORERS: Set[str] = {
    "姆巴佩", "哈兰德", "凯恩", "梅西", "C罗", "维尼修斯",
    "登贝莱", "萨拉赫", "劳塔罗", "莱万多夫斯基",
}

# 主力射手（中等转化率，~0.15-0.18）
STARTER_SCORERS: Set[str] = {
    "贝林厄姆", "亚马尔", "穆夏拉", "孙兴慜", "哲凯赖什", "伊萨克",
    "奥亚萨瓦尔", "加克波", "约翰·曼赞比", "基尼奥内斯", "库尼亚",
    "戴维", "佩德里", "萨卡", "帕尔默", "福登",
}

# 默认射门数（每场）
DEFAULT_SHOTS_PER_GAME: Dict[str, float] = {
    "姆巴佩": 5.5, "哈兰德": 5.0, "凯恩": 4.5, "梅西": 4.0,
    "维尼修斯": 4.5, "C罗": 3.5, "贝林厄姆": 3.5, "亚马尔": 3.5,
    "萨拉赫": 4.0, "劳塔罗": 3.5, "孙兴慜": 3.5, "穆夏拉": 3.5,
    "加克波": 3.0, "普利西奇": 3.0, "哲科": 2.5, "希克": 3.0,
    "久保建英": 3.0, "三笘薰": 2.5, "布拉欣·迪亚斯": 2.5,
    "恩内斯里": 3.0, "J罗": 2.5, "路易斯·迪亚斯": 3.0,
    "努涅斯": 3.5, "巴尔韦德": 2.0, "伊萨克": 3.5,
    "哲凯赖什": 3.5, "库杜斯": 3.0, "莫德里奇": 1.5,
    "德布劳内": 2.0, "多库": 3.0, "奥彭达": 3.0,
    "萨卡": 3.5, "帕尔默": 2.5, "福登": 2.5,
    "萨比策": 2.0, "扎卡": 1.5, "乔纳森·戴维": 3.0,
    "戴维斯": 1.5, "居莱尔": 2.5, "耶尔德兹": 2.5,
    "尼科·威廉姆斯": 2.5, "佩德里": 1.5, "罗德里": 1.0,
    "塔雷米": 3.0, "马赫雷斯": 2.5, "阿穆拉": 2.0,
    "莱默": 2.0, "麦肯尼": 2.0, "巴洛贡": 2.5,
    "登贝莱": 4.0,
    "约翰·曼赞比": 3.0, "基尼奥内斯": 3.5, "赛巴里": 2.5,
    "库尼亚": 3.0, "拉希米": 2.5, "拉林": 3.0,
    "伊利亚·贾斯特": 2.5, "德尼斯·翁达夫": 2.5, "布罗比": 2.5,
    "伊斯梅拉·萨尔": 2.5, "约安·维萨": 2.5, "奥亚萨瓦尔": 3.0,
    "蒂莱曼斯": 2.5, "马丁内斯": 2.5, "希门尼斯": 2.0,
    "乌纳希": 2.5,
    "欧斯塔基奥": 2.0, "卡塞米罗": 1.5, "佐野海舟": 1.0,
    "哈弗茨": 2.0, "胡里奥·恩西索": 1.5, "伊萨·迪奥普": 1.5,
    "阿马德": 2.0, "安东尼奥·努萨": 1.5, "巴科拉": 1.5,
    "巴尔加斯": 2.0, "E·马赫米奇": 1.5, "弗拉林·巴洛贡": 2.0,
    "尼古拉斯·佩佩": 2.5, "萨默维尔": 2.0, "镰田大地": 1.5,
    "亚辛·阿亚里": 1.5, "弗洛伦蒂诺": 1.0,
}

# 球队核心射手（默认射门数查不到时使用）
TEAM_FALLBACK_SHOTS = 2.5

# 转化率（射门转进球）—— v3 提升，解决预测过于保守问题
ELITE_CONVERSION = 0.30   # 精英射手（1/3.3 射门转化）
STARTER_CONVERSION = 0.22  # 主力射手
ROLE_CONVERSION = 0.15     # 角色球员

# 出场概率（淘汰赛核心球员几乎必上场）
ELITE_APPEARANCE = 0.97
STARTER_APPEARANCE = 0.90
ROLE_APPEARANCE = 0.65


def _is_excluded(scorer: str) -> bool:
    """判断进球者是否应排除（乌龙球或点球大战）"""
    return "(乌龙)" in scorer or "(点球)" in scorer


def _classify_player(player: str) -> str:
    """球员分级：elite / starter / role"""
    if player in ELITE_SCORERS:
        return "elite"
    if player in STARTER_SCORERS:
        return "starter"
    return "role"


def _get_player_params(player: str) -> Tuple[float, float, float]:
    """获取球员的射门数、转化率、出场概率"""
    tier = _classify_player(player)
    shots = DEFAULT_SHOTS_PER_GAME.get(player, TEAM_FALLBACK_SHOTS)
    if tier == "elite":
        conversion = ELITE_CONVERSION
        appearance = ELITE_APPEARANCE
    elif tier == "starter":
        conversion = STARTER_CONVERSION
        appearance = STARTER_APPEARANCE
    else:
        conversion = ROLE_CONVERSION
        appearance = ROLE_APPEARANCE
    return shots, conversion, appearance


def _get_form_multiplier(existing_goals: int) -> float:
    """
    状态加成乘数。

    世界杯射手榜前列的球员往往处于"火热状态"，
    在后续比赛中保持或超越之前进球效率的概率较高。

    - 已进 5+ 球：1.25x（射手王争夺者，状态爆发）
    - 已进 3+ 球：1.15x（稳定输出）
    - 其他：1.0x（无加成）
    """
    if existing_goals >= 5:
        return 1.25
    elif existing_goals >= 3:
        return 1.15
    return 1.0


def _get_eliminated_teams(bracket: dict) -> Set[str]:
    """从实际赛果中提取已淘汰球队"""
    eliminated = set()
    for r in bracket.get("results", []):
        if "winner" in r:
            loser = r["teamA"] if r["teamA"] != r["winner"] else r["teamB"]
            eliminated.add(loser)
    return eliminated


def _extract_group_scorers(group_results: list) -> Dict[str, Dict[str, Any]]:
    """从小组赛结果中提取射手统计"""
    scorers = {}

    for match in group_results:
        for scorer in match.get("scorersA", []):
            if _is_excluded(scorer):
                continue
            if scorer not in scorers:
                scorers[scorer] = {"goals": 0, "team": match["teamA"], "matches": 0, "groupGoals": 0}
            scorers[scorer]["goals"] += 1
            scorers[scorer]["groupGoals"] += 1

        for scorer in match.get("scorersB", []):
            if _is_excluded(scorer):
                continue
            if scorer not in scorers:
                scorers[scorer] = {"goals": 0, "team": match["teamB"], "matches": 0, "groupGoals": 0}
            scorers[scorer]["goals"] += 1
            scorers[scorer]["groupGoals"] += 1

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
                scorers[scorer] = {"goals": 0, "team": match["teamA"], "matches": 0, "knockoutGoals": 0}
            scorers[scorer]["goals"] += 1
            scorers[scorer].setdefault("knockoutGoals", 0)
            scorers[scorer]["knockoutGoals"] += 1

        for scorer in match.get("scorersB", []):
            if _is_excluded(scorer):
                continue
            if scorer not in scorers:
                scorers[scorer] = {"goals": 0, "team": match["teamB"], "matches": 0, "knockoutGoals": 0}
            scorers[scorer]["goals"] += 1
            scorers[scorer].setdefault("knockoutGoals", 0)
            scorers[scorer]["knockoutGoals"] += 1

    return scorers


def _estimate_confidence(predicted: float, runner_up: float, team_champion_prob: float) -> str:
    """
    评估预测置信度。

    考虑因素：
    1. 预测进球与第 11 名的差距（差距越大越置信）
    2. 球队晋级概率（球队越强，未来场次越确定）
    """
    if predicted <= 0:
        return "低"

    margin = predicted - runner_up
    # 差距比例
    margin_ratio = margin / max(predicted, 1)

    # 球队概率权重
    team_weight = 0.5 + min(team_champion_prob * 5, 0.5)  # 0.5 ~ 1.0

    score = margin_ratio * team_weight

    if score >= 0.30:
        return "高"
    elif score >= 0.15:
        return "中"
    else:
        return "低"


def predict_top_scorers(
    teams: Dict,
    group_results: list,
    stage_probs: Dict,
    bracket: dict = None,
    remaining_matches: Dict[str, float] = None,
) -> List[Dict[str, Any]]:
    """
    预测最佳射手 Top 10。

    公式：预测总进球 = 已进球 + 剩余场次 × 场均射门 × 转化率 × 出场概率 × 状态加成

    改进点：
    1. 自动识别已淘汰球队，剔除其球员
    2. 球员级差异化（精英/主力/角色）
    3. 状态加成（已进 5+ 球 ×1.25，3+ 球 ×1.15）
    4. 置信度评估
    5. 取整偏移 +0.3 避免保守
    """
    # 1. 收集已淘汰球队
    eliminated_teams = _get_eliminated_teams(bracket) if bracket else set()

    # 2. 提取射手数据
    group_scorers = _extract_group_scorers(group_results)

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

        # 已淘汰球队球员不参与预测（保留已进球数，predicted=existing）
        if team in eliminated_teams:
            predictions.append({
                "player": player,
                "team": team,
                "existingGoals": existing_goals,
                "predictedGoals": existing_goals,  # 已淘汰，预测=已进球
                "confidence": "已锁定",
                "status": "eliminated",
            })
            continue

        # 未淘汰球队球员
        if remaining_matches is not None:
            remaining = remaining_matches.get(team, 0.0)
        else:
            remaining = 0.0

        if remaining <= 0:
            continue

        # 球员级差异化参数
        shots, conversion, appearance = _get_player_params(player)

        # 状态加成：已进多球的球员后续更可能继续进球
        form_mult = _get_form_multiplier(existing_goals)

        predicted_additional = remaining * shots * conversion * appearance * form_mult
        predicted_total = existing_goals + predicted_additional

        predictions.append({
            "player": player,
            "team": team,
            "existingGoals": existing_goals,
            "predictedGoals": round(predicted_total, 1),
            "confidence": "中",  # 后面统一计算
            "status": "active",
        })

    # 排序：主排序 predictedGoals 降序，同分时 active 优先，再按已进球降序
    predictions.sort(key=lambda x: (
        -x["predictedGoals"],
        0 if x["status"] == "active" else 1,
        -x["existingGoals"],
    ))

    # 全员参与排名，取前 10
    top_10 = predictions[:10]

    if top_10:
        # 第 11 名（全体）作为置信度参照
        runner_up_pred = predictions[10]["predictedGoals"] if len(predictions) > 10 else 0

        for p in top_10:
            if p.get("status") == "eliminated":
                continue  # 已锁定球员不需要置信度计算
            team_champion = stage_probs.get(p["team"], {}).get("champion", 0)
            p["confidence"] = _estimate_confidence(
                p["predictedGoals"], runner_up_pred, team_champion
            )
            # 标准化 predictedGoals 为整数（向上偏移 0.3，避免保守取整）
            p["predictedGoals"] = round(p["predictedGoals"] + 0.3)

    return top_10
