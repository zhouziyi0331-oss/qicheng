#!/bin/bash

# ============================================================
# 启程项目 - 端到端测试脚本
# 测试所有新增功能的完整流程
# ============================================================

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
API_URL="http://localhost:3000/api/v1"
STUDENT_PHONE="13800138000"
STUDENT_PASSWORD="test123456"
COMPANY_PHONE="13900139000"
COMPANY_PASSWORD="test123456"

# 测试结果统计
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 测试函数
test_api() {
    local test_name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local token=$5
    local expected_status=${6:-200}

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    log_info "测试: $test_name"

    local response
    local status_code

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL$endpoint" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_URL$endpoint" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi

    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$status_code" -eq "$expected_status" ]; then
        log_info "✅ $test_name - 通过 (状态码: $status_code)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        return 0
    else
        log_error "❌ $test_name - 失败 (期望: $expected_status, 实际: $status_code)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo "$body"
        return 1
    fi
}

# ============================================================
# 主测试流程
# ============================================================

echo "=========================================="
echo "启程项目 - 端到端测试"
echo "=========================================="
echo ""

# 1. 检查服务是否运行
log_info "检查服务状态..."
if ! curl -s "$API_URL/../health" > /dev/null; then
    log_error "后端服务未运行，请先启动服务"
    exit 1
fi
log_info "✅ 后端服务运行正常"
echo ""

# 2. 学生登录
log_info "步骤1: 学生登录"
STUDENT_LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"phone\":\"$STUDENT_PHONE\",\"password\":\"$STUDENT_PASSWORD\"}")

STUDENT_TOKEN=$(echo "$STUDENT_LOGIN_RESPONSE" | jq -r '.data.token')
STUDENT_ID=$(echo "$STUDENT_LOGIN_RESPONSE" | jq -r '.data.user.id')

if [ "$STUDENT_TOKEN" = "null" ] || [ -z "$STUDENT_TOKEN" ]; then
    log_error "学生登录失败"
    echo "$STUDENT_LOGIN_RESPONSE" | jq '.'
    exit 1
fi
log_info "✅ 学生登录成功 (ID: $STUDENT_ID)"
echo ""

# 3. 企业登录
log_info "步骤2: 企业登录"
COMPANY_LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"phone\":\"$COMPANY_PHONE\",\"password\":\"$COMPANY_PASSWORD\"}")

COMPANY_TOKEN=$(echo "$COMPANY_LOGIN_RESPONSE" | jq -r '.data.token')

if [ "$COMPANY_TOKEN" = "null" ] || [ -z "$COMPANY_TOKEN" ]; then
    log_error "企业登录失败"
    echo "$COMPANY_LOGIN_RESPONSE" | jq '.'
    exit 1
fi
log_info "✅ 企业登录成功"
echo ""

# 4. 获取任务列表
log_info "步骤3: 获取任务列表"
TASKS_RESPONSE=$(curl -s -X GET "$API_URL/tasks/market" \
    -H "Authorization: Bearer $STUDENT_TOKEN")

TASK_ID=$(echo "$TASKS_RESPONSE" | jq -r '.data[0].id')

if [ "$TASK_ID" = "null" ] || [ -z "$TASK_ID" ]; then
    log_warning "没有可用任务，跳过任务相关测试"
    TASK_ID=""
else
    log_info "✅ 获取到任务 (ID: $TASK_ID)"
fi
echo ""

# 5. 测试AI拆解指导API
if [ -n "$TASK_ID" ]; then
    log_info "步骤4: 测试AI拆解指导"
    test_api "AI拆解指导" "GET" "/tasks/$TASK_ID/breakdown" "" "$STUDENT_TOKEN" 200
    echo ""
fi

# 6. 测试跳级挑战API
log_info "步骤5: 测试跳级挑战"
CHALLENGE_DATA='{
  "answers": {
    "q1": ["ChatGPT", "Claude"],
    "q2": "我完成过3个AI辅助的内容创作项目，包括文章撰写、社交媒体内容生成等。通过使用AI工具，我能够快速生成高质量的内容初稿，然后进行人工优化。",
    "q3": "B",
    "q4": "A",
    "q5": "通过分析用户需求，使用AI工具生成初稿，然后根据反馈进行迭代优化，最终交付满足要求的内容。"
  }
}'

test_api "跳级挑战提交" "POST" "/student/level-challenge" "$CHALLENGE_DATA" "$STUDENT_TOKEN" 200
echo ""

# 7. 测试学生能力画像API
log_info "步骤6: 测试学生能力画像"
test_api "查看学生能力画像" "GET" "/tasks/student-profile/$STUDENT_ID" "" "$COMPANY_TOKEN" 200
echo ""

# 8. 测试任务进度查看API
if [ -n "$TASK_ID" ]; then
    log_info "步骤7: 测试任务进度查看"

    # 先接受任务
    ACCEPT_RESPONSE=$(curl -s -X POST "$API_URL/tasks/$TASK_ID/accept" \
        -H "Authorization: Bearer $STUDENT_TOKEN")

    ASSIGNMENT_ID=$(echo "$ACCEPT_RESPONSE" | jq -r '.data.assignmentId')

    if [ "$ASSIGNMENT_ID" != "null" ] && [ -n "$ASSIGNMENT_ID" ]; then
        test_api "查看任务进度" "GET" "/tasks/$TASK_ID/progress/$ASSIGNMENT_ID" "" "$STUDENT_TOKEN" 200
    else
        log_warning "任务接受失败，跳过进度查看测试"
    fi
    echo ""
fi

# 9. 测试管理端数据API（需要管理员权限）
log_info "步骤8: 测试管理端数据API"
log_warning "需要管理员权限，跳过此测试"
echo ""

# ============================================================
# 测试结果汇总
# ============================================================

echo "=========================================="
echo "测试结果汇总"
echo "=========================================="
echo "总测试数: $TOTAL_TESTS"
echo -e "${GREEN}通过: $PASSED_TESTS${NC}"
echo -e "${RED}失败: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ 所有测试通过！${NC}"
    exit 0
else
    echo -e "${RED}❌ 有 $FAILED_TESTS 个测试失败${NC}"
    exit 1
fi
