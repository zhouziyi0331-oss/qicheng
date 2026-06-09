#!/bin/bash

# 启程平台语义匹配系统 - 真正执行指南
# 按照正确的方向：理解"言外之意"

set -e

echo "=========================================="
echo "启程平台语义匹配系统 - 执行指南"
echo "核心：理解'言外之意'，不只是字面匹配"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================
# 第一步：环境检查
# ============================================
echo -e "${BLUE}第一步：环境检查${NC}"
echo ""

# 检查PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL未安装${NC}"
    echo ""
    echo "请先安装PostgreSQL 14+："
    echo ""
    echo "macOS:"
    echo "  brew install postgresql@14"
    echo "  brew services start postgresql@14"
    echo ""
    echo "Ubuntu/Debian:"
    echo "  sudo apt-get install postgresql-14"
    echo "  sudo systemctl start postgresql"
    echo ""
    exit 1
else
    echo -e "${GREEN}✓ PostgreSQL已安装${NC}"
    psql --version
fi

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js未安装${NC}"
    echo "请先安装Node.js 16+: https://nodejs.org"
    exit 1
else
    echo -e "${GREEN}✓ Node.js已安装 ($(node -v))${NC}"
fi

# 检查.env文件
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env文件不存在${NC}"
    exit 1
else
    echo -e "${GREEN}✓ .env文件存在${NC}"
fi

echo ""

# ============================================
# 第二步：配置检查（最重要）
# ============================================
echo -e "${BLUE}第二步：配置检查（最重要）${NC}"
echo ""

source .env

# 检查ANTHROPIC_API_KEY
if [[ -z "$ANTHROPIC_API_KEY" || "$ANTHROPIC_API_KEY" == "sk-ant-api03-..." ]]; then
    echo -e "${RED}❌ ANTHROPIC_API_KEY未配置${NC}"
    echo ""
    echo "这个API key用于："
    echo "  1. 生成学生能力画像摘要（200字自然语言描述）"
    echo "  2. 启程老师翻译企业需求"
    echo ""
    echo "请在.env文件中配置："
    echo "  ANTHROPIC_API_KEY=sk-ant-..."
    echo ""
    exit 1
else
    echo -e "${GREEN}✓ ANTHROPIC_API_KEY已配置${NC}"
fi

# 检查EMBEDDING_API配置
if [[ -z "$EMBEDDING_API_URL" ]]; then
    echo -e "${YELLOW}⚠️  EMBEDDING_API_URL未配置${NC}"
    echo ""
    echo "这是最核心的配置！用于生成语义向量（理解'言外之意'）"
    echo ""
    echo "推荐方案："
    echo ""
    echo "1. 硅基流动（推荐，国内访问快）"
    echo "   - 注册：https://siliconflow.cn"
    echo "   - 成本：~¥0.0001/次"
    echo "   - 配置："
    echo "     EMBEDDING_API_URL=https://api.siliconflow.cn/v1/embeddings"
    echo "     EMBEDDING_API_KEY=sk-..."
    echo ""
    echo "2. 阿里云PAI"
    echo "   - 注册：https://pai.console.aliyun.com"
    echo "   - 成本：~¥0.0002/次"
    echo ""
    echo "3. Fallback模式（不推荐）"
    echo "   - 如果不配置，系统会降级到TF-IDF"
    echo "   - 只能字面匹配，无法理解'言外之意'"
    echo ""
    read -p "是否继续使用Fallback模式？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "请先配置EMBEDDING_API后再运行"
        exit 1
    fi
    echo -e "${YELLOW}⚠️  将使用Fallback模式（TF-IDF）${NC}"
else
    echo -e "${GREEN}✓ EMBEDDING_API_URL已配置${NC}"
    echo "  URL: $EMBEDDING_API_URL"

    if [[ -z "$EMBEDDING_API_KEY" ]]; then
        echo -e "${YELLOW}⚠️  EMBEDDING_API_KEY未配置，将使用ANTHROPIC_API_KEY${NC}"
    else
        echo -e "${GREEN}✓ EMBEDDING_API_KEY已配置${NC}"
    fi
fi

echo ""

# ============================================
# 第三步：安装依赖
# ============================================
echo -e "${BLUE}第三步：安装依赖${NC}"
echo ""

if [ ! -d "node_modules" ]; then
    echo "正在安装依赖..."
    npm install
