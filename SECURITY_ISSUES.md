# 启程项目安全问题分析和整改方案

## 🚨 当前存在的严重安全问题

### 1. 密码安全问题
**问题描述：**
- ❌ 注册时要求用户设置密码（第64行：`password`参数）
- ❌ 密码存储在users表的password_hash字段
- ❌ 管理后台可能能看到用户密码相关信息
- ❌ 不符合"手机验证码登录"的安全最佳实践

**风险等级：** 🔴 高危

**影响：**
- 用户密码泄露风险
- 不符合移动应用安全规范
- 增加用户注册门槛
- 密码管理复杂度高

### 2. 数据裸露问题
**问题描述：**
- ❌ 管理后台直接查询users表，可能暴露敏感信息
- ❌ 手机号未脱敏显示（第58行：`u.phone`）
- ❌ 没有数据访问权限控制
- ❌ 没有敏感数据加密

**风险等级：** 🔴 高危

**影响：**
- 用户隐私泄露
- 违反《个人信息保护法》
- 手机号可能被滥用
- 数据安全合规问题

### 3. 注册流程不完整
**问题描述：**
- ❌ 注册时只收集phone和password
- ❌ 没有昵称、头像、自我介绍等基础信息收集
- ❌ 学生注册后直接进入系统，没有完善资料页面
- ❌ 企业注册缺少必要的企业信息

**风险等级：** 🟡 中危

**影响：**
- 用户体验差
- 数据不完整
- 后续功能受限

---

## ✅ 安全合规整改方案

### 方案一：完全移除密码系统（推荐）

#### 1.1 注册流程改造
```
旧流程：手机号 → 验证码 → 设置密码 → 注册成功
新流程：手机号 → 验证码 → 完善资料 → 注册成功
```

**完善资料页面包含：**
- 昵称（必填）
- 头像（可选，提供默认头像）
- 身份选择（学生/企业）
- 一句话介绍（可选）
- 学生额外信息：学校、专业、年级
- 企业额外信息：企业名称、联系人、行业

#### 1.2 登录流程改造
```
旧流程：手机号 → 密码 → 登录
新流程：手机号 → 验证码 → 登录
```

#### 1.3 数据库改造
```sql
-- 移除password_hash字段（保留但不使用，避免数据丢失）
ALTER TABLE users ADD COLUMN password_hash_deprecated TEXT;
UPDATE users SET password_hash_deprecated = password_hash;
ALTER TABLE users DROP COLUMN password_hash;

-- 添加必要字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT; -- 一句话介绍
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;
```

#### 1.4 后端API改造
- 移除register接口的password参数
- 移除login接口的password登录方式
- 新增 POST /auth/complete-profile 接口
- 修改注册流程：验证码通过后直接创建用户，返回token，引导完善资料

---

### 方案二：保留密码但加强安全（备选）

如果必须保留密码功能：

#### 2.1 密码安全加强
- ✅ 使用bcrypt加密（已实现，强度12）
- ✅ 密码最小长度8位（已实现）
- ⚠️ 需要添加：密码复杂度验证（大小写+数字+特殊字符）
- ⚠️ 需要添加：密码找回功能
- ⚠️ 需要添加：密码修改功能
- ⚠️ 需要添加：登录失败次数限制

#### 2.2 密码存储隔离
```sql
-- 创建独立的密码表
CREATE TABLE user_credentials (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  password_hash TEXT NOT NULL,
  password_updated_at TIMESTAMP DEFAULT NOW(),
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 从users表移除password_hash
ALTER TABLE users DROP COLUMN password_hash;
```

---

### 方案三：数据脱敏和权限控制（必须实施）

#### 3.1 管理后台数据脱敏
```typescript
// 手机号脱敏：138****0099
function maskPhone(phone: string): string {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

// 修改管理后台查询
SELECT
  u.id,
  u.nickname,
  u.avatar_url,
  CONCAT(SUBSTRING(u.phone, 1, 3), '****', SUBSTRING(u.phone, 8, 4)) as phone, -- 脱敏
  u.created_at,
  sp.level_a,
  sp.level_b,
  sp.opc_label,
  sp.task_count,
  sp.total_earnings
FROM users u
LEFT JOIN student_profiles sp ON u.id = sp.user_id
```

#### 3.2 权限分级
```typescript
// 不同管理员角色看到的数据不同
enum AdminRole {
  SUPER_ADMIN = 'super',      // 可以看到完整手机号
  OPERATOR = 'operator',       // 只能看到脱敏手机号
  FINANCE = 'finance',         // 只能看到财务数据
  SUPPORT = 'support'          // 只能看到基本信息
}

// 根据角色返回不同数据
if (adminRole !== 'super') {
  studentData.phone = maskPhone(studentData.phone);
}
```

#### 3.3 敏感操作审计
```sql
-- 创建审计日志表
CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_users(id),
  action VARCHAR(50) NOT NULL, -- view_phone, export_data, etc.
  resource_type VARCHAR(50),
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 记录敏感操作
INSERT INTO admin_audit_logs (admin_id, action, resource_type, resource_id, ip_address)
VALUES ($1, 'view_student_detail', 'student', $2, $3);
```

---

## 📋 实施优先级

### P0 - 立即修复（数据安全）
1. ✅ 管理后台手机号脱敏
2. ✅ 移除密码明文传输风险
3. ✅ 添加敏感操作审计日志

### P1 - 本周完成（用户体验）
1. ✅ 实现完整的注册流程（完善资料页面）
2. ✅ 移除密码登录，改为纯验证码登录
3. ✅ 添加用户协议和隐私政策

### P2 - 下周完成（合规）
1. ⚠️ 数据加密存储
2. ⚠️ 权限分级控制
3. ⚠️ 数据导出审批流程

---

## 🎯 推荐实施方案

**建议采用：方案一（移除密码） + 方案三（数据脱敏）**

**理由：**
1. 符合移动应用安全最佳实践
2. 降低安全风险和维护成本
3. 提升用户体验（无需记忆密码）
4. 符合《个人信息保护法》要求
5. 验证码登录已成为行业标准

**实施步骤：**
1. 先实施数据脱敏（不影响现有功能）
2. 创建完善资料页面
3. 修改注册流程
4. 修改登录流程（保留密码登录作为过渡）
5. 数据迁移和清理
6. 完全移除密码功能

---

## 📝 合规检查清单

- [ ] 用户注册时明确告知数据收集目的
- [ ] 提供用户协议和隐私政策
- [ ] 手机号脱敏显示
- [ ] 敏感操作审计日志
- [ ] 数据访问权限控制
- [ ] 用户数据导出功能
- [ ] 用户注销账号功能
- [ ] 数据备份和恢复机制
- [ ] 安全漏洞应急响应预案

---

生成时间：2026-05-06
优先级：🔴 紧急
