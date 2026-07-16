"""
随机森林模型模块

使用历史赛事数据训练 RandomForestClassifier，预测单场比赛的胜/平/负概率。
胜率硬上限 85%，超出部分按比例分配给平和负。
"""
import csv
import os
from typing import Callable, Tuple, Dict, Any

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier

from config import (
    HISTORICAL_FILE,
    RANDOM_FOREST_PARAMS,
    WIN_RATE_CAP,
    RANDOM_SEED,
)
from features import FeatureEngine


def _load_historical_matches() -> pd.DataFrame:
    """加载历史赛事 CSV 数据"""
    if not os.path.exists(HISTORICAL_FILE):
        return pd.DataFrame(columns=["home_team", "away_team", "home_goals", "away_goals", "result"])

    # 自动检测编码：先试 UTF-8，失败则用 GBK
    for enc in ["utf-8", "gbk"]:
        try:
            df = pd.read_csv(HISTORICAL_FILE, encoding=enc)
            return df
        except (UnicodeDecodeError, UnicodeError):
            continue
    return pd.DataFrame(columns=["home_team", "away_team", "home_goals", "away_goals", "result"])


def _build_training_data(
    historical_df: pd.DataFrame,
    feature_engine: FeatureEngine,
) -> Tuple[np.ndarray, np.ndarray]:
    """
    从历史数据构建训练集。
    对于历史数据中有记录的球队，使用 teams.json 中的基础属性构建特征。
    对于没有记录的球队，使用统计均值。
    """
    X, y = [], []
    feature_names = feature_engine.get_feature_names()

    # 为历史数据中的球队生成临时特征数据
    all_teams_in_history = set()
    for _, row in historical_df.iterrows():
        all_teams_in_history.add(row["home_team"])
        all_teams_in_history.add(row["away_team"])

    # 对于不在 teams.json 中的球队，注入默认值
    for team in all_teams_in_history:
        if team not in feature_engine.teams:
            feature_engine.teams[team] = {
                "group": "?",
                "tier": "mid",
                "fifaRank": 50,
                "keyPlayers": [],
                "squadValue": 1.0,
                "majorHistory": {"worldCupTitles": 0, "recentBest": "无"},
                "avgAge": 27.0,
                "host": False,
            }
        # 确保小组赛统计存在
        if team not in feature_engine.group_stats:
            feature_engine.group_stats[team] = {
                "points": 4, "goals_for": 3, "goals_against": 3,
                "goal_diff": 0, "wins": 1, "draws": 1, "losses": 1, "played": 3,
            }

    for _, row in historical_df.iterrows():
        home, away = row["home_team"], row["away_team"]
        result = row["result"]  # H=主胜, D=平, A=客胜

        features = feature_engine.get_match_features(home, away)
        feature_vec = [features[name] for name in feature_names]

        X.append(feature_vec)

        if result == "H":
            y.append(0)  # team_a 胜
        elif result == "D":
            y.append(1)  # 平局
        else:
            y.append(2)  # team_b 胜

    return np.array(X), np.array(y)


def _apply_win_cap(probs: np.ndarray) -> np.ndarray:
    """
    应用胜率硬上限 72%。
    如果任一方的胜率超过 72%，将超出部分按比例分配给平局和另一方。
    """
    probs = probs.copy()

    # 检查 team_a 胜率
    if probs[0] > WIN_RATE_CAP:
        excess = probs[0] - WIN_RATE_CAP
        probs[0] = WIN_RATE_CAP
        # 按比例分配给平和 team_b
        remaining = probs[1] + probs[2]
        if remaining > 0:
            probs[1] += excess * (probs[1] / remaining)
            probs[2] += excess * (probs[2] / remaining)
        else:
            probs[1] += excess / 2
            probs[2] += excess / 2

    # 检查 team_b 胜率
    if probs[2] > WIN_RATE_CAP:
        excess = probs[2] - WIN_RATE_CAP
        probs[2] = WIN_RATE_CAP
        remaining = probs[0] + probs[1]
        if remaining > 0:
            probs[0] += excess * (probs[0] / remaining)
            probs[1] += excess * (probs[1] / remaining)
        else:
            probs[0] += excess / 2
            probs[1] += excess / 2

    # 确保概率和为 1
    probs = probs / probs.sum()
    return probs


