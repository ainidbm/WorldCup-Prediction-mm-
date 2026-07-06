"""
部署前 JSON 数据校验脚本

读取 predictions.json 和 accuracy.json，校验 4 大模块数据完整性：
1. 夺冠概率排行 - 不包含已淘汰队伍
2. 淘汰赛晋级图 - 已完成比赛有比分，未完成有预测
3. 最佳射手预测 Top10 - 数据完整
4. 模型准确率 - 比赛场数正确更新

校验失败只发 CI 警告，不断部署。
Usage: python backend/validate_output.py [deploy_dir]
"""

import json
import os
import sys


def warn(msg: str):
    """GitHub Actions 警告格式"""
    _safe_print(f"::warning::[数据校验] {msg}")
    global warning_count
    warning_count += 1


def ok(msg: str):
    """成功信息"""
    _safe_print(f"  [OK] {msg}")


def err(msg: str):
    """错误信息（不阻断，只是更严重的警告）"""
    _safe_print(f"::error::[数据校验] {msg}")
    global warning_count
    warning_count += 1


def _safe_print(msg: str):
    """安全打印，避免 Windows 控制台编码错误"""
    try:
        print(msg)
    except UnicodeEncodeError:
        import sys
        safe = msg.encode(sys.stdout.encoding, errors="replace").decode(sys.stdout.encoding)
        print(safe)


warning_count = 0


def load_json(path: str) -> dict | None:
    """安全加载 JSON"""
    if not os.path.exists(path):
        warn(f"文件不存在: {path}")
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        err(f"JSON 解析失败: {path} - {e}")
        return None


def validate_champion_prob(predictions: dict):
    """校验夺冠概率排行：不包含已淘汰队伍"""
    champion_prob = predictions.get("championProb", [])
    knockout = predictions.get("knockoutBracket", {})

    if not champion_prob:
        warn("夺冠概率排行 (championProb) 为空！")
        return

    # 收集已被淘汰的队伍（在 knockoutBracket 已完成比赛中落败）
    eliminated_teams = set()
    rounds = knockout.get("rounds", [])
    for rnd in rounds:
        for match in rnd.get("matches", []):
            if match.get("completed") and match.get("winner"):
                # 负者是被淘汰的队伍
                if match.get("teamA") == match["winner"]:
                    eliminated_teams.add(match.get("teamB", ""))
                else:
                    eliminated_teams.add(match.get("teamA", ""))

    # 检查 championProb 中是否有已淘汰队伍
    for entry in champion_prob:
        if entry.get("team") in eliminated_teams:
            warn(f"已淘汰队伍 '{entry['team']}' 仍出现在夺冠概率排行中！")

    # 检查团队数量合理性
    team_count = len(champion_prob)
    if team_count < 2:
        warn(f"夺冠概率排行仅 {team_count} 支队伍（过少）")
    elif team_count > 32:
        warn(f"夺冠概率排行有 {team_count} 支队伍（过多）")

    ok(f"夺冠概率排行：{team_count} 支队伍，已淘汰队伍 {len(eliminated_teams)} 支")


def validate_knockout_bracket(predictions: dict):
    """校验淘汰赛晋级图：已完成比赛有比分，未完成有预测"""
    knockout = predictions.get("knockoutBracket", {})
    rounds = knockout.get("rounds", [])

    if not rounds:
        warn("淘汰赛晋级图 (knockoutBracket.rounds) 为空！")
        return

    total_completed = 0
    total_pending = 0
    completed_with_scores = 0
    pending_with_probs = 0
    pending_with_pred_scores = 0

    for rnd in rounds:
        for match in rnd.get("matches", []):
            if match.get("completed"):
                total_completed += 1
                if "scoreA" in match and "scoreB" in match and "winner" in match:
                    completed_with_scores += 1
                else:
                    warn(f"已完成比赛 {match.get('id', '?')} 缺少比分/胜者信息")
            else:
                total_pending += 1
                # 只在两队都已知时才要求预测数据
                team_a = match.get("teamA", "")
                team_b = match.get("teamB", "")
                teams_known = team_a and team_b and team_a != "待定" and team_b != "待定"
                if teams_known:
                    if "probA" in match and "probB" in match:
                        pending_with_probs += 1
                    else:
                        warn(f"未完成比赛 {match.get('id', '?')} ({team_a} vs {team_b}) 缺少胜率预测")
                    if "predScoreA" in match and "predScoreB" in match:
                        pending_with_pred_scores += 1
                else:
                    # 对阵未确定，不要求预测数据
                    pending_with_probs += 1  # 算作"合理跳过"
                    pending_with_pred_scores += 1

    ok(f"淘汰赛晋级图：{len(rounds)} 轮，已完成 {total_completed} 场（{completed_with_scores} 有比分），"
       f"待进行 {total_pending} 场（{pending_with_probs} 有胜率，{pending_with_pred_scores} 有预测比分）")

    if total_completed > 0 and completed_with_scores < total_completed:
        warn(f"{total_completed - completed_with_scores} 场已完成比赛缺失比分数据！")
    if total_pending > 0 and pending_with_probs < total_pending:
        warn(f"{total_pending - pending_with_probs} 场未完成比赛缺失胜率预测！")


