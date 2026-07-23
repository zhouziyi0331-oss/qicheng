# 前端API集成指南

## 📋 概述

后端已实现以下新功能的API：
1. **微信登录认证** (authAPI)
2. **实践项目管理** (practiceAPI) - 已存在，需更新
3. **联系方式交换** (contactExchangeAPI) - 已存在，需更新
4. **AI实践拆解系统** (新增)

## 🔄 需要更新的API

### 1. 认证API更新

现有的`authAPI`需要添加微信登录相关方法：

```typescript
// 在 src/services/api.ts 中更新 authAPI

export const authAPI = {
  // ... 保留现有方法 ...

  // 新增：微信小程序登录
  wechatLogin: async (code: string, userInfo?: { nickname: string; avatar: string }) => {
    return request('/auth/wechat-login', {
      method: 'POST',
      data: {
        code,
        nickname: userInfo?.nickname,
        avatar: userInfo?.avatar
      },
      needAuth: false
    })
  },

  // 新增：刷新Token
  refreshToken: (token: string) => 
    request('/auth/refresh-token', {
      method: 'POST',
      data: { token },
      needAuth: false
    })
}
```

### 2. 实践项目API已存在

前端已经有`practiceAPI`（第1495-1522行），**无需修改**，后端API完全兼容。

### 3. 联系方式交换API已存在

前端已经有`contactExchangeAPI`（第1525-1545行），**无需修改**，后端API完全兼容。

### 4. 新增AI拆解报告API

在`practiceAPI`后面添加AI拆解相关方法：

```typescript
// 在 src/services/api.ts 的 practiceAPI 中添加

export const practiceAPI = {
  // ... 保留现有方法 ...

  // 新增：生成AI拆解报告
  generateDecomposition: (projectId: string) =>
    request('/practice/decomposition/generate', {
      method: 'POST',
      data: { projectId }
    }),

  // 新增：查询AI拆解报告状态
  getDecompositionStatus: (reportId: string) =>
    request(`/practice/decomposition/${reportId}/status`),

  // 新增：解锁AI拆解报告（付费）
  unlockDecomposition: (reportId: string, paymentAmount: number) =>
    request(`/practice/decomposition/${reportId}/unlock`, {
      method: 'POST',
      data: { paymentAmount }
    }),

  // 新增：获取完整AI拆解报告
  getDecomposition: (reportId: string) =>
    request(`/practice/decomposition/${reportId}`)
}
```

## 🔑 更新配置文件

### 1. 更新API Base URL

在 `src/config/index.ts` 或相关配置文件中：

```typescript
export const getApiUrl = (path: string) => {
  const isDev = process.env.NODE_ENV === 'development'
  
  return isDev
    ? `http://localhost:3000${path}`  // 开发环境
    : `https://api.yourdomain.com${path}`  // 生产环境
}
```

### 2. 更新环境变量

在项目根目录添加 `.env` 文件：

```env
# 开发环境
TARO_APP_API_URL=http://localhost:3000/api

# 微信小程序配置
TARO_APP_WECHAT_APP_ID=your-app-id
```

## 🎯 前端页面集成示例

### 1. 微信登录集成

```typescript
// src/pages/login/index.tsx

import { authAPI } from '@/services/api'
import Taro from '@tarojs/taro'

const handleWechatLogin = async () => {
  try {
    // 1. 获取微信登录code
    const { code } = await Taro.login()
    
    // 2. 获取用户信息（需要用户授权）
    const { userInfo } = await Taro.getUserProfile({
      desc: '用于完善用户资料'
    })
    
    // 3. 调用后端登录接口
    const response = await authAPI.wechatLogin(code, {
      nickname: userInfo.nickName,
      avatar: userInfo.avatarUrl
    })
    
    // 4. 保存token和用户信息
    Taro.setStorageSync('token', response.token)
    Taro.setStorageSync('userInfo', response.user)
    
    // 5. 跳转到首页
    Taro.switchTab({ url: '/pages/index/index' })
    
    Taro.showToast({ title: '登录成功', icon: 'success' })
  } catch (error) {
    console.error('登录失败:', error)
    Taro.showToast({ title: '登录失败', icon: 'none' })
  }
}
```

### 2. AI拆解报告集成

```typescript
// src/packagePractice/pages/practice-report/index.tsx

