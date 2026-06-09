#!/bin/bash

BASE_URL="http://localhost:3000/api/v1"

echo "=== 1. 登录获取token ==="
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13800000001",
    "password": "test123456"
  }')

echo "$LOGIN_RESPONSE" | python3 -m json.tool

TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['accessToken'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ 登录失败，无法获取token"
  exit 1
fi

echo -e "\n✅ Token获取成功\n"

echo "=== 2. 测试六维雷达图API ==="
curl -s "$BASE_URL/ability/radar" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo -e "\n=== 3. 测试成长时间线API ==="
curl -s "$BASE_URL/ability/timeline" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo -e "\n=== 4. 测试情绪状态API ==="
curl -s "$BASE_URL/ability/emotion-state" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo -e "\n✅ 能力图谱API测试完成"
