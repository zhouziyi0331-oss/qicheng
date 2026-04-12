#!/bin/bash

# 停止所有服务（包含两个小程序）

echo "🛑 停止所有服务..."

# 停止后端
if [ -f .pids/backend.pid ]; then
  kill $(cat .pids/backend.pid) 2>/dev/null
  rm .pids/backend.pid
  echo "✓ 后端服务已停止"
fi

# 停止AI服务
if [ -f .pids/ai-service.pid ]; then
  kill $(cat .pids/ai-service.pid) 2>/dev/null
  rm .pids/ai-service.pid
  echo "✓ AI服务已停止"
fi

# 停止管理端前端
if [ -f .pids/frontend.pid ]; then
  kill $(cat .pids/frontend.pid) 2>/dev/null
  rm .pids/frontend.pid
  echo "✓ 管理端网页已停止"
fi

# 停止学生端小程序
if [ -f .pids/miniapp.pid ]; then
  kill $(cat .pids/miniapp.pid) 2>/dev/null
  rm .pids/miniapp.pid
  echo "✓ 学生端小程序已停止"
fi

# 停止企业端小程序
if [ -f .pids/company-miniapp.pid ]; then
  kill $(cat .pids/company-miniapp.pid) 2>/dev/null
  rm .pids/company-miniapp.pid
  echo "✓ 企业端小程序已停止"
fi

# 停止Docker
echo "📦 停止Docker服务..."
docker-compose down

echo ""
echo "✅ 所有服务已停止！"
