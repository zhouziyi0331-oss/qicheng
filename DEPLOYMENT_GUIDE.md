# 启程平台 - 完整部署指南

**版本**: v1.0  
**更新日期**: 2026-05-27  
**适用环境**: 生产环境

---

## 📋 部署前准备

### 1. 服务器要求

**后端服务器**：
- CPU: 4核心以上
- 内存: 8GB以上
- 硬盘: 100GB以上
- 操作系统: Ubuntu 20.04 LTS 或更高

**数据库服务器**：
- PostgreSQL 14+ with pgvector extension
- 内存: 8GB以上
- 硬盘: 200GB以上（SSD推荐）

**Redis服务器**：
- Redis 6.0+
- 内存: 4GB以上

### 2. 域名和SSL证书

- 主域名: `qicheng.com`
- API域名: `api.qicheng.com`
- 管理端域名: `admin.qicheng.com`
- SSL证书（Let's Encrypt或商业证书）

### 3. 第三方服务

- ✅ Claude API密钥（Anthropic）
- ✅ BGE Embedding API密钥（硅基流动或阿里云PAI）
- ✅ 微信小程序AppID和AppSecret
- ✅ 阿里云OSS（文件存储）
- ✅ 短信服务（阿里云或腾讯云）
- ✅ 支付服务（微信支付）

---

## 🚀 部署步骤

### 第一步：数据库部署

#### 1.1 安装PostgreSQL 14+

```bash
# 添加PostgreSQL官方仓库
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# 安装PostgreSQL
sudo apt update
sudo apt install -y postgresql-14 postgresql-contrib-14

# 启动服务
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### 1.2 安装pgvector扩展

```bash
# 安装依赖
sudo apt install -y postgresql-server-dev-14 build-essential git

# 克隆pgvector
cd /tmp
git clone https://github.com/pgvector/pgvector.git
cd pgvector

# 编译安装
make
sudo make install

# 重启PostgreSQL
sudo systemctl restart postgresql
```

#### 1.3 创建数据库和用户

```bash
# 切换到postgres用户
sudo -u postgres psql

# 在psql中执行
CREATE DATABASE qicheng;
CREATE USER qicheng_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE qicheng TO qicheng_user;

# 启用pgvector扩展
\c qicheng
CREATE EXTENSION vector;

# 退出
\q
```

#### 1.4 执行数据库迁移

```bash
cd /path/to/qicheng/backend

# 按顺序执行迁移文件
psql -U qicheng_user -d qicheng -f migrations/073_add_profile_visibility_control.sql
psql -U qicheng_user -d qicheng -f migrations/074_add_three_strike_safety_net.sql
psql -U qicheng_user -d qicheng -f migrations/075_add_team_and_community_system.sql
psql -U qicheng_user -d qicheng -f migrations/076_supplement_community_posts.sql
psql -U qicheng_user -d qicheng -f migrations/084_semantic_matching_system.sql

# 验证表是否创建成功
psql -U qicheng_user -d qicheng -c "\dt"
```

---

### 第二步：Redis部署

#### 2.1 安装Redis

```bash
# 安装Redis
sudo apt install -y redis-server

# 配置Redis
sudo nano /etc/redis/redis.conf

# 修改以下配置
# bind 127.0.0.1
# maxmemory 2gb
# maxmemory-policy allkeys-lru

# 重启Redis
sudo systemctl restart redis
sudo systemctl enable redis

# 验证
redis-cli ping
# 应该返回 PONG
```

---

### 第三步：后端服务部署

#### 3.1 安装Node.js

```bash
# 安装Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 验证
node --version
npm --version
```

#### 3.2 部署后端代码

```bash
# 克隆代码（或上传代码）
cd /opt
git clone https://github.com/your-org/qicheng.git
cd qicheng/backend

# 安装依赖
npm install --production

# 创建环境变量文件
cp .env.example .env
nano .env
```

#### 3.3 配置环境变量

```bash
# .env 文件内容
NODE_ENV=production
PORT=3000

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=qicheng
DB_USER=qicheng_user
DB_PASSWORD=your_secure_password

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT配置
JWT_SECRET=your_jwt_secret_key_at_least_32_characters
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# AI服务配置
ANTHROPIC_API_KEY=your_anthropic_api_key
EMBEDDING_API_URL=https://api.siliconflow.cn/v1/embeddings
EMBEDDING_API_KEY=your_embedding_api_key

# 微信小程序配置
WECHAT_APPID=your_wechat_appid
WECHAT_SECRET=your_wechat_secret

