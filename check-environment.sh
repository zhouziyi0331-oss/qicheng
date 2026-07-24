#!/bin/bash

# 环境检查脚本 - 验证所有服务是否就绪

echo "================================"
echo "🔍 启程OPC平台 - 环境检查"
echo "================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查结果统计
PASS=0
FAIL=0

# 函数：检查命令是否存在
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $2 已安装"
        ((PASS++))
        return 0
    else
        echo -e "${RED}✗${NC} $2 未安装"
        ((FAIL++))
        return 1
    fi
}

# 函数：检查服务是否运行
check_service() {
    if $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $2 正在运行"
        ((PASS++))
        return 0
    else
        echo -e "${RED}✗${NC} $2 未运行"
        ((FAIL++))
        return 1
    fi
}

# 函数：检查端口是否被占用
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${GREEN}✓${NC} 端口 $1 已被占用 (服务可能正在运行)"
        ((PASS++))
        return 0
    else
        echo -e "${YELLOW}○${NC} 端口 $1 空闲"
        return 1
    fi
}

echo "📦 检查必要的工具..."
echo "---"
check_command "node" "Node.js"
check_command "npm" "npm"
check_command "mongosh" "MongoDB Shell" || check_command "mongo" "MongoDB Shell (旧版)"
check_command "redis-cli" "Redis CLI"
check_command "git" "Git"

echo ""
echo "🗄️  检查数据库服务..."
echo "---"

# 检查MongoDB
if mongosh --eval "db.adminCommand('ping')" --quiet &> /dev/null || mongo --eval "db.adminCommand('ping')" --quiet &> /dev/null; then
    echo -e "${GREEN}✓${NC} MongoDB 正在运行"
    ((PASS++))
else
    echo -e "${RED}✗${NC} MongoDB 未运行"
    echo -e "  ${YELLOW}→${NC} 启动命令: brew services start mongodb-community"
    ((FAIL++))
fi

# 检查Redis
if redis-cli ping &> /dev/null; then
    echo -e "${GREEN}✓${NC} Redis 正在运行"
    ((PASS++))
else
    echo -e "${RED}✗${NC} Redis 未运行"
    echo -e "  ${YELLOW}→${NC} 启动命令: brew services start redis"
    ((FAIL++))
fi

echo ""
echo "🔌 检查端口占用..."
echo "---"
check_port 3000 && echo "  → 后端服务可能正在运行"
check_port 27017 && echo "  → MongoDB 正在监听"
check_port 6379 && echo "  → Redis 正在监听"

echo ""
echo "📁 检查项目文件..."
echo "---"

if [ -f "miniapp/backend/package.json" ]; then
    echo -e "${GREEN}✓${NC} 后端 package.json 存在"
    ((PASS++))
else
    echo -e "${RED}✗${NC} 后端 package.json 不存在"
    ((FAIL++))
fi

if [ -d "miniapp/backend/node_modules" ]; then
    echo -e "${GREEN}✓${NC} 后端依赖已安装"
    ((PASS++))
else
    echo -e "${RED}✗${NC} 后端依赖未安装"
    echo -e "  ${YELLOW}→${NC} 运行: cd miniapp/backend && npm install"
    ((FAIL++))
fi

if [ -d "miniapp/dist" ]; then
    echo -e "${GREEN}✓${NC} 小程序已编译 (dist目录存在)"
    ((PASS++))
else
    echo -e "${YELLOW}○${NC} 小程序未编译"
    echo -e "  ${YELLOW}→${NC} 运行: cd miniapp && npm run build:weapp"
fi

echo ""
echo "📝 检查关键文件..."
echo "---"

KEY_FILES=(
    "miniapp/backend/src/services/sms.service.ts"
    "miniapp/backend/src/services/levelUp.service.ts"
    "miniapp/backend/src/controllers/auth.controller.enhanced.ts"
    "miniapp/backend/src/controllers/levelUp.controller.ts"
    "miniapp/src/services/authAPI.ts"
    "miniapp/src/services/levelUpAPI.ts"
    "miniapp/src/hooks/useLevelUp.ts"
)

for file in "${KEY_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $(basename $file)"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $(basename $file) 缺失"
        ((FAIL++))
    fi
done

echo ""
echo "📚 检查文档..."
echo "---"
DOC_COUNT=$(find . -name "*.md" -type f | wc -l | tr -d ' ')
echo -e "${GREEN}✓${NC} 找到 $DOC_COUNT 个文档文件"

echo ""
echo "================================"
echo "📊 检查结果汇总"
echo "================================"
echo -e "通过: ${GREEN}$PASS${NC} 项"
echo -e "失败: ${RED}$FAIL${NC} 项"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 所有检查通过！环境已就绪！${NC}"
    echo ""
    echo "下一步："
    echo "1. 启动后端: cd miniapp/backend && npm run dev"
    echo "2. 测试API: ./test-level-up-api.sh"
    echo "3. 编译小程序: cd miniapp && npm run build:weapp"
    exit 0
else
    echo -e "${YELLOW}⚠️  发现 $FAIL 个问题，请查看上面的提示进行修复${NC}"
    echo ""
    echo "快速修复："
    echo "1. 启动MongoDB: brew services start mongodb-community"
    echo "2. 启动Redis: brew services start redis"
    echo "3. 安装依赖: cd miniapp/backend && npm install"
    exit 1
fi
