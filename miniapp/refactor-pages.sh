#!/bin/bash

# 批量重构页面脚本
# 将所有使用 theme.scss 的页面改为使用 variables.scss

echo "🚀 开始批量重构页面..."

# 找到所有使用 theme.scss 的 SCSS 文件
pages_with_theme=$(grep -r "@import.*theme.scss" src/pages/*/index.scss 2>/dev/null | cut -d: -f1)

count=0
for file in $pages_with_theme; do
  echo "📝 重构: $file"

  # 1. 替换导入语句
  sed -i '' "s/@import '.*\/styles\/theme.scss';/@import '..\/..\/styles\/variables.scss';/g" "$file"

  # 2. 替换常见的旧变量
  sed -i '' 's/var(--theme-bg)/$bg-primary/g' "$file"
  sed -i '' 's/var(--theme-card)/white/g' "$file"
  sed -i '' 's/var(--theme-primary)/$primary/g' "$file"
  sed -i '' 's/var(--theme-accent)/$primary/g' "$file"
  sed -i '' 's/var(--text-primary)/$text-primary/g' "$file"
  sed -i '' 's/var(--text-secondary)/$text-secondary/g' "$file"
  sed -i '' 's/var(--text-tertiary)/$text-tertiary/g' "$file"
  sed -i '' 's/var(--text-white)/$text-tertiary/g' "$file"
  sed -i '' 's/var(--shadow-card)/$shadow-card/g' "$file"
  sed -i '' 's/var(--shadow-soft)/$shadow-soft/g' "$file"
  sed -i '' 's/var(--radius-small)/$radius-sm/g' "$file"
  sed -i '' 's/var(--radius-medium)/$radius-md/g' "$file"
  sed -i '' 's/var(--radius-large)/$radius-lg/g' "$file"
  sed -i '' 's/var(--radius-round)/$radius-full/g' "$file"

  count=$((count + 1))
done

echo "✅ 完成！共重构 $count 个页面"
