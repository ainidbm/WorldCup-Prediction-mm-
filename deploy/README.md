# 2026 世界杯冠军预测 — 阿里云部署指南

## 架构概览

```
用户浏览器
    │
    ▼
┌─────────────────────────────────────────┐
│  阿里云 ECS (CentOS / Ubuntu / Alinux)   │
│  ┌─────────────────────────────────┐    │
│  │  Nginx (可选反向代理 + SSL)      │    │
│  │  :443/:80 → :8000               │    │
│  └──────────────┬──────────────────┘    │
│                 ▼                        │
│  ┌─────────────────────────────────┐    │
│  │  Docker Container               │    │
│  │  ┌───────────────────────────┐  │    │
│  │  │  FastAPI (uvicorn)        │  │    │
│  │  │  :8000                    │  │    │
│  │  │  ├─ /api/predictions      │  │    │
│  │  │  ├─ /api/accuracy         │  │    │
│  │  │  ├─ /api/regenerate (POST)│  │    │
│  │  │  ├─ /api/health           │  │    │
│  │  │  └─ / → React 前端        │  │    │
│  │  └───────────────────────────┘  │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

## 一、前置条件

| 项目 | 要求 |
|------|------|
| 阿里云账号 | 已实名认证 |
| ECS 实例 | 2 核 4GB+ (推荐), 系统盘 40GB+ |
| 操作系统 | CentOS 7+ / Ubuntu 20.04+ / Alibaba Cloud Linux 3 |
| 安全组 | 开放 8000 端口 (HTTP), 443 端口 (HTTPS，可选) |
| 域名 (可选) | 已备案域名，DNS 解析到 ECS 公网 IP |

## 二、快速部署（一键脚本）

### 2.1 连接 ECS

```bash
ssh root@<ECS公网IP>
```

### 2.2 执行部署脚本

```bash
# 下载部署脚本
curl -o setup.sh https://raw.githubusercontent.com/ainidbm/WorldCup-Prediction-mm-/main/deploy/aliyun-setup.sh

# 执行
chmod +x setup.sh
bash setup.sh
```

脚本自动完成：
1. 安装 Docker + Docker Compose
2. 克隆项目代码
3. 构建 Docker 镜像
4. 启动服务
5. 验证健康检查

### 2.3 访问验证

```
http://<ECS公网IP>:8000          → 前端页面
http://<ECS公网IP>:8000/api/health → 健康检查
```

## 三、手动部署（分步详解）

### 3.1 安装 Docker

**CentOS / Alibaba Cloud Linux:**
```bash
yum install -y yum-utils
yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
yum install -y docker-ce docker-compose-plugin
systemctl enable docker --now
```

**Ubuntu:**
```bash
apt-get update
apt-get install -y docker.io docker-compose
systemctl enable docker --now
```

### 3.2 克隆项目

```bash
cd /opt
git clone https://github.com/ainidbm/WorldCup-Prediction-mm-.git worldcup-predict
cd worldcup-predict
```

### 3.3 构建并启动

```bash
docker-compose build
docker-compose up -d
```

### 3.4 验证

```bash
# 查看启动日志
docker-compose logs -f

# 健康检查
curl http://localhost:8000/api/health

# 获取夺冠概率
curl http://localhost:8000/api/predictions | python3 -m json.tool | head -50
```

## 四、Nginx 反向代理 + SSL（生产环境推荐）

### 4.1 安装 Nginx

```bash
yum install -y nginx          # CentOS
# 或
apt-get install -y nginx       # Ubuntu
```

### 4.2 配置反向代理

创建 `/etc/nginx/conf.d/worldcup.conf`:

```nginx
server {
    listen 80;
    server_name your-domain.com;   # 替换为你的域名

    client_max_body_size 10m;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }
}
```

### 4.3 安装 SSL 证书（Let's Encrypt 免费证书）

```bash
# 安装 certbot
yum install -y certbot python3-certbot-nginx   # CentOS
# 或
apt-get install -y certbot python3-certbot-nginx  # Ubuntu

# 获取证书并自动配置
certbot --nginx -d your-domain.com

# 设置自动续期
echo "0 3 * * * certbot renew --quiet" | crontab -
```

### 4.4 重载 Nginx

```bash
nginx -t && systemctl reload nginx
```

配置完成后，通过 `https://your-domain.com` 访问。

## 五、安全组配置（阿里云控制台）

| 端口 | 协议 | 授权对象 | 用途 |
|------|------|----------|------|
| 22 | TCP | 你的 IP | SSH 管理 |
| 80 | TCP | 0.0.0.0/0 | HTTP |
| 443 | TCP | 0.0.0.0/0 | HTTPS |
| 8000 | TCP | 0.0.0.0/0 | 直接访问（可选，配置 Nginx 后可关闭） |

## 六、互动功能

### 6.1 触发预测重新生成

```bash
# API 调用
curl -X POST http://localhost:8000/api/regenerate
```

也可以在前端添加"重新生成"按钮（需额外开发），或使用 cron 定时任务：

```bash
# 每小时自动重新生成（crontab）
0 * * * * curl -X POST http://localhost:8000/api/regenerate
```

### 6.2 查看服务状态

```bash
# 容器状态
docker-compose ps

# 实时日志
docker-compose logs -f --tail=50

# 资源占用
docker stats worldcup-predict
```

## 七、更新部署

```bash
cd /opt/worldcup-predict
git pull origin main
docker-compose build --no-cache
docker-compose up -d
```

## 八、故障排查

| 问题 | 解决方法 |
|------|----------|
| 端口被占用 | `lsof -i:8000` 查看占用进程，kill 或在 docker-compose.yml 改端口 |
| 内存不足 | 升级 ECS 到 4GB+，或在 `docker-compose.yml` 中限制内存: `mem_limit: 2g` |
| 启动失败 | `docker-compose logs worldcup-predict` 查看具体错误 |
| 数据缺失 | 确保 `backend/data/` 目录中的 JSON/CSV 文件完整 |
| 健康检查失败 | 首次启动需约 30 秒加载模型，等待 `start_period` 结束 |

## 九、资源链接

- 项目仓库: https://github.com/ainidbm/WorldCup-Prediction-mm-
- GitHub Pages (静态版): https://ainidbm.github.io/WorldCup-Prediction-mm-/
- API 文档: 启动后访问 `http://<host>:8000/docs` (FastAPI 自动生成 Swagger)
