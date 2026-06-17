# P0安全修复清单（今天+明天完成）

**紧急程度：🔴 高危，必须立即处理**  
**预计时间：2天**  
**目标：封堵90%的严重安全漏洞**

---

## 今天必须完成（4小时）

### ✅ 任务1：生成并更新强密钥（30分钟）

**当前风险：** .env文件中的JWT密钥只有34字符，且包含真实API Key

**操作步骤：**

```bash
# 1. 生成3个64字符强密钥
node -e "console.log('JWT_ACCESS_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('DATABASE_PASSWORD=' + require('crypto').randomBytes(32).toString('base64'))"
```

**2. 更新.env文件：**

```bash
# 备份当前.env
cp .env .env.backup

# 编辑.env，替换以下内容：
JWT_ACCESS_SECRET=<刚才生成的64字符密钥1>
JWT_REFRESH_SECRET=<刚才生成的64字符密钥2>
DATABASE_URL=postgresql://postgres:<刚才生成的密码>@localhost:5432/qicheng

# 删除真实API Key（改为占位符）
ANTHROPIC_API_KEY=sk-your-anthropic-key-here
OPENAI_API_KEY=sk-your-openai-key-here
```

**3. 更新数据库密码：**

```bash
# 连接到PostgreSQL
psql -U postgres

# 执行SQL
ALTER USER postgres WITH PASSWORD '<刚才生成的密码>';
\q

# 重启数据库
sudo systemctl restart postgresql
# 或 macOS: brew services restart postgresql
```

**4. 重启应用测试：**

```bash
npm run dev
# 测试登录接口是否正常
```

**检查清单：**
- [ ] 生成了3个强密钥
- [ ] 更新了.env文件
- [ ] 删除了真实API Key
- [ ] 更新了数据库密码
- [ ] 重启应用验证正常

---

### ✅ 任务2：从Git历史中删除真实API Key（1小时）

**当前风险：** 真实的ANTHROPIC_API_KEY可能已经提交到Git历史中

**操作步骤：**

```bash
# 1. 检查Git历史中是否包含API Key
git log -S "sk-78d5f32890db34a7e8470a567991a3da" --oneline

# 2. 如果有记录，使用git-filter-repo删除（需先安装）
# macOS
brew install git-filter-repo

# 或 pip安装
pip3 install git-filter-repo

# 3. 创建敏感词列表
cat > /tmp/secrets.txt << EOF
sk-78d5f32890db34a7e8470a567991a3da
sk-ant-
EOF

# 4. 从Git历史中删除
git filter-repo --replace-text /tmp/secrets.txt --force

# 5. 强制推送（警告：会改写历史）
git push origin --force --all
git push origin --force --tags
```

**⚠️ 警告：** 这会改写Git历史，团队成员需要重新clone仓库

**6. 撤销泄露的API Key：**

登录 https://console.anthropic.com/settings/keys  
→ 找到泄露的Key  
→ 点击"Revoke"撤销  
→ 生成新的API Key

**检查清单：**
- [ ] 检查了Git历史
- [ ] 从历史中删除了敏感信息
- [ ] 在Anthropic控制台撤销了旧Key
- [ ] 生成了新Key并更新.env
- [ ] 通知团队成员重新clone

---

### ✅ 任务3：确认.env不会被提交（5分钟）

```bash
# 1. 检查.gitignore
cat .gitignore | grep ".env"

# 2. 如果没有，添加
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore

# 3. 从Git跟踪中移除（如果已被跟踪）
git rm --cached .env
git commit -m "Remove .env from git tracking"
git push

# 4. 验证状态
git status  # 应该看不到.env
```

**检查清单：**
- [ ] .gitignore包含.env
- [ ] .env不在git status中
- [ ] 提交了.gitignore更改

---

### ✅ 任务4：统一bcrypt库（30分钟）

**当前风险：** 代码中同时使用bcrypt和bcryptjs，可能导致密码验证失败

**操作步骤：**

```bash
# 1. 卸载bcryptjs
npm uninstall bcryptjs
npm uninstall @types/bcryptjs

# 2. 确保安装了bcrypt
npm install bcrypt
npm install -D @types/bcrypt

# 3. 全局替换导入
# 在VSCode中：Ctrl+Shift+H（全局查找替换）
# 查找：from 'bcryptjs'
# 替换为：from 'bcrypt'
```

**手动修改文件：**

