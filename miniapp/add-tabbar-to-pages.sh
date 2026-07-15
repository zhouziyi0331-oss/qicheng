#!/bin/bash

# 为主要导航页面添加 TabBar 组件
echo "📱 添加 TabBar 组件到主导航页面..."

pages=(
  "tasks/index.tsx:tasks"
  "story/index.tsx:story"
  "mentor/index.tsx:mentor"
)

for entry in "${pages[@]}"; do
  file="${entry%%:*}"
  current="${entry##*:}"
  
  if [ -f "src/pages/$file" ]; then
    echo "  添加到: $file"
    
    # 检查是否已导入 TabBar
    if ! grep -q "import TabBar" "src/pages/$file" 2>/dev/null; then
      # 在导入区域末尾添加 TabBar 导入
      sed -i '' "/^import.*from.*components/a\\
import TabBar from '../../components/TabBar'
" "src/pages/$file"
    fi
    
    # 检查是否已添加 TabBar 组件
    if ! grep -q "<TabBar" "src/pages/$file" 2>/dev/null; then
      # 在组件返回的末尾添加 TabBar（在最后一个 </View> 之前）
      sed -i '' "s/\(.*\)<\/View>\([[:space:]]*\)$/\1  <TabBar current=\"$current\" \/>\n\1<\/View>\2/" "src/pages/$file"
    fi
  fi
done

echo "✅ TabBar 添加完成！"
