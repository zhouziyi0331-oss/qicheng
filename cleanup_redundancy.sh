#!/bin/bash

# ============================================================================
# 启程平台冗余清理脚本
# 执行前请仔细阅读每一步的说明
# ============================================================================

set -e  # 遇到错误立即停止

echo "========================================="
echo "启程平台冗余清理脚本"
echo "========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================================================
# Phase 1: 检查并归档备份目录
# ============================================================================

echo -e "${YELLOW}Phase 1: 检查备份目录${NC}"
echo ""

if [ -d "backend/src_backup_20260527_121715" ]; then
    BACKUP_SIZE=$(du -sh backend/src_backup_20260527_121715 | cut -f1)
    echo "发现备份目录: backend/src_backup_20260527_121715 (大小: $BACKUP_SIZE)"
    echo "这个目录是5月27日创建的备份，已经过去2周了"
    echo ""
    read -p "是否删除这个备份目录? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "正在删除备份目录..."
        rm -rf backend/src_backup_20260527_121715
        echo -e "${GREEN}✓ 已删除备份目录${NC}"
    else
        echo "跳过，保留备份目录"
    fi
else
    echo "✓ 未发现备份目录"
fi

echo ""

# ============================================================================
# Phase 2: 归档旧文档
# ============================================================================

echo -e "${YELLOW}Phase 2: 归档旧文档${NC}"
echo ""

# 创建归档目录
mkdir -p docs/archive/{summaries,reports,guides,ai-mentor,daily}

echo "准备归档以下文档类型:"
echo "  - AI_MENTOR_* 相关文档 (约15个)"
echo "  - *_COMPLETE* 文档 (约10个)"
echo "  - *_FINAL* 文档 (约5个)"
echo "  - DAILY_SUMMARY_* 文档 (约5个)"
echo ""

read -p "是否开始归档? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then

    # 归档AI导师相关文档（保留索引和Quick Start）
    echo "归档 AI_MENTOR_* 文档..."
    find . -maxdepth 1 -name "AI_MENTOR_*.md" \
        ! -name "AI_MENTOR_DOCUMENTATION_INDEX.md" \
        ! -name "AI_MENTOR_QUICK_START.md" \
        -exec mv {} docs/archive/ai-mentor/ \; 2>/dev/null || true

    # 归档完成报告
    echo "归档 *_COMPLETE* 文档..."
    find . -maxdepth 1 -name "*COMPLETE*.md" \
        ! -name "COMPLETE_IMPLEMENTATION_FINAL.md" \
        -exec mv {} docs/archive/reports/ \; 2>/dev/null || true

    # 归档最终报告
    echo "归档 *_FINAL* 文档..."
    find . -maxdepth 1 -name "*FINAL*.md" \
        ! -name "SEMANTIC_MATCHING_FINAL_REPORT_20260609.md" \
        -exec mv {} docs/archive/reports/ \; 2>/dev/null || true

    # 归档每日总结
    echo "归档 DAILY_SUMMARY_* 文档..."
    find . -maxdepth 1 -name "DAILY_SUMMARY_*.md" \
        -exec mv {} docs/archive/daily/ \; 2>/dev/null || true

    # 归档其他总结
    echo "归档其他总结文档..."
    find . -maxdepth 1 -name "*_SUMMARY_*.md" \
        ! -name "PROJECT_SUMMARY.md" \
        ! -name "SYSTEM_CLEANUP_AUDIT.md" \
        -exec mv {} docs/archive/summaries/ \; 2>/dev/null || true

    echo -e "${GREEN}✓ 文档归档完成${NC}"
    echo ""
    echo "归档统计:"
    echo "  - AI Mentor: $(find docs/archive/ai-mentor -name "*.md" 2>/dev/null | wc -l) 个文件"
    echo "  - Reports: $(find docs/archive/reports -name "*.md" 2>/dev/null | wc -l) 个文件"
    echo "  - Summaries: $(find docs/archive/summaries -name "*.md" 2>/dev/null | wc -l) 个文件"
    echo "  - Daily: $(find docs/archive/daily -name "*.md" 2>/dev/null | wc -l) 个文件"
else
    echo "跳过文档归档"
fi

echo ""

# ============================================================================
# Phase 3: 检查未使用的npm依赖
# ============================================================================

echo -e "${YELLOW}Phase 3: 检查未使用的npm依赖${NC}"
echo ""

if command -v npx &> /dev/null; then
    echo "正在检查后端未使用的依赖..."
    cd backend
    npx depcheck --ignores="@types/*,typescript,ts-node,nodemon" > ../unused_deps_backend.txt 2>&1 || true
    cd ..

    if [ -s unused_deps_backend.txt ]; then
        echo -e "${YELLOW}发现未使用的依赖，详情见 unused_deps_backend.txt${NC}"
        echo "前5个未使用的依赖:"
        head -10 unused_deps_backend.txt
    else
        echo -e "${GREEN}✓ 后端依赖检查通过${NC}"
        rm -f unused_deps_backend.txt
    fi

    echo ""

    if [ -d "miniapp" ]; then
        echo "正在检查学生端未使用的依赖..."
        cd miniapp
        npx depcheck --ignores="@types/*,typescript,@tarojs/*" > ../unused_deps_miniapp.txt 2>&1 || true
        cd ..

        if [ -s unused_deps_miniapp.txt ]; then
            echo -e "${YELLOW}发现未使用的依赖，详情见 unused_deps_miniapp.txt${NC}"
        else
            echo -e "${GREEN}✓ 学生端依赖检查通过${NC}"
            rm -f unused_deps_miniapp.txt
        fi
    fi

    echo ""

    if [ -d "company-miniapp" ]; then
        echo "正在检查企业端未使用的依赖..."
        cd company-miniapp
        npx depcheck --ignores="@types/*,typescript,@tarojs/*" > ../unused_deps_company.txt 2>&1 || true
        cd ..

        if [ -s unused_deps_company.txt ]; then
            echo -e "${YELLOW}发现未使用的依赖，详情见 unused_deps_company.txt${NC}"
        else
            echo -e "${GREEN}✓ 企业端依赖检查通过${NC}"
            rm -f unused_deps_company.txt
        fi
    fi
