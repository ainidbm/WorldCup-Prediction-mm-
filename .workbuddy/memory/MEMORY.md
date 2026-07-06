# 项目记忆

## 部署规则
- 用户手动更新 `backend/data/` 中数据后，Git push → GitHub Actions 自动运行
- 手动更新的数据范围：`knockout_bracket.json` + `looking_ahead.xlsx` + `teams.json`
- `looking_ahead.xlsx` 包含每场淘汰赛双方的前瞻数据（维度包括实力、身价、状态、伤病、战术等）
- 前端页面不改变设计和布局，只换数据 JSON
- 部署后自动校验 4 大模块数据完整性，校验失败不阻断部署，仅 CI 日志警告

## 时区处理规则（重要）
- **GitHub Actions 在 UTC 时区运行**，`datetime.now()` 返回的是 UTC 时间
- 生成时间戳必须用 `datetime.now(timezone.utc).isoformat()`（带 `+00:00` 时区标识）
- 前端用 `new Date(ts).toLocaleString('zh-CN')` 会自动转成本地时区显示
- 绝不能使用 naive `datetime.now().isoformat()`，否则在 CI 环境会生成无时区的 UTC 时间，显示错误

## 关键文件
- 后端主入口：`backend/main.py`
- 前瞻数据模块：`backend/looking_ahead.py`
- 数据校验脚本：`backend/validate_output.py`
- CI/CD 工作流：`.github/workflows/deploy.yml`
- 部署目标：GitHub Pages (`https://ainidbm.github.io/WorldCup-Prediction-mm-/`)

## 模型优化记录 (2026-07-06)
- 修复 features.py 的 `recentBest` 字段 bug：teams.json 实际用 `historyBest` 和 `2022年世界杯`
- 特征权重调整：实力分历史冠军权重 0.25→0.10，东道主权重 0.4→0.25
- WIN_RATE_CAP 0.85→0.72，新增 `_calibrate_probs` 概率收缩层
- 比分预测 v3：统计/概率混合 30/70→40/60，概率基线 3.5→3.0
- 历史训练数据补充：8强赛果（挪威2:1巴西、英格兰3:2墨西哥）
- 模型准确率：77.85%（小组赛70.8%，淘汰赛90%）

## Python 运行环境
- 使用 `C:\Users\32739\.workbuddy\binaries\python\versions\3.13.12\python.exe`
- 依赖已安装：scikit-learn, pandas, numpy, openpyxl
- 运行命令：`cd "D:\World Cup championship prediction" && python backend/main.py`
