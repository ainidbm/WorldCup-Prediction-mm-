#!/bin/bash
# ==============================================================
#  阿里云 ECS 一键部署脚本
#  适用: CentOS 7+ / Ubuntu 20.04+ / Alibaba Cloud Linux
# ==============================================================
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  2026 世界杯预测 — 阿里云 ECS 部署${NC}"
echo -e "${GREEN}============================================${NC}"

# ── 1. 检查 Docker ──
echo -e "\n${YELLOW}[1/5] 检查 Docker 环境...${NC}"
if ! command -v docker &> /dev/null; then
    echo "Docker 未安装，正在安装..."
    if command -v apt-get &> /dev/null; then
        # Ubuntu / Debian
        apt-get update
        apt-get install -y docker.io docker-compose
    elif command -v yum &> /dev/null; then
        # CentOS / Alibaba Cloud Linux
        yum install -y docker docker-compose
    fi
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}Docker 安装完成${NC}"
else
    echo -e "${GREEN}Docker 已就绪: $(docker --version)${NC}"
fi

# ── 2. 获取代码 ──
echo -e "\n${YELLOW}[2/5] 获取项目代码...${NC}"
PROJECT_DIR="/opt/worldcup-predict"

if [ -d "$PROJECT_DIR/.git" ]; then
    echo "更新已有代码..."
    cd "$PROJECT_DIR"
    git pull origin main
else
    echo "克隆仓库..."
    git clone https://github.com/ainidbm/WorldCup-Prediction-mm-.git "$PROJECT_DIR"
    cd "$PROJECT_DIR"
fi

# ── 3. 构建镜像 ──
echo -e "\n${YELLOW}[3/5] 构建 Docker 镜像...${NC}"
cd "$PROJECT_DIR"
docker-compose build --no-cache

# ── 4. 启动服务 ──
echo -e "\n${YELLOW}[4/5] 启动服务...${NC}"
docker-compose down 2>/dev/null || true
docker-compose up -d

# 等待服务就绪
echo "等待服务启动..."
for i in $(seq 1 30); do
    if curl -sf http://localhost:8000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}服务已就绪！${NC}"
        break
    fi
    sleep 2
    echo -n "."
done
echo ""

# ── 5. 验证 ──
echo -e "\n${YELLOW}[5/5] 验证部署...${NC}"
curl -s http://localhost:8000/api/health | python3 -m json.tool 2>/dev/null || echo "(健康检查响应)"

# ── 完成 ──
PUBLIC_IP=$(curl -sf ifconfig.me 2>/dev/null || curl -sf ip.sb 2>/dev/null || echo "YOUR_SERVER_IP")

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  部署完成！${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "  前端页面: ${YELLOW}http://${PUBLIC_IP}:8000${NC}"
echo -e "  预测 API: ${YELLOW}http://${PUBLIC_IP}:8000/api/predictions${NC}"
echo -e "  准确率:   ${YELLOW}http://${PUBLIC_IP}:8000/api/accuracy${NC}"
echo -e "  健康检查: ${YELLOW}http://${PUBLIC_IP}:8000/api/health${NC}"
echo ""
echo -e "  查看日志: ${YELLOW}docker-compose logs -f${NC}"
echo -e "  重启服务: ${YELLOW}cd ${PROJECT_DIR} && docker-compose restart${NC}"
echo -e "  重新生成: ${YELLOW}curl -X POST http://localhost:8000/api/regenerate${NC}"
echo ""
echo "  下一步（可选）："
echo "    1. 配置阿里云安全组，开放 8000 端口"
echo "    2. 配置 Nginx 反向代理 + SSL 证书"
echo "    3. 绑定域名"
