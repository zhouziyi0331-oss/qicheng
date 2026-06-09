#!/bin/bash

# API测试脚本
# 前提：后端服务已启动在 http://localhost:3000

set -e

echo "========================================="
echo "🧪 启程平台API测试"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BASE_URL="http://localhost:3000"
TOKEN=""

# ========================================
# 步骤1：检查后端服务
# ========================================
echo "========================================="
echo "📡 步骤1：检查后端服务"
echo "========================================="

if curl -s "$BASE_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 后端服务运行正常${NC}"
    curl -s "$BASE_URL/health" | jq '.'
else
    echo -e "${RED}❌ 后端服务未运行${NC}"
    echo "请先启动后端服务: cd backend && npm run dev"
    exit 1
fi

echo ""

# ========================================
# 步骤2：用户认证
# ========================================
echo "========================================="
echo "🔐 步骤2：用户认证"
echo "========================================="

echo "尝试登录测试用户..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13800138000",
    "password": "Test123456"
  }')

if echo "$LOGIN_RESPONSE" | jq -e '.token' > /dev/null 2>&1; then
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
    echo -e "${GREEN}✅ 登录成功${NC}"
    echo "Token: ${TOKEN:0:50}..."
else
    echo -e "${YELLOW}⚠️  测试用户不存在，尝试注册...${NC}"

    REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/auth/register" \
      -H "Content-Type: application/json" \
      -d '{
        "phone": "13800138000",
        "password": "Test123456",
        "code": "123456",
        "role": "student",
        "name": "测试学生"
      }')

    if echo "$REGISTER_RESPONSE" | jq -e '.token' > /dev/null 2>&1; then
        TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token')
        echo -e "${GREEN}✅ 注册成功${NC}"
        echo "Token: ${TOKEN:0:50}..."
    else
        echo -e "${RED}❌ 注册失败${NC}"
        echo "$REGISTER_RESPONSE" | jq '.'
        exit 1
    fi
fi

echo ""

# ========================================
# 步骤3：测试OPC v2.0 API
# ========================================
echo "========================================="
echo "🧠 步骤3：测试OPC v2.0 API"
echo "========================================="

echo -e "${BLUE}测试 1/5: 获取OPC v2.0题目${NC}"
QUESTIONS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/v1/opc/v2/questions" \
  -H "Authorization: Bearer $TOKEN")

if echo "$QUESTIONS_RESPONSE" | jq -e '.preQuestions' > /dev/null 2>&1; then
    PRE_COUNT=$(echo "$QUESTIONS_RESPONSE" | jq '.preQuestions | length')
    MAIN_COUNT=$(echo "$QUESTIONS_RESPONSE" | jq '.questions | length')
    echo -e "${GREEN}✅ 获取题目成功${NC}"
    echo "   前置题数量: $PRE_COUNT (预期: 2)"
    echo "   主题目数量: $MAIN_COUNT (预期: 36)"
else
    echo -e "${RED}❌ 获取题目失败${NC}"
    echo "$QUESTIONS_RESPONSE" | jq '.'
fi

echo ""
echo -e "${BLUE}测试 2/5: 提交OPC v2.0答案${NC}"
SUBMIT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/opc/v2/submit" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "preAnswers": {
      "career_stage": "exploring",
      "primary_goal": "skill_development"
    },
    "answers": [
      {"questionId": 1, "answer": "A"},
      {"questionId": 2, "answer": "B"},
      {"questionId": 3, "answer": "C"},
      {"questionId": 4, "answer": "A"},
      {"questionId": 5, "answer": "B"},
      {"questionId": 6, "answer": "C"},
      {"questionId": 7, "answer": "A"},
      {"questionId": 8, "answer": "B"},
      {"questionId": 9, "answer": "C"},
      {"questionId": 10, "answer": "A"},
      {"questionId": 11, "answer": "B"},
      {"questionId": 12, "answer": "C"},
      {"questionId": 13, "answer": "A"},
      {"questionId": 14, "answer": "B"},
      {"questionId": 15, "answer": "C"},
      {"questionId": 16, "answer": "A"},
      {"questionId": 17, "answer": "B"},
      {"questionId": 18, "answer": "C"},
      {"questionId": 19, "answer": "A"},
      {"questionId": 20, "answer": "B"},
      {"questionId": 21, "answer": "C"},
      {"questionId": 22, "answer": "A"},
      {"questionId": 23, "answer": "B"},
      {"questionId": 24, "answer": "C"},
      {"questionId": 25, "answer": "A"},
      {"questionId": 26, "answer": "B"},
      {"questionId": 27, "answer": "C"},
      {"questionId": 28, "answer": "A"},
      {"questionId": 29, "answer": "B"},
      {"questionId": 30, "answer": "C"},
      {"questionId": 31, "answer": "A"},
      {"questionId": 32, "answer": "B"},
      {"questionId": 33, "answer": "C"},
      {"questionId": 34, "answer": "A"},
      {"questionId": 35, "answer": "B"},
      {"questionId": 36, "answer": "C"}
    ]
  }')

