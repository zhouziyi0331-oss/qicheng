#!/bin/bash

# ============================================
# 数据安全与联系方式解锁系统 - 完整部署脚本
# ============================================

set -e  # 遇到错误立即退出

echo "=========================================="
echo "开始部署数据安全与联系方式解锁系统"
echo "=========================================="

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 数据库配置（从.env读取或使用默认值）
DB_USER=${DB_USER:-postgres}
DB_NAME=${DB_NAME:-qicheng}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

echo ""
echo "数据库配置："
echo "  用户: $DB_USER"
echo "  数据库: $DB_NAME"
echo "  主机: $DB_HOST"
echo "  端口: $DB_PORT"
echo ""

# ============================================
# 1. 检查PostgreSQL是否运行
# ============================================
echo -e "${YELLOW}[1/6] 检查PostgreSQL...${NC}"

if command -v psql &> /dev/null; then
    echo -e "${GREEN}✓ psql已安装${NC}"

    # 尝试连接数据库
    if psql -U $DB_USER -d $DB_NAME -h $DB_HOST -p $DB_PORT -c "SELECT 1" &> /dev/null; then
        echo -e "${GREEN}✓ 数据库连接成功${NC}"
    else
        echo -e "${RED}✗ 无法连接到数据库${NC}"
        echo "请确保PostgreSQL正在运行，并且数据库 '$DB_NAME' 存在"
        exit 1
    fi
else
    echo -e "${RED}✗ psql未安装或不在PATH中${NC}"
    echo "请安装PostgreSQL或将其添加到PATH"
    echo "macOS: brew install postgresql"
    exit 1
fi

# ============================================
# 2. 执行主migration
# ============================================
echo ""
echo -e "${YELLOW}[2/6] 执行数据库migration...${NC}"

MIGRATION_FILE="migrations/071_security_and_unlock_enhancement.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}✗ Migration文件不存在: $MIGRATION_FILE${NC}"
    exit 1
fi

echo "执行: $MIGRATION_FILE"
if psql -U $DB_USER -d $DB_NAME -h $DB_HOST -p $DB_PORT -f "$MIGRATION_FILE" > /tmp/migration.log 2>&1; then
    echo -e "${GREEN}✓ Migration执行成功${NC}"
else
    echo -e "${RED}✗ Migration执行失败${NC}"
    echo "错误日志："
    cat /tmp/migration.log
    exit 1
fi

# ============================================
# 3. 验证表是否创建成功
# ============================================
echo ""
echo -e "${YELLOW}[3/6] 验证表结构...${NC}"

TABLES=(
    "deliverable_encryption_metadata"
    "data_access_logs"
    "security_commitments"
    "encryption_keys"
    "contact_exchange_requests"
    "collaboration_history"
)

ALL_TABLES_EXIST=true

for table in "${TABLES[@]}"; do
    if psql -U $DB_USER -d $DB_NAME -h $DB_HOST -p $DB_PORT -c "\dt $table" 2>&1 | grep -q "$table"; then
        echo -e "${GREEN}✓ $table${NC}"
    else
        echo -e "${RED}✗ $table 不存在${NC}"
        ALL_TABLES_EXIST=false
    fi
done

if [ "$ALL_TABLES_EXIST" = false ]; then
    echo -e "${RED}部分表创建失败，请检查migration日志${NC}"
    exit 1
fi

# ============================================
# 4. 验证视图和函数
# ============================================
echo ""
echo -e "${YELLOW}[4/6] 验证视图和函数...${NC}"

# 检查视图
if psql -U $DB_USER -d $DB_NAME -h $DB_HOST -p $DB_PORT -c "\dv collaboration_progress" 2>&1 | grep -q "collaboration_progress"; then
    echo -e "${GREEN}✓ collaboration_progress 视图${NC}"
else
    echo -e "${RED}✗ collaboration_progress 视图不存在${NC}"
fi