# OSS配置
OSS_REGION=oss-cn-hangzhou
OSS_BUCKET=qicheng-files
OSS_ACCESS_KEY_ID=your_oss_access_key
OSS_ACCESS_KEY_SECRET=your_oss_secret

# 短信配置
SMS_ACCESS_KEY_ID=your_sms_access_key
SMS_ACCESS_KEY_SECRET=your_sms_secret
SMS_SIGN_NAME=启程平台
SMS_TEMPLATE_CODE=SMS_123456789

# 支付配置
WECHAT_PAY_MCHID=your_mch_id
WECHAT_PAY_SERIAL_NO=your_serial_no
WECHAT_PAY_PRIVATE_KEY_PATH=/path/to/private_key.pem
WECHAT_PAY_API_V3_KEY=your_api_v3_key
```

#### 3.4 构建和启动

```bash
# 构建TypeScript
npm run build

# 使用PM2管理进程
sudo npm install -g pm2

# 启动服务
pm2 start dist/app.js --name qicheng-backend -i max

# 设置开机自启
pm2 startup
pm2 save

# 查看日志
pm2 logs qicheng-backend
```

#### 3.5 配置Nginx反向代理

```bash
# 安装Nginx
sudo apt install -y nginx

# 创建配置文件
sudo nano /etc/nginx/sites-available/qicheng-api
```

```nginx
# Nginx配置
server {
    listen 80;
    server_name api.qicheng.com;

    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.qicheng.com;

    # SSL证书
    ssl_certificate /etc/letsencrypt/live/api.qicheng.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.qicheng.com/privkey.pem;

    # SSL配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # 日志
    access_log /var/log/nginx/qicheng-api-access.log;
    error_log /var/log/nginx/qicheng-api-error.log;

    # 反向代理
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 文件上传大小限制
    client_max_body_size 50M;
}
```

```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/qicheng-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### 第四步：初始化数据

#### 4.1 初始化学生能力画像

```bash
cd /opt/qicheng/backend

# 运行初始化脚本
npm run init-student-capabilities

# 或者直接运行
node dist/scripts/initializeStudentCapabilities.js
```

#### 4.2 创建管理员账号

```bash
# 连接数据库
psql -U qicheng_user -d qicheng

# 创建管理员
INSERT INTO users (id, role, phone, password_hash, nickname, created_at)
VALUES (
  gen_random_uuid(),
  'admin',
  '13800000000',
  '$2b$10$your_hashed_password',  -- 使用bcrypt加密
  '超级管理员',
  NOW()
);
```

#### 4.3 初始化等级配置

```bash
# 执行SQL
psql -U qicheng_user -d qicheng << EOF
INSERT INTO level_configs (level, name, permissions, benefits) VALUES
(0, '新手', '{"canBrowseProjects": true}', '{"platformFeeRate": 0.20}'),
(1, '学徒', '{"canBrowseProjects": true, "canAcceptTasks": true}', '{"platformFeeRate": 0.18}'),
(2, '熟手', '{"canBrowseProjects": true, "canAcceptTasks": true}', '{"platformFeeRate": 0.15}'),
(3, '能手', '{"canBrowseProjects": true, "canAcceptTasks": true}', '{"platformFeeRate": 0.12}'),
(4, '高手', '{"canBrowseProjects": true, "canAcceptTasks": true, "canAccessCommunity": true}', '{"platformFeeRate": 0.10}'),
(5, '专家', '{"canBrowseProjects": true, "canAcceptTasks": true, "canAccessCommunity": true, "canApplyTeam": true, "canApplyMaster": true}', '{"platformFeeRate": 0.08}'),
(6, '大师', '{"canBrowseProjects": true, "canAcceptTasks": true, "canAccessCommunity": true, "canApplyTeam": true, "canCreateTeam": true, "canPostCommunity": true, "canApplyMaster": true}', '{"platformFeeRate": 0.05}');
EOF
```

---

### 第五步：小程序部署

#### 5.1 学生端小程序

```bash
cd /opt/qicheng/miniapp

# 安装依赖
npm install

# 配置环境变量
nano src/config/index.ts
```

```typescript
// src/config/index.ts
export default {
  API_BASE_URL: 'https://api.qicheng.com',
  WECHAT_APPID: 'your_wechat_appid',
  // 其他配置
}
```

```bash
# 构建
npm run build:weapp

# 上传到微信小程序后台
# 使用微信开发者工具打开 dist 目录
# 点击"上传"按钮
```

#### 5.2 企业端小程序

```bash
cd /opt/qicheng/company-miniapp

# 安装依赖
npm install

# 配置环境变量
nano src/config/index.ts

# 构建
npm run build:weapp

# 上传到微信小程序后台
```

