#!/bin/bash

# AI导师系统测试脚本

echo "=========================================="
echo "AI导师系统测试"
echo "=========================================="
echo ""

# 1. 获取测试用户ID
echo "1. 获取测试用户ID..."
USER_ID=$(docker exec -i qicheng-postgres psql -U postgres -d qicheng -t -c "SELECT id FROM users LIMIT 1;" 2>/dev/null | xargs)

if [ -z "$USER_ID" ]; then
  echo "❌ 未找到测试用户，创建测试用户..."
  USER_ID=$(docker exec -i qicheng-postgres psql -U postgres -d qicheng -t -c "
    INSERT INTO users (phone, user_type, role, created_at)
    VALUES ('13800138888', 'student', 'student', NOW())
    ON CONFLICT (phone) DO UPDATE SET phone = EXCLUDED.phone
    RETURNING id;
  " 2>/dev/null | xargs)
fi

echo "✅ 测试用户ID: $USER_ID"
echo ""

# 2. 测试AI导师对话
echo "2. 测试AI导师对话..."
echo "发送消息: '我刚接了一个任务，不知道从哪里开始'"
echo ""

RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/mentor/chat \
  -H "Content-Type: application/json" \
  -d "{
    \"studentId\": \"$USER_ID\",
    \"message\": \"我刚接了一个任务，不知道从哪里开始\",
    \"taskId\": \"test_task_001\"
  }")

echo "响应:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
echo ""

# 3. 检查响应
if echo "$RESPONSE" | grep -q "success.*true"; then
  echo "✅ AI导师对话成功！"

  # 提取回复长度
  RESPONSE_TEXT=$(echo "$RESPONSE" | jq -r '.response' 2>/dev/null)
  RESPONSE_LENGTH=${#RESPONSE_TEXT}

  echo ""
  echo "回复内容:"
  echo "----------------------------------------"
  echo "$RESPONSE_TEXT"
  echo "----------------------------------------"
  echo ""
  echo "回复长度: $RESPONSE_LENGTH 字符"

  if [ $RESPONSE_LENGTH -ge 350 ] && [ $RESPONSE_LENGTH -le 600 ]; then
    echo "✅ 回复长度符合要求（350-600字）"
  else
    echo "⚠️  回复长度不符合要求（期望350-600字，实际${RESPONSE_LENGTH}字）"
  fi

  # 检查Token使用
  TOKENS=$(echo "$RESPONSE" | jq -r '.tokensUsed' 2>/dev/null)
  echo "Token使用: $TOKENS"

  # 检查响应时间
  RESPONSE_TIME=$(echo "$RESPONSE" | jq -r '.responseTime' 2>/dev/null)
  echo "响应时间: ${RESPONSE_TIME}ms"

  # 检查信号检测
  echo ""
  echo "信号检测:"
  echo "- 热情火花: $(echo "$RESPONSE" | jq -r '.detectedPassionSpark' 2>/dev/null)"
  echo "- 穿越感时刻: $(echo "$RESPONSE" | jq -r '.detectedFlowMoment' 2>/dev/null)"
  echo "- 卡点: $(echo "$RESPONSE" | jq -r '.detectedStuckPoint' 2>/dev/null)"

else
  echo "❌ AI导师对话失败"
  echo "错误信息: $(echo "$RESPONSE" | jq -r '.error' 2>/dev/null)"
fi

echo ""
echo "=========================================="
echo "测试完成"
echo "=========================================="
