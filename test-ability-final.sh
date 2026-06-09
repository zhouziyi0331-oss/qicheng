#!/bin/bash

BASE_URL="http://localhost:3000/api/v1"

echo "=== 1. 发送验证码 ==="
curl -s -X POST "$BASE_URL/auth/send-code" \
  -H "Content-Type: application/json" \
  -d '{"phone": "13900000099", "type": "login"}' | python3 -m json.tool

echo -e "\n=== 2. 验证码登录 ==="
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13900000099",
    "code": "123456",
    "loginType": "code"
  }')

echo "$LOGIN_RESPONSE" | python3 -m json.tool

TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['accessToken'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ 登录失败"
  exit 1
fi

echo -e "\n✅ 登录成功\n"

echo "=== 3. 测试六维雷达图API ==="
RADAR_RESPONSE=$(curl -s "$BASE_URL/ability/radar" -H "Authorization: Bearer $TOKEN")
echo "$RADAR_RESPONSE" | python3 -m json.tool

echo -e "\n=== 4. 测试成长时间线API ==="
curl -s "$BASE_URL/ability/timeline" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo -e "\n=== 5. 测试情绪状态API ==="
curl -s "$BASE_URL/ability/emotion-state" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo -e "\n✅ 能力图谱API测试完成"
