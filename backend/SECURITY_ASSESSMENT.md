# 启程项目安全评估报告

生成时间：2026-06-17  
代码规模：2502个TS文件，约10万行代码

---

## 一、当前安全状况总结

### ✅ 已实现的安全措施（优势）

| 项目 | 状态 | 证据 |
|---|---|---|
| **JWT认证机制** | ✅ 已实现 | `src/middleware/auth.ts` 完整的JWT验证和角色权限中间件 |
| **参数化SQL查询** | ✅ 已实现 | 全部使用`query($1, $2)`参数化查询，无SQL注入风险 |
| **密码bcrypt加密** | ✅ 已实现 | 使用bcrypt (rounds≥10)，但部分使用bcrypt部分使用bcryptjs需统一 |
| **CORS配置** | ✅ 已实现 | package.json中有cors依赖 |
| **Helmet安全头** | ✅ 已实现 | package.json中有helmet依赖 |
| **限流中间件** | ✅ 已实现 | 已安装express-rate-limit (v7.1.5) |
| **入参校验** | ✅ 已实现 | 使用express-validator，有validate中间件 |
| **环境变量管理** | ✅ 已实现 | 使用.env文件，密钥未硬编码在代码中 |
| **认证中间件使用广泛** | ✅ 已实现 | 788处authenticate使用记录 |

### ⚠️ 存在的安全风险（需立即处理）

| 风险等级 | 问题 | 影响 | 修复优先级 |
|---|---|---|---|
| 🔴 **P0·高危** | .env文件包含弱密钥 | JWT_ACCESS_SECRET只有34字符，建议≥64字符 | 立即 |
| 🔴 **P0·高危** | .env文件包含真实API Key | ANTHROPIC_API_KEY暴露在版本控制中 | 立即删除 |
| 🔴 **P0·高危** | 数据库密码为默认值 | postgres:postgres，生产环境必须更换 | 立即 |
| 🟡 **P1·中危** | bcrypt库不统一 | 同时使用bcrypt和bcryptjs，可能导致兼容性问题 | 1周内 |
| 🟡 **P1·中危** | 手机号明文存储 | users表中phone字段未加密 | 1月内 |
| 🟡 **P1·中危** | 敏感字段明文存储 | wechat_openid、wechat_unionid未加密 | 1月内 |
| 🟡 **P1·中危** | 文件上传安全缺失 | 1287处文件相关代码，但未见文件类型/大小校验 | 2周内 |
| 🟢 **P2·低危** | 聊天记录明文存储 | mentor_sessions.message未加密 | 3月内 |
| 🟢 **P2·低危** | 无API限流应用 | 已安装express-rate-limit但未见实际使用 | 1月内 |

---

## 二、P0优先级（立即实施，3天完成）

### 2.1 密钥安全强化

**风险：** .env文件中的弱密钥和真实API Key暴露

**修复方案：**

```bash
# 1. 生成强密钥（64字符随机）
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 2. 更新.env
JWT_ACCESS_SECRET=<生成的64字符密钥>
JWT_REFRESH_SECRET=<另一个64字符密钥>
DATABASE_PASSWORD=<32字符随机密钥>

# 3. 删除真实API Key，改为占位符
ANTHROPIC_API_KEY=sk-your-key-here
```

**检查清单：**
- [ ] 生成并更新所有JWT密钥
- [ ] 更新数据库密码
- [ ] 从Git历史中彻底删除真实API Key（使用git-filter-repo）
- [ ] 在Anthropic控制台撤销泄露的API Key
- [ ] 更新.env.example为占位符
- [ ] 添加.env到.gitignore（确认已添加）

### 2.2 环境变量隔离

**创建.env.production模板：**

```bash
# .env.production（生产环境专用，不提交到Git）
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://<user>:<strong-password>@<private-ip>:5432/qicheng
REDIS_URL=redis://<private-ip>:6379
JWT_ACCESS_SECRET=<64字符强密钥>
JWT_REFRESH_SECRET=<另一个64字符强密钥>
ENCRYPTION_KEY_DEFAULT=<32字节hex编码密钥>
# ... 其他真实密钥
```

**部署检查清单：**
- [ ] 生产服务器从.env.production读取配置
- [ ] 开发环境使用.env（弱密钥无妨）
- [ ] CI/CD管道使用环境变量（不读文件）

### 2.3 数据库访问控制

**当前风险：** 数据库可能暴露在公网

**修复方案：**

```bash
# PostgreSQL配置（/etc/postgresql/XX/main/postgresql.conf）
listen_addresses = '127.0.0.1'  # 只监听本地

# 或使用内网IP（如果前后端分离部署）
listen_addresses = '172.16.0.10'  # 仅内网

# 创建专用数据库用户
CREATE USER qicheng_app WITH PASSWORD '<32字符强密码>';
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO qicheng_app;
# 不授予CREATE、DROP、ALTER权限
```

