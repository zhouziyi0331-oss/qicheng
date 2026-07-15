#!/bin/bash

# ============================================================
# 启程项目 - 一键启动脚本
# ============================================================

set -e

echo "🚀 启程 Qicheng 项目启动中..."
echo ""

# 进入项目目录
cd "$(dirname "$0")"

# 1. 检查 Docker 是否运行
echo "1️⃣  检查 Docker 状态..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未运行，请先启动 Docker Desktop"
    exit 1
fi
echo "✅ Docker 运行正常"
echo ""

# 2. 停止旧容器（如果存在）
echo "2️⃣  清理旧容器..."
docker-compose down 2>/dev/null || true
echo "✅ 旧容器已清理"
echo ""

# 3. 启动数据库和Redis（仅基础服务）
echo "3️⃣  启动 PostgreSQL + Redis..."
docker-compose up -d postgres redis
echo ""

# 4. 等待数据库就绪
echo "4️⃣  等待数据库初始化（约10-15秒）..."
for i in {1..30}; do
    if docker exec qicheng-postgres pg_isready -U postgres -d qicheng > /dev/null 2>&1; then
        echo "✅ PostgreSQL 就绪"
        break
    fi
    echo -n "."
    sleep 1
done
echo ""

# 5. 等待Redis就绪
echo "5️⃣  等待 Redis 初始化..."
for i in {1..15}; do
    if docker exec qicheng-redis redis-cli ping > /dev/null 2>&1; then
        echo "✅ Redis 就绪"
        break
    fi
    echo -n "."
    sleep 1
done
echo ""

# 6. 显示服务状态
echo "6️⃣  服务状态："
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker-compose ps
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 7. 显示连接信息
echo "✅ 基础服务启动成功！"
echo ""
echo "📊 服务连接信息："
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  PostgreSQL: localhost:5432"
echo "    - 数据库: qicheng"
echo "    - 用户名: postgres"
echo "    - 密码:   postgres"
echo ""
echo "  Redis:      localhost:6379"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 8. 后续步骤提示
echo "📝 后续步骤："
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. 启动后端服务："
echo "   cd backend"
echo "   npm run dev"
echo ""
echo "2. 启动小程序："
echo "   cd miniapp"
echo "   npm run dev:weapp"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  重要提示："
echo "   需要在 backend/.env 中配置有效的 ANTHROPIC_API_KEY"
echo "   才能使用 AI 导师功能"
echo ""
