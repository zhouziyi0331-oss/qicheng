#!/bin/bash

# 停止所有启程服务

echo "🛑 停止启程项目所有服务..."

if [ -f .pids ]; then
    while read pid; do
        if ps -p $pid > /dev/null 2>&1; then
            echo "   停止进程 $pid"
            kill $pid 2>/dev/null
        fi
    done < .pids
    rm -f .pids
    echo "✅ 所有服务已停止"
else
    echo "⚠️  未找到运行中的服务"
    echo "   尝试手动停止..."
    pkill -f "node dist/src/app.js"
    pkill -f "uvicorn main:app"
    pkill -f "next dev"
    pkill -f "taro build"
    echo "✅ 清理完成"
fi
