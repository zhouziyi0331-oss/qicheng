#!/bin/bash

# ============================================
# 启程平台 - 阿里云轻量服务器一键部署脚本
# ============================================

set -e  # 遇到错误立即退出

echo "🚀 启程平台部署脚本"
echo "===================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ 请使用root权限运行此脚本${NC}"
    echo "使用命令: sudo bash deploy.sh"
    exit 1
fi

echo -e "${GREEN}✅ 权限检查通过${NC}"
echo ""

# ============================================
# 第一步：更新系统
# ============================================
echo "📦 第一步：更新系统..."
apt update && apt upgrade -y
echo -e "${GREEN}✅ 系统更新完成${NC}"
echo ""

# ============================================
# 第二步：安装Node.js 20
# ============================================
echo "📦 第二步：安装Node.js 20..."
if command -v node &> /dev/null; then
    echo "Node.js 已安装，版本: $(node -v)"
else
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    echo -e "${GREEN}✅ Node.js 安装完成，版本: $(node -v)${NC}"
fi
echo ""

# ============================================
# 第三步：安装PostgreSQL
# ============================================
echo "🗄️ 第三步：安装PostgreSQL..."
if command -v psql &> /dev/null; then
    echo "PostgreSQL 已安装"
else
    apt install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
    echo -e "${GREEN}✅ PostgreSQL 安装完成${NC}"
fi
echo ""

# ============================================
# 第四步：安装Nginx
# ============================================
echo "🌐 第四步：安装Nginx..."
if command -v nginx &> /dev/null; then
    echo "Nginx 已安装"
else
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
    echo -e "${GREEN}✅ Nginx 安装完成${NC}"
fi
echo ""

# ============================================
# 第五步：安装PM2
# ============================================
echo "⚙️ 第五步：安装PM2..."
if command -v pm2 &> /dev/null; then
    echo "PM2 已安装"
else
    npm install -g pm2
    echo -e "${GREEN}✅ PM2 安装完成${NC}"
fi
echo ""

# ============================================
# 第六步：创建数据库
# ============================================
echo "🗄️ 第六步：配置数据库..."

# 生成随机密码
DB_PASSWORD=$(openssl rand -base64 16)
JWT_SECRET=$(openssl rand -base64 32)
ADMIN_JWT_SECRET=$(openssl rand -base64 32)

# 创建数据库和用户
sudo -u postgres psql << EOF
-- 删除已存在的数据库和用户（如果有）
DROP DATABASE IF EXISTS qicheng;
DROP USER IF EXISTS qicheng_user;

-- 创建新数据库和用户
CREATE DATABASE qicheng;
CREATE USER qicheng_user WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE qicheng TO qicheng_user;

-- 连接到数据库并授权
\c qicheng
GRANT ALL ON SCHEMA public TO qicheng_user;
ALTER DATABASE qicheng OWNER TO qicheng_user;
EOF

echo -e "${GREEN}✅ 数据库创建完成${NC}"
echo -e "${YELLOW}数据库密码: $DB_PASSWORD${NC}"
echo ""

# ============================================
# 第七步：创建应用目录
# ============================================
echo "📁 第七步：创建应用目录..."
mkdir -p /var/www/qicheng
cd /var/www/qicheng

echo -e "${GREEN}✅ 应用目录创建完成${NC}"
echo ""

# ============================================
# 第八步：提示用户上传代码
# ============================================
echo "📤 第八步：上传代码"
echo "=========================================="
echo -e "${YELLOW}请按以下步骤上传代码：${NC}"
echo ""
echo "方式一：使用scp命令（在你的本地电脑上执行）"
echo "  cd /Users/alwan/code/qicheng"
echo "  tar -czf qicheng.tar.gz backend frontend miniapp"
echo "  scp qicheng.tar.gz root@你的服务器IP:/var/www/qicheng/"
echo ""
echo "方式二：使用阿里云控制台上传"
echo "  1. 登录阿里云控制台"
echo "  2. 进入轻量应用服务器"
echo "  3. 使用文件传输功能上传代码"
echo ""
echo "方式三：使用Git（如果代码在GitHub/Gitee）"
echo "  git clone <你的仓库地址> /var/www/qicheng"
echo ""
echo -e "${RED}上传完成后，请按回车继续...${NC}"
read -p ""

# ============================================
# 第九步：检查代码是否存在
# ============================================
echo "🔍 第九步：检查代码..."
if [ ! -d "/var/www/qicheng/backend" ]; then
    echo -e "${RED}❌ 未找到backend目录，请先上传代码${NC}"
    exit 1
fi

if [ ! -d "/var/www/qicheng/frontend" ]; then
    echo -e "${RED}❌ 未找到frontend目录，请先上传代码${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 代码检查通过${NC}"
echo ""

# ============================================
# 第十步：配置后端
# ============================================
echo "⚙️ 第十步：配置后端..."
cd /var/www/qicheng/backend

# 创建.env文件
cat > .env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://qicheng_user:$DB_PASSWORD@localhost:5432/qicheng
JWT_SECRET=$JWT_SECRET
ADMIN_JWT_SECRET=$ADMIN_JWT_SECRET
EOF

echo -e "${GREEN}✅ 后端配置完成${NC}"
echo ""

# ============================================
# 第十一步：安装后端依赖
# ============================================
echo "📦 第十一步：安装后端依赖..."
npm install --production
echo -e "${GREEN}✅ 后端依赖安装完成${NC}"
echo ""

