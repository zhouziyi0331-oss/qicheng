# 阿里云轻量服务器部署教程（超详细版）

## 📋 准备工作

### 你需要：
- ✅ 阿里云轻量服务器（已有）
- ✅ 本地电脑（Mac/Windows）
- ✅ 30分钟时间

---

## 🚀 部署步骤（共5步）

### 第一步：连接到服务器

#### 方式一：使用阿里云控制台（最简单）

1. **登录阿里云**
   - 打开浏览器，访问 https://www.aliyun.com
   - 点击右上角"控制台"登录

2. **进入轻量应用服务器**
   - 在控制台搜索"轻量应用服务器"
   - 点击进入你的服务器

3. **打开远程连接**
   - 点击"远程连接"按钮
   - 选择"Workbench远程连接"（推荐）
   - 输入root密码（如果忘记密码，点击"重置密码"）

4. **成功连接**
   - 看到黑色命令行界面就成功了
   - 显示类似：`root@iZxxxxxx:~#`

#### 方式二：使用本地终端（Mac用户）

```bash
# 在Mac终端执行
ssh root@你的服务器IP

# 输入密码后回车
```

---

### 第二步：上传代码到服务器

#### 方式一：使用阿里云控制台上传（最简单）

1. **打包代码**
   - 在Mac上打开终端
   - 执行以下命令：

```bash
cd /Users/alwan/code/qicheng
tar -czf qicheng.tar.gz backend frontend miniapp
```

2. **上传文件**
   - 在阿里云控制台，点击"文件传输"
   - 点击"上传文件"
   - 选择刚才打包的 `qicheng.tar.gz`
   - 上传到服务器的 `/root` 目录

3. **解压文件**
   - 在服务器终端执行：

```bash
cd /root
tar -xzf qicheng.tar.gz
```

#### 方式二：使用scp命令（Mac用户）

```bash
# 在Mac终端执行
cd /Users/alwan/code/qicheng
tar -czf qicheng.tar.gz backend frontend miniapp
scp qicheng.tar.gz root@你的服务器IP:/root/

# 然后在服务器上解压
ssh root@你的服务器IP
cd /root
tar -xzf qicheng.tar.gz
```

---

### 第三步：上传并运行部署脚本

1. **上传部署脚本**
   - 使用阿里云控制台"文件传输"功能
   - 上传 `/Users/alwan/code/qicheng/deploy.sh` 到服务器的 `/root` 目录

2. **给脚本添加执行权限**

```bash
chmod +x /root/deploy.sh
```

3. **运行部署脚本**

```bash
cd /root
sudo bash deploy.sh
```

4. **等待部署完成**
   - 脚本会自动安装所有依赖
   - 配置数据库
   - 启动服务
   - 大约需要5-10分钟

5. **中途会提示上传代码**
   - 如果你已经在第二步上传了代码，直接按回车继续
   - 如果还没上传，按照提示上传后再按回车

---

### 第四步：访问网站

部署完成后，你会看到类似这样的信息：

```
🎉 部署完成！
==========================================

服务器IP: 123.456.789.0
管理后台: http://123.456.789.0/admin
API地址: http://123.456.789.0/api
健康检查: http://123.456.789.0/health

👤 管理员账号：
用户名: admin
密码: admin123
```

1. **测试网站是否正常**
   - 打开浏览器
   - 访问 `http://你的服务器IP/health`
   - 如果看到 `{"status":"ok"}` 说明后端正常

2. **访问管理后台**
   - 访问 `http://你的服务器IP/admin`
   - 使用账号 `admin` 密码 `admin123` 登录

3. **修改管理员密码**
   - 登录后立即修改密码
   - 进入"系统管理" → "管理员管理"

---

### 第五步：配置域名（可选但推荐）

#### 如果你有域名：

1. **添加DNS解析**
   - 登录域名服务商（如阿里云）
   - 添加A记录：`@` 指向你的服务器IP
   - 添加A记录：`www` 指向你的服务器IP

2. **修改Nginx配置**

```bash
# 在服务器上执行
nano /etc/nginx/sites-available/qicheng

# 修改这一行：
server_name 你的域名.com www.你的域名.com;

# 保存后重启Nginx
systemctl restart nginx
```

3. **配置HTTPS（推荐）**

```bash
# 安装证书工具
apt install -y certbot python3-certbot-nginx

# 获取免费SSL证书
certbot --nginx -d 你的域名.com -d www.你的域名.com

# 按提示输入邮箱，同意协议
```

4. **访问网站**
   - 现在可以通过 `https://你的域名.com` 访问了

---

