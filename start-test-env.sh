#!/bin/bash

# 启程平台 - 一键启动测试环境
# 使用方法: ./start-test-env.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_header() {
    echo -e "${BLUE}$1${NC}"
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检查端口是否被占用
check_port() {
    lsof -i :"$1" >/dev/null 2>&1
}

# 主函数
main() {
    clear
    print_header "============================================================"
    print_header "🚀 启程平台 - 测试环境启动脚本"
    print_header "============================================================"
    echo ""

    # 1. 检查后端服务
    print_header "📊 步骤 1/5: 检查后端服务"
    echo ""

    if check_port 3000; then
        print_success "后端服务已运行在端口 3000"

        # 健康检查
        if curl -s http://localhost:3000/health | grep -q "ok"; then
            print_success "健康检查通过"
        else
            print_warning "健康检查失败，但服务在运行"
        fi
    else
        print_error "后端服务未运行"
        print_info "请先启动后端服务: cd backend && npm run dev"
        exit 1
    fi
    echo ""

    # 2. 检查数据库
    print_header "📊 步骤 2/5: 检查数据库"
    echo ""

    cd backend
    if node -e "
        const { Pool } = require('pg');
        require('dotenv').config();
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        pool.query('SELECT 1')
            .then(() => { console.log('✅ 数据库连接正常'); process.exit(0); })
            .catch(() => { console.log('❌ 数据库连接失败'); process.exit(1); });
    " 2>/dev/null; then
        print_success "数据库连接正常"
    else
        print_error "数据库连接失败"
        exit 1
    fi
    cd ..
    echo ""

    # 3. 检查测试数据
    print_header "📊 步骤 3/5: 检查测试数据"
    echo ""

    cd backend
    node -e "
        const { Pool } = require('pg');
        require('dotenv').config();
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });

        async function check() {
            const users = await pool.query(\"SELECT COUNT(*) FROM users WHERE phone LIKE '13800000%'\");
            const tasks = await pool.query(\"SELECT COUNT(*) FROM tasks WHERE title LIKE '%React%'\");
            const hints = await pool.query('SELECT COUNT(*) FROM mentor_tool_hints');

            console.log('  测试用户:', users.rows[0].count);
            console.log('  测试任务:', tasks.rows[0].count);
            console.log('  工具提示:', hints.rows[0].count);

            await pool.end();

            if (users.rows[0].count >= 6 && tasks.rows[0].count >= 1 && hints.rows[0].count >= 50) {
                process.exit(0);
            } else {
                process.exit(1);
            }
        }

        check().catch(() => process.exit(1));
    "

    if [ $? -eq 0 ]; then
        print_success "测试数据完整"
    else
        print_warning "测试数据不完整，正在创建..."
        node scripts/create-test-data.js
        if [ $? -eq 0 ]; then
            print_success "测试数据创建成功"
        else
            print_error "测试数据创建失败"
            exit 1
        fi
    fi
    cd ..
    echo ""

    # 4. 显示测试账号
    print_header "📊 步骤 4/5: 测试账号信息"
    echo ""
    print_info "企业账号:"
    echo "  手机号: 13800000001"
    echo "  密码:   test123456"
    echo ""
    print_info "学生账号:"
    echo "  学生1: 13800000002 / test123456"
    echo "  学生2: 13800000003 / test123456"
    echo "  学生3: 13800000004 / test123456"
    echo "  学生4: 13800000005 / test123456"
    echo "  学生5: 13800000006 / test123456"
    echo ""

    # 5. 提供启动选项
    print_header "📊 步骤 5/5: 选择启动方式"
    echo ""
    echo "请选择要启动的服务:"
    echo ""
    echo "  1) 启动学生端小程序"
    echo "  2) 启动企业端小程序"
    echo "  3) 同时启动学生端和企业端"
    echo "  4) 运行API测试"
    echo "  5) 查看测试指南"
    echo "  6) 退出"
    echo ""
    read -p "请输入选项 (1-6): " choice

    case $choice in
        1)
            print_info "启动学生端小程序..."
            cd miniapp
            print_success "学生端开发服务器启动中..."
            print_info "请在微信开发者工具中打开项目: $(pwd)"
            npm run dev:weapp
            ;;
        2)
            print_info "启动企业端小程序..."
            cd company-miniapp
            print_success "企业端开发服务器启动中..."
            print_info "请在微信开发者工具中打开项目: $(pwd)"
            npm run dev:weapp
            ;;
        3)
            print_info "同时启动学生端和企业端..."
            print_warning "将在两个终端窗口中启动服务"

            # 检查是否在tmux中
            if command_exists tmux; then
                tmux new-session -d -s qicheng-student "cd miniapp && npm run dev:weapp"
                tmux new-session -d -s qicheng-company "cd company-miniapp && npm run dev:weapp"
                print_success "服务已在tmux会话中启动"
                print_info "学生端: tmux attach -t qicheng-student"
                print_info "企业端: tmux attach -t qicheng-company"
            else
                print_warning "未安装tmux，请手动在两个终端中启动"
                print_info "终端1: cd miniapp && npm run dev:weapp"
                print_info "终端2: cd company-miniapp && npm run dev:weapp"
            fi
            ;;
        4)
            print_info "运行API测试..."
            cd backend
            node scripts/test-api.js
            ;;
        5)
            print_info "打开测试指南..."
            if command_exists open; then
                open backend/E2E_TEST_GUIDE.md
            elif command_exists xdg-open; then
                xdg-open backend/E2E_TEST_GUIDE.md
            else
                print_info "请手动打开: backend/E2E_TEST_GUIDE.md"
            fi
            ;;
        6)
            print_info "退出"
            exit 0
            ;;
        *)
            print_error "无效选项"
            exit 1
            ;;
    esac
}

# 运行主函数
main
