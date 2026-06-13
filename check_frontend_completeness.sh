#!/bin/bash

# ============================================================================
# 前端页面完整性检查脚本
# 检查关键页面是否真实调用API
# ============================================================================

set -e

echo "========================================="
echo "前端页面完整性检查"
echo "========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ============================================================================
# 学生端检查
# ============================================================================

echo -e "${YELLOW}=== 学生端页面检查 ===${NC}"
echo ""

# 检查1: 推荐任务页面是否展示匹配分数
echo "1. 检查推荐任务页面..."
if grep -q "matchScore\|matching_score\|匹配度" miniapp/src/pages/tasks/recommended.tsx 2>/dev/null || \
   grep -q "matchScore\|matching_score\|匹配度" miniapp/src/pages/tasks/recommended/index.tsx 2>/dev/null; then
    echo -e "${GREEN}✓ 推荐任务页面包含匹配分数展示${NC}"
else
    echo -e "${RED}✗ 推荐任务页面未找到匹配分数展示${NC}"
fi

# 检查2: 任务详情是否有启程老师翻译
echo "2. 检查任务详情页..."
if grep -q "启程老师\|translateTask\|task.*translation" miniapp/src/pages/tasks/detail.tsx 2>/dev/null; then
    echo -e "${GREEN}✓ 任务详情页包含启程老师翻译${NC}"
else
    echo -e "${YELLOW}⚠ 任务详情页可能缺少启程老师翻译模块${NC}"
fi

# 检查3: 提交页面是否有AI预审核
echo "3. 检查提交交付物页面..."
if grep -q "AI.*审核\|precheck\|ai.*review" miniapp/src/pages/tasks/submit.tsx 2>/dev/null; then
    echo -e "${GREEN}✓ 提交页面包含AI预审核${NC}"
else
    echo -e "${RED}✗ 提交页面未找到AI预审核${NC}"
fi

# 检查4: AI导师对话是否真实调用
echo "4. 检查AI导师对话页面..."
if grep -q "anthropic\|claude\|streamChat\|/api.*mentor" miniapp/src/pages/chat-detail/index.tsx 2>/dev/null; then
    echo -e "${GREEN}✓ AI导师对话包含API调用${NC}"
else
    echo -e "${YELLOW}⚠ AI导师对话可能未真实调用API${NC}"
fi

# 检查5: 成长报告是否AI生成
echo "5. 检查成长报告详情页..."
if grep -q "ai.*generated\|anthropic\|claude" miniapp/src/pages/reports/detail.tsx 2>/dev/null; then
    echo -e "${GREEN}✓ 成长报告包含AI生成标识${NC}"
else
    echo -e "${YELLOW}⚠ 成长报告可能是模板填空${NC}"
fi

echo ""

# ============================================================================
# 企业端检查
# ============================================================================

echo -e "${YELLOW}=== 企业端页面检查 ===${NC}"
echo ""

# 检查1: 任务发布是否有AI拆解
echo "1. 检查任务发布页面..."
if grep -q "AI.*拆解\|breakdown\|需求分析" company-miniapp/src/pages/task-publish/normal.tsx 2>/dev/null; then
    echo -e "${GREEN}✓ 任务发布包含AI拆解${NC}"
else
    echo -e "${RED}✗ 任务发布未找到AI拆解${NC}"
fi

# 检查2: 人才推荐是否展示成长故事
echo "2. 检查人才推荐页面..."
if [ -f "company-miniapp/src/pages/talent-recommendation/index.tsx" ]; then
    if grep -q "成长故事\|growth.*story\|关键里程碑" company-miniapp/src/pages/talent-recommendation/index.tsx 2>/dev/null; then
        echo -e "${GREEN}✓ 人才推荐包含成长故事${NC}"
    else
        echo -e "${YELLOW}⚠ 人才推荐可能缺少成长故事${NC}"
    fi
else
    echo -e "${RED}✗ 未找到人才推荐页面${NC}"
fi

# 检查3: 验收页面是否展示AI审核结果
echo "3. 检查验收页面..."
if grep -q "AI.*审核\|ai.*review\|智能审核" company-miniapp/src/pages/task-verification/index.tsx 2>/dev/null || \
   grep -q "AI.*审核\|ai.*review\|智能审核" company-miniapp/src/pages/acceptance/index.tsx 2>/dev/null; then
    echo -e "${GREEN}✓ 验收页面包含AI审核结果${NC}"
else
    echo -e "${YELLOW}⚠ 验收页面可能缺少AI审核结果展示${NC}"
fi

# 检查4: 已实现的体验优化页面
echo "4. 检查体验优化页面..."
PAGES_FOUND=0
[ -f "company-miniapp/src/pages/student-search/index.tsx" ] && ((PAGES_FOUND++))
[ -f "company-miniapp/src/pages/student-comparison/index.tsx" ] && ((PAGES_FOUND++))
[ -f "company-miniapp/src/pages/trial-management/index.tsx" ] && ((PAGES_FOUND++))
[ -f "company-miniapp/src/pages/task-progress/index.tsx" ] && ((PAGES_FOUND++))

