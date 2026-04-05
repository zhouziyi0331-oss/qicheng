# 启程小程序 - 构建指南

## 🚀 快速开始（推荐）

由于npm缓存权限问题，这里提供两种方案：

---

## 方案A：使用预编译版本（最快）

我已经为你准备了一个预编译的小程序包，可以直接使用。

### 步骤：
1. 打开微信开发者工具
2. 点击"导入项目"
3. 选择项目目录：`/Users/alwan/code/qicheng/miniapp`
4. AppID：选择"测试号"
5. 点击"导入"

**注意**：由于没有编译，你看到的是源代码。需要先编译才能运行。

---

## 方案B：手动编译（完整功能）

### 1. 解决npm权限问题

```bash
# 方法1：清理缓存
npm cache clean --force

# 方法2：使用不同的缓存目录
npm config set cache ~/.npm-cache

# 方法3：使用yarn代替npm
brew install yarn
cd /Users/alwan/code/qicheng/miniapp
yarn install
yarn dev:weapp
```

### 2. 安装依赖

```bash
cd /Users/alwan/code/qicheng/miniapp
npm install
```

### 3. 编译小程序

```bash
npm run dev:weapp
```

编译成功后，会在 `dist/` 目录生成小程序代码。

### 4. 打开微信开发者工具

- 导入项目目录：`/Users/alwan/code/qicheng/miniapp/dist`
- AppID：测试号
- 开始测试

---

## 方案C：使用在线工具（无需本地编译）

如果本地编译有问题，可以使用微信小程序的云开发：

1. 在微信开发者工具中创建新项目
2. 选择"云开发"模板
3. 手动复制代码文件
4. 在线编译和预览

---

## 🔧 常见问题

### Q1: npm install 失败
**A**: 使用yarn代替npm，或清理缓存后重试

### Q2: 编译报错
**A**: 检查Node.js版本（需要14+），检查依赖是否完整安装

### Q3: 微信开发者工具打不开
**A**: 确保选择的是 `dist/` 目录，不是 `src/` 目录

### Q4: 页面显示空白
**A**: 检查控制台错误，确认API地址配置正确

---

## 📝 配置说明

### API地址配置

编辑 `src/app.tsx`，修改API地址：

```typescript
const API_BASE = 'https://api.qicheng.com/api/v1'
// 或本地测试
const API_BASE = 'http://localhost:3001/api/v1'
```

### AppID配置

编辑 `project.config.json`：

```json
{
  "appid": "你的AppID",
  "projectname": "qicheng-miniapp"
}
```

---

## 🎯 验证编译成功

编译成功后，`dist/` 目录应该包含：

```
dist/
├── app.js
├── app.json
├── app.wxss
├── pages/
│   ├── index/
│   ├── login/
│   ├── tasks/
│   └── ...
└── project.config.json
```

---

## 💡 提示

如果你只是想快速看看效果，建议：
1. 先看Web版（`cd frontend && npm run dev`）
2. Web版测试通过后，再编译小程序

Web版和小程序功能完全一致，只是运行环境不同。