# 检查函数
if psql -U $DB_USER -d $DB_NAME -h $DB_HOST -p $DB_PORT -c "\df can_exchange_contacts" 2>&1 | grep -q "can_exchange_contacts"; then
    echo -e "${GREEN}✓ can_exchange_contacts 函数${NC}"
else
    echo -e "${RED}✗ can_exchange_contacts 函数不存在${NC}"
fi

# ============================================
# 5. 插入测试数据（可选）
# ============================================
echo ""
echo -e "${YELLOW}[5/6] 是否插入测试数据？ (y/n)${NC}"
read -r INSERT_TEST_DATA

if [ "$INSERT_TEST_DATA" = "y" ] || [ "$INSERT_TEST_DATA" = "Y" ]; then
    TEST_FILE="migrations/TEST_unlock_flow.sql"

    if [ -f "$TEST_FILE" ]; then
        echo "执行测试数据脚本..."
        if psql -U $DB_USER -d $DB_NAME -h $DB_HOST -p $DB_PORT -f "$TEST_FILE" > /tmp/test_data.log 2>&1; then
            echo -e "${GREEN}✓ 测试数据插入成功${NC}"
        else
            echo -e "${RED}✗ 测试数据插入失败${NC}"
            cat /tmp/test_data.log
        fi
    else
        echo -e "${YELLOW}测试数据文件不存在: $TEST_FILE${NC}"
    fi
fi

# ============================================
# 6. 验证数据
# ============================================
echo ""
echo -e "${YELLOW}[6/6] 验证数据...${NC}"

# 检查安全承诺数据
COMMITMENT_COUNT=$(psql -U $DB_USER -d $DB_NAME -h $DB_HOST -p $DB_PORT -t -c "SELECT COUNT(*) FROM security_commitments WHERE is_active = true" 2>/dev/null | xargs)

if [ "$COMMITMENT_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ 安全承诺数据: $COMMITMENT_COUNT 条${NC}"
else
    echo -e "${YELLOW}⚠ 安全承诺数据为空${NC}"
fi

# 检查测试用户（如果插入了测试数据）
if [ "$INSERT_TEST_DATA" = "y" ] || [ "$INSERT_TEST_DATA" = "Y" ]; then
    TEST_USER_COUNT=$(psql -U $DB_USER -d $DB_NAME -h $DB_HOST -p $DB_PORT -t -c "SELECT COUNT(*) FROM users WHERE id IN ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333')" 2>/dev/null | xargs)

    if [ "$TEST_USER_COUNT" -eq 2 ]; then
        echo -e "${GREEN}✓ 测试用户: $TEST_USER_COUNT 个${NC}"
    else
        echo -e "${YELLOW}⚠ 测试用户数量不正确: $TEST_USER_COUNT${NC}"
    fi

    # 检查合作历史
    COLLAB_COUNT=$(psql -U $DB_USER -d $DB_NAME -h $DB_HOST -p $DB_PORT -t -c "SELECT COUNT(*) FROM collaboration_history WHERE student_id = '11111111-1111-1111-1111-111111111111'" 2>/dev/null | xargs)

    if [ "$COLLAB_COUNT" -eq 2 ]; then
        echo -e "${GREEN}✓ 合作历史: $COLLAB_COUNT 条（已完成2单）${NC}"
    else
        echo -e "${YELLOW}⚠ 合作历史数量: $COLLAB_COUNT${NC}"
    fi
fi

# ============================================
# 完成
# ============================================
echo ""
echo "=========================================="
echo -e "${GREEN}部署完成！${NC}"
echo "=========================================="
echo ""
echo "下一步："
echo "1. 启动后端服务: cd backend && npm run dev"
echo "2. 测试API:"
echo "   curl http://localhost:3000/api/v1/security/commitments"
echo ""
echo "3. 如果插入了测试数据，可以测试解锁流程:"
echo "   学生ID: 11111111-1111-1111-1111-111111111111"
echo "   企业ID: 33333333-3333-3333-3333-333333333333"
echo "   已完成2单，可以测试解锁"
echo ""
echo "查看详细文档: SECURITY_IMPLEMENTATION_PROGRESS.md"
echo ""
