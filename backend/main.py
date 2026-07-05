"""
世界杯冠军预测系统 - 主入口

编排流程：加载数据 -> 特征工程 -> 模型训练 -> 蒙特卡洛模拟 -> 射手预测 -> 输出 JSON
"""
import json
import os
import sys

# 确保可以导入同级模块
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import (
    TEAMS_FILE,
    GROUP_RESULTS_FILE,
    KNOCKOUT_BRACKET_FILE,
    OUTPUT_DIR,
    PREDICTIONS_OUTPUT,
    ACCURACY_OUTPUT,
)
from features import build_feature_engine
from model import train_model, create_match_predictor
from monte_carlo import run_monte_carlo_simulation, compute_remaining_matches
from top_scorer import predict_top_scorers
from output import generate_predictions_json, generate_accuracy_json


def load_json(path: str) -> dict | list:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def main():
    print("=" * 60)
    print("  2026 世界杯冠军预测系统 v1.0")
    print("=" * 60)

    # 1. 加载数据
    print("\n[1/6] 加载数据...")
    teams = load_json(TEAMS_FILE)
    group_results = load_json(GROUP_RESULTS_FILE)
    bracket = load_json(KNOCKOUT_BRACKET_FILE)
    print(f"  - 球队数量: {len(teams)}")
    print(f"  - 小组赛场次: {len(group_results)}")
    print(f"  - 16 强对阵数: {len(bracket.get('round_of_16', []))}")

    # 2. 特征工程
    print("\n[2/6] 构建特征工程...")
    feature_engine = build_feature_engine(teams, group_results)
    print("  - 特征引擎构建完成")

    # 3. 训练模型
    print("\n[3/6] 训练随机森林模型...")
    model, accuracy = train_model(feature_engine, group_results)
    predictor = create_match_predictor(model, feature_engine)
    print(f"  - 模型准确率: {accuracy:.2%}")

    # 4. 蒙特卡洛模拟
    print("\n[4/6] 运行蒙特卡洛模拟 (10000 次)...")
    stage_probs, match_predictions, actual_results = run_monte_carlo_simulation(
        bracket, predictor, teams
    )
    print("  - 模拟完成")

    # 5. 射手预测
    print("\n[5/6] 预测最佳射手 Top 10...")
    remaining_matches = compute_remaining_matches(bracket, stage_probs, actual_results)
    top_scorers = predict_top_scorers(teams, group_results, stage_probs, bracket, remaining_matches)
    print(f"  - Top 10 射手已生成")

    # 6. 输出 JSON
    print("\n[6/6] 生成预测结果 JSON...")
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    predictions = generate_predictions_json(
        stage_probs, match_predictions, top_scorers, feature_engine,
        bracket=bracket, actual_results=actual_results, predictor=predictor,
    )
    with open(PREDICTIONS_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(predictions, f, ensure_ascii=False, indent=2)
    print(f"  - predictions.json -> {PREDICTIONS_OUTPUT}")

    accuracy_data = generate_accuracy_json(accuracy, group_results, predictor)
    with open(ACCURACY_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(accuracy_data, f, ensure_ascii=False, indent=2)
    print(f"  - accuracy.json -> {ACCURACY_OUTPUT}")

    print("\n" + "=" * 60)
    print("  预测完成！")
    print("=" * 60)

    # 打印夺冠概率 Top 5
    print("\n夺冠概率 Top 5:")
    top5 = sorted(stage_probs.items(), key=lambda x: x[1]["champion"], reverse=True)[:5]
    for i, (team, probs) in enumerate(top5, 1):
        print(f"  {i}. {team}: {probs['champion']:.1%}")


if __name__ == "__main__":
    main()
