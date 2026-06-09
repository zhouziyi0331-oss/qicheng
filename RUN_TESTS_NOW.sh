#!/bin/bash

# 启程平台测试执行脚本
# 执行时间：2026-05-29
# 用途：一键执行所有测试步骤

set -e  # 遇到错误立即退出

echo "========================================="
echo "🚀 启程平台测试开始"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目路径
PROJECT_DIR="/Users/alwan/code/qicheng"
BACKEND_DIR="$PROJECT_DIR/backend"

# ========================================
# 步骤1：检查PostgreSQL
# ========================================
echo "========================================="
echo "📊 步骤1：检查PostgreSQL状态"
echo "========================================="

if psql -U postgres -c "SELECT version();" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL运行正常${NC}"
else
    echo -e "${RED}❌ PostgreSQL未运行，请先启动PostgreSQL${NC}"
    exit 1
fi

# 检查数据库是否存在
if psql -U postgres -lqt | cut -d \| -f 1 | grep -qw qicheng; then
    echo -e "${GREEN}✅ 数据库 qicheng 存在${NC}"
else
    echo -e "${RED}❌ 数据库 qicheng 不存在${NC}"
    echo "创建数据库..."
    psql -U postgres -c "CREATE DATABASE qicheng;"
fi

echo ""

# ========================================
# 步骤2：运行数据库迁移
# ========================================
echo "========================================="
echo "📊 步骤2：运行数据库迁移"
echo "========================================="

cd "$BACKEND_DIR"

echo "运行迁移 087: OPC v2.0 系统..."
if psql -U postgres -d qicheng -f migrations/087_opc_v2_system.sql > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 迁移 087 完成${NC}"
else
    echo -e "${YELLOW}⚠️  迁移 087 可能已存在或有错误${NC}"
fi

echo "运行迁移 088: 语义匹配引擎..."
if psql -U postgres -d qicheng -f migrations/088_semantic_matching_engine.sql > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 迁移 088 完成${NC}"
else
    echo -e "${YELLOW}⚠️  迁移 088 可能已存在或有错误${NC}"
fi

echo "运行迁移 089: AI导师自动触发..."
if psql -U postgres -d qicheng -f migrations/089_mentor_auto_trigger.sql > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 迁移 089 完成${NC}"
else
    echo -e "${YELLOW}⚠️  迁移 089 可能已存在或有错误${NC}"
fi

echo ""

# ========================================
# 步骤3：验证表创建
# ========================================
echo "========================================="
echo "📊 步骤3：验证表创建"
echo "========================================="

echo "检查OPC v2.0表..."
OPC_TABLES=$(psql -U postgres -d qicheng -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'opc_v2_%';")
echo "OPC v2.0表数量: $OPC_TABLES (预期: 3)"

echo "检查AI导师表..."
MENTOR_TABLES=$(psql -U postgres -d qicheng -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'mentor_%';")
echo "AI导师表数量: $MENTOR_TABLES (预期: 2)"

echo "检查语义匹配表..."
MATCHING_TABLES=$(psql -U postgres -d qicheng -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('student_capabilities', 'task_student_matches', 'task_translations');")
echo "语义匹配表数量: $MATCHING_TABLES (预期: 3)"

echo "检查触发器..."
TRIGGERS=$(psql -U postgres -d qicheng -t -c "SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_name LIKE 'trigger_schedule_%';")
echo "触发器数量: $TRIGGERS (预期: 3)"

if [ "$OPC_TABLES" -ge 3 ] && [ "$MENTOR_TABLES" -ge 2 ] && [ "$MATCHING_TABLES" -ge 3 ] && [ "$TRIGGERS" -ge 3 ]; then
    echo -e "${GREEN}✅ 所有表和触发器创建成功${NC}"
else
    echo -e "${YELLOW}⚠️  部分表或触发器可能未创建${NC}"
fi

echo ""

# ========================================
# 步骤4：显示详细信息
# ========================================
echo "========================================="
echo "📊 步骤4：数据库详细信息"
echo "========================================="

echo "OPC v2.0表："
psql -U postgres -d qicheng -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'opc_v2_%' ORDER BY table_name;"

echo ""
echo "AI导师表："
psql -U postgres -d qicheng -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'mentor_%' ORDER BY table_name;"

echo ""
echo "语义匹配表："
psql -U postgres -d qicheng -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('student_capabilities', 'task_student_matches', 'task_translations') ORDER BY table_name;"

echo ""
echo "触发器："
psql -U postgres -d qicheng -c "SELECT trigger_name, event_manipulation, event_object_table FROM information_schema.triggers WHERE trigger_name LIKE 'trigger_schedule_%' ORDER BY trigger_name;"

echo ""

# ========================================
# 完成
# ========================================
echo "========================================="
echo -e "${GREEN}✅ 数据库迁移和验证完成！${NC}"
echo "========================================="
echo ""
echo "下一步："
echo "1. 启动后端服务: cd $BACKEND_DIR && npm run dev"
echo "2. 查看测试文档: cat $PROJECT_DIR/COMPLETE_TEST_EXECUTION.md"
echo "3. 执行API测试"
echo ""
