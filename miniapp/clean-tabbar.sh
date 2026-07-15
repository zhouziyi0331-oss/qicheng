#!/bin/bash

# 清理错误插入的 TabBar 标签
echo "🧹 清理错误插入的 TabBar..."

# 找到所有包含错误 TabBar 的 TSX 文件
files=$(grep -r "TabBar current=" src/pages --include="*.tsx" -l)

count=0
for file in $files; do
  echo "🔧 清理: $file"

  # 统计清理前的数量
  before=$(grep -o "TabBar" "$file" | wc -l)

  # 方法1: 移除嵌套在JSX标签内的 TabBar（如 <View>  <TabBar current="tasks" />）
  sed -i '' 's|>  *<TabBar current="[^"]*" />|>|g' "$file"

  # 方法2: 移除行尾的 TabBar
  sed -i '' 's|  *<TabBar current="[^"]*" /> *$||g' "$file"

  # 方法3: 移除独立行的 TabBar（保留文件末尾前的那个）
  # 先标记最后一个有效的 TabBar

  # 统计清理后的数量
  after=$(grep -o "TabBar" "$file" | wc -l)

  echo "  清理前: $before 个, 清理后: $after 个"

  count=$((count + 1))
done

echo "✅ 完成！共清理 $count 个文件"
