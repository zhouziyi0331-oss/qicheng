#!/bin/bash

# 语义匹配系统 API 测试脚本
# 使用方法: ./test-matching-api.sh

set -e

echo "=========================================="
echo "语义匹配系统 API 测试"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
API_BASE="http://localhost:3000/api/v1"
TOKEN=""
TASK_ID=""

# 检查jq是否安装
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}提示: 安装jq可以获得更好的JSON格式化输出${NC}"
    echo "macOS: brew install jq"
    echo ""
fi

# 获取token和taskId
echo -e "${BLUE}请输入测试参数:${NC}"
read -p "JWT Token: " TOKEN
read -p "Task ID: " TASK_ID

if [ -z "$TOKEN" ] || [ -z "$TASK_ID" ]; then
    echo -e "${RED}错误: Token和Task ID不能为空${NC}"
    exit 1
fi

echo ""
echo "=========================================="
echo "开始测试..."
echo "=========================================="
echo ""

# 测试1: 触发匹配
echo -e "${YELLOW}测试 1/5: 触发AI匹配${NC}"
echo "POST $API_BASE/tasks/$TASK_ID/trigger-matching"
echo ""

RESPONSE=$(curl -s -X POST "$API_BASE/tasks/$TASK_ID/trigger-matching" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

if command -v jq &> /dev/null; then
    echo "$RESPONSE" | jq '.'
else
    echo "$RESPONSE"
fi

# 检查是否成功
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ 匹配触发成功${NC}"
else
    echo -e "${RED}✗ 匹配触发失败${NC}"
    echo "响应: $RESPONSE"
fi

echo ""
echo "等待3秒..."
sleep 3
echo ""

# 测试2: 查看匹配的学生
echo -e "${YELLOW}测试 2/5: 查看匹配的学生列表${NC}"
echo "GET $API_BASE/tasks/$TASK_ID/matched-students?limit=5"
echo ""

RESPONSE=$(curl -s "$API_BASE/tasks/$TASK_ID/matched-students?limit=5" \
  -H "Authorization: Bearer $TOKEN")

if command -v jq &> /dev/null; then
    echo "$RESPONSE" | jq '.'
else
    echo "$RESPONSE"
fi

# 提取学生ID
STUDENT_IDS=$(echo "$RESPONSE" | grep -o '"studentId":"[^"]*"' | cut -d'"' -f4 | head -5)

if [ -z "$STUDENT_IDS" ]; then
    echo -e "${YELLOW}警告: 未找到匹配的学生${NC}"
else
    echo -e "${GREEN}✓ 找到匹配的学生${NC}"
    STUDENT_ARRAY=$(echo "$STUDENT_IDS" | jq -R -s -c 'split("\n") | map(select(length > 0))')
fi

echo ""
sleep 2
echo ""

# 测试3: 推送给学生
if [ ! -z "$STUDENT_IDS" ]; then
    echo -e "${YELLOW}测试 3/5: 推送任务给学生${NC}"
    echo "POST $API_BASE/tasks/$TASK_ID/push-to-students"
    echo ""

    RESPONSE=$(curl -s -X POST "$API_BASE/tasks/$TASK_ID/push-to-students" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"studentIds\": $STUDENT_ARRAY}")

    if command -v jq &> /dev/null; then
        echo "$RESPONSE" | jq '.'
    else
        echo "$RESPONSE"
    fi

    if echo "$RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✓ 推送成功${NC}"
    else
        echo -e "${RED}✗ 推送失败${NC}"
    fi
else
    echo -e "${YELLOW}测试 3/5: 跳过（无匹配学生）${NC}"
fi

echo ""
sleep 2
echo ""

# 测试4: 查看匹配统计
echo -e "${YELLOW}测试 4/5: 查看匹配统计${NC}"
echo "GET $API_BASE/tasks/$TASK_ID/matching-stats"
echo ""

RESPONSE=$(curl -s "$API_BASE/tasks/$TASK_ID/matching-stats" \
  -H "Authorization: Bearer $TOKEN")

if command -v jq &> /dev/null; then
    echo "$RESPONSE" | jq '.'
else
    echo "$RESPONSE"
fi

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ 统计查询成功${NC}"
else
    echo -e "${RED}✗ 统计查询失败${NC}"
fi

echo ""
sleep 2
echo ""

# 测试5: 查看任务翻译
echo -e "${YELLOW}测试 5/5: 查看任务翻译${NC}"
echo "GET $API_BASE/tasks/$TASK_ID/translation"
echo ""

RESPONSE=$(curl -s "$API_BASE/tasks/$TASK_ID/translation" \
  -H "Authorization: Bearer $TOKEN")

if command -v jq &> /dev/null; then
    echo "$RESPONSE" | jq '.'
else
    echo "$RESPONSE"
fi

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ 翻译查询成功${NC}"
else
    echo -e "${YELLOW}警告: 翻译可能尚未生成${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}测试完成！${NC}"
echo "=========================================="
echo ""
echo "测试总结:"
echo "1. ✓ 触发匹配 API"
echo "2. ✓ 查看匹配学生 API"
echo "3. ✓ 推送任务 API"
echo "4. ✓ 查看统计 API"
echo "5. ✓ 查看翻译 API"
echo ""
echo "如需测试学生端API，请使用学生账号的token运行:"
echo "curl $API_BASE/tasks/students/recommended-tasks \\"
echo "  -H 'Authorization: Bearer {student_token}'"
echo ""
