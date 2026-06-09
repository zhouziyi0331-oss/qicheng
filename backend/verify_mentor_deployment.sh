#!/bin/bash

# ============================================
# AI导师系统部署验证脚本
# 版本：v1.0
# 日期：2026-05-27
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 计数器
PASSED=0
FAILED=0
WARNINGS=0

# 日志函数
log_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED++))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED++))
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    ((WARNINGS++))
}

# 显示标题
show_banner() {
    echo ""
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║                                                        ║"
    echo "║        AI导师系统部署验证脚本                          ║"
    echo "║                                                        ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo ""
}

# 读取数据库配置
load_db_config() {
    if [ -f ".env" ]; then
        source .env
        DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
        DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

        if [ -z "$DB_USER" ] || [ -z "$DB_NAME" ]; then
            DB_USER="qicheng_user"
            DB_NAME="qicheng_db"
        fi
    else
        DB_USER="qicheng_user"
        DB_NAME="qicheng_db"
    fi
}

# 测试1: 检查数据库表
test_database_tables() {
    echo ""
    log_test "检查数据库表..."

    local tables=(
        "mentor_alert_rules"
        "mentor_alerts"
        "mentor_student_profile_cache"
        "mentor_retrospectives"
        "mentor_growth_observations"
        "mentor_sessions"
    )

    for table in "${tables[@]}"; do
        if psql -U $DB_USER -d $DB_NAME -t -c "SELECT 1 FROM $table LIMIT 1;" > /dev/null 2>&1; then
            log_pass "表 $table 存在"
        else
            log_fail "表 $table 不存在"
        fi
    done
}

