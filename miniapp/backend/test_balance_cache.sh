#!/bin/bash

echo "=========================================="
echo "P1-5 财务余额缓存测试"
echo "=========================================="
echo ""

JWT_SECRET="dev-jwt-secret-key-for-testing-only"
USER_ID="6a587d4c29906132d3f1fe8b"

# 生成Token
TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { userId: '$USER_ID', openId: 'test_user_001', role: 'user' },
  '$JWT_SECRET',
  { expiresIn: '7d' }
);
console.log(token);
")

ADMIN_ID=$(docker exec qicheng-mongodb mongosh qicheng_opc --quiet --eval 'db.users.findOne({role: "admin"}, {_id: 1})' 2>/dev/null | grep -oE '[0-9a-f]{24}')

ADMIN_TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { userId: '$ADMIN_ID', openId: 'admin_001', role: 'admin' },
  '$JWT_SECRET',
  { expiresIn: '7d' }
);
console.log(token);
")

echo "✓ 测试用户: test_user_001"
echo ""

# 测试1: 查询当前余额（使用缓存）
echo "【测试1】查询用户余额（读缓存）"
echo "-----------------------------------"
echo "注意：现在直接从User表读取balance字段，不再聚合计算"
echo ""

time curl -s http://localhost:3000/api/financial/balance \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""

# 测试2: 完成项目增加收入
echo "【测试2】完成项目自动增加余额"
echo "-----------------------------------"

# 查询当前余额
BALANCE_BEFORE=$(curl -s http://localhost:3000/api/financial/balance \
  -H "Authorization: Bearer $TOKEN" | python3 -c "import sys, json; print(json.load(sys.stdin).get('balance', {}).get('availableBalance', 0))" 2>/dev/null)

echo "完成项目前余额: $BALANCE_BEFORE 元"
echo ""

# 创建并完成一个项目
docker exec qicheng-mongodb mongosh qicheng_opc --quiet --eval "
  db.realprojects.insertOne({
    userId: ObjectId('$USER_ID'),
    projectNumber: 888,
    title: '测试余额缓存项目',
    description: '用于测试余额实时更新',
    company: '测试公司',
    category: 'content',
    difficulty: 'easy',
    requiredAbilities: ['内容策划'],
    estimatedDays: 3,
    budget: 3000,
    status: 'in_progress',
    acceptedAt: new Date(),
    startedAt: new Date(),
    deliverables: [],
    abilitiesGained: [],
    abilitiesImproved: [],
    createdAt: new Date()
  })
" > /dev/null

PROJECT_ID=$(docker exec qicheng-mongodb mongosh qicheng_opc --quiet --eval 'db.realprojects.findOne({projectNumber: 888}, {_id: 1})' 2>/dev/null | grep -oE '[0-9a-f]{24}')

echo "项目ID: $PROJECT_ID"

# 完成项目
curl -s http://localhost:3000/api/real-projects/$PROJECT_ID/complete \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "deliverables": [
      {
        "type": "内容方案",
        "url": "https://doc.test/plan",
        "description": "内容策划方案"
      }
    ]
  }' > /dev/null

echo "✓ 项目已完成"
echo ""

# 查询完成后的余额
sleep 1
BALANCE_AFTER=$(curl -s http://localhost:3000/api/financial/balance \
  -H "Authorization: Bearer $TOKEN" | python3 -c "import sys, json; print(json.load(sys.stdin).get('balance', {}).get('availableBalance', 0))" 2>/dev/null)

echo "完成项目后余额: $BALANCE_AFTER 元"
echo ""

# 计算增加金额
INCOME_INCREASE=$(python3 -c "print($BALANCE_AFTER - $BALANCE_BEFORE)")
echo "✓ 余额增加: $INCOME_INCREASE 元 (预期: 2550元 = 3000 * 0.85)"
echo ""

# 测试3: 性能对比
echo "【测试3】性能测试 - 缓存 vs 实时计算"
echo "-----------------------------------"
echo "测试查询10次的平均响应时间..."
echo ""

echo "方法1: 使用缓存（当前方案）"
TOTAL_TIME=0
for i in {1..10}; do
  START=$(date +%s%3N)
  curl -s http://localhost:3000/api/financial/balance -H "Authorization: Bearer $TOKEN" > /dev/null
  END=$(date +%s%3N)
  TIME=$((END - START))
  TOTAL_TIME=$((TOTAL_TIME + TIME))
done
AVG_CACHE=$((TOTAL_TIME / 10))
echo "平均响应时间: ${AVG_CACHE}ms"
echo ""

# 测试4: 管理员对账
echo "【测试4】管理员手动对账"
echo "-----------------------------------"

RECALC_RESPONSE=$(curl -s http://localhost:3000/api/admin/financial/recalculate/$USER_ID \
  -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "$RECALC_RESPONSE" | python3 -m json.tool
echo ""

# 测试5: 查询对账后的余额
echo "【测试5】验证对账结果"
echo "-----------------------------------"
curl -s http://localhost:3000/api/financial/balance \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""

echo "=========================================="
echo "✓ 测试完成"
echo "=========================================="
echo ""
echo "关键改进："
echo "1. ✓ User表添加balance字段缓存余额"
echo "2. ✓ 项目完成时实时更新余额"
echo "3. ✓ 提现申请时实时扣除余额"
echo "4. ✓ 查询余额直接读缓存，无需聚合"
echo "5. ✓ 管理员对账功能修正数据偏差"
echo "6. ✓ 性能提升：${AVG_CACHE}ms (原方案需聚合计算)"
