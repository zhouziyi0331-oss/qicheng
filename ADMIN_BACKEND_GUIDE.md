# 启程后台管理系统使用指南

## 系统概览

启程后台管理系统是基于 Next.js 16 构建的内部管理平台，用于管理学生、企业、任务、订单等核心业务。

### 系统信息
- **访问地址**: http://localhost:3001/admin
- **技术栈**: Next.js 16.2.2 + React + TypeScript
- **后端API**: http://localhost:3000/api/v1/admin/*
- **认证方式**: JWT Token (独立的 admin_users 表)

## 快速启动

### 1. 启动后端服务
```bash
cd /Users/alwan/code/qicheng/backend
npm run dev
# 运行在 http://localhost:3000
```

### 2. 启动前端服务
```bash
cd /Users/alwan/code/qicheng/frontend
npm run dev
# 运行在 http://localhost:3001
```

### 3. 访问后台管理系统
- 打开浏览器访问: http://localhost:3001/admin
- 登录账号:
  - 用户名: `admin`
  - 密码: `admin123`

## 管理员账号

### 超级管理员信息
```json
{
  "id": "c8dc9fb0-846f-40b1-a732-55b2a6208e92",
  "username": "admin",
  "realName": "系统管理员",
  "role": {
    "code": "super_admin",
    "name": "超级管理员",
    "permissions": ["*"]
  }
}
```

### 数据库表
- `admin_users`: 管理员账号表
- `admin_roles`: 管理员角色表
- `admin_permissions`: 权限配置表

## 功能模块

### 📊 数据看板 (/admin)
**功能**:
- 实时统计数据展示
- 用户增长趋势图
- 任务和订单统计
- 财务数据概览
- 待处理事项提醒

**API端点**:
- `GET /api/v1/admin/dashboard/stats` - 获取仪表盘统计数据

**当前数据**:
- 学生总数: 13人
- 企业总数: 1家
- 任务总数: 11个
- 今日新增学生: 1人

### 👨‍🎓 学生管理 (/admin/students)
**功能**:
- 学生列表查看（分页）
- 学生详情查看
- 等级和标签筛选
- 学生档案编辑
- 收益统计查看
- 任务完成情况

**API端点**:
- `GET /api/v1/admin/students` - 获取学生列表
- `GET /api/v1/admin/students/:id` - 获取学生详情
- `PUT /api/v1/admin/students/:id` - 更新学生信息
- `DELETE /api/v1/admin/students/:id` - 删除学生

**数据字段**:
```typescript
{
  id: string;
  nickname: string;
  phone: string;
  level_a: number;      // A轨道等级
  level_b: number;      // B轨道等级
  opc_label: string;    // OPC标签
  task_count: number;   // 完成任务数
  total_earnings: string; // 总收益
  created_at: string;
}
```

### 🏢 企业管理 (/admin/companies)
**功能**:
- 企业列表查看
- 企业认证审核
- 企业详情查看
- 发布任务统计
- 支付记录查看
- 黑名单管理

**API端点**:
- `GET /api/v1/admin/companies` - 获取企业列表
- `GET /api/v1/admin/companies/:id` - 获取企业详情
- `PUT /api/v1/admin/companies/:id/verify` - 审核企业认证
- `PUT /api/v1/admin/companies/:id/blacklist` - 加入/移除黑名单

**数据字段**:
```typescript
{
  id: string;
  company_name: string;
  industry: string;
  contact_name: string;
  contact_phone: string;
  verified_at: string;
  total_tasks_posted: number;
  total_paid: string;
  is_blacklisted: boolean;
}
```

### 📋 任务管理 (/admin/tasks)
**功能**:
- 任务列表查看
- 任务审核（发布前审核）
- 任务状态管理
- 任务详情查看
- 任务分配情况
- 任务完成进度

**API端点**:
- `GET /api/v1/admin/tasks` - 获取任务列表
- `GET /api/v1/admin/tasks/:id` - 获取任务详情
- `PUT /api/v1/admin/tasks/:id/review` - 审核任务
- `PUT /api/v1/admin/tasks/:id/status` - 更新任务状态

**任务状态**:
- `draft`: 草稿
- `pending_review`: 待审核
- `active`: 进行中
- `completed`: 已完成
- `cancelled`: 已取消

### 📦 订单管理 (/admin/orders)
**功能**:
- 订单列表查看
- 支付状态跟踪
- 退款处理
- 订单详情查看
- 异常订单处理

**API端点**:
- `GET /api/v1/admin/orders` - 获取订单列表
- `GET /api/v1/admin/orders/:id` - 获取订单详情
- `PUT /api/v1/admin/orders/:id/refund` - 处理退款

### 👨‍🏫 导师管理 (/admin/mentors)
**功能**:
- AI导师配置管理
- 导师会话记录查看
- Token使用统计
- 导师效果分析

**API端点**:
- `GET /api/v1/admin/mentors/sessions` - 获取会话列表
- `GET /api/v1/admin/mentors/stats` - 获取统计数据

