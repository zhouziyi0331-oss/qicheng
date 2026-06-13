#!/bin/bash

# 测试新实现的体验优化API端点

BASE_URL="http://localhost:3000/api/v1"
TOKEN="test-token"  # 需要替换为真实token

echo "======================================"
echo "测试体验优化功能API"
echo "======================================"

echo ""
echo "1. 测试任务模板列表 (E-01a)"
curl -X GET "${BASE_URL}/task-experience/templates" \
  -H "Content-Type: application/json" \
  2>/dev/null | jq '.' || echo "❌ 失败"

echo ""
echo "2. 测试任务草稿保存 (E-01d)"
curl -X POST "${BASE_URL}/task-experience/drafts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "title": "测试任务",
    "description": "这是一个测试任务",
    "category": "设计类",
    "budget": 500
  }' \
  2>/dev/null | jq '.' || echo "❌ 需要登录"

echo ""
echo "3. 测试预算建议 (E-01b)"
curl -X POST "${BASE_URL}/task-experience/budget-suggestion" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "task_category": "设计类",
    "quality_expectation": "standard"
  }' \
  2>/dev/null | jq '.' || echo "❌ 需要登录"

echo ""
echo "4. 测试学生搜索 (E-05c)"
curl -X POST "${BASE_URL}/matching-enhancement/search-students" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "filters": {
      "student_level_min": 3,
      "min_rating": 4.0
    }
  }' \
  2>/dev/null | jq '.' || echo "❌ 需要登录"

echo ""
echo "5. 测试修改意见模板列表 (E-30)"
curl -X GET "${BASE_URL}/acceptance/revision-templates" \
  -H "Authorization: Bearer ${TOKEN}" \
  2>/dev/null | jq '.' || echo "❌ 需要登录"

echo ""
echo "======================================"
echo "测试完成"
echo "======================================"
