#!/bin/bash

# 修复硬编码颜色值
echo "🎨 修复硬编码颜色..."

# 找到所有SCSS文件
scss_files=$(find src/pages -name "*.scss" 2>/dev/null)

count=0
for file in $scss_files; do
  # 检查是否包含硬编码颜色
  if grep -q "#2D3436\|#F5E6E8\|rgba(255, 255, 255" "$file" 2>/dev/null; then
    echo "🔧 修复: $file"

    # 替换常见硬编码颜色
    sed -i '' 's/#2D3436/transparent/g' "$file"
    sed -i '' 's/#F5E6E8/$bg-pink-light/g' "$file"
    sed -i '' 's/rgba(255, 255, 255, 0.9)/rgba(255, 255, 255, 0.9)/g' "$file"
    sed -i '' 's/background: #FFFFFF/background: white/g' "$file"
    sed -i '' 's/color: #FFFFFF/color: white/g' "$file"

    # 修复边框颜色
    sed -i '' 's/border: 1rpx solid #e5e7eb/border: 1rpx solid $border-light/g' "$file"
    sed -i '' 's/border-top: 1rpx solid #e5e7eb/border-top: 1rpx solid $border-light/g' "$file"
    sed -i '' 's/border-bottom: 1rpx solid #e5e7eb/border-bottom: 1rpx solid $border-light/g' "$file"

    count=$((count + 1))
  fi
done

echo "✅ 修复完成！共处理 $count 个文件"