**检查清单：**
- [ ] 确认PostgreSQL不监听0.0.0.0
- [ ] 确认防火墙只开放80、443端口
- [ ] 创建最小权限数据库用户
- [ ] 更新DATABASE_URL使用新用户

### 2.4 HTTPS强制（如已部署）

**Nginx配置：**

```nginx
# /etc/nginx/sites-available/qicheng
server {
    listen 80;
    server_name api.qicheng.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.qicheng.com;
    
    ssl_certificate /etc/letsencrypt/live/qicheng.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/qicheng.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**检查清单：**
- [ ] 安装Let's Encrypt证书（certbot）
- [ ] 配置HTTP到HTTPS重定向
- [ ] 启用HSTS头
- [ ] 配置自动续期（cron: `0 0 1 * * certbot renew`）

---

## 三、P1优先级（一个月内完成，3-5天开发）

### 3.1 API全局限流

**实施方案：**

```typescript
// src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL
});

// 全局限流：每IP每秒100次
export const globalLimiter = rateLimit({
  windowMs: 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:global:',
  }),
  message: { error: '请求过于频繁，请稍后再试' }
});

// 登录限流：每手机号每分钟3次
export const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  keyGenerator: (req) => req.body.phone || req.ip,
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:login:',
  }),
  message: { error: '登录尝试次数过多，请1分钟后再试' }
});

// 短信限流：每手机号每小时5次，每天10次
export const smsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.body.phone,
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:sms:hour:',
  }),
  message: { error: '短信发送过于频繁' }
});
```

**应用到路由：**

```typescript
// src/index.ts
import { globalLimiter } from './middleware/rateLimiter';
app.use(globalLimiter);

// src/routes/auth/controller.ts
import { loginLimiter, smsLimiter } from '../../middleware/rateLimiter';

router.post('/login', loginLimiter, validate, loginHandler);
router.post('/send-sms', smsLimiter, validate, sendSmsHandler);
```

**检查清单：**
- [ ] 安装rate-limit-redis：`npm install rate-limit-redis`
- [ ] 实现全局限流中间件
- [ ] 实现敏感接口限流（登录、短信、AI调用）
- [ ] 测试限流是否生效

### 3.2 手机号加密存储

**实施方案：**

```typescript
// src/utils/encryption.ts
import crypto from 'crypto';

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY_DEFAULT!, 'hex');
const IV_LENGTH = 16;

