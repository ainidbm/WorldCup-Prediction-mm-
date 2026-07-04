"""
特征工程模块

为每支球队构建 4 维特征向量，用于随机森林模型输入：
1. 近期状态 (form): 小组赛积分、净胜球、进球数
2. 硬实力 (strength): FIFA 排名、球员总身价、历史大赛成绩
3. 交锋记录 (h2h): 历史交手胜/平/负比率
4. 情境因素 (context): 东道主加分、淘汰赛经验、年龄结构

注意：4 维特征仅作为可解释性展示层，模型使用原始特征训练。
"""
import csv
import os
from typing import Dict, Any

from config import HISTORICAL_FILE, HOST_NATIONS, FEATURE_WEIGHTS


class FeatureEngine:
    def __init__(self, teams: Dict[str, Any], group_results: list, h2h_data: Dict):
        self.teams = teams
        self.group_results = group_results
        self.h2h_data = h2h_data
        self.group_stats = self._compute_group_stats()
        self.feature_cache = {}

    def _compute_group_stats(self) -> Dict[str, Dict]:
        """从小组赛结果中计算每支球队的统计数据"""
        stats = {}
        # 初始化
        for team_name in self.teams:
            stats[team_name] = {
                "points": 0,
                "goals_for": 0,
                "goals_against": 0,
                "goal_diff": 0,
                "wins": 0,
                "draws": 0,
                "losses": 0,
                "played": 0,
            }

        for match in self.group_results:
            team_a, team_b = match["teamA"], match["teamB"]
            score_a, score_b = match["scoreA"], match["scoreB"]

            for team, gf, ga in [(team_a, score_a, score_b), (team_b, score_b, score_a)]:
                if team not in stats:
                    stats[team] = {
                        "points": 0, "goals_for": 0, "goals_against": 0,
                        "goal_diff": 0, "wins": 0, "draws": 0, "losses": 0, "played": 0,
                    }
                s = stats[team]
                s["played"] += 1
                s["goals_for"] += gf
                s["goals_against"] += ga
                s["goal_diff"] += gf - ga

                if gf > ga:
                    s["wins"] += 1
                    s["points"] += 3
                elif gf == ga:
                    s["draws"] += 1
                    s["points"] += 1
                else:
                    s["losses"] += 1

        return stats

    def get_form_score(self, team: str) -> float:
        """近期状态分数 (0-1)：基于小组赛表现"""
        s = self.group_stats.get(team, {})
        if s.get("played", 0) == 0:
            return 0.5

        # 积分归一化 (最高9分)
        points_norm = min(s["points"] / 9.0, 1.0)
        # 净胜球归一化 (范围约 -6 到 +9)
        gd_norm = min(max((s["goal_diff"] + 6) / 15.0, 0), 1.0)
        # 进球数归一化 (最高约10球)
        gf_norm = min(s["goals_for"] / 10.0, 1.0)

        return 0.5 * points_norm + 0.3 * gd_norm + 0.2 * gf_norm

    def get_strength_score(self, team: str) -> float:
        """硬实力分数 (0-1)：基于 FIFA 排名、身价、历史"""
        info = self.teams.get(team, {})

        # FIFA 排名归一化 (排名1 = 1.0, 排名100 = 0.0)
        fifa_rank = info.get("fifaRank", 50)
        rank_score = max(0, (100 - fifa_rank) / 100.0)

        # 身价归一化 (最高约1100M)
        squad_value = info.get("squadValue", 50)
        value_score = min(squad_value / 1100.0, 1.0)

        # 历史大赛成绩
        titles = info.get("majorHistory", {}).get("worldCupTitles", 0)
        history_score = min(titles / 5.0, 1.0)

        return 0.4 * rank_score + 0.35 * value_score + 0.25 * history_score

    def get_h2h_score(self, team_a: str, team_b: str) -> Dict[str, float]:
        """交锋记录：返回 A 胜/平/B 胜的概率"""
        key = tuple(sorted([team_a, team_b]))
        if key in self.h2h_data:
            return self.h2h_data[key]
        # 无历史数据时返回均等概率
        return {"win_a": 0.33, "draw": 0.34, "win_b": 0.33}

    def get_context_score(self, team: str) -> float:
        """情境因素分数 (0-1)"""
        info = self.teams.get(team, {})

        # 东道主加分
        host_bonus = 1.0 if info.get("host", False) else 0.0

        # 淘汰赛经验（基于历史最佳成绩）
        recent_best = info.get("majorHistory", {}).get("recentBest", "")
        experience = 0.3  # 默认
        if "冠军" in recent_best or "4强" in recent_best or "决赛" in recent_best:
            experience = 1.0
        elif "8强" in recent_best or "季军" in recent_best:
            experience = 0.8
        elif "16强" in recent_best:
            experience = 0.5

        # 年龄结构（25-28岁为最佳，偏离越远扣分越多）
        avg_age = info.get("avgAge", 27.0)
        age_score = max(0, 1.0 - abs(avg_age - 26.5) / 10.0)

        return 0.4 * host_bonus + 0.35 * experience + 0.25 * age_score

    def get_match_features(self, team_a: str, team_b: str) -> Dict[str, Any]:
        """获取两队对阵的完整特征向量"""
        cache_key = (team_a, team_b)
        if cache_key in self.feature_cache:
            return self.feature_cache[cache_key]

        form_a = self.get_form_score(team_a)
        form_b = self.get_form_score(team_b)
        strength_a = self.get_strength_score(team_a)
        strength_b = self.get_strength_score(team_b)
        context_a = self.get_context_score(team_a)
        context_b = self.get_context_score(team_b)

        h2h = self.get_h2h_score(team_a, team_b)

        features = {
            # 差值特征（A - B 视角）
            "form_diff": form_a - form_b,
            "strength_diff": strength_a - strength_b,
            "h2h_win_a": h2h["win_a"] if team_a < team_b else h2h["win_b"],
            "context_diff": context_a - context_b,
            # 绝对值特征
            "form_a": form_a,
            "form_b": form_b,
            "strength_a": strength_a,
            "strength_b": strength_b,
            "context_a": context_a,
            "context_b": context_b,
            # 可解释性权重分数
            "explain_form_a": form_a * FEATURE_WEIGHTS["form"],
            "explain_form_b": form_b * FEATURE_WEIGHTS["form"],
            "explain_strength_a": strength_a * FEATURE_WEIGHTS["strength"],
            "explain_strength_b": strength_b * FEATURE_WEIGHTS["strength"],
            "explain_context_a": context_a * FEATURE_WEIGHTS["context"],
            "explain_context_b": context_b * FEATURE_WEIGHTS["context"],
        }

        self.feature_cache[cache_key] = features
        return features

    def get_feature_names(self) -> list:
        """返回模型使用的特征名称列表"""
        return [
            "form_diff", "strength_diff", "h2h_win_a", "context_diff",
            "form_a", "form_b", "strength_a", "strength_b",
            "context_a", "context_b",
        ]

    def get_key_factors(self, team_a: str, team_b: str) -> list:
        """生成可解释性的关键因素（中文）"""
        factors = []
        info_a = self.teams.get(team_a, {})
        info_b = self.teams.get(team_b, {})

        form_a, form_b = self.get_form_score(team_a), self.get_form_score(team_b)
        strength_a, strength_b = self.get_strength_score(team_a), self.get_strength_score(team_b)

        if form_a > form_b + 0.15:
            factors.append(f"{team_a}近期状态更佳")
        elif form_b > form_a + 0.15:
            factors.append(f"{team_b}近期状态更佳")

        if strength_a > strength_b + 0.15:
            factors.append(f"{team_a}整体实力占优")
        elif strength_b > strength_a + 0.15:
            factors.append(f"{team_b}整体实力占优")

        if info_a.get("host"):
            factors.append(f"{team_a}东道主主场优势")
        if info_b.get("host"):
            factors.append(f"{team_b}东道主主场优势")

        titles_a = info_a.get("majorHistory", {}).get("worldCupTitles", 0)
        titles_b = info_b.get("majorHistory", {}).get("worldCupTitles", 0)
        if titles_a > titles_b:
            factors.append(f"{team_a}大赛底蕴更深")
        elif titles_b > titles_a:
            factors.append(f"{team_b}大赛底蕴更深")

        if not factors:
            factors.append("双方实力较为接近")

        return factors[:5]


