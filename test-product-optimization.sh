#!/bin/bash

# 产品优化功能 API 测试脚本
# 用途：验证 12 个产品优化功能的后端 API 是否正常工作

BASE_URL="http://localhost:3000/api/v1"
TOKEN=""  # 需要替换为真实的访问令牌

echo "=========================================="
echo "产品优化功能 API 测试"
echo "=========================================="
echo ""

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试函数
test_api() {
  local name=$1
  local method=$2
  local endpoint=$3
  local data=$4

  echo -n "测试: $name ... "

  if [ "$method" == "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL$endpoint" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json")
  else
    response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$data")
  fi

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$http_code" == "200" ] || [ "$http_code" == "201" ]; then
    echo -e "${GREEN}✓ 通过${NC} (HTTP $http_code)"
    return 0
  else
    echo -e "${RED}✗ 失败${NC} (HTTP $http_code)"
    echo "  响应: $body"
    return 1
  fi
}

# Phase 1 测试
echo "=========================================="
echo "Phase 1: 快速见效功能"
echo "=========================================="
echo ""

# 1.2 同类数据统计
test_api "获取人格标签统计" "GET" "/stats/personality/探索者"

# 1.1 OPC结果（包含身份宣言）
test_api "获取OPC测评结果" "GET" "/opc-v2/result"

echo ""

# Phase 2 测试
echo "=========================================="
echo "Phase 2: 核心体验功能"
echo "=========================================="
echo ""

# 2.1 身份卡片
test_api "生成OPC身份卡片" "POST" "/opc-v2/generate-identity-card" '{}'

# 2.2 资产仪表盘
test_api "获取资产仪表盘" "GET" "/asset-dashboard"

# 2.3 成长对比
test_api "获取成长对比数据" "GET" "/growth-comparison"

# 2.4 案例库
test_api "搜索案例库" "GET" "/case-library/search?type=stuck"

echo ""

# Phase 3 测试
echo "=========================================="
echo "Phase 3: 生态闭环功能"
echo "=========================================="
echo ""

# 3.1 引路人机制
test_api "检查引路人资格" "POST" "/mentor-relationship/check-qualification" '{}'
test_api "查找引路人" "GET" "/mentor-relationship/find-mentors?limit=5"

# 3.2 OPC故事墙
test_api "搜索故事" "GET" "/opc-stories/search?storyType=breakthrough&limit=10"

# 3.3 企业-学生端打通
test_api "获取我的声誉标签" "GET" "/company-student-bridge/my-reputation-tags"
test_api "获取成长里程碑" "GET" "/company-student-bridge/my-milestones"

# 3.4 需求自动拆解
test_api "获取我的推送任务" "GET" "/demand-decomposition/my-pushes"

echo ""
echo "=========================================="
echo "测试完成"
echo "=========================================="
echo ""
echo "注意事项："
echo "1. 请先设置有效的 ACCESS_TOKEN"
echo "2. 确保后端服务已启动"
echo "3. 确保数据库迁移已完成"
echo ""