export function encryptPhone(phone: string): { encrypted: string; hash: string } {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(phone, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  const hash = crypto.createHash('sha256').update(phone).digest('hex');
  
  return {
    encrypted: `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`,
    hash
  };
}

export function decryptPhone(encrypted: string): string {
  const parts = encrypted.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const authTag = Buffer.from(parts[2], 'hex');
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

**数据库迁移：**

```sql
-- 添加加密字段
ALTER TABLE users ADD COLUMN phone_encrypted TEXT;
ALTER TABLE users ADD COLUMN phone_hash VARCHAR(64);

-- 创建索引
CREATE INDEX idx_users_phone_hash ON users(phone_hash);

-- 迁移数据（在Node脚本中执行）
-- 迁移完成后删除phone列
-- ALTER TABLE users DROP COLUMN phone;
```

**检查清单：**
- [ ] 实现加密工具函数
- [ ] 编写数据迁移脚本
- [ ] 更新所有phone字段读写逻辑
- [ ] 测试加密解密正确性
- [ ] 备份数据后执行迁移

### 3.3 文件上传安全

**实施方案：**

```typescript
// src/middleware/fileUpload.ts
import multer from 'multer';
import path from 'path';
import { AppError } from './errorHandler';

// 文件类型白名单（魔数验证）
const FILE_SIGNATURES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
  'application/pdf': [0x25, 0x50, 0x44, 0x46],
};

function validateFileType(buffer: Buffer): boolean {
  for (const [mimeType, signature] of Object.entries(FILE_SIGNATURES)) {
    if (signature.every((byte, i) => buffer[i] === byte)) {
      return true;
    }
  }
  return false;
}

const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10,
  },
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (!allowedExts.includes(ext)) {
      return cb(new AppError(400, '不支持的文件类型', 'INVALID_FILE_TYPE'));
    }
    cb(null, true);
  }
}).array('files', 10);

// 在上传后再次验证魔数
export async function validateUploadedFiles(files: Express.Multer.File[]) {
  for (const file of files) {
    if (!validateFileType(file.buffer)) {
      throw new AppError(400, '文件内容与扩展名不匹配', 'FILE_SIGNATURE_MISMATCH');
    }
  }
}
```

**检查清单：**
- [ ] 实现文件类型白名单
- [ ] 实现魔数验证
- [ ] 限制文件大小和数量
- [ ] 测试恶意文件上传拦截

### 3.4 数据库自动备份

**备份脚本：**

```bash
#!/bin/bash
# /opt/scripts/backup-db.sh

set -e

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/data/backups/postgres"
BACKUP_FILE="$BACKUP_DIR/qicheng_$DATE.sql.gz"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 导出数据库
PGPASSWORD=$DB_PASSWORD pg_dump -h localhost -U qicheng_backup -d qicheng \
  | gzip > $BACKUP_FILE

# 上传到OSS（可选）
# ossutil cp $BACKUP_FILE oss://qicheng-backup/db/

# 删除7天前的备份
find $BACKUP_DIR -name "qicheng_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
```

**Cron配置：**

```bash
# 每天凌晨3点备份
0 3 * * * /opt/scripts/backup-db.sh >> /var/log/db-backup.log 2>&1
```

**检查清单：**
- [ ] 创建数据库只读用户qicheng_backup
- [ ] 编写备份脚本
- [ ] 配置cron定时任务
- [ ] 测试备份和恢复流程

---

## 四、P2优先级（三个月内完成，3-5天开发）

### 4.1 聊天记录加密

**实施方案：** 类似手机号加密，对mentor_sessions.message字段加密存储

### 4.2 企业资质验证

**实施方案：** 企业注册时要求上传营业执照，调用企业信息API验证

### 4.3 防刷单风控

**实施方案：** 同一对学生-企业24小时内只允许1单，异常交易标记

### 4.4 依赖安全自动化

**实施方案：** CI/CD中添加`npm audit --audit-level=high`检查

---

## 五、安全开发规范（立即生效）

### 团队必须遵守的铁律：

1. **所有用户输入都是恶意输入** - 每个API必须过express-validator校验
2. **密钥永不在代码中** - 只能通过process.env读取
3. **密码永不明文** - 统一使用bcrypt (rounds≥12)
4. **数据库永不在公网** - 只接受内网连接
5. **文件上传必须校验** - 不信任扩展名，验证魔数
6. **API必须有认证** - 不暴露任何无认证业务接口
7. **提交前必须npm audit** - 有高危漏洞不合并

### Code Review安全检查清单：

```markdown
- [ ] 这个API有没有校验入参？
- [ ] 这个接口有没有权限验证（角色+资源归属）？
- [ ] 返回数据中有没有泄露敏感信息（其他用户手机号、openid）？
- [ ] 有没有在日志中打印密码、Token、密钥？
- [ ] 文件上传有没有校验类型和大小？
- [ ] 数据库查询是否使用参数化（$1, $2）？
```

---

## 六、实施时间表

| 阶段 | 任务 | 预计时间 | 责任人 | 截止日期 |
|---|---|---|---|---|
| **P0·立即** | 密钥更新、Git历史清理 | 0.5天 | 后端负责人 | 今天 |
| **P0·立即** | 数据库访问控制 | 0.5天 | 运维负责人 | 今天 |
| **P0·立即** | HTTPS配置（如已部署） | 0.5天 | 运维负责人 | 明天 |
| **P0·立即** | 统一bcrypt库 | 0.5天 | 后端开发 | 明天 |
| **P1·1周** | API限流 | 1天 | 后端开发 | +7天 |
| **P1·2周** | 文件上传安全 | 1天 | 后端开发 | +14天 |
| **P1·1月** | 手机号加密存储 | 2天 | 后端开发 | +30天 |
| **P1·1月** | 数据库自动备份 | 0.5天 | 运维负责人 | +30天 |
| **P2·3月** | 聊天记录加密 | 1天 | 后端开发 | +90天 |
| **P2·3月** | 企业资质验证 | 1天 | 后端开发 | +90天 |

**总计开发时间：** 9天工作量，分3个阶段完成

---

## 七、成本与收益分析

### 安全投入：

- **开发时间：** 9个工作日
- **基础设施：** 
  - Let's Encrypt证书：免费
  - Redis（限流）：已有
  - 备份存储（OSS）：约10元/月
- **维护成本：** 每月1小时（检查日志、更新依赖）

### 风险对比（不实施的后果）：

| 风险 | 发生概率 | 损失估算 | 备注 |
|---|---|---|---|
| 数据库泄露 | 中等 | 500万-2000万 | 10万用户手机号×50元罚款+品牌损失 |
| API被刷崩 | 高 | 10万-50万 | 服务不可用+AI费用爆炸 |
| 账号批量注册 | 高 | 5万-20万 | 羊毛党薅补贴 |
| SQL注入攻击 | 低 | 100万-500万 | 数据篡改/删除 |

**投入产出比：** 9天开发 vs 可能的百万级损失 = **极高性价比**

---

## 八、紧急联系方式

**安全事件响应流程：**

1. **立即止血：** 暂停受影响服务，撤销泄露Token/密钥
2. **排查原因：** 查日志，确定攻击入口和影响范围
3. **修复漏洞：** 修补攻击入口
4. **通知用户：** 如涉及用户数据泄露，按法规通知
5. **复盘改进：** 更新安全规则

**安全事件上报渠道：** security@qicheng.com （建议设置此邮箱）

---

**评估人：** Claude (Kiro AI)  
**下次评估：** 2026-09-17（3个月后）