def _load_h2h_data() -> Dict:
    """从历史数据中构建交锋记录"""
    h2h = {}
    if not os.path.exists(HISTORICAL_FILE):
        return h2h

    with open(HISTORICAL_FILE, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            home, away = row["home_team"], row["away_team"]
            result = row["result"]
            key = tuple(sorted([home, away]))

            if key not in h2h:
                h2h[key] = {"wins": 0, "draws": 0, "losses": 0, "total": 0}

            h2h[key]["total"] += 1
            if result == "H":
                if home == key[0]:
                    h2h[key]["wins"] += 1
                else:
                    h2h[key]["losses"] += 1
            elif result == "A":
                if home == key[0]:
                    h2h[key]["losses"] += 1
                else:
                    h2h[key]["wins"] += 1
            else:
                h2h[key]["draws"] += 1

    # 转换为概率
    result = {}
    for key, data in h2h.items():
        total = data["total"]
        result[key] = {
            "win_a": data["wins"] / total,
            "draw": data["draws"] / total,
            "win_b": data["losses"] / total,
        }
    return result


def build_feature_engine(teams: Dict, group_results: list) -> FeatureEngine:
    """构建特征引擎"""
    h2h_data = _load_h2h_data()
    return FeatureEngine(teams, group_results, h2h_data)
