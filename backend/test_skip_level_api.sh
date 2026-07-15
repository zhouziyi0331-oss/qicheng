#!/bin/bash
# 跳级系统API测试脚本

BASE_URL="http://localhost:3000"
TOKEN=""

echo "======================================"
echo "跳级系统API测试"
echo "======================================"
echo ""

# 检查是否提供了token
if [ -z "$1" ]; then
    echo "使用方法: ./test_skip_level_api.sh [YOUR_JWT_TOKEN]"
    echo ""
    echo "获取token的方法:"
    echo "1. 登录小程序"
    echo "2. 在开发者工具的Storage中找到access_token"
    echo "3. 复制token值作为参数运行此脚本"
    exit 1
fi

TOKEN=$1

echo "测试服务器: $BASE_URL"
echo "Token: ${TOKEN:0:20}..."
echo ""
echo "======================================"
echo ""

# 测试1: 检查跳级资格
echo "📋 测试1: 检查跳级资格"
echo "GET /api/skip-level/eligibility"
curl -s -X GET \
  -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/api/skip-level/eligibility" | jq '.'
echo ""
echo "======================================"
echo ""

# 测试2: 申请跳级 (注意：这会创建真实记录)
read -p "是否测试申请跳级? (会创建真实记录) (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📝 测试2: 申请跳级到Lv.4"
    echo "POST /api/skip-level/apply"
    APPLY_RESULT=$(curl -s -X POST \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"targetLevel": 4}' \
      "$BASE_URL/api/skip-level/apply")
    echo $APPLY_RESULT | jq '.'

    # 提取taskId
    TASK_ID=$(echo $APPLY_RESULT | jq -r '.taskId')
    echo ""
    echo "任务ID: $TASK_ID"
    echo ""
    echo "======================================"
    echo ""

    if [ "$TASK_ID" != "null" ] && [ -n "$TASK_ID" ]; then
        # 测试3: 获取任务详情
        echo "📄 测试3: 获取任务详情"
        echo "GET /api/skip-level/task/$TASK_ID"
        curl -s -X GET \
          -H "Authorization: Bearer $TOKEN" \
          "$BASE_URL/api/skip-level/task/$TASK_ID" | jq '.'
        echo ""
        echo "======================================"
        echo ""

        # 测试4: 领取任务
        echo "✅ 测试4: 领取任务"
        echo "POST /api/skip-level/task/$TASK_ID/receive"
        curl -s -X POST \
          -H "Authorization: Bearer $TOKEN" \
          "$BASE_URL/api/skip-level/task/$TASK_ID/receive" | jq '.'
        echo ""
        echo "======================================"
        echo ""

        # 测试5: 获取进度
        echo "📊 测试5: 获取任务进度"
        echo "GET /api/skip-level/progress/$TASK_ID"
        curl -s -X GET \
          -H "Authorization: Bearer $TOKEN" \
          "$BASE_URL/api/skip-level/progress/$TASK_ID" | jq '.'
        echo ""
        echo "======================================"
        echo ""
    fi
fi

echo ""
echo "✅ API测试完成!"
echo ""
echo "其他可测试的端点:"
echo "  - PUT /api/skip-level/progress/:taskId/subtask/:subTaskId"
echo "  - POST /api/skip-level/submit/:taskId"
echo "  - POST /api/skip-level/score/:taskId/request"
echo "  - GET /api/skip-level/score/:taskId"
echo "  - GET /api/skip-level/rewards/:taskId"
echo "  - POST /api/skip-level/rewards/:taskId/claim"
echo "  - GET /api/skip-level/improvement/:taskId"
echo ""