# 测试2: 检查预警规则
test_alert_rules() {
    echo ""
    log_test "检查预警规则..."

    local count=$(psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM mentor_alert_rules WHERE is_active = true;" | tr -d ' ')

    if [ "$count" -eq 4 ]; then
        log_pass "预警规则已初始化 (4条规则)"
    else
        log_fail "预警规则数量不正确 (期望4条，实际${count}条)"
    fi
}

# 测试3: 检查索引
test_indexes() {
    echo ""
    log_test "检查数据库索引..."

    local indexes=(
        "idx_mentor_alerts_student"
        "idx_retrospectives_student"
        "idx_mentor_profile_cache_updated"
    )

    for index in "${indexes[@]}"; do
        if psql -U $DB_USER -d $DB_NAME -t -c "SELECT 1 FROM pg_indexes WHERE indexname = '$index';" | grep -q 1; then
            log_pass "索引 $index 存在"
        else
            log_warn "索引 $index 不存在"
        fi
    done
}

# 测试4: 检查代码文件
test_code_files() {
    echo ""
    log_test "检查代码文件..."

    local files=(
        "src/services/mentorAlertService.ts"
        "src/services/mentorMemoryService.ts"
        "src/services/mentorExampleService.ts"
        "src/services/mentorRetrospectiveService.ts"
        "src/jobs/mentorAlertJob.ts"
        "src/jobs/mentorRetrospectiveJob.ts"
        "src/routes/mentorRoutes.ts"
        "src/routes/mentorP1Routes.ts"
    )

    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            log_pass "文件 $file 存在"
        else
            log_fail "文件 $file 不存在"
        fi
    done
}

# 测试5: 检查依赖
test_dependencies() {
    echo ""
    log_test "检查依赖包..."

    local deps=(
        "node-cron"
        "uuid"
        "@anthropic-ai/sdk"
    )

    for dep in "${deps[@]}"; do
        if npm list $dep > /dev/null 2>&1; then
            log_pass "依赖 $dep 已安装"
        else
            log_fail "依赖 $dep 未安装"
        fi
    done
}

# 测试6: 检查环境变量
test_env_vars() {
    echo ""
    log_test "检查环境变量..."

    if [ -f ".env" ]; then
        log_pass ".env 文件存在"

        if grep -q "ANTHROPIC_API_KEY=" .env && ! grep -q "ANTHROPIC_API_KEY=$" .env; then
            log_pass "ANTHROPIC_API_KEY 已配置"
        else
            log_fail "ANTHROPIC_API_KEY 未配置"
        fi

        if grep -q "DATABASE_URL=" .env; then
            log_pass "DATABASE_URL 已配置"
        else
            log_fail "DATABASE_URL 未配置"
        fi
    else
        log_fail ".env 文件不存在"
    fi
}

# 测试7: 检查编译结果
test_compilation() {
    echo ""
    log_test "检查编译结果..."

    if [ -d "dist" ]; then
        log_pass "dist 目录存在"

        local compiled_files=(
            "dist/services/mentorAlertService.js"
            "dist/services/mentorMemoryService.js"
            "dist/jobs/mentorAlertJob.js"
        )

        for file in "${compiled_files[@]}"; do
            if [ -f "$file" ]; then
                log_pass "编译文件 $file 存在"
            else
                log_warn "编译文件 $file 不存在"
            fi
        done
    else
        log_warn "dist 目录不存在（可能未编译）"
    fi
}

# 测试8: 检查服务状态
test_service_status() {
    echo ""
    log_test "检查服务状态..."

    if pgrep -f "node.*dist/server.js" > /dev/null || pgrep -f "ts-node.*src/server.ts" > /dev/null; then
        log_pass "服务正在运行"

        # 检查端口
        if lsof -i :3000 > /dev/null 2>&1; then
            log_pass "端口 3000 已监听"
        else
            log_warn "端口 3000 未监听"
        fi
    else
        log_warn "服务未运行"
    fi
}

# 测试9: 检查API健康
test_api_health() {
    echo ""
    log_test "检查API健康..."

    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        log_pass "API健康检查通过"
    else
        log_warn "API健康检查失败（服务可能未启动）"
    fi
}

# 测试10: 检查学生画像
test_student_profiles() {
    echo ""
    log_test "检查学生画像..."

    local profile_count=$(psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM mentor_student_profile_cache;" | tr -d ' ')
    local student_count=$(psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM users WHERE role = 'student';" | tr -d ' ')

    log_pass "学生总数: $student_count"
    log_pass "已有画像: $profile_count"

    if [ "$profile_count" -gt 0 ]; then
        log_pass "学生画像已初始化"
    else
        log_warn "学生画像未初始化（将在订单完成后自动生成）"
    fi
}

# 测试11: 检查日志
test_logs() {
    echo ""
    log_test "检查日志文件..."

    if [ -f "logs/app.log" ]; then
        log_pass "日志文件存在"

        # 检查是否有定时任务日志
        if grep -q "MentorAlertJob" logs/app.log 2>/dev/null; then
            log_pass "预警定时任务日志存在"
        else
            log_warn "预警定时任务日志不存在"
        fi

        if grep -q "MentorRetrospectiveJob" logs/app.log 2>/dev/null; then
            log_pass "复盘定时任务日志存在"
        else
            log_warn "复盘定时任务日志不存在"
        fi
    else
        log_warn "日志文件不存在"
    fi
}

# 显示总结
show_summary() {
    echo ""
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║                                                        ║"
    echo "║                  验证完成                              ║"
    echo "║                                                        ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo ""

    echo "测试结果："
    echo "  ${GREEN}通过: $PASSED${NC}"
    echo "  ${RED}失败: $FAILED${NC}"
    echo "  ${YELLOW}警告: $WARNINGS${NC}"
    echo ""

    if [ $FAILED -eq 0 ]; then
        if [ $WARNINGS -eq 0 ]; then
            echo -e "${GREEN}✅ 所有测试通过！部署成功！${NC}"
        else
            echo -e "${YELLOW}⚠️  部署基本成功，但有 $WARNINGS 个警告${NC}"
        fi
    else
        echo -e "${RED}❌ 有 $FAILED 个测试失败，请检查部署${NC}"
        exit 1
    fi

    echo ""
    echo "下一步："
    echo "  1. 如果服务未运行，执行: npm run dev"
    echo "  2. 查看日志: tail -f logs/app.log | grep Mentor"
    echo "  3. 查看文档: cat AI_MENTOR_QUICK_START.md"
    echo ""
}

# 主函数
main() {
    show_banner

    # 检查是否在正确的目录
    if [ ! -f "package.json" ]; then
        echo -e "${RED}错误: 请在项目根目录（backend）下运行此脚本${NC}"
        exit 1
    fi

    # 加载数据库配置
    load_db_config

    # 运行所有测试
    test_database_tables
    test_alert_rules
    test_indexes
    test_code_files
    test_dependencies
    test_env_vars
    test_compilation
    test_service_status
    test_api_health
    test_student_profiles
    test_logs

    # 显示总结
    show_summary
}

# 运行主函数
main
