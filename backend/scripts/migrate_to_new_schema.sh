#!/bin/bash

# ============================================================
# 批量替换脚本：student_profiles → users + student_capabilities
# 自动修改所有使用旧字段的文件
# ============================================================

set -e

echo "🔧 开始批量替换旧字段..."

# 备份目录
BACKUP_DIR="./src_backup_$(date +%Y%m%d_%H%M%S)"
echo "📦 创建备份: $BACKUP_DIR"
cp -r ./src "$BACKUP_DIR"

# 统计
TOTAL_FILES=0
MODIFIED_FILES=0

# 需要修改的文件列表
FILES=(
  "src/routes/ability/controller.ts"
  "src/routes/admin/dashboard.ts"
  "src/routes/admin/dashboardController.ts"
  "src/routes/admin/studentController.ts"
  "src/routes/alliances/controller.ts"
  "src/routes/challenge/controller.ts"
  "src/routes/company/controller.ts"
  "src/routes/exploration/controller.ts"
  "src/routes/incubation/controller.ts"
  "src/routes/mentor/controller.ts"
  "src/routes/mentor/enhanced-controller.ts"
  "src/routes/opc/controller.ts"
  "src/routes/partnerships/controller.ts"
  "src/routes/reports/controller.ts"
  "src/routes/story/controller.ts"
  "src/routes/student/controller.ts"
  "src/routes/tasks/businessFlowController.ts"
  "src/routes/tasks/companyController.ts"
  "src/routes/tasks/studentFlowController.ts"
  "src/routes/tasks/verificationFlowController.ts"
  "src/routes/team/controller.ts"
  "src/routes/user/profileController.ts"
  "src/scripts/generateEmbeddings.ts"
  "src/services/enhancedMentorService.ts"
  "src/services/invitation/activityService.ts"
  "src/services/invitation/invitationService.ts"
  "src/services/invitation/matchService.ts"
  "src/services/mentorCoreService.ts"
  "src/services/startupReportService.ts"
  "src/utils/sixDimUpdater.ts"
)

# 替换规则
declare -A REPLACEMENTS=(
  # 表名替换
  ["FROM student_profiles"]="FROM users"
  ["JOIN student_profiles"]="JOIN users"
  ["LEFT JOIN student_profiles"]="LEFT JOIN users"
  ["INNER JOIN student_profiles"]="INNER JOIN users"
  ["UPDATE student_profiles"]="UPDATE users"
  ["INSERT INTO student_profiles"]="INSERT INTO users"

  # 字段名替换
  ["sp.level_a"]="u.current_level"
  ["sp.level_b"]="0 as level_b"
  [".level_a"]=".current_level"
  ["level_a:"]="current_level:"
  ["level_a,"]="current_level,"
  ["level_a }"]="current_level }"
  ["level_a FROM"]="current_level FROM"
  ["level_a as"]="current_level as"

  # 别名替换
  ["student_profiles sp"]="users u"
  ["student_profiles AS sp"]="users AS u"
)

echo ""
echo "📝 开始替换..."

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    TOTAL_FILES=$((TOTAL_FILES + 1))
    CHANGED=false

    # 对每个文件应用所有替换规则
    for old in "${!REPLACEMENTS[@]}"; do
      new="${REPLACEMENTS[$old]}"

      # 检查文件是否包含旧字符串
      if grep -q "$old" "$file" 2>/dev/null; then
        # 执行替换
        if [[ "$OSTYPE" == "darwin"* ]]; then
          # macOS
          sed -i '' "s/$old/$new/g" "$file"
        else
          # Linux
          sed -i "s/$old/$new/g" "$file"
        fi
        CHANGED=true
      fi
    done

    if [ "$CHANGED" = true ]; then
      MODIFIED_FILES=$((MODIFIED_FILES + 1))
      echo "  ✅ $file"
    fi
  fi
done

echo ""
echo "✨ 替换完成！"
echo "   总文件数: $TOTAL_FILES"
echo "   修改文件数: $MODIFIED_FILES"
echo "   备份位置: $BACKUP_DIR"
echo ""
echo "⚠️  请执行以下步骤验证："
echo "   1. 运行 TypeScript 编译: npm run build"
echo "   2. 运行测试: npm test"
echo "   3. 检查 git diff 确认修改正确"
echo "   4. 如果有问题，恢复备份: rm -rf src && mv $BACKUP_DIR src"
echo ""
