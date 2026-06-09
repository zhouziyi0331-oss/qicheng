#!/bin/bash

# 启程项目 - 快速API测试脚本
BASE_URL="http://localhost:3000/api/v1"

echo "=========================================="
echo "启程项目 - 快速API测试"
echo "=========================================="
echo ""

# 1. 健康检查
echo "1. 健康检查..."
curl -s http://localhost:3000/health | python3 -m json.tool
echo ""

# 2. 发送验证码
echo "2. 发送验证码..."
PHONE="13900000099"
response=$(curl -s -X POST "$BASE_URL/auth/send-code" \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$PHONE\"}")
echo "$response" | python3 -m json.tool
CODE=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('_dev_code', '123456'))" 2>/dev/null)
echo "验证码: $CODE"
echo ""

# 3. 注册用户
echo "3. 注册新用户..."
response=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"phone\":\"$PHONE\",
    \"code\":\"$CODE\",
    \"role\":\"student\",
    \"userType\":\"student\",
    \"password\":\"Test123456\"
  }")
echo "$response" | python3 -m json.tool
TOKEN=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('accessToken', ''))" 2>/dev/null)
echo ""

# 如果注册失败，尝试登录
if [ -z "$TOKEN" ]; then
    echo "注册失败，尝试登录..."
    response=$(curl -s -X POST "$BASE_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d "{\"phone\":\"$PHONE\",\"password\":\"Test123456\"}")
    echo "$response" | python3 -m json.tool
    TOKEN=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('accessToken', ''))" 2>/dev/null)
    echo ""
fi

if [ -z "$TOKEN" ]; then
    echo "❌ 无法获取token，测试终止"
    exit 1
fi

echo "✅ Token获取成功: ${TOKEN:0:50}..."
echo ""

# 4. 获取当前用户信息
echo "4. 获取当前用户信息..."
curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""

# 5. 获取OPC题目
echo "5. 获取OPC测评题目..."
response=$(curl -s -X GET "$BASE_URL/opc/questions" \
  -H "Authorization: Bearer $TOKEN")
echo "$response" | python3 -m json.tool | head -50
echo ""

# 6. 获取学生档案
echo "6. 获取学生档案..."
curl -s -X GET "$BASE_URL/student/profile" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""

# 7. 获取能力画像
echo "7. 获取能力画像..."
curl -s -X GET "$BASE_URL/ability/profile" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""

# 8. 获取推荐任务
echo "8. 获取推荐任务..."
curl -s -X GET "$BASE_URL/tasks/matched" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -50
echo ""

# 9. 获取通知列表
echo "9. 获取通知列表..."
curl -s -X GET "$BASE_URL/notifications" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""

# 10. 获取探索模式
echo "10. 获取探索模式..."
curl -s -X GET "$BASE_URL/exploration/patterns" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""

# 11. 获取孵化项目
echo "11. 获取孵化项目..."
curl -s -X GET "$BASE_URL/incubation/projects" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""

# 12. 获取热情历史
echo "12. 获取热情发现历史..."
curl -s -X GET "$BASE_URL/passion/history" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""

# 13. 获取人生反思问题
echo "13. 获取人生反思问题..."
curl -s -X GET "$BASE_URL/life-question/questions" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""

echo "=========================================="
echo "✅ 测试完成"
echo "=========================================="
