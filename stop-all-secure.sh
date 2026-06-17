#!/bin/bash

# 🛑 停止所有服务

echo "
╔════════════════════════════════════════════════════════════╗
║   🛑 停止启程项目所有服务                                  ║
╚════════════════════════════════════════════════════════════╝
"

# 读取PID并停止
if [ -f ".pids/backend.pid" ]; then
  BACKEND_PID=$(cat .pids/backend.pid)
  if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "🛑 停止后端服务 (PID: $BACKEND_PID)"
    kill $BACKEND_PID
  fi
  rm .pids/backend.pid
fi

if [ -f ".pids/student.pid" ]; then
  STUDENT_PID=$(cat .pids/student.pid)
  if kill -0 $STUDENT_PID 2>/dev/null; then
    echo "🛑 停止学生端 (PID: $STUDENT_PID)"
    kill $STUDENT_PID
  fi
  rm .pids/student.pid
fi

if [ -f ".pids/company.pid" ]; then
  COMPANY_PID=$(cat .pids/company.pid)
  if kill -0 $COMPANY_PID 2>/dev/null; then
    echo "🛑 停止企业端 (PID: $COMPANY_PID)"
    kill $COMPANY_PID
  fi
  rm .pids/company.pid
fi

# 额外清理可能残留的进程
echo "🧹 清理残留进程..."
pkill -f "ts-node-dev.*src/app.ts" 2>/dev/null
pkill -f "taro.*dev:weapp" 2>/dev/null

echo "
✅ 所有服务已停止
"