```typescript
// src/routes/auth/controller.ts
- import bcrypt from 'bcryptjs';
+ import bcrypt from 'bcrypt';

// src/routes/admin/authController.ts
- import bcrypt from 'bcryptjs';
+ import bcrypt from 'bcrypt';

// 确保所有bcrypt使用rounds≥12
- const hash = await bcrypt.hash(password, 10);
+ const hash = await bcrypt.hash(password, 12);
```

**4. 测试：**

```bash
npm run build
npm test  # 如果有测试的话

# 手动测试登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800000000","password":"test123"}'
```

**检查清单：**
- [ ] 卸载了bcryptjs
- [ ] 全局替换了import
- [ ] 所有bcrypt.hash使用rounds≥12
- [ ] 编译通过
- [ ] 登录功能正常

---

### ✅ 任务5：确认数据库不暴露公网（30分钟）

**当前风险：** PostgreSQL可能监听了0.0.0.0，暴露在公网

**操作步骤：**

```bash
# 1. 检查PostgreSQL监听地址
# Linux
sudo cat /etc/postgresql/*/main/postgresql.conf | grep listen_addresses

# macOS（Homebrew安装）
cat /opt/homebrew/var/postgresql@14/postgresql.conf | grep listen_addresses

# 2. 应该看到：
# listen_addresses = 'localhost'  # 正确
# listen_addresses = '*'          # 错误！需要修改

# 3. 如果是'*'，修改为'localhost'
# 编辑配置文件
sudo nano /etc/postgresql/*/main/postgresql.conf
# 或
nano /opt/homebrew/var/postgresql@14/postgresql.conf

# 修改为：
listen_addresses = 'localhost'

# 4. 重启PostgreSQL
sudo systemctl restart postgresql
# 或 macOS:
brew services restart postgresql@14

# 5. 验证
netstat -an | grep 5432
# 应该看到：
# tcp4       0      0  127.0.0.1.5432         *.*                    LISTEN
# 而不是：
# tcp4       0      0  *.5432                 *.*                    LISTEN
```

**检查清单：**
- [ ] PostgreSQL只监听127.0.0.1或localhost
- [ ] 重启了PostgreSQL
- [ ] netstat确认只有本地监听
- [ ] 应用仍能正常连接数据库

---

### ✅ 任务6：检查服务器防火墙（如已部署）（30分钟）

**操作步骤：**

```bash
# 1. 检查当前开放端口
sudo ufw status
# 或
sudo iptables -L -n

# 2. 应该只开放：
# 22 (SSH, 可选改为其他端口)
# 80 (HTTP)
# 443 (HTTPS)

# 3. 如果开放了3000、5432、6379等端口，关闭它们：
sudo ufw deny 3000
sudo ufw deny 5432
sudo ufw deny 6379

# 4. 确认规则
sudo ufw status verbose
```

**检查清单：**
- [ ] 只开放了22、80、443端口
- [ ] 3000、5432、6379等端口已关闭
- [ ] 应用通过Nginx反向代理（而非直接暴露3000）

---

### ✅ 任务7：配置SSH安全（如已部署）（30分钟）

**操作步骤：**

```bash
# 1. 编辑SSH配置
sudo nano /etc/ssh/sshd_config

# 2. 修改以下配置：
PermitRootLogin no                    # 禁止root直接登录
PasswordAuthentication no             # 禁用密码登录
PubkeyAuthentication yes              # 启用密钥登录
Port 2222                             # 改为非默认端口（可选）

# 3. 重启SSH
sudo systemctl restart sshd

# 4. 在断开当前SSH前，新开一个终端测试：
ssh -p 2222 user@server
```

**⚠️ 警告：** 在修改SSH配置前，确保你已经配置了SSH密钥，否则会锁死自己！

**检查清单：**
- [ ] 禁用了root登录
- [ ] 禁用了密码认证
- [ ] 启用了密钥认证
- [ ] 测试新SSH连接正常
- [ ] 保留一个旧SSH连接以防万一

---

## 明天完成（4小时）

### ✅ 任务8：启用HTTPS（如已部署）（1.5小时）

**操作步骤：**

```bash
# 1. 安装Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# 2. 获取证书
sudo certbot --nginx -d api.qicheng.com -d qicheng.com

# 3. 测试自动续期
sudo certbot renew --dry-run

# 4. 配置自动续期cron
sudo crontab -e
# 添加：
0 0 1 * * certbot renew --quiet

# 5. 验证HTTPS
curl -I https://api.qicheng.com
# 应该看到 HTTP/2 200
```

**Nginx配置（已在SECURITY_ASSESSMENT.md中）**

