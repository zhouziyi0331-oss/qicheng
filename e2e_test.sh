#!/bin/bash

# 启程平台 - 端到端测试脚本
# 用于验证所有核心功能是否正常工作

set -e

BASE_URL="${BASE_URL:-http://localhost:3000}"
STUDENT_PHONE="13900000001"
COMPANY_PHONE="13900000002"
ADMIN_PHONE="13800000000"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0
STUDENT_TOKEN=""
COMPANY_TOKEN=""
ADMIN_TOKEN=""
TASK_ID=""
ORDER_ID=""

echo "=========================================="
echo "启程平台 - 端到端测试"
echo "=========================================="
echo "测试环境: $BASE_URL"
echo ""

# 测试函数
test_api() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local token=$5
    local expected_status=${6:-200}

    echo -n "测试 $name ... "

    local headers=""
    if [ -n "$token" ]; then
        headers="-H \"Authorization: Bearer $token\""
    fi

    local response
    if [ "$method" = "GET" ]; then
        response=$(eval curl -s -w "\n%{http_code}" $headers "$BASE_URL$endpoint")
    else
        response=$(eval curl -s -w "\n%{http_code}" -X $method $headers -H "Content-Type: application/json" -d "'$data'" "$BASE_URL$endpoint")
    fi

    local body=$(echo "$response" | head -n -1)
    local status=$(echo "$response" | tail -n 1)

    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✓ 通过${NC} (HTTP $status)"
        ((PASSED++))
        echo "$body"
        return 0
    else
        echo -e "${RED}✗ 失败${NC} (HTTP $status, 期望 $expected_status)"
        echo "响应: $body"
        ((FAILED++))
        return 1
    fi
}

# 提取JSON字段
extract_json() {
    local json=$1
    local field=$2
    echo "$json" | grep -o "\"$field\":\"[^\"]*\"" | cut -d'"' -f4
}

echo "=========================================="
echo "一、基础功能测试"
echo "=========================================="
echo ""

# 1. 健康检查
test_api "健康检查" "GET" "/health" "" "" 200

# 2. 学生注册
echo ""
echo "2. 学生注册"
REGISTER_RESPONSE=$(test_api "学生注册" "POST" "/api/v1/auth/register" \
    "{\"phone\":\"$STUDENT_PHONE\",\"password\":\"Test123456\",\"role\":\"student\",\"nickname\":\"测试学生\"}" \
    "" 201)

# 3. 学生登录
echo ""
echo "3. 学生登录"
LOGIN_RESPONSE=$(test_api "学生登录" "POST" "/api/v1/auth/login" \
    "{\"phone\":\"$STUDENT_PHONE\",\"password\":\"Test123456\"}" \
    "" 200)

STUDENT_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "学生Token: ${STUDENT_TOKEN:0:20}..."

# 4. 企业注册
echo ""
echo "4. 企业注册"
test_api "企业注册" "POST" "/api/v1/auth/register" \
    "{\"phone\":\"$COMPANY_PHONE\",\"password\":\"Test123456\",\"role\":\"company\",\"companyName\":\"测试企业\"}" \
    "" 201

# 5. 企业登录
echo ""
echo "5. 企业登录"
COMPANY_LOGIN=$(test_api "企业登录" "POST" "/api/v1/auth/login" \
    "{\"phone\":\"$COMPANY_PHONE\",\"password\":\"Test123456\"}" \
    "" 200)

COMPANY_TOKEN=$(echo "$COMPANY_LOGIN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "企业Token: ${COMPANY_TOKEN:0:20}..."

echo ""
echo "=========================================="
echo "二、学生端功能测试"
echo "=========================================="
echo ""

# 6. 获取用户画像（首单前应该不可见）
echo "6. 获取用户画像"
test_api "获取画像（首单前）" "GET" "/api/v1/profile/current" "" "$STUDENT_TOKEN" 200

# 7. 提交OPC测试（模拟）
echo ""
echo "7. 提交OPC测试"
OPC_DATA='{"answers":{"def_1":"我是一个喜欢用代码解决问题的人","def_2":"我擅长快速学习新技术"},"scores":{"openness":8,"persistence":7,"creativity":9}}'
test_api "提交OPC测试" "POST" "/api/v1/profile/questionnaire" "$OPC_DATA" "$STUDENT_TOKEN" 200

# 8. 获取推荐项目
echo ""
echo "8. 获取推荐项目"
test_api "获取推荐项目" "GET" "/api/v1/projects/recommended" "" "$STUDENT_TOKEN" 200

# 9. 浏览项目大厅
echo ""
echo "9. 浏览项目大厅"
test_api "浏览项目大厅" "GET" "/api/v1/projects?page=1&limit=10" "" "$STUDENT_TOKEN" 200

# 10. 获取成长报告列表
echo ""
echo "10. 获取成长报告"
test_api "获取成长报告" "GET" "/api/v1/reports" "" "$STUDENT_TOKEN" 200

echo ""
echo "=========================================="
echo "三、企业端功能测试"
echo "=========================================="
echo ""

# 11. 发布项目
echo "11. 发布项目"
PROJECT_DATA='{
  "title":"开发一个电商小程序",
  "description":"需要开发一个完整的电商小程序，包括商品展示、购物车、订单管理等功能",
  "track":"dev",
  "level":2,
  "budgetMin":3000,
  "budgetMax":5000,
  "deadline":"2026-06-30",
  "requiredSkills":["React","Node.js","微信小程序"],
  "dispatchMode":"normal"
}'
PROJECT_RESPONSE=$(test_api "发布项目" "POST" "/api/v1/projects" "$PROJECT_DATA" "$COMPANY_TOKEN" 201)

