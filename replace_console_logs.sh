#!/bin/bash

# ============================================================================
# 替换 console.log 为 logger
# ============================================================================

echo "开始替换 console.log 为 logger..."
echo ""

# 统计
TOTAL=$(find backend/src -name "*.ts" -type f -exec grep -l "console\.log\|console\.error\|console\.warn" {} \; 2>/dev/null | wc -l | tr -d ' ')

echo "发现 $TOTAL 个文件包含 console.log/error/warn"
echo ""

read -p "是否继续替换? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "已取消"
    exit 0
fi

# 备份并替换
echo "正在替换..."

find backend/src -name "*.ts" -type f -exec sed -i.bak \
    -e 's/console\.log(/logger.info(/g' \
    -e 's/console\.error(/logger.error(/g' \
    -e 's/console\.warn(/logger.warn(/g' \
    -e 's/console\.debug(/logger.debug(/g' \
    {} \;

echo ""
echo "✓ 替换完成"
echo ""
echo "备份文件已创建（*.bak）"
echo "请检查替换结果，如果正确，运行以下命令删除备份："
echo "  find backend/src -name '*.bak' -delete"
echo ""

# 统计替换后的情况
REMAINING=$(find backend/src -name "*.ts" -type f -exec grep -l "console\.log\|console\.error\|console\.warn" {} \; 2>/dev/null | wc -l | tr -d ' ')

echo "剩余 $REMAINING 个文件仍包含 console (可能是字符串中的引用)"
