#!/bin/bash

# 全面优化所有页面 - 应用莫兰迪配色系统
# 功能：自动为所有页面添加莫兰迪配色import和渐变背景

BASE_DIR="/Users/alwan/code/qicheng/miniapp/src"

# 定义所有需要优化的页面路径
PAGES=(
  # packageAdvanced
  "packageAdvanced/pages/asset-dashboard/index.tsx"
  "packageAdvanced/pages/capability-verify/index.tsx"
  "packageAdvanced/pages/graduation-report/index.tsx"
  "packageAdvanced/pages/identity-card/index.tsx"
  "packageAdvanced/pages/jump-level/index.tsx"
  "packageAdvanced/pages/level-growth/index.tsx"
  "packageAdvanced/pages/project-complete/index.tsx"
  "packageAdvanced/pages/recommended-tasks/index.tsx"
  "packageAdvanced/pages/team/create/index.tsx"

  # packageAuth
  "packageAuth/pages/auth/login/index.tsx"
  "packageAuth/pages/bind-phone/index.tsx"
  "packageAuth/pages/login/index.tsx"
  "packageAuth/pages/register/index.tsx"

  # packageCommunity
  "packageCommunity/pages/community/index.tsx"
  "packageCommunity/pages/thinking-points/index.tsx"

  # packageCourse
  "packageCourse/pages/courses/index.tsx"
  "packageCourse/pages/cross-sector-recommend/index.tsx"
  "packageCourse/pages/sector-hall/index.tsx"
  "packageCourse/pages/sectors/index.tsx"

  # packageMentor
  "packageMentor/pages/chat-detail/index.tsx"
  "packageMentor/pages/chat-list/index.tsx"
  "packageMentor/pages/mentor-care/index.tsx"
  "packageMentor/pages/mentor-chat/index.tsx"
  "packageMentor/pages/mentor-reports/index.tsx"

  # packageMisc
  "packageMisc/pages/agreement/index.tsx"
  "packageMisc/pages/alliances/index.tsx"
  "packageMisc/pages/data-authorization/index.tsx"
  "packageMisc/pages/graduation/index.tsx"
  "packageMisc/pages/life-question/index.tsx"
  "packageMisc/pages/opc-incubation/index.tsx"
  "packageMisc/pages/payment-status/index.tsx"

  # packageOther
  "packageOther/pages/gamification-badges/index.tsx"
  "packageOther/pages/gamification-fragments/index.tsx"
  "packageOther/pages/level-rewards/index.tsx"
  "packageOther/pages/my-wallet/index.tsx"
  "packageOther/pages/notification-center/index.tsx"
  "packageOther/pages/notification-settings/index.tsx"
  "packageOther/pages/notifications/index.tsx"
  "packageOther/pages/reports/index.tsx"
  "packageOther/pages/settings/index.tsx"
  "packageOther/pages/wallet/index.tsx"
  "packageOther/pages/wallet/withdraw/index.tsx"
  "packageOther/pages/wallet/withdraw-history/index.tsx"

  # packagePBL
  "packagePBL/pages/pbl-chat/index.tsx"
  "packagePBL/pages/pbl-code-execution/index.tsx"
  "packagePBL/pages/pbl-create-project/index.tsx"
  "packagePBL/pages/pbl-file-upload/index.tsx"
  "packagePBL/pages/pbl-project-detail/index.tsx"
  "packagePBL/pages/pbl-project-showcase/index.tsx"
  "packagePBL/pages/pbl-reflection-log/index.tsx"

  # packageProject
  "packageProject/pages/my-projects/index.tsx"
  "packageProject/pages/portfolio/index.tsx"
  "packageProject/pages/sessions/index.tsx"
  "packageProject/pages/teams/index.tsx"

  # packageTask
  "packageTask/pages/create-rating/index.tsx"
  "packageTask/pages/daily-tasks/index.tsx"
  "packageTask/pages/invitations/index.tsx"
  "packageTask/pages/my-ratings/index.tsx"
  "packageTask/pages/my-tasks/index.tsx"
  "packageTask/pages/pending-ratings/index.tsx"
  "packageTask/pages/rate-task/index.tsx"
  "packageTask/pages/task-communication/index.tsx"
  "packageTask/pages/tasks/index.tsx"

  # pages主目录
  "pages/asset-dashboard/index.tsx"
  "pages/company-add-tag/index.tsx"
  "pages/profile/index.tsx"
  "pages/story-detail/index.tsx"
  "pages/subtask-pushes/index.tsx"
  "pages/tasks/index.tsx"
  "pages/tasks/detail.tsx"
  "pages/tasks/hall.tsx"
  "pages/tasks/submit.tsx"
  "pages/tasks/working.tsx"
  "pages/tasks/recommended.tsx"
  "pages/withdraw/index.tsx"
)