TASK_ID=$(echo "$PROJECT_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "项目ID: $TASK_ID"

# 12. 触发AI匹配
if [ -n "$TASK_ID" ]; then
    echo ""
    echo "12. 触发AI匹配"
    test_api "触发AI匹配" "POST" "/api/v1/tasks/$TASK_ID/trigger-matching" "" "$COMPANY_TOKEN" 200

    # 等待匹配完成
    sleep 3

    # 13. 查看匹配的学生
    echo ""
    echo "13. 查看匹配学生"
    test_api "查看匹配学生" "GET" "/api/v1/tasks/$TASK_ID/matched-students?limit=10" "" "$COMPANY_TOKEN" 200
fi

# 14. 查看企业的项目列表
echo ""
echo "14. 查看项目列表"
test_api "查看项目列表" "GET" "/api/v1/projects/company" "" "$COMPANY_TOKEN" 200

echo ""
echo "=========================================="
echo "四、组队和社区功能测试"
echo "=========================================="
echo ""

# 15. 浏览社区（需要Lv.4+，新用户可能无权限）
echo "15. 浏览社区"
test_api "浏览社区" "GET" "/api/v1/community-new/posts" "" "$STUDENT_TOKEN" 200

# 16. 查看组队列表
echo ""
echo "16. 查看组队列表"
test_api "查看组队列表" "GET" "/api/v1/teams-new" "" "$STUDENT_TOKEN" 200

echo ""
echo "=========================================="
echo "五、大师系统功能测试"
echo "=========================================="
echo ""

# 17. 查看大师列表
echo "17. 查看大师列表"
test_api "查看大师列表" "GET" "/api/v1/masters" "" "$COMPANY_TOKEN" 200

# 18. 查看大师中心（需要是大师身份）
echo ""
echo "18. 查看大师中心"
test_api "查看大师中心" "GET" "/api/v1/master/dashboard" "" "$STUDENT_TOKEN" 200

echo ""
echo "=========================================="
echo "六、管理端功能测试"
echo "=========================================="
echo ""

# 19. 管理员登录
echo "19. 管理员登录"
ADMIN_LOGIN=$(test_api "管理员登录" "POST" "/api/v1/admin/auth/login" \
    "{\"phone\":\"$ADMIN_PHONE\",\"password\":\"Admin123456\"}" \
    "" 200)

if [ $? -eq 0 ]; then
    ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "管理员Token: ${ADMIN_TOKEN:0:20}..."

    # 20. 获取数据看板
    echo ""
    echo "20. 获取数据看板"
    test_api "获取数据看板" "GET" "/api/v1/admin/dashboard" "" "$ADMIN_TOKEN" 200

    # 21. 获取学生列表
    echo ""
    echo "21. 获取学生列表"
    test_api "获取学生列表" "GET" "/api/v1/admin/students?page=1&limit=10" "" "$ADMIN_TOKEN" 200

    # 22. 获取企业列表
    echo ""
    echo "22. 获取企业列表"
    test_api "获取企业列表" "GET" "/api/v1/admin/companies?page=1&limit=10" "" "$ADMIN_TOKEN" 200

    # 23. 获取AI调用日志
    echo ""
    echo "23. 获取AI调用日志"
    test_api "获取AI日志" "GET" "/api/v1/admin/ai/logs?page=1&limit=10" "" "$ADMIN_TOKEN" 200
fi

echo ""
echo "=========================================="
echo "七、数据库完整性测试"
echo "=========================================="
echo ""

# 24. 检查数据库表
echo "24. 检查数据库表"
if command -v psql &> /dev/null; then
    TABLE_COUNT=$(psql -U qicheng_user -d qicheng -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
    if [ -n "$TABLE_COUNT" ] && [ "$TABLE_COUNT" -ge 28 ]; then
        echo -e "${GREEN}✓ 数据库表完整${NC} (共 $TABLE_COUNT 张表)"
        ((PASSED++))
    else
        echo -e "${RED}✗ 数据库表不完整${NC} (只有 $TABLE_COUNT 张表，应该至少28张)"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠ 跳过数据库检查（psql未安装）${NC}"
fi

# 25. 检查向量扩展
echo ""
echo "25. 检查向量扩展"
if command -v psql &> /dev/null; then
    VECTOR_EXT=$(psql -U qicheng_user -d qicheng -t -c "SELECT COUNT(*) FROM pg_extension WHERE extname = 'vector';" 2>/dev/null | xargs)
    if [ "$VECTOR_EXT" = "1" ]; then
        echo -e "${GREEN}✓ 向量扩展已安装${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ 向量扩展未安装${NC}"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠ 跳过向量扩展检查${NC}"
fi

echo ""
echo "=========================================="
echo "八、Redis功能测试"
echo "=========================================="
echo ""

# 26. 检查Redis连接
echo "26. 检查Redis连接"
if command -v redis-cli &> /dev/null; then
    REDIS_PING=$(redis-cli ping 2>/dev/null)
    if [ "$REDIS_PING" = "PONG" ]; then
        echo -e "${GREEN}✓ Redis连接正常${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ Redis连接失败${NC}"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠ 跳过Redis检查（redis-cli未安装）${NC}"
fi

echo ""
echo "=========================================="
echo "测试结果汇总"
echo "=========================================="
echo ""
echo -e "${GREEN}✓ 通过: $PASSED${NC}"
echo -e "${RED}✗ 失败: $FAILED${NC}"
echo ""

TOTAL=$((PASSED + FAILED))
if [ $TOTAL -gt 0 ]; then
    PASS_RATE=$((PASSED * 100 / TOTAL))
    echo "通过率: $PASS_RATE%"
fi
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 所有测试通过！启程平台功能正常！${NC}"
    exit 0
else
    echo -e "${RED}❌ 有 $FAILED 个测试失败，请检查日志${NC}"
    exit 1
fi
