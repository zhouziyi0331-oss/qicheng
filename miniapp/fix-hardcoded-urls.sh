#!/bin/bash

# 批量修复硬编码URL和Token访问的脚本

FILES=(
  "src/pages/ability-trend/index.tsx"
  "src/pages/chat-list/index.tsx"
  "src/pages/bind-phone/index.tsx"
  "src/pages/growth-timeline/index.tsx"
  "src/pages/identity-card/index.tsx"
  "src/pages/graduation-report/index.tsx"
  "src/pages/rate-task/index.tsx"
  "src/pages/level-up/test-questions.tsx"
  "src/pages/level-up/skip-test.tsx"
  "src/pages/asset-dashboard/index.tsx"
  "src/pages/growth-summaries/index.tsx"
  "src/pages/recommended-tasks/index.tsx"
  "src/pages/wallet/index.tsx"
  "src/pages/wallet/withdraw/index.tsx"
)

echo "开始批量修复硬编码URL..."

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "处理: $file"

    # 替换 http://localhost:3000 为 getApiUrl
    sed -i '' 's|http://localhost:3000/api/v1/|${getApiUrl('\''/api/v1/|g' "$file"
    sed -i '' 's|http://localhost:3000/|${getApiUrl('\''/|g' "$file"

    # 替换 process.env.TARO_APP_API_URL 为 getApiUrl
    sed -i '' 's|${process.env.TARO_APP_API_URL}/api/v1/|${getApiUrl('\''/api/v1/|g' "$file"
    sed -i '' 's|`${process.env.TARO_APP_API_URL}/api/v1/|\`${getApiUrl('\''/api/v1/|g' "$file"

    # 替换 Taro.getStorageSync('token') 为 tokenManager.getAccessToken()
    sed -i '' "s|Taro.getStorageSync('token')|tokenManager.getAccessToken()|g" "$file"

    echo "  ✓ 完成"
  else
    echo "  ✗ 文件不存在: $file"
  fi
done

echo ""
echo "批量修复完成！"
echo ""
echo "⚠️  请手动检查以下内容："
echo "1. 每个文件是否已导入: import { getApiUrl } from '../../config'"
echo "2. 每个文件是否已导入: import { tokenManager } from '../../utils/token'"
echo "3. URL替换是否正确（特别是模板字符串的引号）"
echo "4. 运行编译测试确认无错误"
