#!/bin/bash

# 测试语义匹配系统的完整脚本
# 使用方法: ./scripts/testMatchingSystem.sh

set -e

BASE_URL="http://localhost:3000"
COMPANY_TOKEN=""
STUDENT_TOKEN=""

echo "=========================================="
echo "启程平台 - 语义匹配系统测试"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 检查服务器是否运行
echo "1️⃣  检查后端服务..."
if curl -s "$BASE_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 后端服务运行正常${NC}"
else
    echo -e "${RED}❌ 后端服务未运行，请先启动: npm run dev${NC}"
    exit 1
fi
echo ""

# 2. 检查数据库表
echo "2️⃣  检查数据库表..."
docker exec qicheng-postgres psql -U postgres -d qicheng -c "
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_capabilities') THEN '✅'
    ELSE '❌'
  END || ' student_capabilities' as table_check
UNION ALL
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_student_matches') THEN '✅'
    ELSE '❌'
  END || ' task_student_matches'
UNION ALL
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_translations') THEN '✅'
    ELSE '❌'
  END || ' task_translations';
" 2>/dev/null || echo -e "${YELLOW}⚠️  无法连接数据库${NC}"
echo ""

# 3. 检查学生能力画像数据
echo "3️⃣  检查学生能力画像数据..."
STUDENT_COUNT=$(docker exec qicheng-postgres psql -U postgres -d qicheng -t -c "SELECT COUNT(*) FROM student_capabilities;" 2>/dev/null | xargs)
echo "   学生能力画像记录数: $STUDENT_COUNT"
if [ "$STUDENT_COUNT" -eq "0" ]; then
    echo -e "${YELLOW}⚠️  没有学生能力画像数据，需要运行初始化脚本${NC}"
    echo "   运行: npm run init-student-capabilities"
fi
echo ""

# 4. 测试API端点
echo "4️⃣  测试API端点可用性..."

# 需要先登录获取token
echo "   提示: 需要有效的JWT token才能测试API"
echo "   请手动测试以下端点:"
echo ""
echo "   企业端:"
echo "   - POST /api/v1/tasks/:taskId/trigger-matching"
echo "   - GET  /api/v1/tasks/:taskId/matched-students"
echo "   - POST /api/v1/tasks/:taskId/push-to-students"
echo "   - GET  /api/v1/tasks/:taskId/matching-stats"
echo ""
echo "   学生端:"
echo "   - GET  /api/v1/tasks/students/recommended-tasks"
echo "   - GET  /api/v1/tasks/:taskId/translation"
echo "   - POST /api/v1/tasks/:taskId/accept-recommendation"
echo ""

# 5. 检查服务文件
echo "5️⃣  检查服务文件..."
SERVICES=(
    "src/services/vectorGenerationService.ts"
    "src/services/semanticMatchingEngine.ts"
    "src/services/qichengTeacherService.ts"
    "src/services/matchingScheduler.ts"
)

for service in "${SERVICES[@]}"; do
    if [ -f "$service" ]; then
        echo -e "   ${GREEN}✅${NC} $service"
    else
        echo -e "   ${RED}❌${NC} $service"
    fi
done
echo ""

# 6. 检查路由注册
echo "6️⃣  检查路由注册..."
if grep -q "matchingController" src/routes/tasks/index.ts 2>/dev/null; then
    echo -e "   ${GREEN}✅${NC} 匹配路由已注册"
else
    echo -e "   ${RED}❌${NC} 匹配路由未注册"
fi
echo ""

# 7. 数据库统计
echo "7️⃣  数据库统计..."
docker exec qicheng-postgres psql -U postgres -d qicheng -c "
SELECT
    '学生总数' as metric,
    COUNT(*) as count
FROM users WHERE role = 'student'
UNION ALL
SELECT
    '企业总数',
    COUNT(*)
FROM users WHERE role = 'company'
UNION ALL
SELECT
    '开放任务数',
    COUNT(*)
FROM tasks WHERE status = 'open'
UNION ALL
SELECT
    '能力画像数',
    COUNT(*)
FROM student_capabilities
UNION ALL
SELECT
    '匹配记录数',
    COUNT(*)
FROM task_student_matches;
" 2>/dev/null || echo -e "${YELLOW}⚠️  无法获取统计数据${NC}"
echo ""

echo "=========================================="
echo "测试完成！"
echo "=========================================="
echo ""
echo "📝 下一步操作:"
echo "1. 如果学生能力画像为0，运行: npm run init-student-capabilities"
echo "2. 使用Postman测试API端点"
echo "3. 查看日志: tail -f logs/app.log"
echo ""