if echo "$SUBMIT_RESPONSE" | jq -e '.assessmentId' > /dev/null 2>&1; then
    ASSESSMENT_ID=$(echo "$SUBMIT_RESPONSE" | jq -r '.assessmentId')
    echo -e "${GREEN}✅ 提交答案成功${NC}"
    echo "   Assessment ID: $ASSESSMENT_ID"
    echo "   6维度分数:"
    echo "$SUBMIT_RESPONSE" | jq '.scores'
    echo "   性格标签:"
    echo "$SUBMIT_RESPONSE" | jq '.personalityTags'
else
    echo -e "${RED}❌ 提交答案失败${NC}"
    echo "$SUBMIT_RESPONSE" | jq '.'
fi

echo ""
echo -e "${BLUE}测试 3/5: 获取OPC v2.0结果${NC}"
RESULT_RESPONSE=$(curl -s -X GET "$BASE_URL/api/v1/opc/v2/result" \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESULT_RESPONSE" | jq -e '.assessmentId' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 获取结果成功${NC}"
    echo "   AI洞察:"
    echo "$RESULT_RESPONSE" | jq '.aiInsights'
else
    echo -e "${RED}❌ 获取结果失败${NC}"
    echo "$RESULT_RESPONSE" | jq '.'
fi

echo ""
echo -e "${BLUE}测试 4/5: 获取历史记录${NC}"
HISTORY_RESPONSE=$(curl -s -X GET "$BASE_URL/api/v1/opc/v2/history" \
  -H "Authorization: Bearer $TOKEN")

if echo "$HISTORY_RESPONSE" | jq -e 'type' > /dev/null 2>&1; then
    HISTORY_COUNT=$(echo "$HISTORY_RESPONSE" | jq 'length')
    echo -e "${GREEN}✅ 获取历史成功${NC}"
    echo "   历史记录数量: $HISTORY_COUNT"
else
    echo -e "${RED}❌ 获取历史失败${NC}"
    echo "$HISTORY_RESPONSE" | jq '.'
fi

echo ""

# ========================================
# 步骤4：测试AI导师触发API
# ========================================
echo "========================================="
echo "🤖 步骤4：测试AI导师触发API"
echo "========================================="

echo -e "${BLUE}测试: 获取待处理触发${NC}"
PENDING_RESPONSE=$(curl -s -X GET "$BASE_URL/api/v1/mentor-trigger/pending" \
  -H "Authorization: Bearer $TOKEN")

if echo "$PENDING_RESPONSE" | jq -e 'type' > /dev/null 2>&1; then
    PENDING_COUNT=$(echo "$PENDING_RESPONSE" | jq 'length')
    echo -e "${GREEN}✅ 获取待处理触发成功${NC}"
    echo "   待处理数量: $PENDING_COUNT"
else
    echo -e "${YELLOW}⚠️  获取待处理触发失败或无数据${NC}"
fi

echo ""
echo -e "${BLUE}测试: 获取统计数据${NC}"
STATS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/v1/mentor-trigger/stats" \
  -H "Authorization: Bearer $TOKEN")

if echo "$STATS_RESPONSE" | jq -e '.pendingCount' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 获取统计成功${NC}"
    echo "$STATS_RESPONSE" | jq '.'
else
    echo -e "${YELLOW}⚠️  获取统计失败${NC}"
fi

echo ""

# ========================================
# 完成
# ========================================
echo "========================================="
echo -e "${GREEN}✅ API测试完成！${NC}"
echo "========================================="
echo ""
echo "测试总结："
echo "- OPC v2.0 API: 已测试"
echo "- AI导师触发 API: 已测试"
echo "- 认证系统: 正常"
echo ""
echo "下一步："
echo "1. 检查后端日志，确认Cron job运行"
echo "2. 测试WebSocket连接"
echo "3. 测试前端集成"
echo ""