### 🤖 AI引擎 (/admin/ai)
**功能**:
- AI导师系统配置
- Claude API密钥管理
- Token使用监控
- 对话质量分析
- 租户管理（SaaS化）

**API端点**:
- `GET /api/v1/admin/ai/config` - 获取AI配置
- `PUT /api/v1/admin/ai/config` - 更新AI配置
- `GET /api/v1/admin/ai/usage` - 获取使用统计

### 📝 内容管理 (/admin/content)
**功能**:
- 故事圈内容审核
- 敏感内容过滤
- 内容推荐管理
- 举报处理

### 💰 财务管理 (/admin/finance)
**功能**:
- 提现审核
- 资金流水查看
- 财务报表生成
- 收入统计分析

**API端点**:
- `GET /api/v1/admin/finance/withdrawals` - 获取提现列表
- `PUT /api/v1/admin/finance/withdrawals/:id/approve` - 审核提现
- `GET /api/v1/admin/finance/reports` - 获取财务报表

### 💬 客服工具 (/admin/support)
**功能**:
- 用户反馈查看
- 在线客服支持
- 问题工单管理
- FAQ管理

## API认证

### 登录流程
```bash
# 1. 登录获取Token
curl -X POST http://localhost:3000/api/v1/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'

# 响应
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "c8dc9fb0-846f-40b1-a732-55b2a6208e92",
    "username": "admin",
    "realName": "系统管理员",
    "role": "super_admin"
  }
}
```

### 使用Token访问API
```bash
# 2. 使用Token访问受保护的API
curl http://localhost:3000/api/v1/admin/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Token信息
- **有效期**: 8小时
- **存储位置**: localStorage (前端)
- **刷新机制**: 自动刷新（前端拦截器）
- **过期处理**: 自动跳转到登录页

## 前端配置

### API配置 (lib/api.ts)
```typescript
// 管理员API基础配置
const adminApi = {
  // 登录
  login: (username: string, password: string) => 
    axios.post('/api/v1/admin/auth/login', { username, password }),
  
  // 获取管理员信息
  me: () => 
    axios.get('/api/v1/admin/auth/me'),
  
  // 仪表盘统计
  dashboard: () => 
    axios.get('/api/v1/admin/dashboard/stats'),
  
  // 学生管理
  students: {
    list: (params) => axios.get('/api/v1/admin/students', { params }),
    get: (id) => axios.get(`/api/v1/admin/students/${id}`),
    update: (id, data) => axios.put(`/api/v1/admin/students/${id}`, data),
  },
  
  // 企业管理
  companies: {
    list: (params) => axios.get('/api/v1/admin/companies', { params }),
    get: (id) => axios.get(`/api/v1/admin/companies/${id}`),
    verify: (id) => axios.put(`/api/v1/admin/companies/${id}/verify`),
  }
};
```

### 请求拦截器
```typescript
// 自动添加Token
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 处理401未授权
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);
```

## 权限系统

### 角色定义
```sql
-- 超级管理员（全部权限）
INSERT INTO admin_roles (code, name, permissions) VALUES
('super_admin', '超级管理员', '["*"]');

-- 运营管理员（部分权限）
INSERT INTO admin_roles (code, name, permissions) VALUES
('operator', '运营管理员', '["students:read", "companies:read", "tasks:*"]');

-- 财务管理员（财务权限）
INSERT INTO admin_roles (code, name, permissions) VALUES
('finance', '财务管理员', '["orders:read", "finance:*"]');

-- 客服管理员（客服权限）
INSERT INTO admin_roles (code, name, permissions) VALUES
('support', '客服管理员', '["support:*", "students:read", "companies:read"]');
```

### 权限检查
```typescript
// 前端权限检查
const hasPermission = (permission: string) => {
  const user = useUserStore().user;
  if (user.role.permissions.includes('*')) return true;
  return user.role.permissions.includes(permission);
};

// 后端权限中间件
const requirePermission = (permission: string) => {
  return (req, res, next) => {
    const user = req.user;
    if (user.role.permissions.includes('*') || 
        user.role.permissions.includes(permission)) {
      next();
    } else {
      res.status(403).json({ error: 'Permission denied' });
    }
  };
};
```

## 测试脚本

### 完整功能测试
```bash
#!/bin/bash

# 1. 登录
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")

echo "Token: $TOKEN"

# 2. 测试仪表盘
echo -e "\n=== 仪表盘统计 ==="
curl -s http://localhost:3000/api/v1/admin/dashboard/stats \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# 3. 测试学生列表
echo -e "\n=== 学生列表 ==="
curl -s "http://localhost:3000/api/v1/admin/students?page=1&pageSize=5" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# 4. 测试企业列表
echo -e "\n=== 企业列表 ==="
curl -s http://localhost:3000/api/v1/admin/companies \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# 5. 测试任务列表
echo -e "\n=== 任务列表 ==="
curl -s http://localhost:3000/api/v1/admin/tasks \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

## 安全建议

### 生产环境配置

