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
) -> Dict[str, Any]:
    """生成 predictions.json 的完整数据结构"""

    # 夺冠概率排行（降序）
    champion_prob = sorted(
        [{"team": team, "prob": round(probs["champion"], 4)} for team, probs in stage_probs.items()],
        key=lambda x: x["prob"],
        reverse=True,
    )

    # 各阶段晋级概率
    stage_prob_detail = {}
    for team, probs in stage_probs.items():
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
    }


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
