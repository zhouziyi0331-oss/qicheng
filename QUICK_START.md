# 启程项目 - 快速启动指南

## ✅ 当前状态

### 已完成
- ✅ PostgreSQL 已运行（localhost:5432，262个表）
- ✅ Redis 已运行（localhost:6379）
- ✅ 前端代码已修复并构建成功
- ✅ 后端代码完整（194个路由 + 149个服务）

### 待配置
- ⚠️ ANTHROPIC_API_KEY（需要真实的Claude API密钥）

---

## 🚀 启动步骤

### 1. 配置 API 密钥

编辑 `backend/.env` 文件的第 25 行：

```bash
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx  # 替换为真实密钥
```

**获取API密钥**：https://console.anthropic.com/settings/keys

---

### 2. 启动后端服务

```bash
cd /Users/alwan/code/qicheng/backend
npm run dev
```

成功后会显示：`✅ 服务器运行在 http://localhost:3517`

---

### 3. 启动小程序

```bash
cd /Users/alwan/code/qicheng/miniapp
npm run dev:weapp
```

用微信开发者工具导入项目目录 `/Users/alwan/code/qicheng/miniapp`

---

## 📊 服务状态

| 服务 | 状态 | 端口 |
|-----|------|------|
| PostgreSQL | ✅ 运行中 | 5432 |
| Redis | ✅ 运行中 | 6379 |
| 后端 API | ⏸️ 待启动 | 3517 |

---

## 🎯 验证命令

```bash
# 检查 PostgreSQL
docker exec qicheng-postgres psql -U postgres -d qicheng -c "SELECT COUNT(*) FROM users;"

# 检查 Redis
docker exec qicheng-redis redis-cli ping

# 检查后端（启动后执行）
curl http://localhost:3517/api/v1/health
```

---

## 💡 提示

- 数据库已初始化（262个表）
- 后端支持热重载，修改代码自动生效
- 前端需要在微信开发者工具中勾选"不校验合法域名"

**当前只需要配置 API Key 就可以立即启动！**
