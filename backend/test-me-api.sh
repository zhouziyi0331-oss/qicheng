#!/bin/bash

BASE_URL="http://localhost:3000/api/v1"
PHONE="13900139997"
PASSWORD="test123456"

echo "1. 发送验证码..."
CODE_RES=$(curl -s -X POST "$BASE_URL/auth/send-code" \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$PHONE\"}")
CODE=$(echo "$CODE_RES" | grep -o '"_dev_code":"[^"]*"' | cut -d'"' -f4)
echo "验证码: $CODE"

echo -e "\n2. 注册新用户..."
REGISTER_RES=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"phone\":\"$PHONE\",
    \"code\":\"$CODE\",
    \"password\":\"$PASSWORD\",
    \"role\":\"student\",
    \"userType\":\"student\"
  }")
echo "$REGISTER_RES"

ACCESS_TOKEN=$(echo "$REGISTER_RES" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -n "$ACCESS_TOKEN" ]; then
  echo -e "\n3. 测试 /auth/me 接口..."
  USER_RES=$(curl -s -X GET "$BASE_URL/auth/me" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
  echo "$USER_RES"
  
  if echo "$USER_RES" | grep -q '"success":true'; then
    echo -e "\n✅ /auth/me 接口修复成功！"
  else
    echo -e "\n❌ /auth/me 接口仍有问题"
  fi
else
  echo "注册失败"
fi
