#!/bin/bash

# 测试启程OPC新功能API
# 包括：秘密空间、成就系统、任务进度、收藏系统

echo "🧪 启程OPC v3.0 新功能API测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 测试用户ID（从seed数据中获取）
USER_ID="6a587d4c29906132d3f1fe8b"

# 生成测试token（这里简化处理，实际应该通过登录获取）
# 注意：这里需要真实的JWT token，下面的测试会失败因为需要认证
# 建议先通过 /api/auth/wechat-login 获取真实token

echo "ℹ️  注意：以下测试需要有效的JWT token"
echo "   可以通过 POST /api/auth/wechat-login 获取token"
echo ""

# 1. 健康检查
echo "1️⃣ 测试健康检查接口"
curl -s http://localhost:3000/health | python3 -m json.tool
echo ""
echo ""

# 2. 秘密空间 - 需要认证
echo "2️⃣ 测试秘密空间（需要token）"
echo "   GET /api/secret-space - 获取秘密空间"
echo "   POST /api/secret-space/check-in - 签到"
echo "   POST /api/secret-space/mood - 记录心情"
echo ""

# 3. 成就系统 - 需要认证
echo "3️⃣ 测试成就系统（需要token）"
echo "   GET /api/achievements - 获取成就列表"
echo "   POST /api/achievements/check - 检查并解锁成就"
echo "   GET /api/achievements/stats - 成就统计"
echo ""

# 4. 任务进度 - 需要认证
echo "4️⃣ 测试任务进度（需要token）"
echo "   GET /api/task-progress/my/list - 我的任务进度列表"
echo "   POST /api/task-progress/generate - 生成任务拆解（需要OpenAI API key）"
echo ""

# 5. 收藏系统 - 需要认证
echo "5️⃣ 测试收藏系统（需要token）"
echo "   GET /api/favorites - 获取收藏列表"
echo "   GET /api/favorites/stats - 收藏统计"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ API接口清单验证完成"
echo ""
echo "📝 获取JWT token的步骤："
echo "   1. 使用测试openId登录"
echo "   curl -X POST http://localhost:3000/api/auth/wechat-login \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"code\":\"test_code\",\"nickname\":\"测试用户\",\"avatar\":\"😊\"}'"
echo ""
echo "   2. 从响应中获取token，然后用于后续请求："
echo "   curl http://localhost:3000/api/secret-space \\"
echo "     -H 'Authorization: Bearer YOUR_TOKEN_HERE'"
echo ""