SCSS_FILES=(
  # packageAdvanced
  "packageAdvanced/pages/asset-dashboard/index.scss"
  "packageAdvanced/pages/capability-verify/index.scss"
  "packageAdvanced/pages/graduation-report/index.scss"
  "packageAdvanced/pages/identity-card/index.scss"
  "packageAdvanced/pages/jump-level/index.scss"
  "packageAdvanced/pages/level-growth/index.scss"
  "packageAdvanced/pages/project-complete/index.scss"
  "packageAdvanced/pages/recommended-tasks/index.scss"
  "packageAdvanced/pages/team/create/index.scss"

  # packageAuth
  "packageAuth/pages/auth/login/index.scss"
  "packageAuth/pages/bind-phone/index.scss"
  "packageAuth/pages/login/index.scss"
  "packageAuth/pages/register/index.scss"

  # packageCommunity
  "packageCommunity/pages/community/index.scss"
  "packageCommunity/pages/thinking-points/index.scss"

  # packageCourse
  "packageCourse/pages/courses/index.scss"
  "packageCourse/pages/cross-sector-recommend/index.scss"
  "packageCourse/pages/sector-hall/index.scss"
  "packageCourse/pages/sectors/index.scss"

  # packageMentor
  "packageMentor/pages/chat-detail/index.scss"
  "packageMentor/pages/chat-list/index.scss"
  "packageMentor/pages/mentor-care/index.scss"
  "packageMentor/pages/mentor-chat/index.scss"
  "packageMentor/pages/mentor-reports/index.scss"

  # packageMisc
  "packageMisc/pages/agreement/index.scss"
  "packageMisc/pages/alliances/index.scss"
  "packageMisc/pages/data-authorization/index.scss"
  "packageMisc/pages/graduation/index.scss"
  "packageMisc/pages/life-question/index.scss"
  "packageMisc/pages/opc-incubation/index.scss"
  "packageMisc/pages/payment-status/index.scss"

  # packageOther
  "packageOther/pages/gamification-badges/index.scss"
  "packageOther/pages/gamification-fragments/index.scss"
  "packageOther/pages/level-rewards/index.scss"
  "packageOther/pages/my-wallet/index.scss"
  "packageOther/pages/notification-center/index.scss"
  "packageOther/pages/notification-settings/index.scss"
  "packageOther/pages/notifications/index.scss"
  "packageOther/pages/reports/index.scss"
  "packageOther/pages/settings/index.scss"
  "packageOther/pages/wallet/index.scss"
  "packageOther/pages/wallet/withdraw/index.scss"
  "packageOther/pages/wallet/withdraw-history/index.scss"

  # packagePBL
  "packagePBL/pages/pbl-chat/index.scss"
  "packagePBL/pages/pbl-code-execution/index.scss"
  "packagePBL/pages/pbl-create-project/index.scss"
  "packagePBL/pages/pbl-file-upload/index.scss"
  "packagePBL/pages/pbl-project-detail/index.scss"
  "packagePBL/pages/pbl-project-showcase/index.scss"
  "packagePBL/pages/pbl-reflection-log/index.scss"

  # packageProject
  "packageProject/pages/my-projects/index.scss"
  "packageProject/pages/portfolio/index.scss"
  "packageProject/pages/sessions/index.scss"
  "packageProject/pages/teams/index.scss"

  # packageTask
  "packageTask/pages/create-rating/index.scss"
  "packageTask/pages/daily-tasks/index.scss"
  "packageTask/pages/invitations/index.scss"
  "packageTask/pages/my-ratings/index.scss"
  "packageTask/pages/my-tasks/index.scss"
  "packageTask/pages/pending-ratings/index.scss"
  "packageTask/pages/rate-task/index.scss"
  "packageTask/pages/task-communication/index.scss"
  "packageTask/pages/tasks/index.scss"

  # pages主目录
  "pages/asset-dashboard/index.scss"
  "pages/company-add-tag/index.scss"
  "pages/profile/index.scss"
  "pages/story-detail/index.scss"
  "pages/subtask-pushes/index.scss"
  "pages/tasks/index.scss"
  "pages/tasks/detail.scss"
  "pages/tasks/hall.scss"
  "pages/tasks/submit.scss"
  "pages/tasks/working.scss"
  "pages/tasks/recommended.scss"
  "pages/withdraw/index.scss"
)

