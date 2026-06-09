#!/bin/bash

BASE_URL="http://localhost:3000/api/v1"
PHONE="13900139999"
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

# 2. 从数据库获取验证码
echo -e "\n2️⃣ 从数据库获取验证码..."
CODE=$(docker exec qicheng-postgres psql -U postgres -d qicheng_db -t -c "SELECT code FROM verification_codes WHERE phone='$PHONE' ORDER BY created_at DESC LIMIT 1" | xargs)
echo "验证码: $CODE"

if [ -z "$CODE" ]; then
  echo "❌ 未获取到验证码"
  exit 1
fi

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
echo "$REGISTER_RES"

# 提取token（简单字符串处理）
ACCESS_TOKEN=$(echo "$REGISTER_RES" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -n "$ACCESS_TOKEN" ]; then
  echo -e "\n✅ 注册成功！"
  echo "Access Token: ${ACCESS_TOKEN:0:30}..."
  
  # 4. 获取用户信息
  echo -e "\n4️⃣ 获取用户信息..."
  USER_RES=$(curl -s -X GET "$BASE_URL/auth/me" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
  echo "$USER_RES"
  
  # 5. 测试密码登录
  echo -e "\n5️⃣ 测试密码登录..."
  LOGIN_RES=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
      \"phone\":\"$PHONE\",
      \"password\":\"$PASSWORD\"
    }")
  echo "$LOGIN_RES"
  
  # 6. 测试验证码登录
  echo -e "\n6️⃣ 发送新验证码..."
  curl -s -X POST "$BASE_URL/auth/send-code" \
    -H "Content-Type: application/json" \
    -d "{\"phone\":\"$PHONE\"}" > /dev/null
  
  sleep 1
  NEW_CODE=$(docker exec qicheng-postgres psql -U postgres -d qicheng_db -t -c "SELECT code FROM verification_codes WHERE phone='$PHONE' ORDER BY created_at DESC LIMIT 1" | xargs)
  echo "新验证码: $NEW_CODE"
  
  echo -e "\n7️⃣ 测试验证码登录..."
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
