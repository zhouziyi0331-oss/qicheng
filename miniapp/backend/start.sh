#!/bin/bash

# 启程OPC后端 - 一键启动脚本

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 启程OPC后端服务 - 启动脚本"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到Node.js，请先安装Node.js (>= 18.0)"
    exit 1
fi

echo "✓ Node.js版本: $(node -v)"

# 检查npm
if ! command -v npm &> /dev/null; then
    echo "❌ 未检测到npm"
    exit 1
fi

echo "✓ npm版本: $(npm -v)"

# 检查MongoDB
if ! command -v mongod &> /dev/null; then
    echo "⚠️  未检测到MongoDB，请确保MongoDB正在运行"
    echo "   macOS: brew services start mongodb-community"
    echo "   或使用Docker: docker run -d -p 27017:27017 mongo:7"
fi

# 检查.env文件
if [ ! -f .env ]; then
    echo ""
    echo "❌ 未找到.env配置文件"
    echo "正在复制.env.example..."
    cp .env.example .env
    echo "✓ 已创建.env文件"
    echo ""
    echo "⚠️  请编辑.env文件，填入以下必需配置:"
    echo "   - OPENAI_API_KEY (OpenAI GPT-4 API密钥)"
    echo "   - MONGODB_URI (MongoDB连接字符串)"
    echo "   - JWT_SECRET (JWT加密密钥)"
    echo ""
    echo "配置完成后，重新运行: ./start.sh"
    exit 1
fi

# 检查关键环境变量
source .env
if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "sk-your-openai-api-key-here" ]; then
    echo "⚠️  OPENAI_API_KEY 未配置或使用默认值"
    echo "   AI拆解功能需要有效的OpenAI API密钥"
fi

if [ -z "$MONGODB_URI" ]; then
    echo "⚠️  MONGODB_URI 未配置，将使用默认值: mongodb://localhost:27017/qicheng_opc"
fi

# 检查node_modules
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 检测到首次运行，正在安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
    echo "✓ 依赖安装完成"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "选择启动模式:"
echo "1) 开发模式 (带热重载)"
echo "2) 生产模式 (需要先构建)"
echo "3) 初始化测试数据"
echo "4) 退出"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
read -p "请选择 [1-4]: " choice

case $choice in
    1)
        echo ""
        echo "🔥 启动开发服务器..."
        npm run dev
        ;;
    2)
        echo ""
        echo "🏗️  构建生产版本..."
        npm run build
        if [ $? -eq 0 ]; then
            echo "✓ 构建完成"
            echo ""
            echo "🚀 启动生产服务器..."
            npm start
        else
            echo "❌ 构建失败"
            exit 1
        fi
        ;;
    3)
        echo ""
        echo "📊 初始化测试数据..."
        npm run seed
        if [ $? -eq 0 ]; then
            echo ""
            echo "✓ 测试数据初始化完成"
            echo "现在可以启动服务器进行测试了"
        else
            echo "❌ 初始化失败"
            exit 1
        fi
        ;;
    4)
        echo "退出"
        exit 0
        ;;
    *)
        echo "无效选择"
        exit 1
        ;;
esac
