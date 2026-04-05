# 启程平台 - Web + 小程序部署指南

## 📱 双端方案

### 1. Web 端（PWA）
- 支持所有浏览器访问
- 可添加到主屏幕，像 App 一样使用
- 支持离线缓存
- 支持推送通知

### 2. 微信小程序
- 微信生态内使用
- 扫码即用，无需下载
- 支持微信支付
- 流量获取便捷

---

## 🌐 Web 端部署（PWA）

### 已完成配置

✅ **Service Worker** (`/public/sw.js`)
- 离线缓存
- 资源预加载
- 推送通知支持

✅ **Web App Manifest** (`/public/manifest.json`)
- 应用名称、图标、主题色
- 启动页面配置
- 快捷方式（任务大厅、我的任务、个人主页）

✅ **PWA Meta 标签** (`app/layout.tsx`)
- iOS Safari 支持
- 主题色配置
- 全屏模式

### 部署步骤

#### 1. 准备图标资源

需要创建以下尺寸的图标（放在 `/public/icons/` 目录）：

```bash
mkdir -p frontend/public/icons

# 需要的图标尺寸
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png (iOS)
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png
- badge-72x72.png (通知徽章)
```

**图标设计要求**：
- 背景：紫色渐变（#A78BFA → #7C3AED）
- 图案：简洁的"启程"Logo 或 "Q" 字母
- 风格：扁平化、圆角、年轻化

#### 2. 准备截图（可选）

```bash
mkdir -p frontend/public/screenshots

# 桌面端截图
- home.png (1280x720)

# 移动端截图
- mobile.png (750x1334)
```

#### 3. 配置域名和 HTTPS

**PWA 必须使用 HTTPS**（本地开发除外）

##### 方案A：使用 Vercel（推荐）

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署
cd frontend
vercel

# 生产环境部署
vercel --prod
```

**优点**：
- 自动配置 HTTPS
- 全球 CDN 加速
- 自动部署（Git push 即部署）
- 免费额度充足

**访问地址**：`https://qicheng.vercel.app`

##### 方案B：使用自己的服务器

```bash
# 1. 构建前端
cd frontend
npm run build

# 2. 上传到服务器
scp -r .next/* user@your-server:/var/www/qicheng/

# 3. 配置 Nginx
```

**Nginx 配置示例**：

```nginx
server {
    listen 443 ssl http2;
    server_name qicheng.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    root /var/www/qicheng;
    index index.html;

    # PWA 相关
    location /sw.js {
        add_header Cache-Control "no-cache";
        proxy_cache_bypass $http_pragma;
    }

    location /manifest.json {
        add_header Cache-Control "public, max-age=604800";
    }

    # Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 4. 测试 PWA

##### 桌面端测试（Chrome）

1. 打开 `https://your-domain.com`
2. 按 F12 打开开发者工具
3. 切换到 "Application" 标签
4. 检查：
   - ✅ Manifest 加载成功
   - ✅ Service Worker 注册成功
   - ✅ 图标显示正确
5. 点击地址栏右侧的"安装"按钮

##### 移动端测试（iOS Safari）

1. 打开 Safari 访问网站
2. 点击底部"分享"按钮
3. 选择"添加到主屏幕"
4. 设置名称和图标
5. 从主屏幕打开，应该全屏显示

##### 移动端测试（Android Chrome）

1. 打开 Chrome 访问网站
2. 点击右上角菜单
3. 选择"添加到主屏幕"
4. 或者等待自动弹出安装提示

#### 5. 推送通知配置（可选）

```typescript
// 请求通知权限
async function requestNotificationPermission() {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('通知权限已授予');
    }
  }
}

// 发送推送通知（后端）
const webpush = require('web-push');

webpush.setVapidDetails(
  'mailto:your@email.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// 发送通知
webpush.sendNotification(subscription, JSON.stringify({
  title: '新任务通知',
  body: '你有一个新的任务待接取',
  url: '/tasks',
}));
```

---

## 📱 微信小程序开发

### 技术选型

推荐使用 **Taro 3** 框架，可以复用部分 React 代码。

#### 方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| Taro | 可复用React代码，多端支持 | 学习成本中等 | ⭐⭐⭐⭐⭐ |
| uni-app | 生态丰富，文档完善 | Vue语法，无法复用代码 | ⭐⭐⭐⭐ |
| 原生小程序 | 性能最好，功能完整 | 开发成本高，无法复用 | ⭐⭐⭐ |

### 使用 Taro 创建小程序

#### 1. 安装 Taro CLI

```bash
npm install -g @tarojs/cli

# 创建小程序项目
cd /Users/alwan/code/qicheng
taro init qicheng-miniapp

# 选择配置
? 请输入项目名称：qicheng-miniapp
? 请选择框架：React
? 请选择 TypeScript：是
? 请选择 CSS 预处理器：Sass
? 请选择模板源：默认模板
```

#### 2. 项目结构

```
qicheng-miniapp/
├── src/
│   ├── pages/           # 页面
│   │   ├── index/       # 首页
│   │   ├── tasks/       # 任务大厅
│   │   ├── my-tasks/    # 我的任务
│   │   └── profile/     # 个人主页
│   ├── components/      # 组件
│   ├── services/        # API 服务
│   ├── store/           # 状态管理
│   ├── utils/           # 工具函数
│   └── app.tsx          # 入口文件
├── project.config.json  # 小程序配置
└── package.json
```

#### 3. 配置 API 地址

```typescript
// src/config/index.ts
export default {
  // 开发环境
  dev: {
    apiUrl: 'http://localhost:3001/api/v1',
  },
  // 生产环境
  prod: {
    apiUrl: 'https://api.qicheng.com/api/v1',
  },
};
```

