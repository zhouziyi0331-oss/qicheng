#!/bin/bash

# 验证成长数据联动
# 测试场景：完成订单→画像更新→推荐重排

echo "=========================================="
echo "成长数据联动验证"
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

# 测试1: 检查成长数据相关表
echo "测试1: 检查成长数据相关表"
echo "----------------------------------------"

docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME << 'EOF'
SELECT
    'user_ability_profiles' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users
FROM user_ability_profiles
UNION ALL
SELECT
    'ability_dimension_history' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users
FROM ability_dimension_history
UNION ALL
SELECT
    'growth_reports' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT student_id) as unique_users
FROM growth_reports
UNION ALL
SELECT
    'growth_summary_cache' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT student_id) as unique_users
FROM growth_summary_cache
UNION ALL
SELECT
    'student_capabilities' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT student_id) as unique_users
FROM student_capabilities;
EOF

echo ""

# 测试2: 检查任务完成情况
echo "测试2: 检查任务完成情况"
echo "----------------------------------------"

docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME << 'EOF'
SELECT
    ta.task_id,
    ta.student_id,
    ta.status,
    ta.completed_at,
    t.title
FROM task_assignments ta
LEFT JOIN tasks t ON ta.task_id = t.id
WHERE ta.status = 'completed'
ORDER BY ta.completed_at DESC NULLS LAST
LIMIT 5;
EOF

echo ""

# 测试3: 检查能力画像更新情况
echo "测试3: 检查能力画像更新情况"
echo "----------------------------------------"

docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME << 'EOF'
SELECT
    student_id,
    tasks_completed,
    avg_task_quality,
    quality_trend,
    growth_rate,
    skill_acquisition_rate,
    updated_at,
    vector_updated_at
FROM student_capabilities
WHERE tasks_completed > 0
ORDER BY updated_at DESC
LIMIT 5;
EOF

echo ""

# 测试4: 检查成长总结生成情况
echo "测试4: 检查成长总结生成情况"
echo "----------------------------------------"

docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME << 'EOF'
SELECT
    gsc.student_id,
    gsc.task_id,
    gsc.generation_status,
    gsc.is_read,
    gsc.created_at,
    t.title as task_title
FROM growth_summary_cache gsc
LEFT JOIN tasks t ON gsc.task_id = t.id
ORDER BY gsc.created_at DESC
LIMIT 5;
EOF

echo ""

# 测试5: 检查能力画像版本历史
echo "测试5: 检查能力画像版本历史"
echo "----------------------------------------"

docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME << 'EOF'
SELECT
    user_id,
    version,
    is_current,
    information_processing,
    creative_drive,
    tool_learning,
    updated_reason,
    created_at
FROM user_ability_profiles
ORDER BY user_id, version;
EOF

echo ""

# 测试6: 检查能力维度历史记录
echo "测试6: 检查能力维度历史记录"
echo "----------------------------------------"

docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME << 'EOF'
SELECT
    user_id,
    profile_version,
    change_trigger,
    information_processing,
    creative_drive,
    created_at
FROM ability_dimension_history
ORDER BY created_at DESC
LIMIT 5;
EOF

echo ""

# 测试7: 检查任务完成和能力更新的联动
echo "测试7: 检查任务完成和能力更新的联动"
echo "----------------------------------------"

docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME << 'EOF'
SELECT
    ta.task_id,
    ta.student_id,
    ta.status,
    ta.completed_at,
    sc.tasks_completed,
    sc.updated_at as capability_updated,
    gsc.id as has_growth_summary,
    CASE
        WHEN ta.completed_at IS NULL THEN '⚠ completed_at为空'
        WHEN sc.updated_at > ta.completed_at THEN '✓ 能力已更新'
        ELSE '✗ 能力未更新'
    END as linkage_status
FROM task_assignments ta
LEFT JOIN student_capabilities sc ON ta.student_id = sc.student_id
LEFT JOIN growth_summary_cache gsc ON ta.task_id = gsc.task_id AND ta.student_id = gsc.student_id
WHERE ta.status = 'completed'
ORDER BY ta.completed_at DESC NULLS LAST
LIMIT 10;
EOF

echo ""

# 测试8: 检查成长数据触发服务
echo "测试8: 检查成长数据触发服务文件"
echo "----------------------------------------"

if [ -f "/Users/alwan/code/qicheng/backend/src/services/growthDataTrigger.ts" ]; then
    echo -e "${GREEN}✓ growthDataTrigger.ts 存在${NC}"
else
    echo -e "${RED}✗ growthDataTrigger.ts 不存在${NC}"
fi

if [ -f "/Users/alwan/code/qicheng/backend/src/services/abilityDimensionUpdateService.ts" ]; then
    echo -e "${GREEN}✓ abilityDimensionUpdateService.ts 存在${NC}"
else
    echo -e "${RED}✗ abilityDimensionUpdateService.ts 不存在${NC}"
fi

if [ -f "/Users/alwan/code/qicheng/backend/src/services/studentCapabilityService.ts" ]; then
    echo -e "${GREEN}✓ studentCapabilityService.ts 存在${NC}"
else
    echo -e "${RED}✗ studentCapabilityService.ts 不存在${NC}"
fi

echo ""

# 总结
echo "=========================================="
echo "验证总结"
echo "=========================================="
echo ""
echo "成长数据系统状态："
echo "1. 成长总结缓存：2条记录（已生成）"
echo "2. 成长报告：1条记录（毕业报告）"
echo "3. 能力画像：2个用户有记录"
echo "4. 能力维度历史：0条记录（未触发更新）"
echo ""
echo "问题："
echo "- 任务状态为completed，但completed_at字段为空"
echo "- 能力维度历史表为空，说明任务完成后没有触发能力更新"
echo "- 成长总结已生成，但能力画像没有相应更新"
echo ""
echo "原因分析："
echo "1. 任务完成时，completed_at字段没有被设置"
echo "2. growthDataTrigger可能没有被调用"
echo "3. 或者调用了但因为completed_at为空而失败"
echo ""
echo "下一步："
echo "1. 检查任务完成的API路由"
echo "2. 验证是否调用了 growthDataTrigger.onOrderCompleted()"
echo "3. 修复completed_at字段的设置"
echo "4. 手动触发一次成长数据更新，验证联动"
echo ""
