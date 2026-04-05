#!/bin/bash

echo "🚀 启动启程平台..."
echo ""

# 检查端口占用
check_port() {
    lsof -ti:$1 > /dev/null 2>&1
}

# 启动后端
echo "📦 启动后端服务..."
cd /Users/alwan/code/qicheng/backend

if check_port 3001; then
    echo "⚠️  端口 3001 已被占用，尝试关闭..."
    lsof -ti:3001 | xargs kill -9 2>/dev/null
    sleep 2
fi

npm run dev > /tmp/qicheng-backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ 后端已启动 (PID: $BACKEND_PID)"
echo "   日志: tail -f /tmp/qicheng-backend.log"

sleep 3

# 启动前端
echo ""
echo "🎨 启动前端服务..."
cd /Users/alwan/code/qicheng/frontend

if check_port 3000; then
    echo "⚠️  端口 3000 已被占用，尝试关闭..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    sleep 2
fi

npm run dev > /tmp/qicheng-frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ 前端已启动 (PID: $FRONTEND_PID)"
echo "   日志: tail -f /tmp/qicheng-frontend.log"

sleep 5

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 启程平台已启动！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 访问地址："
echo "   👉 http://localhost:3000"
echo ""
echo "🔧 服务状态："
echo "   后端: http://localhost:3001/health"
echo "   前端: http://localhost:3000"
echo ""
echo "📊 进程信息："
echo "   后端 PID: $BACKEND_PID"
echo "   前端 PID: $FRONTEND_PID"
echo ""
echo "🛑 停止服务："
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "📝 查看日志："
echo "   后端: tail -f /tmp/qicheng-backend.log"
echo "   前端: tail -f /tmp/qicheng-frontend.log"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 等待5秒后自动打开浏览器
echo ""
echo "⏳ 5秒后自动打开浏览器..."
sleep 5
open http://localhost:3000

echo ""
echo "✨ 按 Ctrl+C 停止服务"
echo ""

# 保持脚本运行
wait
