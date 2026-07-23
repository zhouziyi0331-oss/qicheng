#!/bin/bash

echo "=========================================="
echo "P0-3 支付验证系统测试"
echo "=========================================="
echo ""

JWT_SECRET="dev-jwt-secret-key-for-testing-only"

# 先查询一个真实用户ID
echo "【准备】查询测试用户"
echo "-----------------------------------"
mongo qicheng_opc --quiet --eval 'db.users.findOne({openId: "test_user_001"}, {_id: 1})' 2>/dev/null | grep -oE '[0-9a-f]{24}' > /tmp/user_id.txt

if [ ! -s /tmp/user_id.txt ]; then
  echo "用户不存在，创建测试用户..."
  mongo qicheng_opc --quiet --eval '
    db.users.insertOne({
      openId: "test_user_001",
      nickname: "测试用户",
      avatar: "◆",
      level: 1,
      exp: 0,
      role: "user",
      totalIncome: 0,
      totalProjects: 0,
      rating: 5.0,
      createdAt: new Date()
    })
  ' > /dev/null
  
  mongo qicheng_opc --quiet --eval 'db.users.findOne({openId: "test_user_001"}, {_id: 1})' 2>/dev/null | grep -oE '[0-9a-f]{24}' > /tmp/user_id.txt
fi

USER_ID=$(cat /tmp/user_id.txt)
echo "✓ 用户ID: $USER_ID"
echo ""

# 生成JWT token
TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { userId: '$USER_ID', openId: 'test_user_001', role: 'user' },
  '$JWT_SECRET',
  { expiresIn: '7d' }
);
console.log(token);
")

echo "✓ 生成Token"
echo ""

# 测试1: 创建支付订单
echo "【测试1】创建支付订单"
echo "-----------------------------------"
ORDER_RESPONSE=$(curl -s http://localhost:3000/api/payment/create-order \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "itemType": "decomposition_report",
    "itemId": "test_report_001",
    "itemTitle": "AI实践拆解报告-测试项目",
    "amount": 29.9,
    "paymentMethod": "mock"
  }')

echo "$ORDER_RESPONSE" | python3 -m json.tool
ORDER_ID=$(echo "$ORDER_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('orderId', ''))" 2>/dev/null)
echo ""

if [ -z "$ORDER_ID" ]; then
  echo "❌ 创建订单失败"
  exit 1
fi

echo "✓ 订单号: $ORDER_ID"
echo ""

# 测试2: 模拟支付
echo "【测试2】模拟支付成功"
echo "-----------------------------------"
PAY_RESPONSE=$(curl -s http://localhost:3000/api/payment/mock-pay \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"orderId\": \"$ORDER_ID\"}")

echo "$PAY_RESPONSE" | python3 -m json.tool
echo ""

# 测试3: 查询支付状态
echo "【测试3】查询支付状态"
echo "-----------------------------------"
STATUS_RESPONSE=$(curl -s http://localhost:3000/api/payment/check-status \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"orderId\": \"$ORDER_ID\"}")

echo "$STATUS_RESPONSE" | python3 -m json.tool
echo ""

# 测试4: 支付历史
echo "【测试4】支付历史"
echo "-----------------------------------"
curl -s http://localhost:3000/api/payment/history \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""

# 测试5: 管理员功能
echo "【测试5】管理员赠送"
echo "-----------------------------------"

# 查询管理员ID
mongo qicheng_opc --quiet --eval 'db.users.findOne({role: "admin"}, {_id: 1})' 2>/dev/null | grep -oE '[0-9a-f]{24}' > /tmp/admin_id.txt
ADMIN_ID=$(cat /tmp/admin_id.txt)

ADMIN_TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { userId: '$ADMIN_ID', openId: 'admin_001', role: 'admin' },
  '$JWT_SECRET',
  { expiresIn: '7d' }
);
console.log(token);
")

curl -s http://localhost:3000/api/admin/payments/grant \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "userId": "'$USER_ID'",
    "itemType": "graduation_report",
    "itemId": "test_grad_report_001",
    "itemTitle": "毕业报告-管理员赠送",
    "remark": "测试管理员赠送"
  }' | python3 -m json.tool
echo ""

# 测试6: 支付统计
echo "【测试6】支付统计"
echo "-----------------------------------"
curl -s "http://localhost:3000/api/admin/payments/stats" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool
echo ""

echo "=========================================="
echo "✓ 测试完成"
echo "=========================================="
