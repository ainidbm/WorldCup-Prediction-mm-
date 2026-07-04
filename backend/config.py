"""
配置模块：路径常量、模型参数、权重定义
"""
import os

# 路径配置
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
OUTPUT_DIR = os.path.join(BASE_DIR, "..", "docs")

TEAMS_FILE = os.path.join(DATA_DIR, "teams.json")
GROUP_RESULTS_FILE = os.path.join(DATA_DIR, "group_results.json")
KNOCKOUT_BRACKET_FILE = os.path.join(DATA_DIR, "knockout_bracket.json")
HISTORICAL_FILE = os.path.join(DATA_DIR, "historical.csv")

PREDICTIONS_OUTPUT = os.path.join(OUTPUT_DIR, "predictions.json")
ACCURACY_OUTPUT = os.path.join(OUTPUT_DIR, "accuracy.json")

# 蒙特卡洛参数
MONTE_CARLO_ITERATIONS = 10000
RANDOM_SEED = 42

# 模型参数
WIN_RATE_CAP = 0.85  # 胜率硬上限 85%
RANDOM_FOREST_PARAMS = {
    "n_estimators": 200,
    "max_depth": 10,
    "min_samples_split": 20,
    "min_samples_leaf": 10,
    "random_state": RANDOM_SEED,
}

# 4 维特征权重（仅用于可解释性展示，不参与模型训练）
FEATURE_WEIGHTS = {
    "form": 0.40,       # 近期状态
    "strength": 0.30,   # 硬实力
    "h2h": 0.15,        # 交锋记录
    "context": 0.15,    # 情境因素
}

# 东道主球队
HOST_NATIONS = {"美国", "加拿大", "墨西哥"}

# 淘汰赛阶段名称
STAGE_NAMES = {
    "round_of_16": "16强",
    "quarter": "8强",
    "semi": "4强",
    "final": "决赛",
    "champion": "冠军",
}
