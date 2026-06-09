#!/bin/bash

# ============================================
# AI导师系统一键部署脚本
# 版本：v1.0
# 日期：2026-05-27
# ============================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示标题
show_banner() {
    echo ""
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║                                                        ║"
    echo "║        AI导师系统 P0+P1 一键部署脚本                  ║"
    echo "║                                                        ║"
    echo "║        版本: v1.0                                      ║"
    echo "║        日期: 2026-05-27                                ║"
    echo "║                                                        ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo ""
}

# 检查前置条件
check_prerequisites() {
    log_info "检查前置条件..."

    # 检查Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装，请先安装 Node.js"
        exit 1
    fi
    log_success "Node.js 已安装: $(node --version)"

    # 检查npm
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        exit 1
    fi
    log_success "npm 已安装: $(npm --version)"

    # 检查PostgreSQL
    if ! command -v psql &> /dev/null; then
        log_error "PostgreSQL 未安装，请先安装 PostgreSQL"
        exit 1
    fi
    log_success "PostgreSQL 已安装: $(psql --version)"

    # 检查当前目录
    if [ ! -f "package.json" ]; then
        log_error "请在项目根目录（backend）下运行此脚本"
        exit 1
    fi
    log_success "当前目录正确"

    echo ""
}

# 检查环境变量
check_env_vars() {
    log_info "检查环境变量..."

    if [ ! -f ".env" ]; then
        log_error ".env 文件不存在"
        exit 1
    fi

    # 检查ANTHROPIC_API_KEY
    if ! grep -q "ANTHROPIC_API_KEY=" .env; then
        log_error ".env 文件中缺少 ANTHROPIC_API_KEY"
        exit 1
    fi

    # 检查是否为空
    if grep -q "ANTHROPIC_API_KEY=$" .env || grep -q "ANTHROPIC_API_KEY=\"\"" .env; then
        log_error "ANTHROPIC_API_KEY 未设置，请在 .env 文件中配置"
        exit 1
    fi

    log_success "环境变量配置正确"
    echo ""
}

# 安装依赖
install_dependencies() {
    log_info "检查并安装依赖..."

    # 检查是否已安装
    if npm list node-cron uuid @anthropic-ai/sdk &> /dev/null; then
        log_success "所有依赖已安装"
    else
        log_info "安装缺失的依赖..."
        npm install node-cron uuid @anthropic-ai/sdk
        npm install --save-dev @types/node-cron @types/uuid
        log_success "依赖安装完成"
    fi

    echo ""
}

