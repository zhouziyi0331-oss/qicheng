#!/bin/bash

echo "=========================================="
echo "P0-3 支付验证系统测试"
echo "=========================================="
echo ""

JWT_SECRET="dev-jwt-secret-key-for-testing-only"
USER_ID="6a587d4c29906132d3f1fe8b"
OPEN_ID="test_user_001"

# 生成JWT token
TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { userId: '$USER_ID', openId: '$OPEN_ID', role: 'user' },
  '$JWT_SECRET',
  { expiresIn: '7d' }
);
console.log(token);
")

echo "✓ 用户: $OPEN_ID"
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
IS_PAID=$(echo "$STATUS_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('isPaid', False))" 2>/dev/null)
echo ""

if [ "$IS_PAID" = "True" ]; then
  echo "✓ 支付验证成功"
else
  echo "❌ 支付状态异常"
fi
echo ""

# 测试4: 支付历史
echo "【测试4】支付历史"
echo "-----------------------------------"
curl -s http://localhost:3000/api/payment/history \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""

# 测试5: 管理员功能
echo "【测试5】管理员赠送权限"
echo "-----------------------------------"

ADMIN_ID=$(docker exec qicheng-mongodb mongosh qicheng_opc --quiet --eval 'db.users.findOne({role: "admin"}, {_id: 1})' | grep -oE '[0-9a-f]{24}')

ADMIN_TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { userId: '$ADMIN_ID', openId: 'admin_001', role: 'admin' },
  '$JWT_SECRET',
  { expiresIn: '7d' }
);
console.log(token);
")

GRANT_RESPONSE=$(curl -s http://localhost:3000/api/admin/payments/grant \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "userId": "'$USER_ID'",
    "itemType": "graduation_report",
    "itemId": "test_grad_report_001",
    "itemTitle": "毕业报告-管理员赠送",
    "remark": "测试管理员赠送功能"
  }')

echo "$GRANT_RESPONSE" | python3 -m json.tool
echo ""

# 测试6: 支付统计
echo "【测试6】支付统计"
echo "-----------------------------------"
curl -s "http://localhost:3000/api/admin/payments/stats" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool
echo ""

# 测试7: 验证支付检查（paymentService.verifyPayment）
echo "【测试7】验证支付检查逻辑"
echo "-----------------------------------"
echo "检查用户是否已支付 test_report_001..."

# 尝试重复创建订单，应该被拒绝
DUPLICATE_RESPONSE=$(curl -s http://localhost:3000/api/payment/create-order \
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

echo "$DUPLICATE_RESPONSE" | python3 -m json.tool
ERROR_MSG=$(echo "$DUPLICATE_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('error', ''))" 2>/dev/null)

if [[ "$ERROR_MSG" == *"已解锁"* ]] || [[ "$ERROR_MSG" == *"重复"* ]]; then
  echo "✓ 重复支付检查成功"
else
  echo "⚠ 重复支付检查可能有问题"
fi
echo ""

echo "=========================================="
echo "✓ 所有测试完成"
echo "=========================================="
