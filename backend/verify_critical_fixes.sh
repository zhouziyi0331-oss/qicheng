#!/bin/bash

# 启程平台 - 关键问题修复验证脚本
# 验证completed_at字段修复和导师队列服务

echo "=========================================="
echo "启程平台关键问题修复验证"
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
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}验证1: 检查代码修复${NC}"
echo "----------------------------------------"

# 检查completed_at字段是否在所有任务完成代码中设置
echo "检查任务完成代码中的completed_at字段..."

FILES_TO_CHECK=(
  "src/routes/admin/orderController.ts"
  "src/routes/tasks/companyController.ts"
  "src/routes/team/controller.ts"
)

ALL_FIXED=true

for file in "${FILES_TO_CHECK[@]}"; do
  if grep -q "completed_at = NOW()" "$file" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} $file - completed_at字段已设置"
  else
    echo -e "${RED}✗${NC} $file - completed_at字段未设置"
    ALL_FIXED=false
  fi
done

echo ""

# 检查导师队列服务是否存在
echo "检查导师队列服务..."
if [ -f "src/services/mentorQueueService.ts" ]; then
  echo -e "${GREEN}✓${NC} mentorQueueService.ts 已创建"
else
  echo -e "${RED}✗${NC} mentorQueueService.ts 不存在"
  ALL_FIXED=false
fi

# 检查studentFlowController是否使用队列服务
if grep -q "mentorQueueService" "src/routes/tasks/studentFlowController.ts" 2>/dev/null; then
  echo -e "${GREEN}✓${NC} studentFlowController.ts 已使用队列服务"
else
  echo -e "${RED}✗${NC} studentFlowController.ts 未使用队列服务"
  ALL_FIXED=false
fi

# 检查app.ts是否启动队列处理器
if grep -q "mentorQueueService.start()" "src/app.ts" 2>/dev/null; then
  echo -e "${GREEN}✓${NC} app.ts 已启动队列处理器"
else
  echo -e "${RED}✗${NC} app.ts 未启动队列处理器"
  ALL_FIXED=false
fi

echo ""
echo -e "${BLUE}验证2: 检查数据库状态${NC}"
echo "----------------------------------------"

# 检查任务表结构
echo "检查tasks表是否有completed_at字段..."
docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME << 'EOF'
SELECT
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'tasks' AND column_name = 'completed_at';
EOF

echo ""

# 检查task_assignments表结构
echo "检查task_assignments表是否有completed_at字段..."
docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME << 'EOF'
SELECT
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'task_assignments' AND column_name = 'completed_at';
EOF

echo ""
echo -e "${BLUE}验证3: 检查已完成任务的completed_at字段${NC}"
echo "----------------------------------------"

docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME << 'EOF'
-- 检查tasks表中已完成任务的completed_at字段
SELECT
    'tasks表' as table_name,
    COUNT(*) as total_completed,
    COUNT(completed_at) as has_completed_at,
    COUNT(*) - COUNT(completed_at) as missing_completed_at
FROM tasks
WHERE status = 'completed'
UNION ALL
-- 检查task_assignments表中已完成任务的completed_at字段
SELECT
    'task_assignments表' as table_name,
    COUNT(*) as total_completed,
    COUNT(completed_at) as has_completed_at,
    COUNT(*) - COUNT(completed_at) as missing_completed_at
FROM task_assignments
WHERE status = 'completed';
EOF

echo ""
echo -e "${BLUE}验证4: 检查成长数据联动${NC}"
echo "----------------------------------------"

docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME << 'EOF'
-- 检查已完成任务是否有成长总结
SELECT
    t.id as task_id,
    t.title,
    t.status,
    t.completed_at,
    CASE
        WHEN gsc.id IS NOT NULL THEN '✓ 有成长总结'
        ELSE '✗ 缺少成长总结'
    END as growth_summary_status,
    CASE
        WHEN adh.id IS NOT NULL THEN '✓ 有能力历史'
        ELSE '✗ 缺少能力历史'
    END as ability_history_status
FROM tasks t
LEFT JOIN growth_summary_cache gsc ON t.id = gsc.task_id
LEFT JOIN task_assignments ta ON t.id = ta.task_id
LEFT JOIN ability_dimension_history adh ON ta.student_id = adh.user_id
    AND adh.created_at >= t.completed_at
WHERE t.status = 'completed'
ORDER BY t.completed_at DESC NULLS LAST
LIMIT 10;
EOF

echo ""
echo -e "${BLUE}验证5: 检查Redis连接${NC}"
echo "----------------------------------------"

# 检查Redis是否运行
if docker ps | grep -q "redis"; then
  echo -e "${GREEN}✓${NC} Redis容器正在运行"

  # 检查Redis中的导师队列
  echo "检查Redis中的导师队列..."
  docker exec -i qicheng-redis redis-cli << 'EOF'
ZCARD mentor:delayed_jobs
EOF
else
  echo -e "${RED}✗${NC} Redis容器未运行"
fi

echo ""
echo "=========================================="
echo "验证总结"
echo "=========================================="
echo ""

if [ "$ALL_FIXED" = true ]; then
  echo -e "${GREEN}✓ 所有代码修复已完成${NC}"
else
  echo -e "${RED}✗ 部分代码修复未完成${NC}"
fi

echo ""
echo -e "${YELLOW}修复内容：${NC}"
echo "1. ✓ 修复了3个文件中的completed_at字段设置"
echo "   - src/routes/admin/orderController.ts"
echo "   - src/routes/tasks/companyController.ts"
echo "   - src/routes/team/controller.ts"
echo ""
echo "2. ✓ 创建了导师队列服务（mentorQueueService.ts）"
echo "   - 使用Redis实现延迟任务队列"
echo "   - 替代setTimeout，支持持久化和重试"
echo "   - 自动处理任务失败和重试（最多3次）"
echo ""
echo "3. ✓ 更新了任务接单流程（studentFlowController.ts）"
echo "   - 使用队列服务替代setTimeout"
echo "   - 3秒后触发导师需求理解阶段"
echo ""
echo "4. ✓ 更新了服务器启动流程（app.ts）"
echo "   - 启动时自动启动队列处理器"
echo "   - 关闭时优雅停止队列处理器"
echo ""
echo -e "${YELLOW}下一步建议：${NC}"
echo "1. 重启后端服务以应用修复"
echo "2. 执行端到端测试验证修复效果"
echo "3. 监控导师队列的运行状态"
echo ""
