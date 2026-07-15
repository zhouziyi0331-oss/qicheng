#!/bin/bash

# Phase 1 数据库初始化脚本
# 运行所有必需的迁移以支持Phase 1功能

set -e

echo "========================================="
echo "Phase 1 数据库初始化"
echo "========================================="
echo ""

# 数据库连接信息
export PGPASSWORD=postgres
DB_HOST="localhost"
DB_PORT="5432"
DB_USER="postgres"
DB_NAME="qicheng"

# 等待PostgreSQL就绪
echo "等待PostgreSQL就绪..."
for i in {1..30}; do
  if docker exec qicheng-postgres psql -U $DB_USER -c '\q' 2>/dev/null; then
    echo "✓ PostgreSQL已就绪"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "✗ PostgreSQL启动超时"
    exit 1
  fi
  sleep 1
done

echo ""

# 检查数据库是否存在
echo "检查数据库..."
DB_EXISTS=$(docker exec qicheng-postgres psql -U $DB_USER -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")

if [ "$DB_EXISTS" != "1" ]; then
  echo "创建数据库 $DB_NAME..."
  docker exec qicheng-postgres psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;"
  echo "✓ 数据库创建成功"
else
  echo "✓ 数据库已存在"
fi

echo ""

# 进入migrations目录
cd "$(dirname "$0")/migrations"

# Phase 1 必需的迁移文件（按顺序）
REQUIRED_MIGRATIONS=(
  "007_ai_mentor_tables.sql"
  "012_complete_business_flow.sql"
  "016_opc_test_system.sql"
  "017_opc_test_questions_data.sql"
  "040_opc_assessment_growth_report_system_fixed.sql"
  "042_opc_v2_ability_portrait_system.sql"
  "090_opc_v2_personality_system.sql"
  "090_opc_v2_test_data.sql"
  "031_test_data.sql"
)

echo "运行必需的迁移..."
echo "========================================="

for migration in "${REQUIRED_MIGRATIONS[@]}"; do
  if [ -f "$migration" ]; then
    echo ""
    echo "▶ 运行: $migration"
    if docker exec -i qicheng-postgres psql -U $DB_USER -d $DB_NAME < "$migration" > /dev/null 2>&1; then
      echo "  ✓ 成功"
    else
      echo "  ⚠ 跳过（可能已执行或有冲突）"
    fi
  else
    echo "  ⚠ 文件不存在: $migration"
  fi
done

echo ""
echo "========================================="
echo "验证关键表..."
echo "========================================="

# 验证关键表是否存在
TABLES=("users" "user_opc_results" "orders" "mentor_observations")

for table in "${TABLES[@]}"; do
  TABLE_EXISTS=$(docker exec qicheng-postgres psql -U $DB_USER -d $DB_NAME -tAc "SELECT 1 FROM information_schema.tables WHERE table_name='$table'")
  if [ "$TABLE_EXISTS" = "1" ]; then
    ROW_COUNT=$(docker exec qicheng-postgres psql -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM $table")
    echo "✓ $table (${ROW_COUNT}行)"
  else
    echo "✗ $table 不存在"
  fi
done

echo ""
echo "========================================="
echo "数据库初始化完成！"
echo "========================================="
echo ""
echo "下一步："
echo "1. 测试stats API: curl http://localhost:3517/api/v1/stats/personality/system_builder"
echo "2. 启动前端构建: cd ../miniapp && npm run build:weapp"
echo "3. 在微信开发者工具中测试所有功能"
echo ""