def _calibrate_probs(probs: np.ndarray) -> np.ndarray:
    """
    概率校准：向均值收缩，减少极端预测。

    淘汰赛冷门率约 30%（FIFA 统计），
    对胜率 > 60% 的一方进行收缩，将部分概率转移给对手和平局。
    """
    probs = probs.copy()

    # 温度收缩参数
    shrink = 0.15

    # 对两方胜率分别向 0.33 收缩
    for i in [0, 2]:
        if probs[i] > 0.55:
            excess = probs[i] - 0.55
            probs[i] -= excess * shrink
            # 将收缩量分配给另外两项
            others = [j for j in range(3) if j != i]
            total_others = sum(probs[j] for j in others)
            if total_others > 0:
                for j in others:
                    probs[j] += excess * shrink * (probs[j] / total_others)
            else:
                probs[others[0]] += excess * shrink / 2
                probs[others[1]] += excess * shrink / 2

    probs = probs / probs.sum()
    return probs


def train_model(
    feature_engine: FeatureEngine,
    group_results: list,
) -> RandomForestClassifier:
    """
    训练随机森林模型。

    返回:
        model: 训练好的 RandomForestClassifier
    """
    historical_df = _load_historical_matches()

    if len(historical_df) < 10:
        print("  警告：历史数据不足，使用默认模型参数")
        model = RandomForestClassifier(**RANDOM_FOREST_PARAMS)
        # 创建合成数据保证模型可运行
        np.random.seed(RANDOM_SEED)
        X_synthetic = np.random.randn(100, 10)
        y_synthetic = np.random.choice([0, 1, 2], size=100, p=[0.4, 0.25, 0.35])
        model.fit(X_synthetic, y_synthetic)
        return model, 0.5

    X, y = _build_training_data(historical_df, feature_engine)

    if len(X) < 20:
        print("  警告：有效训练样本不足，补充合成数据")
        np.random.seed(RANDOM_SEED)
        X_extra = np.random.randn(200, X.shape[1]) * 0.3
        y_extra = np.random.choice([0, 1, 2], size=200, p=[0.4, 0.25, 0.35])
        X = np.vstack([X, X_extra])
        y = np.concatenate([y, y_extra])

    model = RandomForestClassifier(**RANDOM_FOREST_PARAMS)

    # 全量训练
    model.fit(X, y)

    return model


def create_match_predictor(
    model: RandomForestClassifier,
    feature_engine: FeatureEngine,
) -> Callable[[str, str], Tuple[float, float, float]]:
    """
    创建比赛预测函数。

    返回一个函数: predict_match(team_a, team_b) -> (p_win_a, p_draw, p_win_b)
    """
    feature_names = feature_engine.get_feature_names()

    def predict_match(team_a: str, team_b: str) -> Tuple[float, float, float]:
        features = feature_engine.get_match_features(team_a, team_b)
        feature_vec = np.array([[features[name] for name in feature_names]])

        raw_probs = model.predict_proba(feature_vec)[0]

        # 确保长度为 3（模型可能只见过 2 类）
        probs = np.zeros(3)
        for i, cls in enumerate(model.classes_):
            if cls < 3:
                probs[cls] = raw_probs[i]

        # 确保概率和为 1
        if probs.sum() > 0:
            probs = probs / probs.sum()
        else:
            probs = np.array([0.4, 0.25, 0.35])

        # 概率校准：减少极端预测
        probs = _calibrate_probs(probs)

        # 应用胜率上限
        probs = _apply_win_cap(probs)

        return float(probs[0]), float(probs[1]), float(probs[2])

    return predict_match