else
    echo -e "${YELLOW}未找到npx命令，跳过依赖检查${NC}"
fi

echo ""

# ============================================================================
# Phase 4: 查找console.log
# ============================================================================

echo -e "${YELLOW}Phase 4: 查找console.log调试代码${NC}"
echo ""

CONSOLE_COUNT=$(find backend/src -name "*.ts" -type f -exec grep -l "console\.log\|console\.error" {} \; 2>/dev/null | wc -l | tr -d ' ')

if [ "$CONSOLE_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}发现 $CONSOLE_COUNT 个文件包含console.log/error${NC}"
    echo "这些应该替换为Winston日志"
    echo ""
    echo "文件列表:"
    find backend/src -name "*.ts" -type f -exec grep -l "console\.log\|console\.error" {} \; 2>/dev/null | head -10
    echo ""
    read -p "是否生成替换脚本? (y/N): " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cat > replace_console_logs.sh << 'EOF'
#!/bin/bash
# 替换console.log为logger
find backend/src -name "*.ts" -type f -exec sed -i.bak \
    -e 's/console\.log(/logger.info(/g' \
    -e 's/console\.error(/logger.error(/g' \
    -e 's/console\.warn(/logger.warn(/g' \
    {} \;
echo "替换完成，备份文件为 *.bak"
echo "请手动检查并删除备份文件: find backend/src -name '*.bak' -delete"
EOF
        chmod +x replace_console_logs.sh
        echo -e "${GREEN}✓ 已生成 replace_console_logs.sh${NC}"
        echo "请手动运行该脚本并验证"
    fi
else
    echo -e "${GREEN}✓ 未发现console.log${NC}"
fi

echo ""

# ============================================================================
# Phase 5: 生成清理报告
# ============================================================================

echo -e "${YELLOW}Phase 5: 生成清理报告${NC}"
echo ""

cat > CLEANUP_REPORT.md << 'EOF'
# 清理报告

**执行时间**: $(date)

## 已完成的清理

### 1. 备份目录清理
EOF

if [ ! -d "backend/src_backup_20260527_121715" ]; then
    echo "- ✅ 已删除 backend/src_backup_20260527_121715 备份目录" >> CLEANUP_REPORT.md
else
    echo "- ⏭️ 保留了 backend/src_backup_20260527_121715 备份目录" >> CLEANUP_REPORT.md
fi

cat >> CLEANUP_REPORT.md << EOF

### 2. 文档归档
- AI Mentor文档: $(find docs/archive/ai-mentor -name "*.md" 2>/dev/null | wc -l | tr -d ' ') 个
- 报告文档: $(find docs/archive/reports -name "*.md" 2>/dev/null | wc -l | tr -d ' ') 个
- 总结文档: $(find docs/archive/summaries -name "*.md" 2>/dev/null | wc -l | tr -d ' ') 个
- 每日总结: $(find docs/archive/daily -name "*.md" 2>/dev/null | wc -l | tr -d ' ') 个

### 3. 代码质量检查
- Console.log文件数: $CONSOLE_COUNT 个

### 4. 保留的核心文档
- README.md - 项目总览
- PLATFORM_ARCHITECTURE.md - 架构设计
- API_DOCUMENTATION.md - API文档
- DEPLOYMENT_GUIDE.md - 部署指南
- SYSTEM_CLEANUP_AUDIT.md - 清理审查报告

## 下一步行动

### 立即执行
1. 运行数据一致性检查: \`psql -d qicheng_db -f backend/scripts/check_data_consistency.sql\`
2. 如有不一致，运行修复脚本: \`psql -d qicheng_db -f backend/scripts/fix_data_consistency.sql\`

### 本周执行
1. 检查并清理未使用的npm依赖（如果生成了 unused_deps_*.txt 文件）
2. 替换console.log为logger（如果生成了 replace_console_logs.sh）
3. 补全缺失的前端页面

### 下周执行
1. 全流程功能测试
2. 性能优化
3. 部署到测试环境

EOF

echo -e "${GREEN}✓ 清理报告已生成: CLEANUP_REPORT.md${NC}"

echo ""
echo "========================================="
echo "清理脚本执行完成"
echo "========================================="
echo ""
echo "总结:"
echo "  - 备份目录: $([ -d backend/src_backup_20260527_121715 ] && echo '保留' || echo '已删除')"
echo "  - 文档归档: $(find docs/archive -name "*.md" 2>/dev/null | wc -l | tr -d ' ') 个文件"
echo "  - 详细报告: CLEANUP_REPORT.md"
echo ""
echo "下一步请执行:"
echo "  1. 查看 CLEANUP_REPORT.md"
echo "  2. 运行数据一致性检查"
echo "  3. 检查 unused_deps_*.txt 文件（如果存在）"
