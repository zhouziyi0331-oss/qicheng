#!/bin/bash

# 启程平台 - 关键问题修复脚本
# 修复completed_at字段和其他数据问题

echo "=========================================="
echo "启程平台关键问题修复"
echo "=========================================="
echo ""

# 数据库连接
DB_CONTAINER="qicheng-postgres"
DB_NAME="qicheng"
DB_USER="postgres"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "修复1: 设置任务完成时间（completed_at字段）"
echo "----------------------------------------"

docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME << 'EOF'
-- 修复已完成任务的completed_at字段
UPDATE task_assignments
SET completed_at = updated_at
WHERE status = 'completed' AND completed_at IS NULL;

-- 显示修复结果
SELECT
    task_id,
    student_id,
    status,
    completed_at,
    updated_at
FROM task_assignments
WHERE status = 'completed'
ORDER BY completed_at DESC NULLS LAST;
EOF

echo ""
echo -e "${GREEN}✓ completed_at字段已修复${NC}"
echo ""

echo "修复2: 验证能力画像数据完整性"
echo "----------------------------------------"

docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME << 'EOF'
-- 检查缺少人格标签的学生
SELECT
    student_id,
    tasks_completed,
    personality_style,
    profile_summary
FROM student_capabilities
WHERE personality_style IS NULL OR profile_summary IS NULL
LIMIT 5;
EOF

echo ""

echo "修复3: 检查向量生成状态"
echo "----------------------------------------"

docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME << 'EOF'
-- 检查缺少向量的学生
SELECT
    student_id,
    tasks_completed,
    CASE
        WHEN combined_vector IS NULL THEN '✗ 缺少向量'
        ELSE '✓ 已生成'
    END as vector_status,
    vector_updated_at
FROM student_capabilities
ORDER BY vector_updated_at DESC NULLS LAST
LIMIT 10;
EOF

echo ""

echo "修复4: 验证OPC测试和能力画像的关联"
echo "----------------------------------------"

docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME << 'EOF'
-- 检查OPC测试结果是否都有对应的能力画像
SELECT
    r.student_id,
    r.personality_label as opc_label,
    uap.personality_label as profile_label,
    sc.personality_style as capability_label,
    CASE
        WHEN uap.id IS NOT NULL AND sc.id IS NOT NULL THEN '✓ 完整'
        WHEN uap.id IS NULL THEN '✗ 缺少user_ability_profiles'
        WHEN sc.id IS NULL THEN '✗ 缺少student_capabilities'
        ELSE '⚠ 部分缺失'
    END as status
FROM opc_v2_results r
LEFT JOIN user_ability_profiles uap ON r.student_id = uap.user_id AND uap.is_current = true
LEFT JOIN student_capabilities sc ON r.student_id = sc.student_id;
EOF

echo ""

echo "=========================================="
echo "修复总结"
echo "=========================================="
echo ""
echo -e "${GREEN}已完成的修复：${NC}"
echo "1. ✓ 修复了任务completed_at字段"
echo "2. ✓ 验证了能力画像数据完整性"
echo "3. ✓ 检查了向量生成状态"
echo "4. ✓ 验证了OPC测试和能力画像的关联"
echo ""
echo -e "${YELLOW}需要代码层面的修复：${NC}"
echo "1. 替换setTimeout为消息队列（导师触发）"
echo "2. 在任务完成API中确保设置completed_at"
echo "3. 添加能力更新的重试机制"
echo ""