1. **修改默认密码**
```sql
-- 立即修改admin账号密码
UPDATE admin_users 
SET password_hash = '$2b$10$新的bcrypt_hash值'
WHERE username = 'admin';
```

2. **启用HTTPS**
```nginx
server {
  listen 443 ssl http2;
  server_name admin.qicheng.com;
  
  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;
  
  location / {
    proxy_pass http://localhost:3001;
  }
}
```

3. **IP白名单**
```nginx
# 只允许特定IP访问管理后台
location /admin {
  allow 192.168.1.0/24;  # 公司内网
  allow 10.0.0.0/8;      # VPN网段
  deny all;
  
  proxy_pass http://localhost:3001;
}
```

4. **启用操作日志**
```sql
-- 创建操作日志表
CREATE TABLE admin_operation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id VARCHAR(100),
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

5. **定期备份**
```bash
# 每日自动备份数据库
0 2 * * * pg_dump qicheng_db > /backup/qicheng_$(date +\%Y\%m\%d).sql
```

## 故障排查

### 前端无法访问
```bash
# 1. 检查前端服务
curl http://localhost:3001/admin

# 2. 检查进程
ps aux | grep "next dev"

# 3. 查看日志
cd /Users/alwan/code/qicheng/frontend
npm run dev
```

### 后端API错误
```bash
# 1. 检查后端服务
curl http://localhost:3000/api/v1/health

# 2. 检查数据库连接
psql -U postgres -d qicheng_db -c "SELECT 1"

# 3. 查看后端日志
cd /Users/alwan/code/qicheng/backend
tail -f logs/app.log
```

### 登录失败
```bash
# 1. 检查管理员账号
psql -U postgres -d qicheng_db -c "SELECT * FROM admin_users WHERE username='admin'"

# 2. 重置密码（密码: admin123）
psql -U postgres -d qicheng_db -c "
UPDATE admin_users 
SET password_hash = '\$2b\$10\$YourBcryptHashHere'
WHERE username = 'admin'
"

# 3. 检查JWT密钥
grep JWT_SECRET /Users/alwan/code/qicheng/backend/.env
```

### Token过期
- Token有效期: 8小时
- 过期后自动跳转登录页
- 可在前端设置自动刷新机制

## 性能优化

### 数据库索引
```sql
-- 学生表索引
CREATE INDEX idx_students_level ON student_profiles(level_a, level_b);
CREATE INDEX idx_students_created ON student_profiles(created_at);

-- 任务表索引
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_company ON tasks(company_id);

-- 订单表索引
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);
```

### 缓存策略
```typescript
// Redis缓存仪表盘数据（5分钟）
const getDashboardStats = async () => {
  const cacheKey = 'admin:dashboard:stats';
  const cached = await redis.get(cacheKey);
  
  if (cached) return JSON.parse(cached);
  
  const stats = await db.query(/* 复杂统计查询 */);
  await redis.setex(cacheKey, 300, JSON.stringify(stats));
  
  return stats;
};
```

## 开发指南

### 添加新的管理模块

1. **创建页面组件**
```bash
# 创建新模块目录
mkdir -p frontend/app/admin/new-module

# 创建页面文件
touch frontend/app/admin/new-module/page.tsx
```

2. **添加API端点**
```typescript
// backend/src/routes/admin/newModuleRoutes.ts
import { Router } from 'express';
import { authenticate } from '../../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  // 实现逻辑
});

export default router;
```

3. **注册路由**
```typescript
// backend/src/app.ts
import newModuleRoutes from './routes/admin/newModuleRoutes';
app.use('/api/v1/admin/new-module', newModuleRoutes);
```

4. **更新导航菜单**
```typescript
// frontend/app/admin/page.tsx
const modules = [
  // ...existing modules
  { 
    id: "new-module", 
    href: "/admin/new-module", 
    label: "新模块", 
    icon: "🆕" 
  },
];
```

## 常见问题

### Q: 如何添加新的管理员账号？
```sql
INSERT INTO admin_users (id, username, password_hash, real_name, role_id)
VALUES (
  gen_random_uuid(),
  'newadmin',
  '$2b$10$...',  -- 使用bcrypt加密
  '新管理员',
  (SELECT id FROM admin_roles WHERE code = 'operator')
);
```

### Q: 如何修改管理员权限？
```sql
-- 更新角色权限
UPDATE admin_roles 
SET permissions = '["students:*", "tasks:read"]'
WHERE code = 'operator';
```

### Q: 如何查看操作日志？
```sql
SELECT 
  aol.*,
  au.username,
  au.real_name
FROM admin_operation_logs aol
JOIN admin_users au ON aol.admin_id = au.id
ORDER BY aol.created_at DESC
LIMIT 100;
```

## 联系支持

如有问题，请查看:
- 前端日志: 浏览器开发者工具 Console
- 后端日志: `backend/logs/app.log`
- 数据库日志: PostgreSQL日志
- API文档: http://localhost:3000/api-docs

---

**最后更新**: 2026-05-05  
**系统版本**: v1.0.0  
**系统状态**: ✅ 正常运行
