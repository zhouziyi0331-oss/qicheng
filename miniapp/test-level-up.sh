#!/bin/bash

echo "=================================="
echo "🎉 升级验证系统 - 完整测试"
echo "=================================="
echo ""

# 1. 检查后端服务
echo "📡 检查后端服务..."
BACKEND_STATUS=$(curl -s http://localhost:3000/api/level-up-validation/history 2>&1 | head -1)
if [[ $BACKEND_STATUS == *"error"* ]] || [[ $BACKEND_STATUS == *"无效"* ]]; then
  echo "✅ 后端服务运行正常（返回认证错误，说明路由正确）"
else
  echo "⚠️  后端服务可能未启动或路由错误"
fi
echo ""

# 2. 检查编译文件
echo "📦 检查前端编译..."
if [ -d "/Users/alwan/code/qicheng/miniapp/dist/pages/level-up-test" ]; then
  echo "✅ level-up-test 页面已编译"
else
  echo "❌ level-up-test 页面未编译"
fi

if [ -d "/Users/alwan/code/qicheng/miniapp/dist/pages/level-up-validation" ]; then
  echo "✅ level-up-validation 页面已编译"
else
  echo "❌ level-up-validation 页面未编译"
fi

if [ -d "/Users/alwan/code/qicheng/miniapp/dist/pages/level-up-done" ]; then
  echo "✅ level-up-done 页面已编译"
else
  echo "❌ level-up-done 页面未编译"
fi
echo ""

# 3. 检查API定义
echo "🔌 检查API集成..."
if grep -q "levelUpValidationAPI" /Users/alwan/code/qicheng/miniapp/src/services/api.ts; then
  echo "✅ levelUpValidationAPI 已添加到 api.ts"
else
  echo "❌ levelUpValidationAPI 未添加"
fi
echo ""

# 4. 检查页面注册
echo "📝 检查页面注册..."
if grep -q "level-up-test/index" /Users/alwan/code/qicheng/miniapp/src/app.config.ts; then
  echo "✅ level-up-test 已注册"
else
  echo "❌ level-up-test 未注册"
fi

if grep -q "level-up-validation/index" /Users/alwan/code/qicheng/miniapp/src/app.config.ts; then
  echo "✅ level-up-validation 已注册"
else
  echo "❌ level-up-validation 未注册"
fi

if grep -q "level-up-done/index" /Users/alwan/code/qicheng/miniapp/src/app.config.ts; then
  echo "✅ level-up-done 已注册"
else
  echo "❌ level-up-done 未注册"
fi
echo ""

# 5. 统计代码行数
echo "📊 代码统计..."
echo "level-up-validation:"
wc -l /Users/alwan/code/qicheng/miniapp/src/pages/level-up-validation/index.tsx
wc -l /Users/alwan/code/qicheng/miniapp/src/pages/level-up-validation/index.scss

echo "level-up-done:"
wc -l /Users/alwan/code/qicheng/miniapp/src/pages/level-up-done/index.tsx
wc -l /Users/alwan/code/qicheng/miniapp/src/pages/level-up-done/index.scss

echo "level-up-test:"
wc -l /Users/alwan/code/qicheng/miniapp/src/pages/level-up-test/index.tsx
wc -l /Users/alwan/code/qicheng/miniapp/src/pages/level-up-test/index.scss
echo ""

# 6. 最终提示
echo "=================================="
echo "✅ 系统检查完成！"
echo "=================================="
echo ""
echo "🚀 开始测试："
echo "1. 打开微信开发者工具"
echo "2. 选择项目：/Users/alwan/code/qicheng/miniapp/dist"
echo "3. 在顶部输入框输入：pages/level-up-test/index"
echo "4. 点击任意等级卡片开始测试"
echo ""
echo "📖 详细文档："
echo "- 使用文档：升级验证系统-使用文档.md"
echo "- 快速测试：升级验证-快速测试.md"
echo "- 完整总结：升级验证系统-完整实现总结.md"
echo ""
echo "🎉 祝测试顺利！"
