#!/bin/bash

# 🚀 启程项目 - 完整启动脚本
# 包含后端 + 学生端小程序 + 企业端小程序

echo "
╔════════════════════════════════════════════════════════════╗
║   🚀 启程项目启动脚本                                      ║
╠════════════════════════════════════════════════════════════╣
║   包含: 后端 + 学生端 + 企业端                             ║
║   安全: 集成所有安全措施                                   ║
╚════════════════════════════════════════════════════════════╝
"

# 检查端口是否被占用
check_port() {
  local port=$1
  if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
    echo "❌ 端口 $port 已被占用"
    return 1
  else
    echo "✅ 端口 $port 可用"
    return 0
  fi
}

# 检查依赖
echo "📦 检查依赖..."

if ! command -v node &> /dev/null; then
  echo "❌ Node.js 未安装"
  exit 1
fi

if ! command -v npm &> /dev/null; then
  echo "❌ npm 未安装"
  exit 1
fi

echo "✅ Node.js $(node -v)"
echo "✅ npm $(npm -v)"

# 检查端口
echo ""
echo "🔍 检查端口..."
check_port 3000 || exit 1
check_port 10086 || echo "⚠️  微信开发者工具端口可能被占用"

# 启动后端
echo ""
echo "🔧 启动后端服务..."
cd backend

if [ ! -d "node_modules" ]; then
  echo "📦 安装后端依赖..."
  npm install
fi

# 检查环境变量
if [ ! -f ".env" ]; then
  echo "❌ 请先配置 .env 文件"
  echo "💡 参考: .env.secure.template"
  exit 1
fi

# 启动后端
npm run dev &
BACKEND_PID=$!
echo "✅ 后端已启动 (PID: $BACKEND_PID)"

# 等待后端启动
echo "⏳ 等待后端启动..."
sleep 5

# 检查后端是否成功启动
if ! curl -s http://localhost:3000/health > /dev/null; then
  echo "❌ 后端启动失败"
  kill $BACKEND_PID
  exit 1
fi

echo "✅ 后端运行正常"

# 启动学生端小程序
echo ""
echo "📱 启动学生端小程序..."
cd ../miniapp

if [ ! -d "node_modules" ]; then
  echo "📦 安装学生端依赖..."
  npm install
fi

npm run dev:weapp &
STUDENT_PID=$!
echo "✅ 学生端已启动 (PID: $STUDENT_PID)"

# 启动企业端小程序
echo ""
echo "🏢 启动企业端小程序..."
cd ../company-miniapp

if [ ! -d "node_modules" ]; then
  echo "📦 安装企业端依赖..."
  npm install
fi

npm run dev:weapp &
COMPANY_PID=$!
echo "✅ 企业端已启动 (PID: $COMPANY_PID)"

# 保存PID到文件
cd ..
echo "$BACKEND_PID" > .pids/backend.pid
echo "$STUDENT_PID" > .pids/student.pid
echo "$COMPANY_PID" > .pids/company.pid

echo "
╔════════════════════════════════════════════════════════════╗
║   ✅ 启动完成！                                            ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║   后端:     http://localhost:3000                         ║
║   健康检查: http://localhost:3000/health                  ║
║                                                            ║
║   学生端:   在微信开发者工具中打开 miniapp/dist           ║
║   企业端:   在微信开发者工具中打开 company-miniapp/dist   ║
║                                                            ║
╠════════════════════════════════════════════════════════════╣
║   进程ID:                                                  ║
║   - 后端: $BACKEND_PID                                     ║
║   - 学生端: $STUDENT_PID                                   ║
║   - 企业端: $COMPANY_PID                                   ║
║                                                            ║
║   停止所有服务: ./stop-all-secure.sh                      ║
╚════════════════════════════════════════════════════════════╝

🔒 安全措施已集成:
  ✅ P0: JWT黑名单 - Token存内存
  ✅ P0: 横向越权保护 - Service层校验
  ✅ P1: 登录锁定 - 5次失败锁定30分钟
  ✅ P1: 文件上传 - 大小校验
  ✅ 手机号脱敏
  ✅ 401自动刷新Token
  ✅ 429登录锁定提示

📖 使用文档: MINIAPP_INTEGRATION_GUIDE.md

按 Ctrl+C 停止...
"

# 等待用户中断
wait
