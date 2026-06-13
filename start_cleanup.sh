#!/bin/bash

# ============================================================================
# 一键启动清理流程
# ============================================================================

clear

cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║           🔧 启程平台系统清理与完善                            ║
║                                                               ║
║           从"能看"到"能用"                                     ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

EOF

echo "欢迎使用系统清理工具！"
echo ""
echo "这个工具将帮助你："
echo "  ✓ 检查并修复逻辑闭环问题"
echo "  ✓ 发现并补全缺失的前端页面"
echo "  ✓ 清理冗余的文档和代码"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# 主菜单
# ============================================================================

while true; do
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}主菜单${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo ""
    echo "1. 📊 运行完整检查（推荐首次使用）"
    echo "2. 🔍 仅检查数据一致性"
    echo "3. 🎨 仅检查前端完整性"
    echo "4. 🧹 运行冗余清理"
    echo "5. 📖 查看文档指南"
    echo "6. ❌ 退出"
    echo ""
    read -p "请选择 (1-6): " choice

    case $choice in
        1)
            echo ""
            echo -e "${YELLOW}═══════════════════════════════════════${NC}"
            echo -e "${YELLOW}运行完整检查${NC}"
            echo -e "${YELLOW}═══════════════════════════════════════${NC}"
            echo ""

            # 检查数据库连接
            echo "检查数据库连接..."
            if psql -d qicheng_db -c "SELECT 1;" > /dev/null 2>&1; then
                echo -e "${GREEN}✓ 数据库连接正常${NC}"
                echo ""

                # 运行数据一致性检查
                echo "1/3 运行数据一致性检查..."
                psql -d qicheng_db -f backend/scripts/check_data_consistency.sql > data_check_result.txt 2>&1
                echo -e "${GREEN}✓ 完成，结果保存到 data_check_result.txt${NC}"
                echo ""

                # 显示关键结果
                echo "数据一致性检查结果预览:"
                echo "---"
                head -30 data_check_result.txt
                echo "..."
                echo ""
                read -p "按回车继续..."
            else
                echo -e "${RED}✗ 数据库连接失败${NC}"
                echo "请确保："
                echo "  1. PostgreSQL已启动"
                echo "  2. 数据库 qicheng_db 存在"
                echo "  3. 有连接权限"
                echo ""
                read -p "按回车返回菜单..."
                continue
            fi

            # 运行前端检查
            echo "2/3 运行前端完整性检查..."
            if [ -f "./check_frontend_completeness.sh" ]; then
                ./check_frontend_completeness.sh
                echo ""
                read -p "按回车继续..."
            else
                echo -e "${RED}✗ 未找到 check_frontend_completeness.sh${NC}"
            fi

            # 显示总结
            echo ""
            echo "3/3 生成总结报告..."
            echo ""
            echo -e "${GREEN}═══════════════════════════════════════${NC}"
            echo -e "${GREEN}检查完成！${NC}"
            echo -e "${GREEN}═══════════════════════════════════════${NC}"
            echo ""
            echo "生成的报告文件："
            echo "  📄 data_check_result.txt - 数据一致性检查结果"
            echo "  📄 FRONTEND_COMPLETENESS_REPORT.md - 前端完整性报告"
            echo ""
            echo "下一步："
            echo "  1. 查看 data_check_result.txt，检查是否有数据不一致"
            echo "  2. 查看 FRONTEND_COMPLETENESS_REPORT.md，确认哪些页面需要修复"
            echo "  3. 如有问题，运行修复脚本或补全页面"
            echo ""
            read -p "按回车返回菜单..."
            ;;

        2)
            echo ""
            echo -e "${YELLOW}═══════════════════════════════════════${NC}"
            echo -e "${YELLOW}数据一致性检查${NC}"
            echo -e "${YELLOW}═══════════════════════════════════════${NC}"
            echo ""

            if psql -d qicheng_db -c "SELECT 1;" > /dev/null 2>&1; then
                echo "运行检查..."
                psql -d qicheng_db -f backend/scripts/check_data_consistency.sql
                echo ""
                echo -e "${GREEN}检查完成${NC}"
                echo ""
                echo "如果发现数据不一致，运行修复脚本："
                echo "  psql -d qicheng_db -f backend/scripts/fix_data_consistency.sql"
            else
                echo -e "${RED}数据库连接失败${NC}"
            fi
            echo ""
            read -p "按回车返回菜单..."
            ;;

        3)
            echo ""
            echo -e "${YELLOW}═══════════════════════════════════════${NC}"
            echo -e "${YELLOW}前端完整性检查${NC}"
            echo -e "${YELLOW}═══════════════════════════════════════${NC}"
            echo ""

            if [ -f "./check_frontend_completeness.sh" ]; then
                ./check_frontend_completeness.sh
            else
                echo -e "${RED}未找到 check_frontend_completeness.sh${NC}"
            fi
            echo ""
            read -p "按回车返回菜单..."
            ;;

        4)
            echo ""
            echo -e "${YELLOW}═══════════════════════════════════════${NC}"
            echo -e "${YELLOW}冗余清理${NC}"
            echo -e "${YELLOW}═══════════════════════════════════════${NC}"
            echo ""
            echo -e "${RED}警告: 这将归档/删除文件！${NC}"
            echo ""
            read -p "确定要继续吗? (y/N): " confirm

            if [[ $confirm =~ ^[Yy]$ ]]; then
                if [ -f "./cleanup_redundancy.sh" ]; then
                    ./cleanup_redundancy.sh
                else
                    echo -e "${RED}未找到 cleanup_redundancy.sh${NC}"
                fi
            else
                echo "已取消"
            fi
            echo ""
            read -p "按回车返回菜单..."
            ;;

        5)
            echo ""
            echo -e "${YELLOW}═══════════════════════════════════════${NC}"
            echo -e "${YELLOW}文档指南${NC}"
            echo -e "${YELLOW}═══════════════════════════════════════${NC}"
            echo ""
            echo "可用的文档："
            echo ""
            echo "1. CLEANUP_QUICK_REFERENCE.md - 快速参考（推荐）"
            echo "2. CLEANUP_EXECUTION_GUIDE.md - 详细执行指南"
            echo "3. SYSTEM_CLEANUP_AUDIT.md - 完整审查报告"
            echo ""
            read -p "选择要查看的文档 (1-3, 或按回车返回): " doc_choice

            case $doc_choice in
                1)
                    if command -v open &> /dev/null; then
                        open CLEANUP_QUICK_REFERENCE.md
                    elif command -v xdg-open &> /dev/null; then
                        xdg-open CLEANUP_QUICK_REFERENCE.md
                    else
                        cat CLEANUP_QUICK_REFERENCE.md | less
                    fi
                    ;;
                2)
                    if command -v open &> /dev/null; then
                        open CLEANUP_EXECUTION_GUIDE.md
                    elif command -v xdg-open &> /dev/null; then
                        xdg-open CLEANUP_EXECUTION_GUIDE.md
                    else
                        cat CLEANUP_EXECUTION_GUIDE.md | less
                    fi
                    ;;
                3)
                    if command -v open &> /dev/null; then
                        open SYSTEM_CLEANUP_AUDIT.md
                    elif command -v xdg-open &> /dev/null; then
                        xdg-open SYSTEM_CLEANUP_AUDIT.md
                    else
                        cat SYSTEM_CLEANUP_AUDIT.md | less
                    fi
                    ;;
                *)
                    echo "返回主菜单..."
                    ;;
            esac
            ;;

        6)
            echo ""
            echo "感谢使用！"
            echo ""
            echo "如需帮助，请查看："
            echo "  📖 CLEANUP_QUICK_REFERENCE.md"
            echo ""
            exit 0
            ;;

        *)
            echo -e "${RED}无效选择，请重试${NC}"
            ;;
    esac
done