def validate_top_scorers(predictions: dict):
    """校验最佳射手预测：数据完整"""
    top_scorers = predictions.get("topScorers", [])

    if not top_scorers:
        warn("最佳射手预测 (topScorers) 为空！")
        return

    required_fields = ["player", "team", "existingGoals", "predictedGoals"]
    complete_count = 0
    for s in top_scorers:
        if all(f in s for f in required_fields):
            complete_count += 1
        else:
            missing = [f for f in required_fields if f not in s]
            warn(f"射手 '{s.get('player', '?')}' 缺少字段: {missing}")

    team_set = set(s.get("team", "") for s in top_scorers)
    ok(f"最佳射手预测：{complete_count}/{len(top_scorers)} 条完整数据，覆盖 {len(team_set)} 支球队")


def validate_accuracy(accuracy: dict):
    """校验模型准确率：比赛场数正确更新"""
    if not accuracy:
        err("模型准确率 (accuracy.json) 为空！")
        return

    required_fields = [
        "groupStageAccuracy", "knockoutAccuracy",
        "overallAccuracy", "totalMatchesEvaluated", "correctPredictions",
        "groupMatches", "knockoutMatches",
    ]
    missing = [f for f in required_fields if f not in accuracy]
    if missing:
        warn(f"准确率数据缺少字段: {missing}")

    total = accuracy.get("totalMatchesEvaluated", 0)
    correct = accuracy.get("correctPredictions", 0)
    group = accuracy.get("groupMatches", 0)
    knockout = accuracy.get("knockoutMatches", 0)

    if total <= 0:
        warn("totalMatchesEvaluated 为 0 或负数，准确率数据可能未更新！")
    else:
        ok(f"模型准确率：{correct}/{total} 场 ({group} 小组赛 + {knockout} 淘汰赛)")

    # 校验 accuracy 值范围
    for key in ["groupStageAccuracy", "knockoutAccuracy", "overallAccuracy"]:
        val = accuracy.get(key, -1)
        if not (0 <= val <= 1):
            warn(f"{key} = {val}，超出 0-1 合理范围")


def main():
    deploy_dir = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "docs"
    )

    pred_path = os.path.join(deploy_dir, "predictions.json")
    acc_path = os.path.join(deploy_dir, "accuracy.json")

    print("=" * 50)
    print("  部署前数据校验")
    print("=" * 50)
    print(f"  目录: {deploy_dir}")
    print()

    predictions = load_json(pred_path)
    accuracy = load_json(acc_path)

    if predictions is None and accuracy is None:
        err("predictions.json 和 accuracy.json 均不可用，无法校验")
        sys.exit(0)  # 不阻断部署

    # 4 大模块校验
    print("--- 夺冠概率排行 ---")
    if predictions:
        validate_champion_prob(predictions)

    print("\n--- 淘汰赛晋级图 ---")
    if predictions:
        validate_knockout_bracket(predictions)

    print("\n--- 最佳射手预测 ---")
    if predictions:
        validate_top_scorers(predictions)

    print("\n--- 模型准确率 ---")
    if accuracy:
        validate_accuracy(accuracy)

    print()
    print("=" * 50)
    if warning_count == 0:
        _safe_print("  校验通过，所有 4 大模块数据完整 [OK]")
    else:
        _safe_print(f"  校验完成，共 {warning_count} 项警告（不阻断部署）")
    print("=" * 50)

    # 始终返回 0（不阻断 CI）
    sys.exit(0)


if __name__ == "__main__":
    main()
