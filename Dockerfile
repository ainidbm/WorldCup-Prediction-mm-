# ────────────────────────────────────────────────────
#  Stage 1: 构建前端
# ────────────────────────────────────────────────────
FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend

# 安装依赖
COPY frontend/package.json ./
RUN npm install --registry=https://registry.npmmirror.com 2>/dev/null || npm install

# 复制前端源码并构建（API 模式 + 根路径）
COPY frontend/ ./
ENV VITE_API_MODE=true
RUN npx vite build --base /

# ────────────────────────────────────────────────────
#  Stage 2: Python 后端 + 前端静态文件
# ────────────────────────────────────────────────────
FROM python:3.13-slim

WORKDIR /app

# 安装 Python 依赖
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir fastapi uvicorn

# 复制后端代码 + 数据
COPY backend/ ./backend/

# 复制前端构建产物
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist/

# 工作目录设为 backend（api.py 中用相对路径引用数据）
WORKDIR /app/backend

# 暴露端口
EXPOSE 8000

# 启动 FastAPI 服务
CMD ["python", "api.py"]