echo "🎨 开始批量优化所有页面..."
echo "目标：应用莫兰迪配色系统 + 渐变背景"
echo ""

TSX_COUNT=0
SCSS_COUNT=0
SKIPPED=0

# 处理TSX文件
for page in "${PAGES[@]}"; do
  FILE="$BASE_DIR/$page"

  if [ ! -f "$FILE" ]; then
    echo "⚠️  跳过（文件不存在）: $page"
    ((SKIPPED++))
    continue
  fi

  # 检查是否已经导入morandi-colors
  if grep -q "morandi-colors" "$FILE"; then
    echo "✓ 已优化: $page"
    continue
  fi

  # 添加morandi-colors导入（在import './index.scss'之前）
  if grep -q "import './index.scss'" "$FILE"; then
    sed -i '' "/import '\.\/index\.scss'/i\\
import '../../../styles/morandi-colors.scss'\\
" "$FILE"
    echo "✅ 优化TSX: $page"
    ((TSX_COUNT++))
  elif grep -q "import './index.css'" "$FILE"; then
    sed -i '' "/import '\.\/index\.css'/i\\
import '../../../styles/morandi-colors.scss'\\
" "$FILE"
    echo "✅ 优化TSX: $page"
    ((TSX_COUNT++))
  else
    echo "⚠️  跳过（无样式导入）: $page"
    ((SKIPPED++))
  fi
done

echo ""
echo "---"
echo ""

# 处理SCSS文件
for scss in "${SCSS_FILES[@]}"; do
  FILE="$BASE_DIR/$scss"

  if [ ! -f "$FILE" ]; then
    echo "⚠️  跳过（SCSS不存在）: $scss"
    ((SKIPPED++))
    continue
  fi

  # 检查是否已经导入morandi-colors
  if grep -q "@import.*morandi-colors" "$FILE"; then
    echo "✓ 已优化: $scss"
    continue
  fi

  # 在文件开头添加morandi-colors导入
  sed -i '' '1i\
@import '"'"'../../../styles/morandi-colors.scss'"'"';
' "$FILE"

  # 为主容器类添加渐变背景（如果有page、container、wrapper等类）
  if grep -q "\.page\|\.container\|\.wrapper\|^\..*-page" "$FILE"; then
    # 找到第一个主类选择器，添加渐变
    sed -i '' '/^\.[a-z-]*\(page\|container\|wrapper\)/a\
  @include gradient-page-main;
' "$FILE"
    echo "✅ 优化SCSS + 渐变: $scss"
  else
    echo "✅ 优化SCSS: $scss"
  fi

  ((SCSS_COUNT++))
done

echo ""
echo "========================================="
echo "🎉 批量优化完成！"
echo "========================================="
echo "✅ TSX文件优化: $TSX_COUNT 个"
echo "✅ SCSS文件优化: $SCSS_COUNT 个"
echo "⚠️  跳过文件: $SKIPPED 个"
echo "========================================="
echo ""
echo "📋 下一步："
echo "1. 检查编译是否正常"
echo "2. 手动调整部分页面的渐变背景（根据设计需要）"
echo "3. 为关键页面添加Typewriter组件"
echo "4. 将emoji替换为极简文字图标"
echo ""
