#!/bin/bash
# 批量应用莫兰迪配色到所有页面

cd /Users/alwan/code/qicheng/miniapp/src

echo "=========================================="
echo "批量应用莫兰迪配色系统"
echo "=========================================="

# packageGrowth 页面列表
GROWTH_PAGES=(
  "ability-map"
  "ability-trend"
  "belief-shifts"
  "deep-patterns"
  "exploration-patterns"
  "exploration-reflection"
  "flow-moments"
  "growth-challenges"
  "growth-comparison"
  "growth-summaries"
  "milestones"
  "my-growth"
  "partnerships"
  "passion-sparks"
  "toolbox"
)

# pages 页面列表
MAIN_PAGES=(
  "history"
  "mentor-apply"
  "mentor-find"
  "mentor"
  "story"
  "student-reputation"
)

# packageOnboarding 页面列表
ONBOARDING_PAGES=(
  "onboarding"
  "track-selection"
)

# 处理函数：添加莫兰迪import到SCSS文件
process_scss() {
  local file=$1
  if [ -f "$file" ]; then
    # 检查是否已经有import
    if ! grep -q "morandi-colors.scss" "$file"; then
      echo "处理: $file"

      # 在文件开头添加import
      sed -i '' "1i\\
@import '../../../styles/morandi-colors.scss';\\
" "$file"

      # 替换常见背景色为莫兰迪渐变
      sed -i '' \
        -e 's/background: #[Ff]8[Ff]9[Ff][Aa]/@include gradient-page-main/g' \
        -e 's/background: #[Ff]5[Ff]7[Ff][Aa]/@include gradient-page-main/g' \
        -e 's/background: #[Ff]3[Ff]4[Ff]6/background: rgba(255, 255, 255, 0.85)/g' \
        "$file"

      echo "  ✓ 已添加莫兰迪配色"
    else
      echo "跳过: $file (已有莫兰迪import)"
    fi
  fi
}

# 处理packageGrowth页面
echo ""
echo "处理 packageGrowth 页面..."
for page in "${GROWTH_PAGES[@]}"; do
  scss_file="packageGrowth/pages/$page/index.scss"
  process_scss "$scss_file"
done

# 处理主pages页面
echo ""
echo "处理 pages 页面..."
for page in "${MAIN_PAGES[@]}"; do
  scss_file="pages/$page/index.scss"
  process_scss "$scss_file"
done

# 处理packageOnboarding页面
echo ""
echo "处理 packageOnboarding 页面..."
for page in "${ONBOARDING_PAGES[@]}"; do
  scss_file="packageOnboarding/pages/$page/index.scss"
  process_scss "$scss_file"
done

# 特殊处理：OPC测试结果页
if [ -f "packageOnboarding/pages/opc-test/result.scss" ]; then
  process_scss "packageOnboarding/pages/opc-test/result.scss"
fi

echo ""
echo "=========================================="
echo "✓ 批量处理完成！"
echo "=========================================="
echo ""
echo "已为所有页面添加莫兰迪配色系统"
echo "下一步："
echo "1. 手动检查页面效果"
echo "2. 为关键页面添加Typewriter组件"
echo "3. 调整个别页面的配色方案"
