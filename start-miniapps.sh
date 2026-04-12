#!/bin/bash

echo "🚀 启动启程项目 - 学生端 + 企业端小程序"
echo "=========================================="

# 检查端口占用
check_port() {
  lsof -ti:$1 > /dev/null 2>&1
  return $?
}

# 清理端口
cleanup_port() {
  if check_port $1; then
    echo "⚠️  端口 $1 被占用，正在清理..."
    lsof -ti:$1 | xargs kill -9 2>/dev/null
    sleep 1
  fi
}

# 清理可能占用的端口
cleanup_port 10086  # 学生端小程序
cleanup_port 10087  # 企业端小程序

# 启动学生端小程序
echo ""
echo "📱 启动学生端小程序..."
cd /Users/alwan/code/qicheng/miniapp
npm run dev:weapp > /tmp/student-miniapp.log 2>&1 &
STUDENT_PID=$!
echo "✅ 学生端小程序已启动 (PID: $STUDENT_PID)"
echo "   日志: /tmp/student-miniapp.log"

# 等待2秒
sleep 2

# 启动企业端小程序
echo ""
echo "🏢 启动企业端小程序..."
cd /Users/alwan/code/qicheng/company-miniapp
npm run dev:weapp > /tmp/company-miniapp.log 2>&1 &
COMPANY_PID=$!
echo "✅ 企业端小程序已启动 (PID: $COMPANY_PID)"
echo "   日志: /tmp/company-miniapp.log"

echo ""
echo "=========================================="
echo "✨ 所有服务已启动！"
echo ""
echo "📱 学生端小程序:"
echo "   - 项目路径: /Users/alwan/code/qicheng/miniapp"
echo "   - 编译输出: miniapp/dist"
echo "   - 进程ID: $STUDENT_PID"
echo ""
echo "🏢 企业端小程序:"
echo "   - 项目路径: /Users/alwan/code/qicheng/company-miniapp"
echo "   - 编译输出: company-miniapp/dist"
echo "   - 进程ID: $COMPANY_PID"
echo ""
echo "💡 使用微信开发者工具导入对应的项目路径即可预览"
echo "🛑 停止服务: ./stop-miniapps.sh"
echo "=========================================="

# 保存PID到文件
echo $STUDENT_PID > /tmp/student-miniapp.pid
echo $COMPANY_PID > /tmp/company-miniapp.pid