#### 4. 复用 Web 端代码

```typescript
// 可以直接复用的部分
- API 客户端 (lib/api.ts)
- 工具函数 (utils/)
- 类型定义 (types/)
- 状态管理逻辑 (store/)

// 需要重写的部分
- UI 组件（使用 Taro UI）
- 页面布局（小程序规范）
- 路由导航（小程序 API）
```

#### 5. 关键页面实现

##### 首页 (pages/index/index.tsx)

```tsx
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import './index.scss';

export default function Index() {
  const goToTasks = () => {
    Taro.navigateTo({ url: '/pages/tasks/index' });
  };

  return (
    <View className="index">
      <View className="hero">
        <Text className="title">开启你的职业启程</Text>
        <Text className="subtitle">AI驱动的个性化成长平台</Text>
        <Button className="btn-primary" onClick={goToTasks}>
          开始测评
        </Button>
      </View>
    </View>
  );
}
```

##### 任务大厅 (pages/tasks/index.tsx)

```tsx
import { View, ScrollView } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { taskApi } from '@/services/api';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    Taro.showLoading({ title: '加载中...' });
    try {
      const res = await taskApi.getMarketTasks();
      setTasks(res.data);
    } catch (error) {
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      Taro.hideLoading();
    }
  };

  return (
    <ScrollView scrollY className="tasks">
      {tasks.map(task => (
        <TaskCard key={task.id} task={task} />
      ))}
    </ScrollView>
  );
}
```

#### 6. 微信登录集成

```typescript
// src/services/auth.ts
import Taro from '@tarojs/taro';

export async function wxLogin() {
  try {
    // 1. 获取微信登录凭证
    const { code } = await Taro.login();

    // 2. 发送到后端换取 token
    const res = await Taro.request({
      url: 'https://api.qicheng.com/api/v1/auth/wx-login',
      method: 'POST',
      data: { code },
    });

    // 3. 保存 token
    Taro.setStorageSync('token', res.data.token);

    return res.data;
  } catch (error) {
    Taro.showToast({ title: '登录失败', icon: 'none' });
    throw error;
  }
}
```

#### 7. 后端微信登录接口

```typescript
// backend/src/routes/auth/wxLogin.ts
import axios from 'axios';

export async function wxLogin(req: Request, res: Response) {
  const { code } = req.body;

  // 1. 用 code 换取 openid
  const wxRes = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
    params: {
      appid: process.env.WX_APPID,
      secret: process.env.WX_SECRET,
      js_code: code,
      grant_type: 'authorization_code',
    },
  });

  const { openid, session_key } = wxRes.data;

  // 2. 查找或创建用户
  let user = await queryOne('SELECT * FROM users WHERE wx_openid = $1', [openid]);
  if (!user) {
    user = await queryOne(
      'INSERT INTO users (wx_openid, role) VALUES ($1, $2) RETURNING *',
      [openid, 'student']
    );
  }

  // 3. 生成 JWT token
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET);

  res.json({ success: true, data: { token, user } });
}
```

#### 8. 编译和预览

```bash
# 编译为微信小程序
cd qicheng-miniapp
npm run dev:weapp

# 打开微信开发者工具
# 导入项目目录：qicheng-miniapp/dist
```

#### 9. 发布小程序

1. **注册小程序**
   - 访问 [微信公众平台](https://mp.weixin.qq.com/)
   - 注册小程序账号
   - 获取 AppID

2. **配置服务器域名**
   - 小程序后台 → 开发 → 开发设置
   - 配置服务器域名：`https://api.qicheng.com`
   - 必须是 HTTPS

3. **提交审核**
   - 微信开发者工具 → 上传代码
   - 小程序后台 → 版本管理 → 提交审核
   - 等待审核（通常1-3天）

4. **发布上线**
   - 审核通过后点击"发布"
   - 用户可以搜索到小程序

---

## 📊 双端对比

| 功能 | Web (PWA) | 微信小程序 |
|------|-----------|-----------|
| 访问方式 | 浏览器 | 微信内 |
| 安装 | 添加到主屏幕 | 扫码即用 |
| 离线使用 | ✅ | ❌ |
| 推送通知 | ✅ | ✅ |
| 支付 | 支付宝/微信H5 | 微信支付 |
| 分享 | 链接分享 | 微信分享 |
| 开发成本 | 低 | 中 |
| 审核 | 无需审核 | 需要审核 |
| 更新 | 即时更新 | 需要发版 |

---

## 🚀 推荐部署流程

### 第一阶段：Web PWA（1周）

1. ✅ 创建图标资源
2. ✅ 部署到 Vercel（自动 HTTPS）
3. ✅ 测试 PWA 功能
4. ✅ 分享给用户测试

**优点**：快速上线，无需审核

### 第二阶段：微信小程序（2-3周）

1. 使用 Taro 创建小程序项目
2. 复用 Web 端 API 和逻辑
3. 重写 UI 组件（使用 Taro UI）
4. 集成微信登录和支付
5. 提交审核和发布

**优点**：覆盖微信生态，流量获取便捷

---

## 📝 下一步行动

### 立即可做（Web PWA）

1. **创建图标**：使用 Figma 或 Canva 设计启程 Logo
2. **部署 Vercel**：
   ```bash
   cd frontend
   vercel login
   vercel --prod
   ```
3. **测试 PWA**：在手机上添加到主屏幕

### 1-2周内（微信小程序）

1. **注册小程序账号**
2. **创建 Taro 项目**
3. **开发核心页面**（首页、任务、个人主页）
4. **提交审核**

需要我帮你创建图标资源或者开始 Taro 小程序项目吗？
