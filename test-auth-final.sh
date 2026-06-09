#!/bin/bash

BASE_URL="http://localhost:3000/api/v1"
PHONE="13900139998"
PASSWORD="test123456"

echo "========================================="
echo "测试完整的注册登录流程"
echo "========================================="

# 1. 发送验证码
echo -e "\n1️⃣ 发送验证码到 $PHONE..."
CODE_RES=$(curl -s -X POST "$BASE_URL/auth/send-code" \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$PHONE\"}")
echo "$CODE_RES"

# 提取开发环境的验证码
CODE=$(echo "$CODE_RES" | grep -o '"_dev_code":"[^"]*"' | cut -d'"' -f4)
echo "验证码: $CODE"

if [ -z "$CODE" ]; then
  echo "❌ 未获取到验证码"
  exit 1
fi

# 2. 注册新用户
echo -e "\n2️⃣ 注册新用户..."
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

# 提取token
ACCESS_TOKEN=$(echo "$REGISTER_RES" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -n "$ACCESS_TOKEN" ]; then
  echo -e "\n✅ 注册成功！"
  echo "Access Token: ${ACCESS_TOKEN:0:30}..."
  
  # 3. 获取用户信息
  echo -e "\n3️⃣ 获取用户信息..."
  USER_RES=$(curl -s -X GET "$BASE_URL/auth/me" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
  echo "$USER_RES"
  
  # 4. 测试密码登录
  echo -e "\n4️⃣ 测试密码登录..."
  LOGIN_RES=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
      \"phone\":\"$PHONE\",
      \"password\":\"$PASSWORD\"
    }")
  echo "$LOGIN_RES"
  
  # 5. 测试验证码登录
  echo -e "\n5️⃣ 发送新验证码..."
  CODE_RES2=$(curl -s -X POST "$BASE_URL/auth/send-code" \
    -H "Content-Type: application/json" \
    -d "{\"phone\":\"$PHONE\"}")
  echo "$CODE_RES2"
  
  NEW_CODE=$(echo "$CODE_RES2" | grep -o '"_dev_code":"[^"]*"' | cut -d'"' -f4)
  echo "新验证码: $NEW_CODE"
  
  echo -e "\n6️⃣ 测试验证码登录..."
  CODE_LOGIN_RES=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
      \"phone\":\"$PHONE\",
      \"code\":\"$NEW_CODE\"
    }")
  echo "$CODE_LOGIN_RES"
  
  echo -e "\n✅ 所有测试通过！"
else
  echo -e "\n❌ 注册失败"
fi

echo -e "\n========================================="