## 🔧 常用管理命令

### 查看服务状态

```bash
# 查看后端服务状态
pm2 status

# 查看后端日志
pm2 logs qicheng-backend

# 查看Nginx状态
systemctl status nginx

# 查看Nginx日志
tail -f /var/log/nginx/qicheng_error.log
```

### 重启服务

```bash
# 重启后端
pm2 restart qicheng-backend

# 重启Nginx
systemctl restart nginx

# 重启数据库
systemctl restart postgresql
```

### 更新代码

```bash
# 1. 上传新代码到服务器
# 2. 解压到 /var/www/qicheng

# 3. 重新安装依赖
cd /var/www/qicheng/backend
npm install --production

# 4. 运行数据库迁移（如果有新的）
node scripts/runMigrations.js

# 5. 重新构建前端
cd /var/www/qicheng/frontend
npm install
npm run build

# 6. 重启后端服务
pm2 restart qicheng-backend

# 7. 重启Nginx
systemctl restart nginx
```

---

## ❓ 常见问题

### 1. 无法访问网站

**检查防火墙**：
```bash
# 查看防火墙状态
ufw status

# 开放80端口
ufw allow 80/tcp

# 开放443端口（HTTPS）
ufw allow 443/tcp
```

**检查阿里云安全组**：
- 登录阿里云控制台
- 进入轻量应用服务器
- 点击"防火墙"
- 添加规则：允许80端口和443端口

### 2. 后端服务启动失败

**查看日志**：
```bash
pm2 logs qicheng-backend
```

**常见原因**：
- 数据库连接失败：检查 `/var/www/qicheng/backend/.env` 文件
- 端口被占用：`lsof -i :3000` 查看端口占用
- 依赖安装失败：重新运行 `npm install`

### 3. 前端页面空白

**检查构建**：
```bash
cd /var/www/qicheng/frontend
ls -la out/  # 检查是否有构建文件
```

**重新构建**：
```bash
cd /var/www/qicheng/frontend
rm -rf .next out
npm run build
systemctl restart nginx
```

### 4. 数据库连接失败

**检查数据库状态**：
```bash
systemctl status postgresql
```

**重启数据库**：
```bash
systemctl restart postgresql
```

**测试连接**：
```bash
sudo -u postgres psql -d qicheng -c "SELECT 1;"
```

---

## 📱 小程序配置

### 修改API地址

1. **编辑小程序配置**

```bash
# 在服务器上
nano /var/www/qicheng/miniapp/src/services/api.ts
```

2. **修改BASE_URL**

```typescript
const BASE_URL = 'http://你的服务器IP/api/v1';
// 或者使用域名
const BASE_URL = 'https://你的域名.com/api/v1';
```

3. **重新打包小程序**
   - 下载修改后的代码到本地
   - 使用微信开发者工具打开
   - 上传代码

---

## 🔒 安全建议

### 1. 修改默认密码

```bash
# 修改root密码
passwd

# 修改管理员密码（在网站后台修改）
```

### 2. 配置SSH密钥登录

```bash
# 在本地Mac生成密钥
ssh-keygen -t rsa -b 4096

# 上传公钥到服务器
ssh-copy-id root@你的服务器IP

# 禁用密码登录（可选）
nano /etc/ssh/sshd_config
# 修改：PasswordAuthentication no
systemctl restart sshd
```

### 3. 定期备份数据库

```bash
# 创建备份脚本
cat > /root/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
sudo -u postgres pg_dump qicheng > /root/backups/qicheng_$DATE.sql
# 保留最近7天的备份
find /root/backups -name "qicheng_*.sql" -mtime +7 -delete
EOF

chmod +x /root/backup.sh
mkdir -p /root/backups

# 添加定时任务（每天凌晨2点备份）
crontab -e
# 添加这一行：
0 2 * * * /root/backup.sh
```

---

## 📞 需要帮助？

如果遇到问题：

1. **查看部署信息**
```bash
cat /root/qicheng_deploy_info.txt
```

2. **查看日志**
```bash
pm2 logs qicheng-backend
tail -f /var/log/nginx/qicheng_error.log
```

3. **重新部署**
```bash
cd /root
sudo bash deploy.sh
```

---

## 🎉 完成！

现在你的网站已经部署成功了！

- ✅ 网站可以通过IP访问
- ✅ 管理后台可以登录
- ✅ 数据库正常运行
- ✅ 服务自动启动

下一步建议：
1. 配置域名
2. 配置HTTPS证书
3. 修改管理员密码
4. 定期备份数据

---

*最后更新时间: 2026-04-18*