import { practiceAPI } from '@/services/api'
import { useState } from 'react'

const PracticeReport = () => {
  const [decompositionReport, setDecompositionReport] = useState(null)
  const [isUnlocked, setIsUnlocked] = useState(false)

  // 生成AI拆解报告
  const handleGenerateDecomposition = async (projectId: string) => {
    try {
      Taro.showLoading({ title: '生成中...' })
      
      const response = await practiceAPI.generateDecomposition(projectId)
      
      // 显示预览
      setDecompositionReport(response.preview)
      
      Taro.hideLoading()
      Taro.showToast({ title: '报告生成成功', icon: 'success' })
    } catch (error) {
      Taro.hideLoading()
      Taro.showToast({ title: '生成失败', icon: 'none' })
    }
  }

  // 解锁报告（付费）
  const handleUnlockReport = async (reportId: string) => {
    try {
      // 这里应该先调用微信支付
      const paymentAmount = 29.9
      
      // TODO: 集成微信支付
      // const paymentResult = await requestWechatPayment(paymentAmount)
      
      // 支付成功后解锁
      const report = await practiceAPI.unlockDecomposition(reportId, paymentAmount)
      
      setDecompositionReport(report)
      setIsUnlocked(true)
      
      Taro.showToast({ title: '解锁成功', icon: 'success' })
    } catch (error) {
      Taro.showToast({ title: '解锁失败', icon: 'none' })
    }
  }

  // 获取完整报告
  const handleViewFullReport = async (reportId: string) => {
    try {
      const report = await practiceAPI.getDecomposition(reportId)
      setDecompositionReport(report)
    } catch (error) {
      Taro.showToast({ title: '获取报告失败', icon: 'none' })
    }
  }

  return (
    // ... UI代码
  )
}
```

## 🧪 测试步骤

### 1. 启动后端服务

```bash
cd backend
npm run dev
```

### 2. 启动前端小程序

```bash
npm run dev:weapp
```

### 3. 在微信开发者工具中测试

1. 打开微信开发者工具
2. 导入项目
3. 在"详情 → 本地设置"中勾选"不校验合法域名"
4. 测试登录流程
5. 测试实践项目列表
6. 测试AI拆解报告生成

## ⚠️ 注意事项

### 1. 域名配置

生产环境需要在微信公众平台配置服务器域名：

```
request合法域名：https://api.yourdomain.com
```

### 2. Token管理

前端已有`tokenManager`，确保在请求拦截器中正确使用：

```typescript
// 请求拦截器已配置（第21-27行）
if (needAuth) {
  const token = tokenManager.getAccessToken()
  if (token) {
    header['Authorization'] = `Bearer ${token}`
  }
}
```

### 3. 错误处理

后端返回401时，前端会自动清除token并跳转登录（第40-44行）。

### 4. 开发环境微信登录

后端支持开发模式的模拟微信登录（当未配置WECHAT_APP_ID时）：

```typescript
// backend/src/controllers/auth.controller.ts
if (process.env.NODE_ENV === 'development') {
  return {
    openid: `dev_openid_${Date.now()}`,
    session_key: 'dev_session_key'
  }
}
```

## 📝 完整集成清单

- [x] 后端服务启动
- [x] 后端API实现完成
- [x] 后端测试数据初始化
- [ ] 前端authAPI添加wechatLogin方法
- [ ] 前端practiceAPI添加AI拆解方法
- [ ] 前端登录页面集成微信登录
- [ ] 前端实践报告页面集成AI拆解
- [ ] 微信支付集成（付费解锁）
- [ ] 生产环境域名配置
- [ ] 生产环境部署测试

## 🚀 快速集成命令

```bash
# 1. 启动后端
cd backend && npm run dev

# 2. 新开终端，启动前端
cd .. && npm run dev:weapp

# 3. 在微信开发者工具中打开项目

# 4. 测试API
# - 登录功能
# - 实践项目列表
# - AI拆解报告生成
```

## 💡 下一步优化

1. **添加Loading状态** - AI生成需要10-15秒
2. **添加WebSocket** - 实时推送生成进度
3. **缓存策略** - 避免重复生成
4. **错误重试** - 网络失败自动重试
5. **离线支持** - 本地缓存已解锁报告

---

**集成完成后，前端将拥有完整的AI驱动实践拆解功能！**