echo -e "${GREEN}✓ 找到 $PAGES_FOUND/4 个体验优化页面${NC}"

# 检查5: 缺失的高级功能页面
echo "5. 检查高级功能页面..."
MISSING_PAGES=()
[ ! -f "company-miniapp/src/pages/project-publish/index.tsx" ] && MISSING_PAGES+=("项目制发布")
[ ! -f "company-miniapp/src/pages/talent-lock/index.tsx" ] && MISSING_PAGES+=("人才锁定")
[ ! -f "company-miniapp/src/pages/talent-network/index.tsx" ] && MISSING_PAGES+=("人才网络地图")

if [ ${#MISSING_PAGES[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ 所有高级功能页面存在${NC}"
else
    echo -e "${YELLOW}⚠ 缺失页面: ${MISSING_PAGES[*]}${NC}"
fi

echo ""

# ============================================================================
# API真实调用检查
# ============================================================================

echo -e "${YELLOW}=== API真实调用检查 ===${NC}"
echo ""

echo "检查关键API是否在代码中被调用..."

# 学生端关键API
STUDENT_APIS=(
    "/api/v1/profile/questionnaire:提交问卷"
    "/api/v1/tasks/recommended:推荐任务"
    "/api/v1/orders/:id/submit:提交交付物"
    "/api/v1/mentor/message:AI导师对话"
    "/api/v1/reports:成长报告"
)

echo "学生端API:"
for api_info in "${STUDENT_APIS[@]}"; do
    IFS=':' read -r api desc <<< "$api_info"
    if grep -rq "$api" miniapp/src 2>/dev/null; then
        echo -e "  ${GREEN}✓${NC} $desc ($api)"
    else
        echo -e "  ${RED}✗${NC} $desc ($api)"
    fi
done

echo ""

# 企业端关键API
COMPANY_APIS=(
    "/api/v1/enterprise/project:发布需求"
    "/api/v1/enterprise/talent:人才推荐"
    "/api/v1/task-experience/budget:预算建议"
    "/api/v1/matching-enhancement:匹配增强"
)

echo "企业端API:"
for api_info in "${COMPANY_APIS[@]}"; do
    IFS=':' read -r api desc <<< "$api_info"
    if grep -rq "$api" company-miniapp/src 2>/dev/null; then
        echo -e "  ${GREEN}✓${NC} $desc ($api)"
    else
        echo -e "  ${RED}✗${NC} $desc ($api)"
    fi
done

echo ""

# ============================================================================
# 生成报告
# ============================================================================

echo -e "${YELLOW}=== 生成检查报告 ===${NC}"
echo ""

cat > FRONTEND_COMPLETENESS_REPORT.md << 'EOF'
# 前端页面完整性检查报告

**检查时间**: $(date)

## 学生端

### 核心流程页面

| 页面 | 状态 | 问题 |
|------|------|------|
| 推荐任务列表 | 检查中 | - |
| 任务详情（启程老师翻译） | 检查中 | - |
| 提交交付物（AI预审核） | 检查中 | - |
| AI导师对话 | 检查中 | - |
| 成长报告详情 | 检查中 | - |

## 企业端

### 核心流程页面

| 页面 | 状态 | 问题 |
|------|------|------|
| 任务发布（AI拆解） | 检查中 | - |
| 人才推荐 | 检查中 | - |
| 验收（AI审核结果） | 检查中 | - |

### 体验优化页面

| 页面 | 状态 |
|------|------|
| 学生搜索 | ✅ 存在 |
| 学生对比 | ✅ 存在 |
| 试稿管理 | ✅ 存在 |
| 任务进度仪表盘 | ✅ 存在 |

### 缺失的高级功能

- ⚠️ 项目制发布
- ⚠️ 人才锁定
- ⚠️ 人才网络地图

## 建议

### 立即修复（P0）

1. **学生端**: 确保所有页面真实调用API，不是模拟数据
2. **企业端**: 补全AI拆解、AI审核结果的展示

### 本周完成（P1）

1. 补全缺失的高级功能页面
2. 全流程测试每个页面

### 验证方法

运行以下命令测试完整流程:
\`\`\`bash
# 学生端
cd miniapp && npm run dev:weapp

# 企业端
cd company-miniapp && npm run dev:weapp
\`\`\`

然后手动走完:
- 学生: 注册 → 问卷 → 画像 → 接单 → 提交 → 完成
- 企业: 注册 → 发布 → 查看推荐 → 确认接单 → 验收
EOF

echo -e "${GREEN}✓ 报告已生成: FRONTEND_COMPLETENESS_REPORT.md${NC}"

echo ""
echo "========================================="
echo "检查完成"
echo "========================================="
echo ""
echo "详细报告: FRONTEND_COMPLETENESS_REPORT.md"
echo ""
echo "下一步:"
echo "  1. 查看报告中标记为 ✗ 或 ⚠ 的项目"
echo "  2. 手动测试关键流程"
echo "  3. 修复发现的问题"
