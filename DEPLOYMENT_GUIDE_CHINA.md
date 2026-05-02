# 启程平台 - 中国大陆部署方案

## 🎯 部署目标

将启程平台部署到中国大陆可访问的免费/低成本服务器，确保：
- ✅ 中国用户可以稳定访问
- ✅ 无需翻墙，速度快
- ✅ 成本可控（免费或低成本）
- ✅ 长期稳定运行

---

## 🌐 推荐部署方案

### 方案一：阿里云 / 腾讯云（推荐）

**优势**：
- ✅ 国内访问速度快
- ✅ 稳定性高
- ✅ 有免费试用额度
- ✅ 支持备案

**服务选择**：
1. **前端部署**：阿里云OSS + CDN（静态网站托管）
2. **后端部署**：阿里云ECS轻量应用服务器
3. **数据库**：阿里云RDS PostgreSQL（或自建）

**费用估算**：
- 轻量应用服务器：¥24/月起（1核2G）
- OSS存储：¥0.12/GB/月
- CDN流量：¥0.24/GB
- 首年可能有新用户优惠

---

### 方案二：Vercel + Railway（国际但可访问）

**优势**：
- ✅ 完全免费（有限额）
- ✅ 自动部署
- ✅ 中国大部分地区可访问（速度较慢）

**服务选择**：
1. **前端**：Vercel（免费）
2. **后端**：Railway（免费额度 $5/月）
3. **数据库**：Railway PostgreSQL（免费）

**限制**：
- Vercel在中国访问速度较慢
- Railway免费额度有限
- 不适合高流量应用

---

### 方案三：华为云 / 百度云

**优势**：
- ✅ 国内服务商
- ✅ 有免费试用
- ✅ 访问速度快

**服务选择**：
1. **前端**：华为云OBS + CDN
2. **后端**：华为云ECS
3. **数据库**：华为云RDS

---

## 📋 部署步骤（以阿里云为例）

### 第一步：准备工作

1. **注册阿里云账号**
   - 访问 https://www.aliyun.com
   - 完成实名认证（必需）

2. **购买服务器**
   - 选择"轻量应用服务器"
   - 配置：1核2G，40GB SSD
   - 系统：Ubuntu 22.04
   - 地域：选择离用户最近的（如华东、华北）

3. **域名准备**（可选但推荐）
   - 购买域名（.cn域名需要备案）
   - 完成ICP备案（约15-30天）

---

### 第二步：服务器配置

```bash
# 1. 连接服务器（使用阿里云控制台的Web终端）

# 2. 更新系统
sudo apt update && sudo apt upgrade -y

# 3. 安装Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 4. 安装PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# 5. 安装Nginx（反向代理）
sudo apt install -y nginx

# 6. 安装PM2（进程管理）
sudo npm install -g pm2

# 7. 安装Git
sudo apt install -y git
```

---

### 第三步：部署后端

```bash
# 1. 创建应用目录
sudo mkdir -p /var/www/qicheng
sudo chown -R $USER:$USER /var/www/qicheng
cd /var/www/qicheng

# 2. 克隆代码（或上传代码）
# 方式1：如果有Git仓库
git clone <你的仓库地址> .

# 方式2：手动上传
# 使用scp或阿里云控制台上传代码

# 3. 安装依赖
cd backend
npm install --production

# 4. 配置环境变量
cat > .env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://qicheng_user:your_password@localhost:5432/qicheng
JWT_SECRET=$(openssl rand -base64 32)
ADMIN_JWT_SECRET=$(openssl rand -base64 32)
EOF

# 5. 初始化数据库
sudo -u postgres psql << EOF
CREATE DATABASE qicheng;
CREATE USER qicheng_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE qicheng TO qicheng_user;
\c qicheng
GRANT ALL ON SCHEMA public TO qicheng_user;
EOF

# 6. 运行数据库迁移
npm run migrate

# 7. 使用PM2启动
pm2 start src/app.js --name qicheng-backend
pm2 save
pm2 startup
```

---

### 第四步：部署前端

