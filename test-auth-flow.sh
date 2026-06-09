#!/bin/bash

BASE_URL="http://localhost:3000/api/v1"
PHONE="13900139999"
PASSWORD="test123456"

echo "========================================="
echo "测试完整的注册登录流程"
echo "========================================="

# 1. 发送验证码
echo -e "\n1️⃣ 发送验证码..."
CODE_RES=$(curl -s -X POST "$BASE_URL/auth/send-code" \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$PHONE\"}")
echo "$CODE_RES" | jq '.'

# 2. 从数据库获取验证码（开发环境）
echo -e "\n2️⃣ 从数据库获取验证码..."
CODE=$(docker exec qicheng-postgres psql -U qicheng_user -d qicheng_db -t -c "SELECT code FROM verification_codes WHERE phone='$PHONE' ORDER BY created_at DESC LIMIT 1" | xargs)
echo "验证码: $CODE"

# 3. 注册新用户
echo -e "\n3️⃣ 注册新用户..."
REGISTER_RES=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"phone\":\"$PHONE\",
    \"code\":\"$CODE\",
    \"password\":\"$PASSWORD\",
    \"role\":\"student\",
    \"userType\":\"student\"
  }")
echo "$REGISTER_RES" | jq '.'

# 提取token
ACCESS_TOKEN=$(echo "$REGISTER_RES" | jq -r '.data.accessToken // empty')

if [ -n "$ACCESS_TOKEN" ]; then
  echo -e "\n✅ 注册成功！Access Token: ${ACCESS_TOKEN:0:20}..."
  
  # 4. 使用token获取用户信息
  echo -e "\n4️⃣ 获取用户信息..."
  USER_RES=$(curl -s -X GET "$BASE_URL/auth/me" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
  echo "$USER_RES" | jq '.'
  
  # 5. 测试登录（密码方式）
  echo -e "\n5️⃣ 测试密码登录..."
  LOGIN_RES=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
      \"phone\":\"$PHONE\",
      \"password\":\"$PASSWORD\"
    }")
  echo "$LOGIN_RES" | jq '.'
  
  # 6. 测试登录（验证码方式）
  echo -e "\n6️⃣ 发送新验证码..."
  curl -s -X POST "$BASE_URL/auth/send-code" \
    -H "Content-Type: application/json" \
    -d "{\"phone\":\"$PHONE\"}" > /dev/null
  
  NEW_CODE=$(docker exec qicheng-postgres psql -U qicheng_user -d qicheng_db -t -c "SELECT code FROM verification_codes WHERE phone='$PHONE' ORDER BY created_at DESC LIMIT 1" | xargs)
  echo "新验证码: $NEW_CODE"
  
  echo -e "\n7️⃣ 测试验证码登录..."
  CODE_LOGIN_RES=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
      \"phone\":\"$PHONE\",
      \"code\":\"$NEW_CODE\"
    }")
  echo "$CODE_LOGIN_RES" | jq '.'
  
else
  echo -e "\n❌ 注册失败"
fi

echo -e "\n========================================="
echo "测试完成"
echo "========================================="
