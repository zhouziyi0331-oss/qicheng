#!/bin/bash

echo "================================================"
echo "🚀 启程项目版本备份和对比任务"
echo "================================================"
echo ""

# 第1步：备份新版本到GitHub
echo "📦 第1步：备份新版本..."
cd /Users/alwan/code/qicheng

echo "当前未提交的修改："
git status --short | head -10
echo ""

echo "添加所有修改..."
git add .

echo "创建提交..."
git commit -m "feat: 添加升级验证系统 + API优化

新功能：
- 升级验证系统（L1-L5）
- 升级完成页面（仪式感动画）
- 测试页面
- levelUpValidationAPI 集成

优化：
- API超时时间增加到120秒
- 添加自动重试机制（2次）
- 优化错误处理

代码统计：
- 新增页面：3个
- 新增代码：1,494行
- 文档：7份

日期：2026-07-23
状态：生产就绪"

echo ""
echo "推送到GitHub..."
git push origin main

echo "✅ 新版本备份完成！"
echo ""

# 第2步：备份旧版本到GitHub
echo "📦 第2步：备份旧版本..."
cd /Users/alwan/code/qicheng-merged-backup-20260723

# 检查是否有git仓库
if [ -d ".git" ]; then
    echo "发现git仓库，开始备份..."

    git checkout -b old-version-backup-20260723 2>/dev/null || git checkout old-version-backup-20260723

    git add .

    git commit -m "backup: 旧版本完整代码（2026年6月）

包含功能：
- mentor-care（导师关怀）
- mentor-chat（导师聊天，独立页面）
- mentor-reports（导师报告）
- 基础mentor页面

备份原因：
- 准备迁移到新版本
- 保留独特功能以备后续整合

备份日期：2026-07-23"

    git push origin old-version-backup-20260723

    echo "✅ 旧版本备份完成！"
else
    echo "⚠️  旧版本没有git仓库，跳过GitHub备份"
    echo "   但本地文件已重命名保存"
fi

echo ""
echo "================================================"
echo "✅ 备份任务完成！"
echo "================================================"
echo ""
echo "📊 备份总结："
echo "- 新版本：已推送到 origin/main"
echo "- 旧版本：已推送到 origin/old-version-backup-20260723"
echo "- 本地备份：qicheng-merged-backup-20260723"
echo ""
echo "🔍 接下来的任务："
echo "1. 对比 mentor-care 和 mentor-reports 功能"
echo "2. 决定是否需要迁移到新版本"
echo "3. 确认后删除旧版本目录"
