# 真实注册登录系统配置指南

## 当前问题

1. ❌ 短信验证码无法真实发送（缺少阿里云短信服务配置）
2. ❌ 前端没有实现完整的注册流程
3. ❌ 没有登录状态持久化（刷新页面就丢失登录状态）

## 解决方案

### 方案一：配置阿里云短信服务（推荐生产环境）

#### 1. 开通阿里云短信服务

1. 登录 [阿里云控制台](https://www.aliyun.com/)
2. 搜索"短信服务"并开通
3. 创建签名（如"启程"）
4. 创建模板（验证码类型）：`您的验证码是${code}，60秒内有效`
5. 获取AccessKey ID和AccessKey Secret

#### 2. 配置环境变量

编辑 `/Users/alwan/code/qicheng/backend/.env`，添加：

```bash
# 阿里云短信服务
ALIYUN_ACCESS_KEY_ID=LTAI5t...（你的AccessKey ID）
ALIYUN_ACCESS_KEY_SECRET=xxx...（你的AccessKey Secret）
ALIYUN_SMS_SIGN_NAME=启程
ALIYUN_SMS_TEMPLATE_CODE=SMS_123456789（你的模板CODE）
```

#### 3. 重启后端服务

```bash
cd /Users/alwan/code/qicheng/backend
npm start
```

---

### 方案二：开发环境模拟短信（快速测试）

**优点：** 无需配置阿里云，立即可用  
**缺点：** 验证码显示在控制台，不是真实短信

#### 当前已实现的功能

后端已经实现了开发模式，当没有配置阿里云时：
- 验证码会打印在后端控制台日志中
- API响应会返回验证码（仅开发环境）

#### 使用方法

1. 前端调用 `POST /api/v1/auth/send-code`，传入手机号
2. 后端返回：`{ success: true, _dev_code: "123456" }`
3. 前端自动填充验证码或提示用户输入

---

## 前端注册登录流程改造

### 当前问题

前端 `/Users/alwan/code/qicheng/frontend/app/register/page.tsx` 没有实现：
1. 发送验证码按钮
2. 60秒倒计时
3. 验证码输入框
4. 真实API调用
5. JWT token存储

### 需要实现的完整流程

```
用户输入手机号 
  ↓
点击"发送验证码"按钮
  ↓
调用 POST /api/v1/auth/send-code { phone: "13800138000" }
  ↓
后端发送短信（或开发模式返回验证码）
  ↓
用户输入验证码
  ↓
点击"注册"按钮
  ↓
调用 POST /api/v1/auth/register { phone, code, userType, password }
  ↓
后端验证验证码 → 创建用户 → 返回JWT token
  ↓
前端存储token到localStorage
  ↓
跳转到对应页面（学生→首页，企业→控制台）
```

---

## 登录状态持久化

### 需要实现的功能

1. **Token存储**
   - 将JWT token存储到 `localStorage`
   - 存储用户信息（userId, role, userType）

2. **自动登录**
   - 页面加载时检查localStorage中的token
   - 如果token有效，自动登录
   - 如果token过期，跳转到登录页

3. **Token刷新**
   - Access Token过期时，使用Refresh Token刷新
   - 无感知续期

---

## 后端API已实现

✅ `POST /api/v1/auth/send-code` - 发送验证码  
✅ `POST /api/v1/auth/register` - 注册  
✅ `POST /api/v1/auth/login` - 登录  
✅ `POST /api/v1/auth/refresh` - 刷新token  
✅ `POST /api/v1/auth/logout` - 登出  

---

## 数据库已实现

✅ `users` 表 - 存储用户信息（phone, password_hash, role, user_type）  
✅ `student_profiles` 表 - 学生档案  
✅ `company_profiles` 表 - 企业档案  
✅ Redis - 验证码存储（60秒过期）  

---

## 下一步行动

### 立即可做（方案二）

1. 修改前端注册页面，实现完整的验证码流程
2. 实现JWT token存储和自动登录
3. 测试注册→登录→刷新页面→自动登录

### 生产环境（方案一）

1. 开通阿里云短信服务
2. 配置环境变量
3. 测试真实短信发送

---

## 费用说明

### 阿里云短信服务

- 验证码短信：约 **0.045元/条**
- 充值最低：100元（约2200条短信）
- 适合场景：生产环境、真实用户注册

### 开发环境模拟

- 费用：**免费**
- 适合场景：开发测试、演示

---

## 安全建议

1. ✅ 验证码60秒过期（已实现）
2. ✅ 同一手机号10分钟内最多发送3次（已实现）
3. ✅ 密码使用bcrypt加密（已实现）
4. ✅ JWT token有效期：Access 1小时，Refresh 7天（已实现）
5. ⚠️ 生产环境必须使用HTTPS
6. ⚠️ 生产环境必须更换JWT_SECRET为强随机密钥

---

## 总结

**后端已完全实现**，只需：
1. 配置阿里云短信服务（或使用开发模式）
2. 前端实现完整的注册登录UI和逻辑
3. 实现token持久化和自动登录

我可以立即帮你实现前端部分，你想用哪个方案？
