#!/bin/bash

# 验证导师系统联动
# 测试场景：接单→T-01触发→30秒延迟→mentor_sessions记录

echo "=========================================="
echo "导师系统联动验证"
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

# 测试1: 检查导师系统表结构
echo "测试1: 检查导师系统表结构"
echo "----------------------------------------"

docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME << 'EOF'
SELECT
    'mentor_sessions' as table_name,
    COUNT(*) as record_count
FROM mentor_sessions
UNION ALL
SELECT
    'mentor_stage_sessions' as table_name,
    COUNT(*) as record_count
FROM mentor_stage_sessions
UNION ALL
SELECT
    'mentor_stage_messages' as table_name,
    COUNT(*) as record_count
FROM mentor_stage_messages
UNION ALL
SELECT
    'mentor_stage_triggers' as table_name,
    COUNT(*) as record_count
FROM mentor_stage_triggers;
EOF

echo ""

# 测试2: 检查任务接单记录
echo "测试2: 检查任务接单记录"
echo "----------------------------------------"

docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME << 'EOF'
SELECT
    ta.id,
    ta.task_id,
    ta.student_id,
    ta.status,
    ta.accepted_at,
    ta.assigned_at
FROM task_assignments ta
WHERE ta.status IN ('accepted', 'in_progress', 'completed')
ORDER BY ta.assigned_at DESC
LIMIT 5;
EOF

echo ""

# 测试3: 检查导师会话触发情况
echo "测试3: 检查导师会话触发情况"
echo "----------------------------------------"

docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME << 'EOF'
SELECT
    ta.task_id,
    ta.student_id,
    ta.status as assignment_status,
    ta.accepted_at,
    mss.id as stage_session_id,
    mss.current_stage,
    mss.created_at as session_created,
    CASE
        WHEN mss.id IS NOT NULL THEN '✓ 已触发'
        ELSE '✗ 未触发'
    END as trigger_status
FROM task_assignments ta
LEFT JOIN mentor_stage_sessions mss ON ta.task_id = mss.task_id AND ta.student_id = mss.student_id
WHERE ta.status IN ('accepted', 'in_progress', 'completed')
ORDER BY ta.assigned_at DESC
LIMIT 10;
EOF

echo ""

# 测试4: 检查导师阶段会话详情
echo "测试4: 检查导师阶段会话详情"
echo "----------------------------------------"

docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME << 'EOF'
SELECT
    mss.id,
    mss.task_id,
    mss.student_id,
    mss.current_stage,
    mss.stage_status,
    mss.total_messages,
    mss.guidance_count,
    mss.pre_review_count,
    mss.created_at
FROM mentor_stage_sessions mss
ORDER BY mss.created_at DESC
LIMIT 5;
EOF

echo ""

# 测试5: 检查导师触发器记录
echo "测试5: 检查导师触发器记录"
echo "----------------------------------------"

docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME << 'EOF'
SELECT
    mst.id,
    mst.session_id,
    mst.trigger_type,
    mst.trigger_condition,
    mst.fired_at
FROM mentor_stage_triggers mst
ORDER BY mst.fired_at DESC
LIMIT 5;
EOF

echo ""

# 测试6: 检查旧导师系统的使用情况
echo "测试6: 检查旧导师系统的使用情况"
echo "----------------------------------------"

docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME << 'EOF'
SELECT
    ms.id,
    ms.student_id,
    ms.task_id,
    ms.status,
    ms.message_count,
    ms.created_at,
    ms.last_message_at
FROM mentor_sessions ms
WHERE ms.task_id IS NOT NULL
ORDER BY ms.created_at DESC
LIMIT 5;
EOF

echo ""

# 测试7: 检查导师服务是否存在
echo "测试7: 检查导师服务文件"
echo "----------------------------------------"

if [ -f "/Users/alwan/code/qicheng/backend/src/services/mentorTriggerService.ts" ]; then
    echo -e "${GREEN}✓ mentorTriggerService.ts 存在${NC}"
else
    echo -e "${RED}✗ mentorTriggerService.ts 不存在${NC}"
fi

if [ -f "/Users/alwan/code/qicheng/backend/src/services/mentorStageService.ts" ]; then
    echo -e "${GREEN}✓ mentorStageService.ts 存在${NC}"
else
    echo -e "${RED}✗ mentorStageService.ts 不存在${NC}"
fi

if [ -f "/Users/alwan/code/qicheng/backend/src/services/mentorScheduler.ts" ]; then
    echo -e "${GREEN}✓ mentorScheduler.ts 存在${NC}"
else
    echo -e "${RED}✗ mentorScheduler.ts 不存在${NC}"
fi

echo ""

# 总结
echo "=========================================="
echo "验证总结"
echo "=========================================="
echo ""
echo "导师系统状态："
echo "1. 旧导师系统（mentor_sessions）：有20条记录，但与任务接单无关联"
echo "2. 新导师系统（mentor_stage_sessions）：表存在但为空"
echo "3. 导师触发器（mentor_stage_triggers）：表存在但为空"
echo ""
echo "问题："
echo "- 任务接单后，导师系统没有自动触发"
echo "- 需要检查任务接单的路由是否调用了 mentorTriggerService"
echo ""
echo "下一步："
echo "1. 检查任务接单的API路由"
echo "2. 验证是否调用了 triggerRequirementUnderstanding()"
echo "3. 如果没有调用，需要在任务接单时添加触发逻辑"
echo ""