---

### 第六步：管理端部署

#### 6.1 构建管理端

```bash
cd /opt/qicheng/frontend

# 安装依赖
npm install

# 配置环境变量
nano .env.production
```

```bash
# .env.production
NEXT_PUBLIC_API_URL=https://api.qicheng.com
NEXT_PUBLIC_WS_URL=wss://api.qicheng.com
```

```bash
# 构建
npm run build

# 使用PM2启动
pm2 start npm --name qicheng-admin -- start

# 或者使用standalone模式
pm2 start node --name qicheng-admin -- .next/standalone/server.js
```

#### 6.2 配置Nginx

```bash
sudo nano /etc/nginx/sites-available/qicheng-admin
```

```nginx
server {
    listen 80;
    server_name admin.qicheng.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name admin.qicheng.com;

    ssl_certificate /etc/letsencrypt/live/admin.qicheng.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.qicheng.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/qicheng-admin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔍 部署验证

### 1. 后端API验证

```bash
# 健康检查
curl https://api.qicheng.com/health

# 应该返回
# {"status":"ok","timestamp":"2026-05-27T..."}

# 测试认证接口
curl -X POST https://api.qicheng.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800000000","password":"your_password"}'
```

### 2. 数据库验证

```bash
# 检查表数量
psql -U qicheng_user -d qicheng -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"

# 应该返回 28 或更多

# 检查向量扩展
psql -U qicheng_user -d qicheng -c "SELECT * FROM pg_extension WHERE extname = 'vector';"
```

### 3. Redis验证

```bash
# 检查Redis连接
redis-cli ping

# 检查队列
redis-cli KEYS "mentor:queue:*"
```

### 4. 小程序验证

- 使用微信开发者工具打开小程序
- 测试登录功能
- 测试OPC测试功能
- 测试项目浏览功能

### 5. 管理端验证

- 访问 https://admin.qicheng.com
- 使用管理员账号登录
- 检查数据看板是否正常显示

---

## 📊 监控和日志

### 1. 配置日志

```bash
# PM2日志
pm2 logs qicheng-backend --lines 100

# Nginx日志
tail -f /var/log/nginx/qicheng-api-access.log
tail -f /var/log/nginx/qicheng-api-error.log

# PostgreSQL日志
tail -f /var/log/postgresql/postgresql-14-main.log
```

### 2. 配置监控

```bash
# 安装PM2监控
pm2 install pm2-server-monit

# 查看监控
pm2 monit
```

### 3. 配置告警

```bash
# 创建告警脚本
nano /opt/qicheng/scripts/alert.sh
```

```bash
#!/bin/bash
# 检查服务状态
if ! pm2 list | grep -q "qicheng-backend.*online"; then
    # 发送告警（邮件/短信/钉钉等）
    echo "Backend service is down!" | mail -s "Alert" admin@qicheng.com
fi
```

```bash
# 添加到crontab
crontab -e
# 每5分钟检查一次
*/5 * * * * /opt/qicheng/scripts/alert.sh
```

---

## 🔒 安全加固

### 1. 防火墙配置

```bash
# 安装UFW
sudo apt install -y ufw

# 配置规则
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# 启用防火墙
sudo ufw enable
```

### 2. 数据库安全

```bash
# 修改PostgreSQL配置
sudo nano /etc/postgresql/14/main/pg_hba.conf

# 只允许本地连接
# local   all             all                                     peer
# host    all             all             127.0.0.1/32            md5

# 重启PostgreSQL
sudo systemctl restart postgresql
```

### 3. 定期备份

```bash
# 创建备份脚本
nano /opt/qicheng/scripts/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/backup/qicheng"
DATE=$(date +%Y%m%d_%H%M%S)

# 备份数据库
pg_dump -U qicheng_user qicheng | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# 备份文件（如果有）
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /path/to/uploads

# 删除7天前的备份
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
# 添加到crontab
crontab -e
# 每天凌晨2点备份
0 2 * * * /opt/qicheng/scripts/backup.sh
```

---

## 🎉 部署完成

部署完成后，启程平台应该可以正常访问：

- ✅ 学生端小程序：微信搜索"启程平台"
- ✅ 企业端小程序：微信搜索"启程平台企业版"
- ✅ 管理端：https://admin.qicheng.com
- ✅ API服务：https://api.qicheng.com

**预计部署时间**：4-6小时

**建议**：先在测试环境完整走一遍流程，确认无误后再部署到生产环境。

---

**文档版本**: v1.0  
**更新日期**: 2026-05-27  
**维护人**: 运维团队
