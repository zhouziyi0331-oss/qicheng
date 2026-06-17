# 🔧 小程序启动失败解决方案

## 问题诊断

根据截图显示的错误：
```
timeout
Error: simulator not found
```

这是因为：
1. 小程序无法连接到后端API
2. 需要配置微信开发者工具的"不校验合法域名"

---

## 解决步骤

### 步骤1：启动后端（必须）

```bash
# 回到项目根目录
cd /Users/alwan/code/qicheng

# 启动后端
cd backend
npm run dev

# 等待看到日志：
# ✅ 启程 Backend started
# Port: 3000
```

**验证后端是否运行：**
```bash
curl http://localhost:3000/health
# 应该返回: {"status":"ok","service":"qicheng-backend",...}
```

### 步骤2：配置微信开发者工具

在微信开发者工具中：

1. **点击右上角"详情"按钮**

2. **勾选以下选项：**
   - ✅ 不校验合法域名、web-view（业务域名）、TLS版本以及HTTPS证书
   - ✅ 启用调试

3. **本地设置：**
   - ✅ 使用npm模块
   - ✅ 不校验合法域名

### 步骤3：重新编译小程序

```bash
# 学生端
cd /Users/alwan/code/qicheng/miniapp
npm run dev:weapp

# 等待编译完成，看到：
# ✅ Build successfully
```

### 步骤4：刷新微信开发者工具

在微信开发者工具中：
1. 点击"编译"按钮（或按快捷键 Cmd+B）
2. 查看Console，应该能看到：
   ```
   API Base URL: http://localhost:3000/api/v1
   ```

---

## 快速修复脚本

我已经创建了修复脚本，运行这个：

```bash
cd /Users/alwan/code/qicheng

# 1. 停止所有服务
./stop-all-secure.sh

# 2. 启动后端
cd backend
npm run dev &

# 3. 等待5秒
sleep 5

# 4. 测试后端
curl http://localhost:3000/health

# 5. 重新编译学生端
cd ../miniapp
npm run dev:weapp
```

---

## 常见问题

### Q1: 后端启动失败
```bash
# 检查端口占用
lsof -ti:3000

# 如果有进程，杀掉它
kill -9 $(lsof -ti:3000)

# 重新启动
cd backend
npm run dev
```

### Q2: 小程序编译失败
```bash
# 清除缓存
cd miniapp
rm -rf node_modules dist
npm install
npm run dev:weapp
```

### Q3: 仍然显示timeout
确认：
1. ✅ 后端在运行（curl http://localhost:3000/health 成功）
2. ✅ 微信开发者工具勾选了"不校验合法域名"
3. ✅ 小程序已重新编译
4. ✅ 点击了"编译"按钮刷新

---

## 正确的启动顺序

```bash
# 1. 启动后端
cd backend
npm run dev

# 等待后端完全启动（看到✅启动成功的日志）

# 2. 启动小程序编译
cd ../miniapp
npm run dev:weapp

# 等待编译完成

# 3. 打开微信开发者工具
# - 导入项目：选择 miniapp/dist 目录
# - 点击"详情"
# - 勾选"不校验合法域名"
# - 点击"编译"
```

---

## 验证成功的标志

1. ✅ 后端日志显示：`启程 Backend started`
2. ✅ curl测试成功返回健康状态
3. ✅ 小程序Console显示：`API Base URL: http://localhost:3000/api/v1`
4. ✅ 小程序不再显示"模拟器启动失败"
5. ✅ 可以看到登录页面

---

**立即尝试这些步骤，应该就能解决问题！**
