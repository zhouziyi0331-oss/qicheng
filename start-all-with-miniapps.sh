#!/bin/bash

# 启程项目 - 启动所有服务（包含两个小程序）

echo "🚀 启动启程项目所有服务..."

# 创建PID文件目录
mkdir -p .pids

# 1. 启动Docker服务
echo "📦 启动Docker服务..."
docker-compose up -d

# 2. 启动后端服务
echo "🔧 启动后端服务 (端口3000)..."
cd backend
npm run dev > ../.pids/backend.log 2>&1 &
echo $! > ../.pids/backend.pid
cd ..

# 3. 启动AI服务
echo "🤖 启动AI服务 (端口8000)..."
cd ai-service
source venv/bin/activate
python main.py > ../.pids/ai-service.log 2>&1 &
echo $! > ../.pids/ai-service.pid
cd ..

# 4. 启动管理端前端
echo "🌐 启动管理端网页 (端口3002)..."
cd frontend
npm run dev > ../.pids/frontend.log 2>&1 &
echo $! > ../.pids/frontend.pid
cd ..

# 5. 启动学生端小程序
echo "📱 启动学生端小程序..."
cd miniapp
npm run dev > ../.pids/miniapp.log 2>&1 &
echo $! > ../.pids/miniapp.pid
cd ..

# 6. 启动企业端小程序
echo "🏢 启动企业端小程序..."
cd company-miniapp
npm run dev > ../.pids/company-miniapp.log 2>&1 &
echo $! > ../.pids/company-miniapp.pid
cd ..

echo ""
echo "✅ 所有服务已启动！"
echo ""
echo "📋 服务列表："
echo "  - 后端API:      http://localhost:3000"
echo "  - AI服务:       http://localhost:8000"
echo "  - 管理端网页:   http://localhost:3002"
echo "  - 学生端小程序: 使用微信开发者工具打开 miniapp 目录"
echo "  - 企业端小程序: 使用微信开发者工具打开 company-miniapp 目录"
echo ""
echo "📝 日志文件："
echo "  - 后端:         .pids/backend.log"
echo "  - AI服务:       .pids/ai-service.log"
echo "  - 管理端:       .pids/frontend.log"
echo "  - 学生端小程序: .pids/miniapp.log"
echo "  - 企业端小程序: .pids/company-miniapp.log"
echo ""
echo "🛑 停止所有服务: ./stop-all.sh"
