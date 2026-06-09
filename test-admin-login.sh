#!/bin/bash

# 管理员登录测试脚本

BASE_URL="http://localhost:3000/api/v1"

echo "=========================================="
echo "管理员登录测试"
echo "=========================================="
echo ""

# 测试1: 管理员登录
echo "1. 测试管理员登录..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/admin/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }')

echo "登录响应: $LOGIN_RESPONSE"
echo ""

# 提取token
ADMIN_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | sed 's/"token":"//;s/"//')

if [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ 登录失败，未获取到token"
  echo ""
  echo "尝试其他常见密码..."

  # 尝试密码: admin
  echo "尝试密码: admin"
  LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/admin/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "username": "admin",
      "password": "admin"
    }')
  echo "响应: $LOGIN_RESPONSE"
  ADMIN_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | sed 's/"token":"//;s/"//')

  if [ -z "$ADMIN_TOKEN" ]; then
    # 尝试密码: 123456
    echo ""
    echo "尝试密码: 123456"
    LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/admin/auth/login" \
      -H "Content-Type: application/json" \
      -d '{
        "username": "admin",
        "password": "123456"
      }')
    echo "响应: $LOGIN_RESPONSE"
    ADMIN_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | sed 's/"token":"//;s/"//')
  fi

  if [ -z "$ADMIN_TOKEN" ]; then
    echo ""
    echo "❌ 所有常见密码都失败了"
    echo "需要重置管理员密码"
    exit 1
  fi
fi

echo "✅ 登录成功！"
echo "Token: ${ADMIN_TOKEN:0:50}..."
echo ""

# 测试2: 获取管理员信息
echo "2. 测试获取管理员信息..."
ME_RESPONSE=$(curl -s -X GET "$BASE_URL/admin/auth/me" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "管理员信息: $ME_RESPONSE"
echo ""

# 测试3: 获取仪表盘数据
echo "3. 测试获取仪表盘数据..."
DASHBOARD_RESPONSE=$(curl -s -X GET "$BASE_URL/admin/dashboard" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "仪表盘数据: $DASHBOARD_RESPONSE"
echo ""

echo "=========================================="
echo "测试完成！"
echo "=========================================="
