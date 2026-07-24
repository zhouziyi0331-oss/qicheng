#!/bin/bash

# 晋级验证系统 - 后端测试脚本

BASE_URL="http://localhost:3000"
TOKEN="your_test_token_here"

echo "================================"
echo "晋级验证系统 - API 测试"
echo "================================"
echo ""

# 测试1: 健康检查
echo "📍 测试1: 健康检查"
curl -X GET "$BASE_URL/health" | jq '.'
echo ""
echo ""

# 测试2: 检查晋级条件
echo "📍 测试2: 检查晋级条件"
curl -X POST "$BASE_URL/api/level-up/check" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "completedOrderId": "order_test_001"
  }' | jq '.'
echo ""
echo ""

# 测试3: 获取 Lv.0→1 对话
echo "📍 测试3: 获取 Lv.0→1 对话内容"
curl -X POST "$BASE_URL/api/level-up/dialog" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fromLevel": 0,
    "toLevel": 1
  }' | jq '.'
echo ""
echo ""

# 测试4: 获取 Lv.1→2 对话
echo "📍 测试4: 获取 Lv.1→2 对话内容"
curl -X POST "$BASE_URL/api/level-up/dialog" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fromLevel": 1,
    "toLevel": 2
  }' | jq '.'
echo ""
echo ""

# 测试5: 提交答案
echo "📍 测试5: 提交答案"
curl -X POST "$BASE_URL/api/level-up/answer" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fromLevel": 1,
    "toLevel": 2,
    "selectedOption": "B"
  }' | jq '.'
echo ""
echo ""

# 测试6: 确认晋级
echo "📍 测试6: 确认晋级"
curl -X POST "$BASE_URL/api/level-up/confirm" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "toLevel": 2
  }' | jq '.'
echo ""
echo ""

echo "================================"
echo "✅ 测试完成"
echo "================================"
