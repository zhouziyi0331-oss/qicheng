# 🚀 启程平台

**AI驱动的学生-企业任务匹配平台**

---

## 📊 项目状态

```
✅ 数据库部署完成 (21个表)
✅ 后端服务运行正常 (端口3000)
✅ 前端组件集成完成
✅ 测试环境就绪
⏳ 等待前端UI测试
```

**系统就绪度**: 85%

---

## 🚀 快速开始

### 一键启动测试环境

```bash
./start-test-env.sh
```

### 或手动启动

```bash
# 后端服务 (已运行)
cd backend && npm run dev

# 学生端小程序
cd miniapp && npm run dev:weapp

# 企业端小程序
cd company-miniapp && npm run dev:weapp
```

---

## 📖 文档导航

### 快速开始
- **[QUICK_START.md](QUICK_START.md)** - 快速开始指南
- **[backend/PROJECT_STATUS.md](backend/PROJECT_STATUS.md)** - 项目状态总览

### 测试相关
- **[backend/E2E_TEST_GUIDE.md](backend/E2E_TEST_GUIDE.md)** - 端到端测试指南
- **[backend/P1_E2E_TEST_READY.md](backend/P1_E2E_TEST_READY.md)** - 测试准备状态

### 部署相关
- **[backend/README_DEPLOYMENT.md](backend/README_DEPLOYMENT.md)** - 部署文档索引
- **[backend/FINAL_DEPLOYMENT_SUMMARY.md](backend/FINAL_DEPLOYMENT_SUMMARY.md)** - 最终总结

---

## 🔐 测试账号

### 企业账号
```
手机号: 13800000001
密码:   test123456
```

### 学生账号
```
学生1-5: 13800000002-13800000006
密码:    test123456
```

---

## 🎯 核心功能

### 1. AI智能匹配
- 6维度匹配算法
- 精准推送 (Top 5)
- 实时匹配分数

### 2. 启程老师翻译
- 任务语义理解
- 功能模块拆解
- 学生友好描述

### 3. AI导师系统
- 7大场景支持
- 情感识别
- 成长引导

---

## 🛠️ 技术栈

### 后端
- Node.js + Express
- TypeScript
- PostgreSQL 14+
- Bull + Socket.io
- Claude API

### 前端
- Taro + React
- TypeScript
- 微信小程序

---

## 📊 项目结构

```
qicheng/
├── backend/              # 后端服务
│   ├── src/             # 源代码
│   ├── scripts/         # 脚本文件
│   └── *.md            # 文档 (9份)
├── miniapp/             # 学生端小程序
├── company-miniapp/     # 企业端小程序
├── start-test-env.sh    # 一键启动脚本
├── QUICK_START.md       # 快速开始
└── README.md           # 本文件
```

---

## 🔗 快速链接

- **后端服务**: http://localhost:3000
- **健康检查**: http://localhost:3000/health
- **API文档**: [backend/API_DOCUMENTATION.md](backend/API_DOCUMENTATION.md)

---

## 📞 需要帮助？

### 常见问题

**Q: 如何开始测试？**  
A: 运行 `./start-test-env.sh` 或查看 [QUICK_START.md](QUICK_START.md)

**Q: 测试账号是什么？**  
A: 参考上面的"测试账号"部分

**Q: 如何查看详细文档？**  
A: 参考"文档导航"部分

**Q: 服务是否正常？**  
A: 访问 http://localhost:3000/health

---

## 🎉 项目亮点

- ✅ 6维度智能匹配算法
- ✅ AI驱动的任务翻译
- ✅ 实时流式输出
- ✅ 长期记忆系统
- ✅ 情感识别与支持
- ✅ 完整的测试环境

---

**最后更新**: 2026-05-28  
**维护者**: 启程平台技术团队

🚀 **准备就绪，开始测试吧！**
