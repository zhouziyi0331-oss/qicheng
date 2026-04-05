# 启程平台 - 微信小程序

## 🎯 项目说明

这是启程平台的微信小程序版本，使用 Taro 3 框架开发。

## 📦 技术栈

- **框架**：Taro 3.6
- **语言**：TypeScript
- **UI库**：Taro Components
- **样式**：Sass
- **状态管理**：React Hooks

## 🚀 快速开始

### 1. 安装依赖

```bash
cd miniapp
npm install
```

### 2. 开发模式

```bash
npm run dev:weapp
```

### 3. 打开微信开发者工具

1. 打开微信开发者工具
2. 导入项目
3. 项目目录选择：`miniapp/dist`
4. AppID：使用测试号或自己的AppID

### 4. 构建生产版本

```bash
npm run build:weapp
```

## 📱 页面结构

```
src/pages/
├── index/          # 首页
├── login/          # 登录页
├── test/           # OPC测评
├── tasks/          # 任务大厅
├── my-tasks/       # 我的任务
├── task-detail/    # 任务详情
└── profile/        # 个人主页
```

## 🎨 设计规范

### 颜色
- 主色：#8B5CF6（紫色）
- 辅助色：#EC4899（粉色）
- 背景：#F9FAFB（浅灰）

### 字体
- 标题：48px - 64px
- 正文：28px - 32px
- 辅助：24px

### 圆角
- 卡片：32px
- 按钮：48px（全圆角）

## 🔧 配置说明

### API地址

修改 `src/utils/request.ts` 中的 `BASE_URL`：

```typescript
const BASE_URL = 'https://api.qicheng.com/api/v1'
```

### 微信登录

需要在后端实现微信登录接口：

```typescript
POST /api/v1/auth/wx-login
{
  "code": "微信登录凭证"
}
```

## 📋 功能清单

### 已实现
- ✅ 首页（Hero + 功能卡片）
- ✅ 登录页（微信授权登录）
- ✅ OPC测评页
- ✅ 任务大厅
- ✅ 我的任务
- ✅ 任务详情
- ✅ 个人主页
- ✅ AI导师聊天

### 待实现
- ⏳ 支付功能（微信支付）
- ⏳ 提现功能
- ⏳ 故事墙
- ⏳ OPC报告购买
- ⏳ 成长时间线

## 🐛 常见问题

### 1. 编译失败

```bash
# 清除缓存
rm -rf node_modules dist
npm install
npm run dev:weapp
```

### 2. 样式不生效

检查 `config/index.js` 中的 `designWidth` 是否为 750。

### 3. API请求失败

1. 检查微信开发者工具的"详情" → "本地设置" → "不校验合法域名"是否勾选
2. 检查后端API地址是否正确
3. 检查token是否有效

## 📝 开发规范

### 命名规范
- 页面文件：小写 + 连字符（如 `task-detail`）
- 组件文件：大驼峰（如 `TaskCard`）
- 样式类名：小写 + 连字符（如 `task-card`）

### 代码规范
- 使用 TypeScript
- 使用函数式组件 + Hooks
- 样式使用 Sass
- 遵循 ESLint 规则

## 🚀 部署

### 1. 构建生产版本

```bash
npm run build:weapp
```

### 2. 上传代码

1. 打开微信开发者工具
2. 点击"上传"
3. 填写版本号和备注
4. 上传成功

### 3. 提交审核

1. 登录[微信公众平台](https://mp.weixin.qq.com/)
2. 进入"版本管理"
3. 提交审核
4. 等待审核通过（通常1-3天）

### 4. 发布上线

审核通过后，点击"发布"即可上线。

## 📞 联系方式

如有问题，请联系开发团队。
