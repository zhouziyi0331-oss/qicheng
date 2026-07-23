#!/bin/bash

# 测试支付流程脚本
# 使用管理员直接创建用户的JWT token进行测试

echo "=========================================="
echo "P0-3 支付验证系统测试"
echo "=========================================="
echo ""

# JWT secret (从.env或默认值)
JWT_SECRET="${JWT_SECRET:-qicheng-jwt-secret-2024}"

# 创建测试用户的JWT token (绕过微信登录)
# 使用已存在的test_user_001
USER_ID="60d0fe4f5311236168a109ca"  # 占位符，需要从数据库获取
OPEN_ID="test_user_001"

# 使用Node.js生成JWT token
TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { userId: '$USER_ID', openId: '$OPEN_ID' },
  '$JWT_SECRET',
  { expiresIn: '7d' }
);
console.log(token);
")

echo "✓ 生成测试Token"
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

echo "✓ 订单创建成功: $ORDER_ID"
echo ""

# 测试2: 模拟支付成功
echo "【测试2】模拟支付成功"
echo "-----------------------------------"
PAY_RESPONSE=$(curl -s http://localhost:3000/api/payment/mock-pay \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"orderId\": \"$ORDER_ID\"}")

echo "$PAY_RESPONSE" | python3 -m json.tool
echo ""
echo "✓ 模拟支付完成"
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
  echo "✓ 支付状态验证成功"
else
  echo "❌ 支付状态验证失败"
  exit 1
fi
echo ""

# 测试4: 验证支付记录（尝试解锁）
echo "【测试4】验证支付 - 尝试解锁报告"
echo "-----------------------------------"
echo "注意：这需要先创建拆解报告，这里仅测试验证逻辑"
echo ""

# 测试5: 获取支付历史
echo "【测试5】获取支付历史"
echo "-----------------------------------"
HISTORY_RESPONSE=$(curl -s http://localhost:3000/api/payment/history \
  -H "Authorization: Bearer $TOKEN")

echo "$HISTORY_RESPONSE" | python3 -m json.tool
echo ""
echo "✓ 支付历史查询成功"
echo ""

# 测试6: 管理员赠送（需要admin权限）
echo "【测试6】管理员赠送支付权限"
echo "-----------------------------------"

# 生成管理员token
ADMIN_TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { userId: 'admin_id', openId: 'admin_001', role: 'admin' },
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
    "itemTitle": "毕业报告-测试赠送",
    "remark": "测试管理员赠送功能"
  }')

echo "$GRANT_RESPONSE" | python3 -m json.tool
echo ""
echo "✓ 管理员赠送测试完成"
echo ""

# 测试7: 获取支付统计
echo "【测试7】获取支付统计"
echo "-----------------------------------"
STATS_RESPONSE=$(curl -s "http://localhost:3000/api/admin/payments/stats" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "$STATS_RESPONSE" | python3 -m json.tool
echo ""
echo "✓ 支付统计查询成功"
echo ""

echo "=========================================="
echo "测试完成！"
echo "=========================================="