# 执行数据库迁移
run_migrations() {
    log_info "执行数据库迁移..."

    # 从.env读取数据库配置
    source .env

    # 提取数据库连接信息
    DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

    if [ -z "$DB_USER" ] || [ -z "$DB_NAME" ]; then
        log_warning "无法从DATABASE_URL解析数据库信息，使用默认值"
        DB_USER="qicheng_user"
        DB_NAME="qicheng_db"
    fi

    log_info "数据库用户: $DB_USER"
    log_info "数据库名称: $DB_NAME"

    # 执行P0迁移
    log_info "执行P0迁移 (085_mentor_enhancement_p0.sql)..."
    if psql -U $DB_USER -d $DB_NAME -f migrations/085_mentor_enhancement_p0.sql > /dev/null 2>&1; then
        log_success "P0迁移执行成功"
    else
        log_warning "P0迁移可能已执行过，跳过"
    fi

    # 执行P1迁移
    log_info "执行P1迁移 (086_mentor_enhancement_p1.sql)..."
    if psql -U $DB_USER -d $DB_NAME -f migrations/086_mentor_enhancement_p1.sql > /dev/null 2>&1; then
        log_success "P1迁移执行成功"
    else
        log_warning "P1迁移可能已执行过，跳过"
    fi

    # 验证表创建
    log_info "验证表创建..."
    TABLE_COUNT=$(psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE 'mentor_%';" | tr -d ' ')

    if [ "$TABLE_COUNT" -ge 5 ]; then
        log_success "数据库表创建成功 (共 $TABLE_COUNT 张表)"
    else
        log_error "数据库表创建失败，只找到 $TABLE_COUNT 张表"
        exit 1
    fi

    echo ""
}

# 备份app.ts
backup_app_file() {
    log_info "备份 app.ts 文件..."

    if [ -f "src/app.ts" ]; then
        cp src/app.ts src/app.ts.backup.$(date +%Y%m%d_%H%M%S)
        log_success "备份完成"
    else
        log_error "src/app.ts 文件不存在"
        exit 1
    fi

    echo ""
}

# 检查路由是否已注册
check_routes_registered() {
    log_info "检查路由注册..."

    if grep -q "mentorP1Routes" src/app.ts; then
        log_success "P1路由已注册"
        return 0
    else
        log_warning "P1路由未注册"
        return 1
    fi
}

# 检查定时任务是否已启动
check_jobs_registered() {
    log_info "检查定时任务注册..."

    if grep -q "mentorAlertJob" src/app.ts && grep -q "mentorRetrospectiveJob" src/app.ts; then
        log_success "定时任务已注册"
        return 0
    else
        log_warning "定时任务未注册"
        return 1
    fi
}

# 提示手动修改
prompt_manual_changes() {
    echo ""
    log_warning "需要手动修改 src/app.ts 文件"
    echo ""
    echo "请在 src/app.ts 中添加以下内容："
    echo ""
    echo "1. 在文件顶部添加 import："
    echo "   ${GREEN}import mentorP1Routes from './routes/mentorP1Routes';${NC}"
    echo ""
    echo "2. 在路由注册部分添加（第163行附近）："
    echo "   ${GREEN}app.use('/api/v1/mentor', mentorP1Routes);${NC}"
    echo ""
    echo "3. 在定时任务部分添加（第85-110行附近）："
    echo "   ${GREEN}const mentorAlertJob = require('./jobs/mentorAlertJob').default;${NC}"
    echo "   ${GREEN}mentorAlertJob.start();${NC}"
    echo "   ${GREEN}const mentorRetrospectiveJob = require('./jobs/mentorRetrospectiveJob').default;${NC}"
    echo "   ${GREEN}mentorRetrospectiveJob.start();${NC}"
    echo ""
    echo "4. 在优雅关闭部分添加："
    echo "   ${GREEN}mentorAlertJob.stop();${NC}"
    echo "   ${GREEN}mentorRetrospectiveJob.stop();${NC}"
    echo ""

    read -p "完成修改后按回车继续..."
    echo ""
}

# 编译TypeScript
compile_typescript() {
    log_info "编译TypeScript..."

    if npm run build > /dev/null 2>&1; then
        log_success "编译成功"
    else
        log_error "编译失败，请检查代码"
        exit 1
    fi

    echo ""
}

# 初始化学生画像
init_student_profiles() {
    log_info "检查学生画像初始化..."

    source .env
    DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

    if [ -z "$DB_USER" ] || [ -z "$DB_NAME" ]; then
        DB_USER="qicheng_user"
        DB_NAME="qicheng_db"
    fi

    # 检查是否有学生画像
    PROFILE_COUNT=$(psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM mentor_student_profile_cache;" | tr -d ' ')
    STUDENT_COUNT=$(psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM users WHERE role = 'student';" | tr -d ' ')

    log_info "学生总数: $STUDENT_COUNT"
    log_info "已有画像: $PROFILE_COUNT"

    if [ "$PROFILE_COUNT" -lt "$STUDENT_COUNT" ]; then
        log_warning "有 $((STUDENT_COUNT - PROFILE_COUNT)) 个学生未初始化画像"
        log_info "画像将在学生完成第一个订单后自动生成"
    else
        log_success "所有学生画像已初始化"
    fi

    echo ""
}

# 显示部署总结
show_summary() {
    echo ""
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║                                                        ║"
    echo "║                  部署完成！                            ║"
    echo "║                                                        ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo ""

    log_success "✅ 数据库迁移完成"
    log_success "✅ 依赖安装完成"
    log_success "✅ 代码编译完成"

    echo ""
    echo "下一步操作："
    echo ""
    echo "1. 重启服务："
    echo "   ${GREEN}npm run dev${NC}  (开发环境)"
    echo "   ${GREEN}pm2 restart qicheng-backend${NC}  (生产环境)"
    echo ""
    echo "2. 查看日志确认启动："
    echo "   ${GREEN}tail -f logs/app.log | grep -E 'Mentor|✅'${NC}"
    echo ""
    echo "3. 验证部署："
    echo "   ${GREEN}curl http://localhost:3000/health${NC}"
    echo ""
    echo "4. 查看文档："
    echo "   ${GREEN}cat AI_MENTOR_QUICK_START.md${NC}"
    echo ""

    log_info "预期日志输出："
    echo "   ✅ AI导师预警定时任务已启动（每15分钟扫描一次）"
    echo "   ✅ AI导师复盘定时任务已启动（每5分钟扫描一次）"
    echo ""
}

# 主函数
main() {
    show_banner

    # 检查前置条件
    check_prerequisites

    # 检查环境变量
    check_env_vars

    # 安装依赖
    install_dependencies

    # 执行数据库迁移
    run_migrations

    # 备份app.ts
    backup_app_file

    # 检查是否需要手动修改
    if ! check_routes_registered || ! check_jobs_registered; then
        prompt_manual_changes
    else
        log_success "路由和定时任务已配置"
        echo ""
    fi

    # 编译TypeScript
    compile_typescript

    # 初始化学生画像
    init_student_profiles

    # 显示总结
    show_summary
}

# 运行主函数
main
