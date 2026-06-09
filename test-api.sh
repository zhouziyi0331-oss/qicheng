#!/bin/bash

# 启程项目 - API测试脚本
# 用于快速测试核心API功能

BASE_URL="http://localhost:3000/api/v1"
TOKEN=""

echo "=========================================="
echo "启程项目 API 测试"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试结果统计
PASSED=0
FAILED=0

# 测试函数
test_api() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_code=$5

    echo -n "测试: $name ... "

    if [ "$method" = "GET" ]; then
        if [ -z "$TOKEN" ]; then
            response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL$endpoint")
        else
            response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL$endpoint" -H "Authorization: Bearer $TOKEN")
        fi
    else
        if [ -z "$TOKEN" ]; then
            response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint" -H "Content-Type: application/json" -d "$data")
        else
            response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "$data")
        fi
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" = "$expected_code" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (Expected $expected_code, got $http_code)"
        echo "Response: $body"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# 1. 健康检查
echo "=========================================="
echo "1. 健康检查"
echo "=========================================="
response=$(curl -s http://localhost:3000/health)
if echo "$response" | grep -q "ok"; then
    echo -e "${GREEN}✓ 后端服务运行正常${NC}"
    echo "Response: $response"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ 后端服务异常${NC}"
    FAILED=$((FAILED + 1))
fi
echo ""

# 2. 注册新用户
echo "=========================================="
echo "2. 用户注册测试"
echo "=========================================="
TIMESTAMP=$(date +%s)
TEST_PHONE="138${TIMESTAMP:(-8)}"
echo "测试手机号: $TEST_PHONE"

register_data="{\"phone\":\"$TEST_PHONE\",\"password\":\"Test123456\",\"code\":\"123456\",\"role\":\"student\"}"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/register" -H "Content-Type: application/json" -d "$register_data")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ 注册成功${NC}"
    TOKEN=$(echo "$body" | python3 -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('token', ''))" 2>/dev/null)
    if [ -z "$TOKEN" ]; then
        echo -e "${YELLOW}⚠ 未获取到token，尝试登录${NC}"
        # 尝试登录
        login_data="{\"phone\":\"$TEST_PHONE\",\"password\":\"Test123456\"}"
        response=$(curl -s -X POST "$BASE_URL/auth/login" -H "Content-Type: application/json" -d "$login_data")
        TOKEN=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('token', ''))" 2>/dev/null)
    fi
    echo "Token: ${TOKEN:0:50}..."
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ 注册失败 (HTTP $http_code)${NC}"
    echo "Response: $body"
    FAILED=$((FAILED + 1))

    # 尝试使用已存在的测试账号登录
    echo -e "${YELLOW}尝试使用已存在账号登录...${NC}"
    login_data='{"phone":"13800138000","password":"Test123456"}'
    response=$(curl -s -X POST "$BASE_URL/auth/login" -H "Content-Type: application/json" -d "$login_data")
    TOKEN=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('token', ''))" 2>/dev/null)
    if [ ! -z "$TOKEN" ]; then
        echo -e "${GREEN}✓ 使用已存在账号登录成功${NC}"
        echo "Token: ${TOKEN:0:50}..."
    fi
fi
echo ""

# 3. 获取当前用户信息
echo "=========================================="
echo "3. 获取用户信息"
echo "=========================================="
test_api "获取当前用户" "GET" "/auth/me" "" "200"
echo ""

# 4. OPC测评系统测试
echo "=========================================="
echo "4. OPC测评系统"
echo "=========================================="
test_api "获取OPC题目" "GET" "/opc/questions" "" "200"
echo ""

# 5. 任务系统测试
echo "=========================================="
echo "5. 任务系统"
echo "=========================================="
test_api "获取推荐任务" "GET" "/tasks/matched" "" "200"
test_api "获取我的任务" "GET" "/tasks/my" "" "200"
echo ""

# 6. 能力系统测试
echo "=========================================="
echo "6. 能力系统"
echo "=========================================="
test_api "获取能力画像" "GET" "/ability/profile" "" "200"
echo ""

# 7. AI导师系统测试
echo "=========================================="
echo "7. AI导师系统"
echo "=========================================="
test_api "获取导师列表" "GET" "/mentor/students" "" "200"
echo ""

# 8. 通知系统测试
echo "=========================================="
echo "8. 通知系统"
echo "=========================================="
test_api "获取通知列表" "GET" "/notifications" "" "200"
test_api "获取未读数量" "GET" "/notifications/unread-count" "" "200"
echo ""

# 9. 学生信息测试
echo "=========================================="
echo "9. 学生信息"
echo "=========================================="
test_api "获取学生档案" "GET" "/student/profile" "" "200"
test_api "获取余额信息" "GET" "/student/balance" "" "200"
test_api "获取等级信息" "GET" "/student/level" "" "200"
echo ""

# 10. 合伙人系统测试
echo "=========================================="
echo "10. 合伙人系统"
echo "=========================================="
test_api "获取合伙关系" "GET" "/partnerships/student/test-student-id" "" "200"
echo ""

# 11. 联盟系统测试
echo "=========================================="
echo "11. 联盟系统"
echo "=========================================="
test_api "获取我的联盟" "GET" "/alliances/my" "" "200"
echo ""

# 12. 探索系统测试
echo "=========================================="
echo "12. 探索系统"
echo "=========================================="
test_api "获取探索模式" "GET" "/exploration/patterns" "" "200"
test_api "获取探索历史" "GET" "/exploration/history" "" "200"
echo ""

# 13. 孵化系统测试
echo "=========================================="
echo "13. 孵化系统"
echo "=========================================="
test_api "获取孵化项目" "GET" "/incubation/projects" "" "200"
echo ""

# 14. 热情系统测试
echo "=========================================="
echo "14. 热情发现"
echo "=========================================="
test_api "获取热情历史" "GET" "/passion/history" "" "200"
echo ""

# 15. 人生问题测试
echo "=========================================="
echo "15. 人生反思"
echo "=========================================="
test_api "获取反思问题" "GET" "/life-question/questions" "" "200"
test_api "获取反思历史" "GET" "/life-question/history" "" "200"
echo ""

# 测试总结
echo "=========================================="
echo "测试总结"
echo "=========================================="
TOTAL=$((PASSED + FAILED))
echo "总测试数: $TOTAL"
echo -e "${GREEN}通过: $PASSED${NC}"
echo -e "${RED}失败: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 所有测试通过！${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  有 $FAILED 个测试失败${NC}"
    exit 1
fi
