#!/bin/bash

# 晋级验证系统 - 数据库初始化脚本

echo "================================"
echo "晋级验证系统 - 数据库初始化"
echo "================================"
echo ""

# 检查MongoDB是否运行
echo "📍 检查MongoDB服务..."
if ! pgrep -x "mongod" > /dev/null; then
    echo "❌ MongoDB未运行，请先启动MongoDB服务"
    echo "   macOS: brew services start mongodb-community"
    echo "   Linux: sudo systemctl start mongod"
    exit 1
fi

echo "✅ MongoDB服务正常运行"
echo ""

# 执行初始化
echo "📍 开始初始化数据库..."
echo ""

mongosh qicheng <<EOF

print("========================================");
print("1. 创建新集合");
print("========================================");

// 创建 levelUpAnswers 集合
db.createCollection("levelUpAnswers");
print("✓ levelUpAnswers 集合已创建");

// 创建 levelUpHistory 集合
db.createCollection("levelUpHistory");
print("✓ levelUpHistory 集合已创建");

print("");
print("========================================");
print("2. 创建索引");
print("========================================");

// levelUpAnswers 索引
db.levelUpAnswers.createIndex({ "studentId": 1, "toLevel": 1 });
print("✓ levelUpAnswers 索引已创建");

// levelUpHistory 索引
db.levelUpHistory.createIndex({ "studentId": 1, "leveledUpAt": -1 });
print("✓ levelUpHistory 索引已创建");

print("");
print("========================================");
print("3. 更新现有集合");
print("========================================");

// 为现有学生添加 level 字段
var studentsResult = db.students.updateMany(
  { level: { \$exists: false } },
  { \$set: { level: 0 } }
);
print("✓ 已为 " + studentsResult.modifiedCount + " 个学生添加 level 字段");

// 为现有订单添加必要字段
var ordersResult1 = db.completedOrders.updateMany(
  { revisionCount: { \$exists: false } },
  { \$set: { revisionCount: 0 } }
);
print("✓ 已为 " + ordersResult1.modifiedCount + " 个订单添加 revisionCount 字段");

var ordersResult2 = db.completedOrders.updateMany(
  { rating: { \$exists: false } },
  { \$set: { rating: 4.5 } }
);
print("✓ 已为 " + ordersResult2.modifiedCount + " 个订单添加 rating 字段");

var ordersResult3 = db.completedOrders.updateMany(
  { review: { \$exists: false } },
  { \$set: { review: "完成得不错" } }
);
print("✓ 已为 " + ordersResult3.modifiedCount + " 个订单添加 review 字段");

var ordersResult4 = db.completedOrders.updateMany(
  { amount: { \$exists: false } },
  { \$set: { amount: 80 } }
);
print("✓ 已为 " + ordersResult4.modifiedCount + " 个订单添加 amount 字段");

print("");
print("========================================");
print("4. 验证结果");
print("========================================");

var studentCount = db.students.countDocuments();
var studentWithLevelCount = db.students.countDocuments({ level: { \$exists: true } });
var orderCount = db.completedOrders.countDocuments();
var answerCount = db.levelUpAnswers.countDocuments();
var historyCount = db.levelUpHistory.countDocuments();

print("学生总数: " + studentCount);
print("有等级的学生数: " + studentWithLevelCount);
print("已完成订单数: " + orderCount);
print("晋级答案记录数: " + answerCount);
print("晋级历史记录数: " + historyCount);

print("");
print("========================================");
print("✅ 数据库初始化完成！");
print("========================================");

EOF

echo ""
echo "================================"
echo "✅ 初始化完成！"
echo "================================"
echo ""
echo "下一步："
echo "1. 启动后端服务: cd miniapp/backend && npm run dev"
echo "2. 测试API接口: ./test-level-up-api.sh"
echo "3. 启动小程序进行前端测试"
echo ""
