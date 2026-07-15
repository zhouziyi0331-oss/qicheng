#!/bin/bash

# 修复仍在使用 theme.scss 的文件
echo "🔧 修复 theme.scss 导入..."

# 文件列表
files=(
  "src/pages/tasks/working.scss"
  "src/pages/tasks/hall.scss"
  "src/pages/tasks/recommended.scss"
  "src/pages/tasks/detail.scss"
  "src/pages/tasks/submit.scss"
  "src/pages/mentor-system/my-mentees.scss"
  "src/pages/mentor-system/become-mentor.scss"
  "src/pages/community/create-post.scss"
  "src/pages/community/detail.scss"
  "src/pages/notification-center/notification-center.scss"
  "src/pages/opc-test/choice-questions.scss"
  "src/pages/opc-test/result.scss"
  "src/pages/story/post.scss"
  "src/pages/invitations/verify.scss"
  "src/pages/invitations/detail.scss"
  "src/pages/level-up/test-result.scss"
  "src/pages/level-up/test-questions.scss"
  "src/pages/level-up/skip-test.scss"
)

count=0
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "📝 修复: $file"

    # 确定正确的相对路径
    if [[ $file == *"/pages/tasks/"* ]]; then
      sed -i '' "s|@import.*theme\.scss.*|@import '../../styles/variables.scss';|g" "$file"
    elif [[ $file == *"/pages/mentor-system/"* ]]; then
      sed -i '' "s|@import.*theme\.scss.*|@import '../../styles/variables.scss';|g" "$file"
    elif [[ $file == *"/pages/community/"* ]]; then
      sed -i '' "s|@import.*theme\.scss.*|@import '../../styles/variables.scss';|g" "$file"
    elif [[ $file == *"/pages/notification-center/"* ]]; then
      sed -i '' "s|@import.*theme\.scss.*|@import '../../styles/variables.scss';|g" "$file"
    elif [[ $file == *"/pages/opc-test/"* ]]; then
      sed -i '' "s|@import.*theme\.scss.*|@import '../../styles/variables.scss';|g" "$file"
    elif [[ $file == *"/pages/story/"* ]]; then
      sed -i '' "s|@import.*theme\.scss.*|@import '../../styles/variables.scss';|g" "$file"
    elif [[ $file == *"/pages/invitations/"* ]]; then
      sed -i '' "s|@import.*theme\.scss.*|@import '../../styles/variables.scss';|g" "$file"
    elif [[ $file == *"/pages/level-up/"* ]]; then
      sed -i '' "s|@import.*theme\.scss.*|@import '../../styles/variables.scss';|g" "$file"
    fi

    # 替换旧变量
    sed -i '' 's/var(--theme-bg)/$bg-primary/g' "$file"
    sed -i '' 's/var(--theme-card)/white/g' "$file"
    sed -i '' 's/var(--theme-primary)/$primary/g' "$file"
    sed -i '' 's/var(--theme-accent)/$primary/g' "$file"
    sed -i '' 's/var(--text-primary)/$text-primary/g' "$file"
    sed -i '' 's/var(--text-secondary)/$text-secondary/g' "$file"
    sed -i '' 's/var(--text-tertiary)/$text-tertiary/g' "$file"
    sed -i '' 's/var(--shadow-card)/$shadow-card/g' "$file"
    sed -i '' 's/var(--shadow-soft)/$shadow-soft/g' "$file"
    sed -i '' 's/var(--radius-small)/$radius-sm/g' "$file"
    sed -i '' 's/var(--radius-medium)/$radius-md/g' "$file"
    sed -i '' 's/var(--radius-large)/$radius-lg/g' "$file"
    sed -i '' 's/var(--radius-round)/$radius-full/g' "$file"

    count=$((count + 1))
  fi
done

echo "✅ 完成！共修复 $count 个文件"
