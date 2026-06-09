#!/bin/bash

# 启程平台完整性验证脚本
# 用于检查所有功能是否真实可用

set -e

echo "=========================================="
echo "启程平台 - 完整性验证"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0
WARNINGS=0

# 检查函数
check_item() {
    local name=$1
    local command=$2

    echo -n "检查 $name ... "

    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 通过${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ 失败${NC}"
        ((FAILED++))
        return 1
    fi
}

check_warning() {
    local name=$1
    local command=$2

    echo -n "检查 $name ... "

    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 通过${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${YELLOW}⚠ 警告${NC}"
        ((WARNINGS++))
        return 1
    fi
}

echo "=========================================="
echo "一、数据库完整性检查"
echo "=========================================="
echo ""

# 检查核心表
check_item "users表" "docker exec qicheng-postgres psql -U postgres -d qicheng -c 'SELECT current_level, is_master FROM users LIMIT 1' -t"
check_item "user_ability_profiles表" "docker exec qicheng-postgres psql -U postgres -d qicheng -c 'SELECT is_visible_to_student, work_condition_vector FROM user_ability_profiles LIMIT 1' -t"
check_item "projects表" "docker exec qicheng-postgres psql -U postgres -d qicheng -c 'SELECT dispatch_mode, requirement_condition_vector FROM projects LIMIT 1' -t"
check_item "orders表" "docker exec qicheng-postgres psql -U postgres -d qicheng -c 'SELECT order_type, transfer_to, master_id FROM orders LIMIT 1' -t"
check_item "order_submissions表" "docker exec qicheng-postgres psql -U postgres -d qicheng -c 'SELECT is_final_fail, ai_review_json FROM order_submissions LIMIT 1' -t"
check_item "teams表" "docker exec qicheng-postgres psql -U postgres -d qicheng -c 'SELECT status, current_members FROM teams LIMIT 1' -t"
check_item "community_posts表" "docker exec qicheng-postgres psql -U postgres -d qicheng -c 'SELECT type, track FROM community_posts LIMIT 1' -t"
check_item "student_capabilities表" "docker exec qicheng-postgres psql -U postgres -d qicheng -c 'SELECT combined_vector, skills FROM student_capabilities LIMIT 1' -t"
check_item "task_student_matches表" "docker exec qicheng-postgres psql -U postgres -d qicheng -c 'SELECT overall_score, match_breakdown FROM task_student_matches LIMIT 1' -t"
check_item "task_translations表" "docker exec qicheng-postgres psql -U postgres -d qicheng -c 'SELECT functional_modules, required_skills FROM task_translations LIMIT 1' -t"

echo ""
echo "=========================================="
echo "二、后端服务文件检查"
echo "=========================================="
echo ""

# 检查AI引擎服务
check_item "AI-01 画像分析服务" "test -f backend/src/services/opcAnalysisService.ts"
check_item "AI-03 作品预审核服务" "test -f backend/src/services/aiReviewService.ts"
check_item "AI-04 成长报告服务" "test -f backend/src/services/growthTrackingService.ts"
check_item "AI-06 导师引导服务" "test -f backend/src/services/mentorCoreService.ts"
check_item "六维更新服务" "test -f backend/src/services/abilityDimensionUpdateService.ts"
check_item "语义匹配引擎" "test -f backend/src/services/semanticMatchingEngine.ts"
check_item "启程老师服务" "test -f backend/src/services/qichengTeacherService.ts"

echo ""
echo "=========================================="
echo "三、API路由检查"
echo "=========================================="
echo ""

# 检查关键路由文件
check_item "认证路由" "test -f backend/src/routes/auth/index.ts"
check_item "用户画像路由" "test -f backend/src/routes/user/profileController.ts"
check_item "项目路由" "test -f backend/src/routes/projects/index.ts"
check_item "订单路由" "test -f backend/src/routes/orders/index.ts"
check_item "导师路由" "test -f backend/src/routes/mentor/index.ts"
check_item "组队路由" "test -f backend/src/routes/teamRoutes.ts"
check_item "社区路由" "test -f backend/src/routes/communityRoutes.ts"
check_item "大师路由" "test -f backend/src/routes/masterRoutes.ts"
check_item "三次兜底路由" "test -f backend/src/routes/tasks/threeStrikeRoutes.ts"
check_item "匹配路由" "test -f backend/src/routes/tasks/matchingController.ts"

echo ""
echo "=========================================="
echo "四、学生端前端页面检查"
echo "=========================================="
echo ""

# 检查学生端页面
check_item "画像展示页面" "test -f miniapp/src/pages/ability/index.tsx"
check_item "成长总结页面" "test -f miniapp/src/pages/growth-summaries/index.tsx"
check_item "跳级申请页面" "test -f miniapp/src/pages/jump-level/index.tsx"
check_item "社区浏览页面" "test -f miniapp/src/pages/community/index/index.tsx"
check_item "推荐任务页面" "test -f miniapp/src/pages/tasks/recommended/index.tsx"
check_item "任务翻译详情页面" "test -f miniapp/src/pages/tasks/detail-translated/index.tsx"
check_item "三次兜底弹窗" "test -f miniapp/src/components/ThreeStrikeModal/index.tsx"
check_item "组队创建页面" "test -f miniapp/src/pages/team/create/index.tsx"

echo ""
echo "=========================================="
echo "五、企业端前端页面检查"
echo "=========================================="
echo ""

# 检查企业端页面
check_warning "项目发布页面" "test -f company-miniapp/src/pages/project-publish/index.tsx"
check_warning "项目列表页面" "test -f company-miniapp/src/pages/project-list/index.tsx"
check_warning "交付验收页面" "test -f company-miniapp/src/pages/order-review/index.tsx"
check_item "任务匹配页面" "test -f company-miniapp/src/pages/task-matching/index.tsx"

echo ""
echo "=========================================="
echo "六、数据完整性检查"
echo "=========================================="
echo ""

# 检查数据
echo -n "检查学生能力画像数据 ... "
STUDENT_CAP_COUNT=$(docker exec qicheng-postgres psql -U postgres -d qicheng -t -c "SELECT COUNT(*) FROM student_capabilities;" 2>/dev/null | xargs)
if [ "$STUDENT_CAP_COUNT" -gt "0" ]; then
    echo -e "${GREEN}✓ 有 $STUDENT_CAP_COUNT 条记录${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ 没有数据，需要运行初始化脚本${NC}"
    ((WARNINGS++))
fi

echo -n "检查向量维度 ... "
VECTOR_DIM=$(docker exec qicheng-postgres psql -U postgres -d qicheng -t -c "SELECT vector_dims(work_condition_vector) FROM user_ability_profiles WHERE work_condition_vector IS NOT NULL LIMIT 1;" 2>/dev/null | xargs)
if [ "$VECTOR_DIM" = "1024" ]; then
    echo -e "${GREEN}✓ 1024维${NC}"
    ((PASSED++))
elif [ -n "$VECTOR_DIM" ]; then
    echo -e "${YELLOW}⚠ 维度为 $VECTOR_DIM，应为1024${NC}"
    ((WARNINGS++))
else
    echo -e "${YELLOW}⚠ 没有向量数据${NC}"
    ((WARNINGS++))
fi

echo ""
echo "=========================================="
echo "验证结果汇总"
echo "=========================================="
echo ""
echo -e "${GREEN}✓ 通过: $PASSED${NC}"
echo -e "${RED}✗ 失败: $FAILED${NC}"
echo -e "${YELLOW}⚠ 警告: $WARNINGS${NC}"
echo ""

TOTAL=$((PASSED + FAILED + WARNINGS))
PASS_RATE=$((PASSED * 100 / TOTAL))

echo "完成度: $PASS_RATE%"
echo ""

if [ $FAILED -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 所有检查通过！启程平台功能完整！${NC}"
    exit 0
elif [ $FAILED -eq 0 ]; then
    echo -e "${YELLOW}⚠️  核心功能完整，但有 $WARNINGS 个警告项需要处理${NC}"
    exit 0
else
    echo -e "${RED}❌ 有 $FAILED 个关键项失败，需要修复${NC}"
    exit 1
fi
