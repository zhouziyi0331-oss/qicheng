#!/bin/bash

echo "🛑 停止启程项目小程序服务"
echo "=========================================="

# 从PID文件读取并停止进程
if [ -f /tmp/student-miniapp.pid ]; then
  STUDENT_PID=$(cat /tmp/student-miniapp.pid)
  if ps -p $STUDENT_PID > /dev/null 2>&1; then
    echo "🔴 停止学生端小程序 (PID: $STUDENT_PID)..."
    kill $STUDENT_PID 2>/dev/null
  fi
  rm /tmp/student-miniapp.pid
fi

if [ -f /tmp/company-miniapp.pid ]; then
  COMPANY_PID=$(cat /tmp/company-miniapp.pid)
  if ps -p $COMPANY_PID > /dev/null 2>&1; then
    echo "🔴 停止企业端小程序 (PID: $COMPANY_PID)..."
    kill $COMPANY_PID 2>/dev/null
  fi
  rm /tmp/company-miniapp.pid
fi

# 清理可能残留的进程
echo ""
echo "🧹 清理残留进程..."
pkill -f "taro build --type weapp --watch" 2>/dev/null

# 清理端口
cleanup_port() {
  if lsof -ti:$1 > /dev/null 2>&1; then
    echo "   清理端口 $1..."
    lsof -ti:$1 | xargs kill -9 2>/dev/null
  fi
}

cleanup_port 10086
cleanup_port 10087

echo ""
echo "✅ 所有小程序服务已停止"
echo "=========================================="
