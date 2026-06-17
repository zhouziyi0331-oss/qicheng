# 小程序安全集成完成指南

**状态：** ✅ 安全API层已创建完成

---

## 📦 已创建的安全模块

### 1. Token管理工具 (`utils/token.ts`)
```typescript
import { tokenManager, maskPhone, parseLoginLockError } from '@/utils/token';

// ✅ P0: Access Token存内存
tokenManager.setAccessToken(token);
tokenManager.getAccessToken();

// ✅ P0: Refresh Token加密存Storage  
await tokenManager.setRefreshToken(token);
await tokenManager.getRefreshToken();

// ✅ P0: 保存Token对
await tokenManager.saveTokens(accessToken, refreshToken);

// ✅ P0: 清除所有Token（退出登录）
await tokenManager.clearTokens();

// ✅ 手机号脱敏
const masked = maskPhone('13800138000'); // "138****8000"

// ✅ P1: 解析登录锁定错误
const lock = parseLoginLockError('请30分钟后重试');
// { isLocked: true, remainingMinutes: 30 }
```

### 2. 安全请求封装 (`utils/secureRequest.ts`)
```typescript
import { http } from '@/utils/secureRequest';

// GET请求
const data = await http.get('/users/profile');

// POST请求
const result = await http.post('/orders', { taskId: '123' });

// PUT请求
await http.put('/users/profile', { nickname: '张三' });

// DELETE请求
await http.delete('/orders/123');

// ✅ P1: 文件上传（带大小校验）
const url = await http.upload({
  filePath: tempFilePath,
  maxSize: 10 * 1024 * 1024, // 10MB
});
```

### 3. 认证服务示例 (`services/authSecure.ts`)
```typescript
import { authService } from '@/services/authSecure';

// ✅ P1: 登录（支持锁定提示）
await authService.loginWithPassword(phone, password);

// ✅ 微信登录
await authService.loginWithWechat({ code });

// ✅ 验证码登录
await authService.sendSmsCode(phone);
await authService.loginWithSmsCode(phone, code);

// ✅ P0: 退出登录（清除Token）
await authService.logout();

// ✅ 退出所有设备
await authService.logoutAll();

// 检查登录状态
const isLoggedIn = authService.isLoggedIn();
```

### 4. 订单服务示例 (`services/orderSecure.ts`)
```typescript
import { orderService } from '@/services/orderSecure';

// ✅ P0: 获取订单（后端自动校验权限）
const order = await orderService.getOrderById(orderId);

// ✅ P0: 获取我的订单（后端自动过滤）
const orders = await orderService.getMyOrders({
  status: 'pending',
  page: 1,
  pageSize: 20,
});

// 接受/完成/取消订单
await orderService.acceptOrder(orderId);
await orderService.completeOrder(orderId);
await orderService.cancelOrder(orderId);
```

---

## 🔄 迁移步骤

### 学生端小程序迁移

#### 步骤1：在 `app.tsx` 中初始化
```typescript
import { tokenManager } from '@/utils/token';
import Taro from '@tarojs/taro';

// 应用启动时检查Token
useEffect(() => {
  const initAuth = async () => {
    const refreshToken = await tokenManager.getRefreshToken();
    if (refreshToken) {
      // 有refreshToken，尝试刷新accessToken
      // 这个逻辑在secureRequest中已自动处理
    } else {
      // 没有Token，跳转登录
      Taro.reLaunch({ url: '/pages/auth/login/index' });
    }
  };
  
  initAuth();
}, []);
```

#### 步骤2：更新登录页面
```typescript
// pages/auth/login/index.tsx
import { authService } from '@/services/authSecure';
import { useState } from 'react';
import Taro from '@tarojs/taro';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) {
      Taro.showToast({ title: '请输入手机号和密码', icon: 'none' });
      return;
    }

    try {
      setLoading(true);
      
      // ✅ 使用安全登录服务
      await authService.loginWithPassword(phone, password);
      
      Taro.showToast({ title: '登录成功', icon: 'success' });
      
      // 跳转首页
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/index/index' });
      }, 1500);
      
    } catch (error: any) {
      // ✅ 错误已在authService中处理（包括登录锁定提示）
      Taro.showToast({
        title: error.message || '登录失败',
        icon: 'none',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="login-page">
      <Input
        type="number"
        placeholder="请输入手机号"
        value={phone}
        onInput={e => setPhone(e.detail.value)}
      />
      <Input
        type="password"
        placeholder="请输入密码"
        value={password}
        onInput={e => setPassword(e.detail.value)}
      />
      <Button
        onClick={handleLogin}
        loading={loading}
        disabled={loading}
      >
        登录
      </Button>
    </View>
  );
}
```

#### 步骤3：更新个人中心
```typescript
// pages/profile/index.tsx
import { authService } from '@/services/authSecure';
import { maskPhone } from '@/utils/token';

export default function Profile() {
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    const info = await authService.getCurrentUser();
    setUserInfo(info);
  };

  const handleLogout = async () => {
    Taro.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: async (res) => {
        if (res.confirm) {
          // ✅ P0安全: 退出登录
          await authService.logout();
        }
      },
    });
  };

  const handleLogoutAll = async () => {
    Taro.showModal({
      title: '确认退出所有设备',
      content: '将会退出您在所有设备上的登录',
      success: async (res) => {
        if (res.confirm) {
          await authService.logoutAll();
        }
      },
    });
  };

  return (
    <View className="profile-page">
      <Text>手机号: {maskPhone(userInfo?.phone)}</Text>
      <Button onClick={handleLogout}>退出登录</Button>
      <Button onClick={handleLogoutAll}>退出所有设备</Button>
    </View>
  );
}
```

---

## 🎯 集成效果

### ✅ 已实现的安全功能

1. **P0安全 - JWT黑名单**
   - ✅ Access Token存内存，页面刷新后消失
   - ✅ Refresh Token加密存Storage
   - ✅ 退出登录后Token立即失效

2. **P0安全 - 横向越权保护**
   - ✅ 后端Service层自动校验权限
   - ✅ 前端无需额外处理

3. **P1安全 - 登录锁定**
   - ✅ 5次失败自动显示锁定时间
   - ✅ 友好的错误提示

4. **P1安全 - 文件上传**
   - ✅ 自动校验文件大小
   - ✅ 超过限制自动拒绝

5. **统一错误处理**
   - ✅ 401自动刷新Token或跳转登录
   - ✅ 429显示登录锁定提示
   - ✅ 网络错误友好提示

---

## 📝 下一步

### 学生端 (`/miniapp`)
1. ✅ 安全API层已创建
2. ⏳ 替换现有的`services/auth.ts`为`services/authSecure.ts`
3. ⏳ 更新所有页面使用新的服务
4. ⏳ 测试登录/退出流程

### 企业端 (`/company-miniapp`)
1. ⏳ 复制安全API层代码
2. ⏳ 创建企业特定服务
3. ⏳ 更新页面
4. ⏳ 测试

---

## 🚀 快速测试

```bash
# 1. 启动后端
cd backend
npm run dev

# 2. 启动学生端小程序
cd miniapp
npm run dev:weapp

# 3. 测试功能
# - 登录测试
# - 连续5次错误密码测试（查看锁定提示）
# - 退出登录测试
# - Token刷新测试（等待15分钟）
# - 文件上传测试
```

---

**状态：** 安全API层已完成，可以开始集成到页面！
