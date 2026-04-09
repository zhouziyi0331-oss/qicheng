#!/bin/bash

# 启程项目 - 三端联调启动脚本
# 用法: ./start-all.sh

echo "🚀 启动启程项目三端服务..."
echo ""

# 检查Docker服务
echo "📦 检查Docker服务..."
if ! docker ps &> /dev/null; then
    echo "❌ Docker未运行，请先启动Docker"
    exit 1
fi

# 检查数据库容器
if ! docker ps | grep -q "qicheng-postgres"; then
    echo "⚠️  PostgreSQL容器未运行，正在启动..."
    docker-compose up -d postgres redis
    echo "⏳ 等待数据库启动..."
    sleep 5
fi

echo "✅ Docker服务正常"
echo ""

# 启动后端服务
echo "🔧 启动后端服务 (端口 3000)..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "📦 安装后端依赖..."
    npm install
fi
if [ ! -d "dist" ]; then
    echo "🔨 编译后端代码..."
    npm run build
fi
node dist/src/app.js &
BACKEND_PID=$!
echo "✅ 后端服务已启动 (PID: $BACKEND_PID)"
cd ..
echo ""

# 启动AI服务
echo "🤖 启动AI服务 (端口 8001)..."
cd ai-service
if [ ! -d "venv" ]; then
    echo "📦 创建Python虚拟环境..."
    python3 -m venv venv
fi
source venv/bin/activate
if ! pip show anthropic &> /dev/null; then
    echo "📦 安装AI服务依赖..."
    pip install -r requirements.txt
fi
uvicorn main:app --port 8001 &
AI_PID=$!
echo "✅ AI服务已启动 (PID: $AI_PID)"
deactivate
cd ..
echo ""

# 启动前端服务
echo "🌐 启动前端服务 (端口 3002)..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    npm install
fi
npm run dev -- --port 3002 &
FRONTEND_PID=$!
echo "✅ 前端服务已启动 (PID: $FRONTEND_PID)"
cd ..
echo ""

# 启动小程序开发服务
echo "📱 启动小程序开发服务..."
cd miniapp
if [ ! -d "node_modules" ]; then
    echo "📦 安装小程序依赖..."
    npm install
fi
npm run dev:weapp &
MINIAPP_PID=$!
echo "✅ 小程序服务已启动 (PID: $MINIAPP_PID)"
cd ..
echo ""

# 保存PID到文件
echo "$BACKEND_PID" > .pids
echo "$AI_PID" >> .pids
echo "$FRONTEND_PID" >> .pids
echo "$MINIAPP_PID" >> .pids

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ 所有服务已启动！"
echo ""
echo "📍 服务地址："
echo "   后端API:    http://localhost:3000/api/v1"
echo "   AI服务:     http://localhost:8001"
echo "   前端网页:   http://localhost:3002"
echo "   小程序:     使用微信开发者工具打开 miniapp/dist 目录"
echo ""
echo "📊 数据库："
echo "   PostgreSQL: localhost:5432"
echo "   Redis:      localhost:6379"
echo ""
echo "🛑 停止所有服务: ./stop-all.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⏳ 等待服务完全启动 (约10秒)..."
sleep 10

# 检查服务状态
echo ""
echo "🔍 检查服务状态..."
if curl -s http://localhost:3000/api/v1/health > /dev/null 2>&1; then
    echo "✅ 后端服务正常"
else
    echo "⚠️  后端服务可能未完全启动"
fi

if curl -s http://localhost:8001/health > /dev/null 2>&1; then
    echo "✅ AI服务正常"
else
    echo "⚠️  AI服务可能未完全启动"
fi

if curl -s http://localhost:3002 > /dev/null 2>&1; then
    echo "✅ 前端服务正常"
else
    echo "⏳ 前端服务正在启动中..."
fi

echo ""
echo "🎉 启动完成！按 Ctrl+C 停止所有服务"
echo ""

# 等待用户中断
trap "echo ''; echo '🛑 正在停止所有服务...'; kill $BACKEND_PID $AI_PID $FRONTEND_PID $MINIAPP_PID 2>/dev/null; rm -f .pids; echo '✅ 所有服务已停止'; exit 0" INT

# 保持脚本运行
wait
