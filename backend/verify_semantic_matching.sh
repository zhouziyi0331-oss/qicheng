#!/bin/bash

# ============================================
# 语义匹配系统部署验证脚本
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
    echo "║        语义匹配系统部署验证脚本                        ║"
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
        "student_capabilities"
        "task_student_matches"
        "task_translations"
    )

    for table in "${tables[@]}"; do
        if psql -U $DB_USER -d $DB_NAME -t -c "SELECT 1 FROM $table LIMIT 1;" > /dev/null 2>&1; then
            log_pass "表 $table 存在"
        else
            log_fail "表 $table 不存在"
        fi
    done
}

# 测试2: 检查向量扩展
test_vector_extension() {
    echo ""
    log_test "检查pgvector扩展..."

    if psql -U $DB_USER -d $DB_NAME -t -c "SELECT 1 FROM pg_extension WHERE extname = 'vector';" | grep -q 1; then
        log_pass "pgvector扩展已安装"
    else
        log_fail "pgvector扩展未安装"
    fi
}

# 测试3: 检查tasks表扩展字段
test_tasks_table_extensions() {
    echo ""
    log_test "检查tasks表扩展字段..."

    local fields=(
        "matching_enabled"
        "matched_students_count"
        "top_match_score"
        "matching_completed_at"
    )

    for field in "${fields[@]}"; do
        if psql -U $DB_USER -d $DB_NAME -t -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = '$field';" | grep -q "$field"; then
            log_pass "字段 tasks.$field 存在"
        else
            log_warn "字段 tasks.$field 不存在"
        fi
    done
}

# 测试4: 检查索引
test_indexes() {
    echo ""
    log_test "检查数据库索引..."

    local indexes=(
        "idx_student_capabilities_student"
        "idx_student_capabilities_vector"
        "idx_matches_task"
        "idx_matches_student"
        "idx_task_translations_task"
    )

    for index in "${indexes[@]}"; do
        if psql -U $DB_USER -d $DB_NAME -t -c "SELECT 1 FROM pg_indexes WHERE indexname = '$index';" | grep -q 1; then
            log_pass "索引 $index 存在"
        else
            log_warn "索引 $index 不存在"
        fi
    done
}

# 测试5: 检查代码文件
test_code_files() {
    echo ""
    log_test "检查代码文件..."

    local files=(
        "src/services/vectorGenerationService.ts"
        "src/services/semanticMatchingEngine.ts"
        "src/services/qichengTeacherService.ts"
        "src/services/matchingScheduler.ts"
        "src/routes/tasks/matchingController.ts"
    )

    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            log_pass "文件 $file 存在"
        else
            log_fail "文件 $file 不存在"
        fi
    done
}

# 测试6: 检查路由注册
test_route_registration() {
    echo ""
    log_test "检查路由注册..."

    if grep -q "matchingCtrl.triggerMatching" src/routes/tasks/index.ts; then
        log_pass "匹配路由已注册"
    else
        log_fail "匹配路由未注册"
    fi

    if grep -q "matchingCtrl.getRecommendedTasks" src/routes/tasks/index.ts; then
        log_pass "推荐任务路由已注册"
    else
        log_fail "推荐任务路由未注册"
    fi
}

# 测试7: 检查调度器启动
test_scheduler_startup() {
    echo ""
    log_test "检查调度器启动..."

    if grep -q "matchingScheduler.start()" src/app.ts; then
        log_pass "matchingScheduler已在app.ts中启动"
    else
        log_fail "matchingScheduler未在app.ts中启动"
    fi
}

# 测试8: 检查环境变量
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

        if grep -q "EMBEDDING_API_URL=" .env; then
            log_pass "EMBEDDING_API_URL 已配置"
        else
            log_warn "EMBEDDING_API_URL 未配置（将使用默认值）"
        fi
    else
        log_fail ".env 文件不存在"
    fi
}

# 测试9: 检查编译结果
test_compilation() {
    echo ""
    log_test "检查编译结果..."

    if [ -d "dist" ]; then
        log_pass "dist 目录存在"

        local compiled_files=(
            "dist/services/vectorGenerationService.js"
            "dist/services/semanticMatchingEngine.js"
            "dist/services/matchingScheduler.js"
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

# 测试10: 检查视图
test_views() {
    echo ""
    log_test "检查数据库视图..."

    local views=(
        "student_matching_overview"
        "task_matching_overview"
    )

    for view in "${views[@]}"; do
        if psql -U $DB_USER -d $DB_NAME -t -c "SELECT 1 FROM information_schema.views WHERE table_name = '$view';" | grep -q 1; then
            log_pass "视图 $view 存在"
        else
            log_warn "视图 $view 不存在"
        fi
    done
}

# 测试11: 检查辅助函数
test_helper_functions() {
    echo ""
    log_test "检查数据库辅助函数..."

    if psql -U $DB_USER -d $DB_NAME -t -c "SELECT 1 FROM pg_proc WHERE proname = 'cosine_similarity';" | grep -q 1; then
        log_pass "函数 cosine_similarity 存在"
    else
        log_warn "函数 cosine_similarity 不存在"
    fi
}

# 测试12: 检查学生能力数据
test_student_capabilities_data() {
    echo ""
    log_test "检查学生能力数据..."

    local count=$(psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM student_capabilities;" 2>/dev/null | tr -d ' ')
    local student_count=$(psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM users WHERE role = 'student';" 2>/dev/null | tr -d ' ')

    log_pass "学生总数: $student_count"
    log_pass "已有能力画像: $count"

    if [ "$count" -gt 0 ]; then
        log_pass "学生能力画像已初始化"
    else
        log_warn "学生能力画像未初始化（需要运行初始化脚本）"
    fi
}

# 测试13: 检查任务向量
test_task_vectors() {
    echo ""
    log_test "检查任务向量..."

    # 检查tasks表是否有向量字段
    if psql -U $DB_USER -d $DB_NAME -t -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'combined_embedding';" | grep -q "combined_embedding"; then
        log_pass "tasks表有combined_embedding字段"

        local count=$(psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM tasks WHERE combined_embedding IS NOT NULL;" 2>/dev/null | tr -d ' ')
        log_pass "已生成向量的任务数: $count"
    else
        log_warn "tasks表没有combined_embedding字段"
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
            echo -e "${GREEN}✅ 所有测试通过！语义匹配系统已就绪！${NC}"
        else
            echo -e "${YELLOW}⚠️  系统基本就绪，但有 $WARNINGS 个警告${NC}"
        fi
    else
        echo -e "${RED}❌ 有 $FAILED 个测试失败，请检查部署${NC}"
        exit 1
    fi

    echo ""
    echo "下一步："
    echo "  1. 如果学生能力画像未初始化，运行: npm run init-student-capabilities"
    echo "  2. 如果任务向量未生成，运行: npm run init-task-vectors"
    echo "  3. 测试匹配功能: curl -X POST http://localhost:3000/api/v1/tasks/{taskId}/trigger-matching"
    echo "  4. 查看文档: cat SEMANTIC_MATCHING_DEPLOYMENT.md"
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
    test_vector_extension
    test_tasks_table_extensions
    test_indexes
    test_code_files
    test_route_registration
    test_scheduler_startup
    test_env_vars
    test_compilation
    test_views
    test_helper_functions
    test_student_capabilities_data
    test_task_vectors

    # 显示总结
    show_summary
}

# 运行主函数
main