# ============================================
# 第十二步：运行数据库迁移
# ============================================
echo "🔄 第十二步：运行数据库迁移..."
if [ -f "scripts/runMigrations.js" ]; then
    node scripts/runMigrations.js
    echo -e "${GREEN}✅ 数据库迁移完成${NC}"
else
    echo -e "${YELLOW}⚠️ 未找到迁移脚本，跳过${NC}"
fi
echo ""

# ============================================
# 第十三步：启动后端服务
# ============================================
echo "🚀 第十三步：启动后端服务..."
pm2 delete qicheng-backend 2>/dev/null || true
pm2 start src/app.js --name qicheng-backend
pm2 save
pm2 startup
echo -e "${GREEN}✅ 后端服务启动完成${NC}"
echo ""

# ============================================
# 第十四步：构建前端
# ============================================
echo "🏗️ 第十四步：构建前端..."
cd /var/www/qicheng/frontend

# 创建.env.production
cat > .env.production << EOF
NEXT_PUBLIC_API_URL=/api
EOF

npm install
npm run build
echo -e "${GREEN}✅ 前端构建完成${NC}"
echo ""

# ============================================
# 第十五步：配置Nginx
# ============================================
echo "🌐 第十五步：配置Nginx..."

# 获取服务器IP
SERVER_IP=$(curl -s ifconfig.me)

cat > /etc/nginx/sites-available/qicheng << EOF
server {
    listen 80;
    server_name $SERVER_IP;

    # 前端静态文件
    location / {
        root /var/www/qicheng/frontend/out;
        try_files \$uri \$uri.html \$uri/ /index.html;

        # 缓存静态资源
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }

    # 后端API代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 健康检查
    location /health {
        proxy_pass http://localhost:3000/health;
    }

    # 日志
    access_log /var/log/nginx/qicheng_access.log;
    error_log /var/log/nginx/qicheng_error.log;
}
EOF

# 启用配置
ln -sf /etc/nginx/sites-available/qicheng /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试配置
nginx -t

# 重启Nginx
systemctl restart nginx

echo -e "${GREEN}✅ Nginx配置完成${NC}"
echo ""

# ============================================
# 第十六步：配置防火墙
# ============================================
echo "🔒 第十六步：配置防火墙..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable
echo -e "${GREEN}✅ 防火墙配置完成${NC}"
echo ""

# ============================================
# 第十七步：创建管理员账号
# ============================================
echo "👤 第十七步：创建管理员账号..."
cd /var/www/qicheng/backend

if [ -f "scripts/createTestAdmin.js" ]; then
    node scripts/createTestAdmin.js
    echo -e "${GREEN}✅ 管理员账号创建完成${NC}"
    echo -e "${YELLOW}默认账号: admin${NC}"
    echo -e "${YELLOW}默认密码: admin123${NC}"
else
    echo -e "${YELLOW}⚠️ 未找到创建管理员脚本${NC}"
fi
echo ""

# ============================================
# 部署完成
# ============================================
echo ""
echo "=========================================="
echo -e "${GREEN}🎉 部署完成！${NC}"
echo "=========================================="
echo ""
echo "📋 部署信息："
echo "----------------------------------------"
echo "服务器IP: $SERVER_IP"
echo "管理后台: http://$SERVER_IP/admin"
echo "API地址: http://$SERVER_IP/api"
echo "健康检查: http://$SERVER_IP/health"
echo ""
echo "👤 管理员账号："
echo "用户名: admin"
echo "密码: admin123"
echo ""
echo "🗄️ 数据库信息："
echo "数据库名: qicheng"
echo "用户名: qicheng_user"
echo "密码: $DB_PASSWORD"
echo ""
echo "⚙️ 服务管理命令："
echo "查看后端日志: pm2 logs qicheng-backend"
echo "重启后端: pm2 restart qicheng-backend"
echo "停止后端: pm2 stop qicheng-backend"
echo "查看Nginx日志: tail -f /var/log/nginx/qicheng_error.log"
echo "重启Nginx: systemctl restart nginx"
echo ""
echo "=========================================="
echo ""

# 保存部署信息到文件
cat > /root/qicheng_deploy_info.txt << EOF
启程平台部署信息
==================

部署时间: $(date)
服务器IP: $SERVER_IP

访问地址:
- 管理后台: http://$SERVER_IP/admin
- API地址: http://$SERVER_IP/api
- 健康检查: http://$SERVER_IP/health

管理员账号:
- 用户名: admin
- 密码: admin123

数据库信息:
- 数据库名: qicheng
- 用户名: qicheng_user
- 密码: $DB_PASSWORD

JWT密钥:
- JWT_SECRET: $JWT_SECRET
- ADMIN_JWT_SECRET: $ADMIN_JWT_SECRET

服务管理:
- 查看后端日志: pm2 logs qicheng-backend
- 重启后端: pm2 restart qicheng-backend
- 停止后端: pm2 stop qicheng-backend
- 查看Nginx日志: tail -f /var/log/nginx/qicheng_error.log
- 重启Nginx: systemctl restart nginx
EOF

echo -e "${GREEN}✅ 部署信息已保存到: /root/qicheng_deploy_info.txt${NC}"
echo ""
echo -e "${YELLOW}⚠️ 重要提示：${NC}"
echo "1. 请立即修改管理员密码"
echo "2. 请妥善保管数据库密码"
echo "3. 建议配置域名和HTTPS证书"
echo "4. 定期备份数据库"
echo ""
