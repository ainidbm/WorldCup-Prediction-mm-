# 2026 世界杯预测项目 · 长期记忆

## 项目概述
- 2026 FIFA 世界杯 AI 预测引擎（Python 后端 + React/TypeScript 前端）
- 部署在 GitHub Pages: https://ainidbm.github.io/WorldCup-Prediction-mm-/
- GitHub 仓库: https://github.com/ainidbm/WorldCup-Prediction-mm-

## 技术栈
- 后端: Python (numpy, scikit-learn, pandas)，随机森林模型 + 蒙特卡洛 10000 次模拟
- 前端: React + TypeScript + Vite，Recharts 图表，lucide-react 图标
- 部署: GitHub Actions → GitHub Pages
- Python venv: `C:\Users\32739\.workbuddy\binaries\python\envs\default\Scripts\python.exe`

## 项目结构
- `backend/` — Python 预测引擎 (main.py, model.py, features.py, monte_carlo.py, output.py, top_scorer.py, config.py)
- `frontend/` — React 前端 (src/components/, src/data/loader.ts, src/styles/global.css)
- `docs/` — 预测输出 (predictions.json, accuracy.json) + 交接文档
- `backend/data/` — 输入数据 (teams.json, group_results.json, knockout_bracket.json, historical_matches.csv)

## 关键设计决策
- 淘汰赛晋级图使用 SVG 连线树形布局，MatchCard 显示已完成比赛比分 + 未完成比赛胜率+预测比分
- 预测比分算法: Poisson PMF 搜索最可能整数比分，基于小组赛统计 + 胜率概率混合
- 胜率硬上限 85%，超出部分按比例分配给平局和另一方

## 当前数据状态 (2026-07-05)
- 14 支存活球队，法国 19.5% 夺冠概率领先
- 16 场 R16 + 2 场 QF 已完成，6 场 QF 待定
- 模型准确率 78.99% (交叉验证)
