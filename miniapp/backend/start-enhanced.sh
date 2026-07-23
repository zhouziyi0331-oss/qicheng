#!/bin/bash

# 启程OPC后端 - 快速启动脚本
# 用于快速启动完整的个性化动态系统

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   启程OPC后端 - 个性化动态系统${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# 检查 Node.js
echo -e "${YELLOW}◆ 检查 Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ 未安装 Node.js${NC}"
    echo "请访问 https://nodejs.org/ 安装 Node.js 18+"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js 已安装: ${NODE_VERSION}${NC}\n"

# 检查 npm
echo -e "${YELLOW}◆ 检查 npm...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ 未安装 npm${NC}"
    exit 1
fi
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✓ npm 已安装: v${NPM_VERSION}${NC}\n"

# 检查 MongoDB
echo -e "${YELLOW}◆ 检查 MongoDB...${NC}"
if ! command -v mongod &> /dev/null; then
    echo -e "${YELLOW}⚠ 未安装 MongoDB${NC}"
    echo "请访问 https://www.mongodb.com/try/download/community 安装 MongoDB"
    read -p "是否继续？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✓ MongoDB 已安装${NC}\n"
fi

# 检查 .env 文件
echo -e "${YELLOW}◆ 检查环境配置...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠ 未找到 .env 文件${NC}"
    if [ -f ".env.example" ]; then
        echo "正在从 .env.example 创建 .env..."
        cp .env.example .env
        echo -e "${GREEN}✓ .env 文件已创建${NC}"
        echo -e "${YELLOW}⚠ 请编辑 .env 文件，填入必要配置：${NC}"
        echo "  - OPENAI_API_KEY (必填)"
        echo "  - MONGODB_URI"
        echo "  - JWT_SECRET"
        read -p "是否现在编辑？(y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            ${EDITOR:-nano} .env
        fi
    else
        echo -e "${RED}✗ 未找到 .env.example${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ .env 文件已存在${NC}"
fi

# 检查必要的环境变量
source .env 2>/dev/null || true
if [ -z "$OPENAI_API_KEY" ]; then
    echo -e "${YELLOW}⚠ 警告: 未配置 OPENAI_API_KEY${NC}"
    echo "AI功能将无法使用"
fi
echo

# 检查依赖
echo -e "${YELLOW}◆ 检查依赖...${NC}"
if [ ! -d "node_modules" ]; then
    echo "正在安装依赖..."
    npm install
else
    echo -e "${GREEN}✓ 依赖已安装${NC}"
fi
echo

# 显示菜单
while true; do
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}请选择操作：${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo "  1) 开发模式启动 (热重载)"
    echo "  2) 生产模式启动"
    echo "  3) 生成测试数据（基础）"
    echo "  4) 生成测试数据（个性化系统）"
    echo "  5) 生成所有测试数据"
    echo "  6) 构建项目"
    echo "  7) 查看系统信息"
    echo "  8) 运行API测试"
    echo "  9) 退出"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    read -p "$(echo -e ${YELLOW}请输入选项 [1-9]: ${NC})" choice

    case $choice in
        1)
            echo -e "\n${GREEN}◆ 启动开发服务器...${NC}"
            npm run dev
            ;;
        2)
            echo -e "\n${GREEN}◆ 启动生产服务器...${NC}"
            if [ ! -d "dist" ]; then
                echo "正在构建项目..."
                npm run build
            fi
            npm start
            ;;
        3)
            echo -e "\n${GREEN}◆ 生成基础测试数据...${NC}"
            npm run seed
            echo -e "\n${GREEN}✓ 基础测试数据生成完成${NC}\n"
            ;;
        4)
            echo -e "\n${GREEN}◆ 生成个性化系统测试数据...${NC}"
            npm run seed:personalized
            echo -e "\n${GREEN}✓ 个性化系统测试数据生成完成${NC}\n"
            ;;
        5)
            echo -e "\n${GREEN}◆ 生成所有测试数据...${NC}"
            npm run seed:all
            echo -e "\n${GREEN}✓ 所有测试数据生成完成${NC}\n"
            ;;
        6)
            echo -e "\n${GREEN}◆ 构建项目...${NC}"
            npm run build
            echo -e "\n${GREEN}✓ 构建完成${NC}\n"
            ;;
        7)
            echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            echo -e "${GREEN}系统信息${NC}"
            echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            echo -e "Node.js: ${NODE_VERSION}"
            echo -e "npm: v${NPM_VERSION}"
            echo -e "项目目录: $(pwd)"
            if [ -f ".env" ]; then
                echo -e "环境配置: ${GREEN}✓ 已配置${NC}"
            else
                echo -e "环境配置: ${RED}✗ 未配置${NC}"
            fi
            if [ -d "node_modules" ]; then
                echo -e "依赖安装: ${GREEN}✓ 已安装${NC}"
            else
                echo -e "依赖安装: ${RED}✗ 未安装${NC}"
            fi
            if [ -d "dist" ]; then
                echo -e "构建状态: ${GREEN}✓ 已构建${NC}"
            else
                echo -e "构建状态: ${YELLOW}⚠ 未构建${NC}"
            fi
            echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
            ;;
        8)
            echo -e "\n${GREEN}◆ 运行API测试...${NC}"
            echo -e "${YELLOW}提示: 请先启动服务器（选项1或2）${NC}"
            echo -e "${YELLOW}详细测试指南请查看: API_TESTING.md${NC}\n"
            echo "基础健康检查:"
            curl -s http://localhost:3000/health | jq '.' 2>/dev/null || echo "服务器未运行或jq未安装"
            echo
            ;;
        9)
            echo -e "\n${GREEN}感谢使用启程OPC后端系统！${NC}\n"
            exit 0
            ;;
        *)
            echo -e "${RED}无效选项，请重新选择${NC}\n"
            ;;
    esac
done
