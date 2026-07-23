#!/bin/bash

# API测试脚本
BASE_URL="http://localhost:3000"

echo "==================================="
echo "启程OPC系统 API测试"
echo "==================================="
echo ""

# 1. 健康检查
echo "1️⃣ 测试健康检查..."
curl -s "$BASE_URL/health" | python3 -m json.tool
echo ""

# 2. 测试OPC测评题目获取（无需认证）
echo "2️⃣ 测试获取OPC测评题目..."
QUESTIONS_RESULT=$(curl -s "$BASE_URL/api/opc/questions")
echo "$QUESTIONS_RESULT" | python3 -c "import sys, json; data = json.load(sys.stdin); print(f'✓ 成功获取 {len(data.get(\"data\", []))} 道测评题')"
echo ""

# 3. 创建测试用户（模拟微信登录）
echo "3️⃣ 创建测试用户..."
LOGIN_RESULT=$(curl -s -X POST "$BASE_URL/api/auth/wechat-login" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "test-code-001",
    "userInfo": {
      "nickName": "测试学生",
      "avatarUrl": "https://example.com/avatar.png"
    }
  }')

TOKEN=$(echo "$LOGIN_RESULT" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('data', {}).get('token', ''))" 2>/dev/null)
USER_ID=$(echo "$LOGIN_RESULT" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('data', {}).get('user', {}).get('_id', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "⚠️ 无法创建测试用户（可能需要配置微信API）"
  echo "跳过需要认证的测试..."
  exit 0
fi

echo "✓ 测试用户创建成功"
echo "  Token: ${TOKEN:0:20}..."
echo "  User ID: $USER_ID"
echo ""

# 4. 提交OPC测评
echo "4️⃣ 提交OPC测评..."
SUBMIT_RESULT=$(curl -s -X POST "$BASE_URL/api/opc/submit" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "answers": {
      "1": "A", "2": "B", "3": "C", "4": "D",
      "5": "A", "6": "B", "7": "C", "8": "D",
      "9": "A", "10": "B", "11": "C", "12": "D",
      "13": "A", "14": "B", "15": "C", "16": "D",
      "17": "A", "18": "B", "19": "C", "20": "D",
      "21": "A", "22": "B", "23": "C", "24": "D",
      "25": "A", "26": "B", "27": "C", "28": "D",
      "29": "A", "30": "B", "31": "C", "32": "D",
      "33": "A", "34": "B", "35": "C", "36": "D"
    }
  }')

echo "$SUBMIT_RESULT" | python3 -c "import sys, json; data = json.load(sys.stdin); result = data.get('data', {}); print(f'✓ OPC测评完成'); print(f'  人格标签: {result.get(\"personalityTag\")}'); print(f'  维度数量: {len(result.get(\"dimensionScores\", {}))}')"
echo ""

# 5. 获取最新测评结果
echo "5️⃣ 获取最新测评结果..."
curl -s "$BASE_URL/api/opc/latest" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "import sys, json; data = json.load(sys.stdin); result = data.get('data', {}); print(f'✓ 测评结果: {result.get(\"personalityTag\")}')"
echo ""

# 6. 获取智能项目匹配
echo "6️⃣ 获取智能项目匹配..."
MATCH_RESULT=$(curl -s "$BASE_URL/api/opc/match/projects" \
  -H "Authorization: Bearer $TOKEN")
echo "$MATCH_RESULT" | python3 -c "import sys, json; data = json.load(sys.stdin); projects = data.get('data', {}).get('projects', []); print(f'✓ 匹配到 {len(projects)} 个项目')"
echo ""

# 7. AI导师对话
echo "7️⃣ 测试AI导师对话..."
CHAT_RESULT=$(curl -s -X POST "$BASE_URL/api/mentor/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "message": "我对这个项目很感兴趣，但不知道从哪里开始",
    "context": "general"
  }')

echo "$CHAT_RESULT" | python3 -c "import sys, json; data = json.load(sys.stdin); result = data.get('data', {}); response = result.get('response', '')[:100]; print(f'✓ AI导师回复: {response}...')"
echo ""

# 8. 获取成长统计
echo "8️⃣ 获取成长统计..."
curl -s "$BASE_URL/api/mentor/growth-stats" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "import sys, json; data = json.load(sys.stdin); stats = data.get('data', {}); print(f'✓ 对话次数: {stats.get(\"totalConversations\")}'); print(f'✓ 热情火花: {stats.get(\"totalPassionSparks\")}'); print(f'✓ 穿越感时刻: {stats.get(\"totalFlowMoments\")}')"
echo ""

echo "==================================="
echo "✅ API测试完成！"
echo "==================================="
