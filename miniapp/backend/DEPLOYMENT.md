# 启程OPC - 部署指南

## 📦 部署方案概览

### 方案一: 传统VPS部署（推荐新手）
适合：阿里云、腾讯云、AWS EC2等VPS服务器

### 方案二: Docker容器化部署（推荐）
适合：支持Docker的任何环境

### 方案三: Serverless部署
适合：腾讯云函数、AWS Lambda等

---

## 🚀 方案一：VPS部署（PM2）

### 1. 服务器要求
- OS: Ubuntu 20.04+ / CentOS 7+
- RAM: 至少2GB
- 磁盘: 至少20GB
- Node.js: 18.0+
- MongoDB: 5.0+

### 2. 安装依赖

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node -v
npm -v

# 安装MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# 启动MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# 安装PM2
sudo npm install -g pm2
```

### 3. 部署后端代码

```bash
# 创建应用目录
sudo mkdir -p /var/www/qicheng-backend
sudo chown -R $USER:$USER /var/www/qicheng-backend

# 上传代码（使用git或scp）
cd /var/www/qicheng-backend
git clone <你的仓库地址> .

# 或使用scp从本地上传
# scp -r ./backend/* user@server:/var/www/qicheng-backend/

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
nano .env  # 编辑配置
```

### 4. 配置.env

```env
NODE_ENV=production
PORT=3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/qicheng_opc

# OpenAI
OPENAI_API_KEY=sk-your-production-key
OPENAI_MODEL=gpt-4

# JWT
JWT_SECRET=your-strong-random-secret-key

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://servicewechat.com

# 微信支付（可选）
WECHAT_APP_ID=your-app-id
WECHAT_MCH_ID=your-merchant-id
WECHAT_API_KEY=your-api-key
```

### 5. 构建和启动

```bash
# 构建TypeScript
npm run build

# 使用PM2启动
pm2 start dist/index.js --name qicheng-backend

# 设置开机自启
pm2 startup
pm2 save

# 查看日志
pm2 logs qicheng-backend

# 其他PM2命令
pm2 list                 # 查看所有进程
pm2 restart qicheng-backend  # 重启
pm2 stop qicheng-backend     # 停止
pm2 delete qicheng-backend   # 删除
```

### 6. 配置Nginx反向代理

```bash
# 安装Nginx
sudo apt install -y nginx

# 创建配置文件
sudo nano /etc/nginx/sites-available/qicheng-backend
```

配置内容：

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/qicheng-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. 配置HTTPS（Let's Encrypt）

```bash
# 安装Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取SSL证书
sudo certbot --nginx -d api.yourdomain.com

# 自动续期测试
sudo certbot renew --dry-run
```

---

## 🐳 方案二：Docker部署

### 1. 安装Docker

```bash
# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

### 2. 配置环境变量

```bash
# 复制.env.example
cp .env.example .env

# 编辑生产环境配置
nano .env
```

### 3. 启动服务

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f backend

# 查看运行状态
docker-compose ps

# 停止服务
docker-compose down

# 重启服务
docker-compose restart
```

### 4. 初始化数据库

```bash
# 进入容器
docker-compose exec backend sh

# 运行seed脚本
npm run seed

# 退出容器
exit
```

---

## ☁️ 方案三：腾讯云Serverless部署

### 1. 安装Serverless CLI

```bash
npm install -g serverless
```

### 2. 创建serverless.yml

```yaml
component: express
name: qicheng-backend

inputs:
  src:
    src: ./
    exclude:
      - .env
      - node_modules/**
  region: ap-guangzhou
  runtime: Nodejs18.15
  apigatewayConf:
    protocols:
      - https
    environment: release
  functionConf:
    timeout: 30
    memorySize: 512
    environment:
      variables:
        NODE_ENV: production
        MONGODB_URI: ${env.MONGODB_URI}
        OPENAI_API_KEY: ${env.OPENAI_API_KEY}
        JWT_SECRET: ${env.JWT_SECRET}
```

### 3. 部署

```bash
# 登录腾讯云
serverless login

# 部署
serverless deploy
```

---

## 📊 生产环境监控

### 1. PM2监控

```bash
# 启用PM2 Plus监控
pm2 plus
```

### 2. 配置日志

编辑 `src/index.ts`，添加日志系统：

```typescript
import winston from 'winston'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
})
```

### 3. 接入Sentry错误追踪

```bash
npm install @sentry/node
```

```typescript
import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
})

app.use(Sentry.Handlers.requestHandler())
app.use(Sentry.Handlers.errorHandler())
```

---

## 🔒 安全加固

### 1. 防火墙配置

```bash
# 启用UFW
sudo ufw enable

# 允许SSH
sudo ufw allow 22/tcp

# 允许HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 查看状态
sudo ufw status
```

### 2. MongoDB安全配置

```bash
# 启用认证
sudo nano /etc/mongod.conf
```

```yaml
security:
  authorization: enabled
```

```bash
# 创建管理员用户
mongosh
use admin
db.createUser({
  user: "admin",
  pwd: "strong_password",
  roles: ["root"]
})
```

### 3. 环境变量加密

使用专门的密钥管理服务：
- 腾讯云：密钥管理系统（KMS）
- 阿里云：密钥管理服务
- AWS：Secrets Manager

---

## 🔄 CI/CD自动化部署

### GitHub Actions示例

创建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: |
        cd backend
        npm ci
    
    - name: Build
      run: |
        cd backend
        npm run build
    
    - name: Deploy to server
      uses: appleboy/scp-action@master
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        source: "backend/dist/*,backend/package.json"
        target: "/var/www/qicheng-backend"
    
    - name: Restart PM2
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /var/www/qicheng-backend/backend
          npm install --production
          pm2 restart qicheng-backend
```

---

## 📈 性能优化建议

1. **启用Redis缓存**
   - 缓存AI生成结果
   - 缓存项目列表查询

2. **CDN加速**
   - 静态资源使用CDN
   - API使用CDN边缘节点

3. **数据库优化**
   - 添加适当索引
   - 定期备份
   - 使用连接池

4. **负载均衡**
   - 使用Nginx负载均衡
   - 多实例部署

---

## 🆘 故障排查

### 查看日志
```bash
# PM2日志
pm2 logs qicheng-backend

# Nginx日志
sudo tail -f /var/log/nginx/error.log

# MongoDB日志
sudo tail -f /var/log/mongodb/mongod.log
```

### 常见问题

1. **502 Bad Gateway**: 检查后端服务是否启动
2. **MongoDB连接失败**: 检查MongoDB服务状态
3. **OpenAI超时**: 检查网络和API Key

---

## 📞 技术支持

部署过程中遇到问题，可以：
1. 查看日志文件
2. 检查环境配置
3. 验证依赖版本