**检查清单：**
- [ ] 安装了Let's Encrypt证书
- [ ] HTTP自动跳转HTTPS
- [ ] HSTS头已配置
- [ ] 自动续期已配置
- [ ] 测试HTTPS访问正常

---

### ✅ 任务9：应用Helmet和CORS（1小时）

**当前状态：** 已安装helmet和cors，但可能未正确配置

**操作步骤：**

```typescript
// src/index.ts
import helmet from 'helmet';
import cors from 'cors';

// 1. 配置Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
}));

// 2. 配置CORS
const allowedOrigins = [
  'https://qicheng.com',
  'https://www.qicheng.com',
  'https://mp.weixin.qq.com',  // 微信小程序
];

if (process.env.NODE_ENV === 'development') {
  allowedOrigins.push('http://localhost:3000');
  allowedOrigins.push('http://localhost:8080');
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

**检查清单：**
- [ ] Helmet已配置
- [ ] CORS白名单已配置
- [ ] 开发环境允许localhost
- [ ] 生产环境只允许合法域名
- [ ] 测试跨域请求正常

---

### ✅ 任务10：添加全局限流（1小时）

**操作步骤：**

```bash
# 1. 安装依赖
npm install express-rate-limit rate-limit-redis
```

```typescript
// src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';

// 全局限流：每IP每秒100次
export const globalLimiter = rateLimit({
  windowMs: 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: '请求过于频繁，请稍后再试',
      code: 'RATE_LIMIT_EXCEEDED'
    });
  },
});

// 登录限流：每IP每分钟5次
export const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: '登录尝试次数过多，请1分钟后再试' },
});

// 短信限流：每IP每小时10次
export const smsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: '短信发送过于频繁' },
});
```

```typescript
// src/index.ts
import { globalLimiter } from './middleware/rateLimiter';

// 应用全局限流（在所有路由之前）
app.use('/api', globalLimiter);

// 应用到具体路由
import { loginLimiter, smsLimiter } from './middleware/rateLimiter';

app.post('/api/auth/login', loginLimiter, ...);
app.post('/api/auth/send-sms', smsLimiter, ...);
```

**检查清单：**
- [ ] 安装了限流依赖
- [ ] 实现了全局限流
- [ ] 实现了登录限流
- [ ] 实现了短信限流
- [ ] 测试限流是否生效（用curl快速请求）

---

### ✅ 任务11：添加安全响应头（30分钟）

```typescript
// src/index.ts

// 添加安全响应头中间件
app.use((_req, res, next) => {
  // 禁止浏览器MIME类型嗅探
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // 防止点击劫持
  res.setHeader('X-Frame-Options', 'DENY');
  
  // 启用XSS过滤
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // 限制Referrer信息泄露
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // 权限策略
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
});
```

**检查清单：**
- [ ] 添加了安全响应头
- [ ] 测试响应头存在（curl -I 或浏览器开发者工具）

---

## 完成后验证（30分钟）

### 安全检查清单：

```bash
# 1. 检查密钥强度
cat .env | grep SECRET
# 应该都是64字符以上的随机字符串

# 2. 检查Git状态
git status
# 不应该看到.env

# 3. 检查数据库连接
psql $DATABASE_URL -c "SELECT version();"
# 应该能连接

# 4. 检查应用启动
npm run dev
# 应该正常启动

# 5. 测试限流
for i in {1..110}; do curl -s http://localhost:3000/api/health > /dev/null; done
# 应该有部分请求返回429

# 6. 检查bcrypt统一
grep -r "bcryptjs" src/
# 应该没有结果

# 7. 测试登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800000000","password":"test123"}'
# 应该返回token或错误（不是500）
```

---

## 紧急回滚方案

**如果出现严重问题，立即回滚：**

```bash
# 1. 恢复.env
cp .env.backup .env

# 2. 重启应用
npm run dev

# 3. 如果数据库密码改了导致连不上：
psql -U postgres
ALTER USER postgres WITH PASSWORD 'postgres';
\q

# 4. 如果Git历史清理出错：
git reflog  # 查看历史
git reset --hard HEAD@{n}  # 回滚到某个点
```

---

## 完成标志

✅ 所有11个任务都打勾  
✅ 验证清单全部通过  
✅ 应用正常运行  
✅ 团队成员已通知（Git历史改写、新密钥）

**预期效果：** 封堵了90%的严重安全漏洞，可以安心睡觉了。

---

**下一步：** 进入P1优先级（一个月内完成），见SECURITY_ASSESSMENT.md第三部分。
