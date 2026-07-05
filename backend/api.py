"""
FastAPI 后端 — 对外提供预测 API + 静态前端服务

启动时自动运行完整预测管线并缓存结果。
接口:
  GET  /api/predictions    — 预测数据（夺冠概率、淘汰赛对阵、射手榜）
  GET  /api/accuracy       — 模型准确率回测
  POST /api/regenerate     — 重新生成预测（互动触发）
  GET  /api/health         — 健康检查
  GET  /                  — 静态前端页面
"""
import json
import os
import sys
import time
import threading
from pathlib import Path

# 确保可以导入同级模块
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from config import (
    TEAMS_FILE,
    GROUP_RESULTS_FILE,
    KNOCKOUT_BRACKET_FILE,
    OUTPUT_DIR,
)
from features import build_feature_engine
from model import train_model, create_match_predictor
from monte_carlo import run_monte_carlo_simulation, compute_remaining_matches
from top_scorer import predict_top_scorers
from output import generate_predictions_json, generate_accuracy_json

# ── 应用初始化 ──────────────────────────────────────────────

app = FastAPI(
    title="2026 世界杯冠军预测 API",
    description="基于随机森林 + 蒙特卡洛的世界杯预测引擎",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── 全局缓存 ────────────────────────────────────────────────

_predictions_cache: dict = {}
_accuracy_cache: dict = {}
_cache_lock = threading.Lock()
_last_generated: str = ""


def _load_data():
    """加载所有输入数据"""
    def _read(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    return (
        _read(TEAMS_FILE),
        _read(GROUP_RESULTS_FILE),
        _read(KNOCKOUT_BRACKET_FILE),
    )


def run_prediction_pipeline() -> tuple:
    """运行完整预测管线，返回 (predictions_dict, accuracy_dict)"""
    print("[API] 加载数据...")
    teams, group_results, bracket = _load_data()

    print("[API] 构建特征工程...")
    feature_engine = build_feature_engine(teams, group_results)

    print("[API] 训练随机森林模型...")
    model, accuracy = train_model(feature_engine, group_results)
    predictor = create_match_predictor(model, feature_engine)
    print(f"  - 模型准确率: {accuracy:.2%}")

    print("[API] 运行蒙特卡洛模拟 (10000 次)...")
    stage_probs, match_predictions, actual_results = run_monte_carlo_simulation(
        bracket, predictor, teams
    )

    print("[API] 预测最佳射手 Top 10...")
    remaining_matches = compute_remaining_matches(bracket, stage_probs, actual_results)
    top_scorers = predict_top_scorers(
        teams, group_results, stage_probs, bracket, remaining_matches
    )

    print("[API] 生成 JSON 输出...")
    predictions = generate_predictions_json(
        stage_probs,
        match_predictions,
        top_scorers,
        feature_engine,
        bracket=bracket,
        actual_results=actual_results,
        predictor=predictor,
    )

    accuracy_data = generate_accuracy_json(accuracy, group_results, predictor, bracket)

    print("[API] 管线完成！")
    return predictions, accuracy_data


def _rebuild_cache():
    """重建全局缓存"""
    global _predictions_cache, _accuracy_cache, _last_generated
    with _cache_lock:
        predictions, accuracy_data = run_prediction_pipeline()
        _predictions_cache = predictions
        _accuracy_cache = accuracy_data
        _last_generated = time.strftime("%Y-%m-%d %H:%M:%S")


# ── 事件 ────────────────────────────────────────────────────


@app.on_event("startup")
def startup():
    """启动时自动运行预测管线"""
    print("=" * 50)
    print("  2026 世界杯冠军预测 API 启动中...")
    print("=" * 50)
    try:
        _rebuild_cache()
        print(f"  缓存就绪 — 生成时间: {_last_generated}")
    except Exception as e:
        print(f"  ⚠ 启动时预测失败: {e}")
        print("  将在首次请求时重试...")


# ── API 路由 ────────────────────────────────────────────────


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "lastGenerated": _last_generated,
        "hasCache": bool(_predictions_cache),
    }


@app.get("/api/predictions")
def get_predictions():
    """获取完整预测数据"""
    if not _predictions_cache:
        try:
            _rebuild_cache()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"预测引擎运行失败: {e}")
    return _predictions_cache


@app.get("/api/accuracy")
def get_accuracy():
    """获取模型准确率数据"""
    if not _accuracy_cache:
        try:
            _rebuild_cache()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"准确率计算失败: {e}")
    return _accuracy_cache


@app.post("/api/regenerate")
def regenerate(background_tasks=None):
    """
    触发预测重新生成（互动使用）

    异步执行，立即返回确认。
    完成后可通过 /api/health 查看新的生成时间。
    """
    import asyncio

    async def _async_rebuild():
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, _rebuild_cache)

    try:
        asyncio.create_task(_async_rebuild())
    except RuntimeError:
        # 不在事件循环中（同步调用），直接运行
        threading.Thread(target=_rebuild_cache, daemon=True).start()

    return {
        "message": "预测重新生成已触发，请稍后查询",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
    }


# ── 静态文件（前端） ────────────────────────────────────────

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "dist")


@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    """处理 SPA 路由回退"""
    # 先尝试匹配 API 路由（FastAPI 自动处理 /api/* 路径，此处处理非 API 静态请求）
    file_path = os.path.join(FRONTEND_DIR, full_path) if full_path else ""

    if full_path and os.path.isfile(file_path):
        return FileResponse(file_path)

    # SPA 回退：返回 index.html
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.isfile(index_path):
        return FileResponse(index_path)

    # 前端未构建时返回提示
    return {
        "message": "前端尚未构建。请运行: cd frontend && npm run build",
        "endpoints": {
            "predictions": "/api/predictions",
            "accuracy": "/api/accuracy",
            "health": "/api/health",
        },
    }


# ── 入口 ────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        log_level="info",
    )