else
    echo -e "${GREEN}✓ 依赖已安装${NC}"
fi

# 检查axios是否安装（用于调用Embedding API）
if ! npm list axios &> /dev/null; then
    echo "安装axios（用于调用Embedding API）..."
    npm install axios
fi

echo ""

# ============================================
# 第四步：数据库迁移
# ============================================
echo -e "${BLUE}第四步：数据库迁移${NC}"
echo ""

echo "检查pgvector扩展..."
PGVECTOR_CHECK=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM pg_extension WHERE extname='vector';" 2>/dev/null || echo "0")

if [ "$PGVECTOR_CHECK" -eq "0" ]; then
    echo "正在安装pgvector扩展..."
    psql $DATABASE_URL -c "CREATE EXTENSION IF NOT EXISTS vector;" || {
        echo -e "${RED}错误: 无法安装pgvector扩展${NC}"
        echo ""
        echo "请手动安装pgvector："
        echo "  macOS: brew install pgvector"
        echo "  Ubuntu: sudo apt-get install postgresql-14-pgvector"
        echo ""
        echo "然后运行："
        echo "  psql $DATABASE_URL -c 'CREATE EXTENSION vector;'"
        exit 1
    }
fi
echo -e "${GREEN}✓ pgvector扩展已启用${NC}"

echo ""
echo "运行migration..."
psql $DATABASE_URL -f migrations/072_semantic_matching_system.sql || {
    echo -e "${YELLOW}警告: Migration可能已经运行过${NC}"
}

# 验证表结构
echo ""
echo "验证表结构..."
TABLE_CHECK=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='student_capabilities' AND column_name='profile_summary';" 2>/dev/null || echo "0")

if [ "$TABLE_CHECK" -eq "1" ]; then
    echo -e "${GREEN}✓ 表结构正确（包含profile_summary字段）${NC}"
else
    echo -e "${RED}❌ 表结构不正确，缺少profile_summary字段${NC}"
    exit 1
fi

echo ""

# ============================================
# 第五步：生成能力画像摘要
# ============================================
echo -e "${BLUE}第五步：生成能力画像摘要${NC}"
echo ""

echo "这是最核心的步骤："
echo "  1. 为每个学生生成200字自然语言描述"
echo "  2. 使用BGE模型生成1024维语义向量"
echo "  3. 这样才能理解'言外之意'"
echo ""

STUDENT_COUNT=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM users WHERE role='student';" 2>/dev/null || echo "0")
echo "当前有 $STUDENT_COUNT 个学生"

if [ "$STUDENT_COUNT" -gt "0" ]; then
    echo ""
    echo "预计耗时：约 $((STUDENT_COUNT * 3)) 秒"
    echo ""
    read -p "是否开始生成能力画像？(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm run init-vectors || {
            echo -e "${YELLOW}警告: 向量初始化失败，但系统仍可运行${NC}"
        }
    else
        echo "跳过向量初始化"
    fi
else
    echo -e "${YELLOW}⚠️  没有学生数据，跳过向量初始化${NC}"
fi

echo ""

# ============================================
# 第六步：验证配置
# ============================================
echo -e "${BLUE}第六步：验证配置${NC}"
echo ""

# 检查是否有学生画像摘要
SUMMARY_COUNT=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM student_capabilities WHERE profile_summary IS NOT NULL;" 2>/dev/null || echo "0")
echo "已生成能力画像摘要的学生数：$SUMMARY_COUNT"

# 检查是否有向量
VECTOR_COUNT=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM student_capabilities WHERE profile_vector IS NOT NULL;" 2>/dev/null || echo "0")
echo "已生成语义向量的学生数：$VECTOR_COUNT"

echo ""

# ============================================
# 完成
# ============================================
echo "=========================================="
echo -e "${GREEN}配置完成！${NC}"
echo "=========================================="
echo ""
echo "下一步："
echo ""
echo "1. 启动后端服务："
echo "   npm run dev"
echo ""
echo "2. 测试API："
echo "   ./test-matching-api.sh"
echo ""
echo "3. 查看文档："
echo "   cat ../SEMANTIC_MATCHING.md"
echo ""
echo "=========================================="
echo "核心价值："
echo "  理解'言外之意'"
echo "  学生：'喜欢把乱的东西理清楚'"
echo "  企业：'内部流程太乱想找人梳理'"
echo "  → 系统能识别这两句话在语义上高度接近"
echo "=========================================="
