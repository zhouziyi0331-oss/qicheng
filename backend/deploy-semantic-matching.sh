#!/bin/bash

# 启程平台语义匹配系统 - 快速部署脚本
# 使用方法: ./deploy-semantic-matching.sh

set -e  # 遇到错误立即退出

echo "=========================================="
echo "启程平台语义匹配系统 - 快速部署"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo -e "${RED}错误: 请在backend目录下运行此脚本${NC}"
    exit 1
fi

# 步骤1: 检查环境
echo -e "${YELLOW}步骤 1/5: 检查环境...${NC}"

# 检查PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${RED}错误: 未找到psql命令，请先安装PostgreSQL${NC}"
    exit 1
fi
echo -e "${GREEN}✓ PostgreSQL 已安装${NC}"

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: 未找到node命令，请先安装Node.js${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js 已安装 ($(node -v))${NC}"

# 检查.env文件
if [ ! -f ".env" ]; then
    echo -e "${RED}错误: 未找到.env文件${NC}"
    exit 1
fi
echo -e "${GREEN}✓ .env 文件存在${NC}"

# 检查ANTHROPIC_API_KEY
if ! grep -q "ANTHROPIC_API_KEY=sk-ant-" .env; then
    echo -e "${YELLOW}警告: ANTHROPIC_API_KEY 未配置或格式不正确${NC}"
    echo -e "${YELLOW}提示: 启程老师翻译功能需要Claude API，但向量生成不需要${NC}"
fi

echo ""

# 步骤2: 安装依赖
echo -e "${YELLOW}步骤 2/5: 检查依赖...${NC}"
if [ ! -d "node_modules" ]; then
    echo "正在安装依赖..."
    npm install
else
    echo -e "${GREEN}✓ 依赖已安装${NC}"
fi
echo ""

# 步骤3: 运行数据库迁移
echo -e "${YELLOW}步骤 3/5: 运行数据库迁移...${NC}"

# 从.env读取数据库URL
source .env

# 检查pgvector扩展
echo "检查pgvector扩展..."
PGVECTOR_CHECK=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM pg_extension WHERE extname='vector';" 2>/dev/null || echo "0")

if [ "$PGVECTOR_CHECK" -eq "0" ]; then
    echo "正在安装pgvector扩展..."
    psql $DATABASE_URL -c "CREATE EXTENSION IF NOT EXISTS vector;" || {
        echo -e "${RED}错误: 无法安装pgvector扩展${NC}"
        echo -e "${YELLOW}提示: 请手动运行: psql $DATABASE_URL -c 'CREATE EXTENSION vector;'${NC}"
        exit 1
    }
fi
echo -e "${GREEN}✓ pgvector 扩展已启用${NC}"

# 运行migration
echo "运行语义匹配系统migration..."
if [ -f "migrations/072_semantic_matching_system.sql" ]; then
    psql $DATABASE_URL -f migrations/072_semantic_matching_system.sql || {
        echo -e "${YELLOW}警告: Migration可能已经运行过，继续...${NC}"
    }
    echo -e "${GREEN}✓ Migration 完成${NC}"
else
    echo -e "${RED}错误: 未找到migration文件${NC}"
    exit 1
fi

# 验证表是否创建
echo "验证表创建..."
TABLE_COUNT=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('student_capabilities', 'task_student_matches', 'task_translations');" 2>/dev/null || echo "0")

if [ "$TABLE_COUNT" -eq "3" ]; then
    echo -e "${GREEN}✓ 3个新表已创建${NC}"
else
    echo -e "${RED}错误: 表创建失败，只找到 $TABLE_COUNT 个表${NC}"
    exit 1
fi

echo ""

# 步骤4: 初始化向量数据
echo -e "${YELLOW}步骤 4/5: 初始化向量数据...${NC}"
echo "这可能需要几分钟，请耐心等待..."
echo ""

# 检查是否已有数据
STUDENT_COUNT=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM student_capabilities;" 2>/dev/null || echo "0")
TASK_COUNT=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM tasks WHERE combined_embedding IS NOT NULL;" 2>/dev/null || echo "0")

if [ "$STUDENT_COUNT" -gt "0" ] && [ "$TASK_COUNT" -gt "0" ]; then
    echo -e "${GREEN}✓ 向量数据已存在 (学生: $STUDENT_COUNT, 任务: $TASK_COUNT)${NC}"
    read -p "是否重新生成向量? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "跳过向量初始化"
    else
        npm run init-vectors
    fi
else
    echo "开始初始化向量..."
    npm run init-vectors || {
        echo -e "${YELLOW}警告: 向量初始化失败，但系统仍可运行${NC}"
        echo -e "${YELLOW}提示: 可以稍后手动运行: npm run init-vectors${NC}"
    }
fi

echo ""

# 步骤5: 验证部署
echo -e "${YELLOW}步骤 5/5: 验证部署...${NC}"

# 检查API路由文件
if [ -f "src/routes/tasks/matchingController.ts" ]; then
    echo -e "${GREEN}✓ matchingController.ts 存在${NC}"
else
    echo -e "${RED}✗ matchingController.ts 不存在${NC}"
fi

# 检查服务文件
SERVICES=("vectorGenerationService.ts" "semanticMatchingEngine.ts" "qichengTeacherService.ts" "studentCapabilityService.ts")
for service in "${SERVICES[@]}"; do
    if [ -f "src/services/$service" ]; then
        echo -e "${GREEN}✓ $service 存在${NC}"
    else
        echo -e "${RED}✗ $service 不存在${NC}"
    fi
done

echo ""
echo "=========================================="
echo -e "${GREEN}部署完成！${NC}"
echo "=========================================="
echo ""
echo "下一步操作："
echo ""
echo "1. 启动后端服务:"
echo "   npm run dev"
echo ""
echo "2. 测试API端点:"
echo "   curl http://localhost:3000/api/v1/tasks/{taskId}/trigger-matching \\"
echo "     -X POST \\"
echo "     -H 'Authorization: Bearer {token}'"
echo ""
echo "3. 启动前端 (企业端):"
echo "   cd ../company-miniapp"
echo "   npm run dev:weapp"
echo ""
echo "4. 启动前端 (学生端):"
echo "   cd ../miniapp"
echo "   npm run dev:weapp"
echo ""
echo "=========================================="
echo "文档参考:"
echo "- 部署文档: ../SEMANTIC_MATCHING_DEPLOYMENT.md"
echo "- 集成报告: ../SEMANTIC_MATCHING_INTEGRATION.md"
echo "=========================================="