```bash
# 1. 构建前端
cd /var/www/qicheng/frontend
npm install
npm run build

# 2. 配置Nginx
sudo nano /etc/nginx/sites-available/qicheng

# 添加以下配置：
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名或IP

    # 前端静态文件
    location / {
        root /var/www/qicheng/frontend/out;
        try_files $uri $uri.html $uri/ /index.html;
    }

    # 后端API代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# 3. 启用配置
sudo ln -s /etc/nginx/sites-available/qicheng /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 4. 配置防火墙
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
sudo ufw enable
```

---

### 第五步：配置HTTPS（可选但推荐）

```bash
# 1. 安装Certbot
sudo apt install -y certbot python3-certbot-nginx

# 2. 获取SSL证书
sudo certbot --nginx -d your-domain.com

# 3. 自动续期
sudo certbot renew --dry-run
```

---

## 🔧 配置文件修改

### 1. 前端API配置

修改 `frontend/.env.production`：

```env
NEXT_PUBLIC_API_URL=https://your-domain.com/api
```

### 2. 后端CORS配置

修改 `backend/src/app.js`：

```javascript
app.use(cors({
  origin: ['https://your-domain.com', 'http://your-domain.com'],
  credentials: true
}));
```

---

## 📱 小程序部署

### 微信小程序

1. **注册小程序账号**
   - 访问 https://mp.weixin.qq.com
   - 完成企业认证（需要营业执照）

2. **配置服务器域名**
   - 在小程序后台配置request合法域名
   - 必须是HTTPS域名
   - 必须备案

3. **修改API地址**

修改 `miniapp/src/services/api.ts`：

```typescript
const BASE_URL = 'https://your-domain.com/api/v1';
```

4. **上传代码**
   - 使用微信开发者工具
   - 上传代码并提交审核

---

## 💰 成本估算

### 方案一：阿里云（推荐）

**月度成本**：
- 轻量应用服务器（1核2G）：¥24/月
- 带宽（1Mbps）：包含在服务器费用中
- OSS存储（10GB）：¥1.2/月
- CDN流量（10GB）：¥2.4/月
- **总计：约¥30/月**

**年度成本**：
- 首年新用户优惠：约¥200-300/年
- 续费价格：约¥360/年

### 方案二：Vercel + Railway（免费）

**月度成本**：
- Vercel：免费
- Railway：免费（$5额度）
- **总计：¥0/月**

**限制**：
- 访问速度较慢
- 流量和计算资源有限
- 不适合生产环境

---

## 🚀 快速部署脚本

我可以为你创建一键部署脚本：

```bash
#!/bin/bash
# deploy.sh - 一键部署脚本

echo "🚀 启程平台部署脚本"
echo "===================="

# 检查环境
echo "📋 检查环境..."
command -v node >/dev/null 2>&1 || { echo "❌ 需要安装Node.js"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ 需要安装npm"; exit 1; }
command -v psql >/dev/null 2>&1 || { echo "❌ 需要安装PostgreSQL"; exit 1; }

# 安装依赖
echo "📦 安装依赖..."
cd backend && npm install
cd ../frontend && npm install

# 配置数据库
echo "🗄️ 配置数据库..."
# ... 数据库初始化脚本

# 运行迁移
echo "🔄 运行数据库迁移..."
cd ../backend && npm run migrate

# 构建前端
echo "🏗️ 构建前端..."
cd ../frontend && npm run build

# 启动服务
echo "🎉 启动服务..."
cd ../backend && pm2 start src/app.js --name qicheng-backend

echo "✅ 部署完成！"
echo "访问地址：http://your-server-ip"
```

---

## 📞 需要帮助？

如果你需要：
1. ✅ 我可以帮你创建完整的部署脚本
2. ✅ 我可以帮你配置Docker容器化部署
3. ✅ 我可以帮你优化服务器配置
4. ✅ 我可以帮你设置自动化部署（CI/CD）

请告诉我你选择哪个方案，我会提供详细的部署指导！

---

*最后更新时间: 2026-04-18*
