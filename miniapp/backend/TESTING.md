# 启程OPC - 测试指南

## 🧪 快速测试流程

### 1. 启动后端服务

```bash
cd backend
npm install
npm run dev
```

服务启动在 `http://localhost:3000`

### 2. 初始化测试数据

```bash
npm run seed
```

这会创建：
- 3个测试用户
- 4个测试项目（3个已完成，1个进行中）
- 3个项目报告
- 3个合作记录

### 3. 测试API

#### 健康检查
```bash
curl http://localhost:3000/health
```

#### 获取项目列表 (需要Token)

由于API需要JWT认证，你需要先生成一个测试Token，或者临时禁用认证进行测试。

**方案A: 使用测试Token（推荐）**

创建一个简单的Token生成脚本：

```bash
# 在backend目录
node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { userId: 'test_user_001', openId: 'test_user_001' },
  process.env.JWT_SECRET || 'default-secret-key',
  { expiresIn: '7d' }
);
console.log(token);
"
```

复制生成的Token，然后测试：

```bash
TOKEN="你的token"

# 获取项目列表
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/practice/projects

# 获取统计数据
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/practice/stats

# 获取项目报告（替换PROJECT_ID）
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/practice/projects/PROJECT_ID/report

# 生成AI拆解报告
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"projectId": "PROJECT_ID"}' \
  http://localhost:3000/api/practice/decomposition/generate

# 获取合作伙伴列表
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/contact-exchange/partners
```

**方案B: 临时禁用认证（仅开发测试）**

编辑 `src/routes/practice.routes.ts` 和 `src/routes/contactExchange.routes.ts`，注释掉认证中间件：

```typescript
// router.use(authMiddleware)  // 临时注释
```

然后可以直接访问：

```bash
curl http://localhost:3000/api/practice/projects
curl http://localhost:3000/api/practice/stats
```

## 🤖 测试AI拆解功能

### 前置条件
1. 在 `.env` 中配置有效的 `OPENAI_API_KEY`
2. 确保API Key有GPT-4访问权限
3. 有已完成的项目

### 测试步骤

```bash
# 1. 获取已完成的项目ID
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/practice/projects?status=completed

# 2. 生成AI拆解报告（使用上面获取的projectId）
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"projectId": "你的项目ID"}' \
  http://localhost:3000/api/practice/decomposition/generate

# 响应示例：
# {
#   "success": true,
#   "message": "报告生成中",
#   "preview": {
#     "id": "report-id",
#     "status": "generating",
#     "isUnlocked": false,
#     "preview": {
#       "abilitiesCount": 4,
#       "customerTypesCount": 5,
#       "channelsCount": 4
#     },
#     "abilityPreview": "垂直人群定位能力"
#   }
# }

# 3. 查询生成状态
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/practice/decomposition/REPORT_ID/status

# 4. 解锁报告（模拟付费）
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"paymentAmount": 29.9}' \
  http://localhost:3000/api/practice/decomposition/REPORT_ID/unlock

# 5. 获取完整报告
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/practice/decomposition/REPORT_ID
```

### AI生成内容示例

成功生成后，你会看到5大模块的完整分析：

**1. 能力拆解**
```json
{
  "abilities": [
    {
      "name": "垂直人群定位能力",
      "description": "能够分析特定人群画像，找到差异化切入点",
      "evidence": ["分析了25-35岁职场女性", "挖掘了敏感肌痛点", "..."],
      "marketValue": "这个能力在市场上价值¥3000-8000/次"
    }
  ]
}
```

**2. 问题价值**
```json
{
  "painPoint": "账号投放2个月没起色，内容同质化严重",
  "rootCause": "缺少清晰的人群定位...",
  "metrics": [
    {"label": "互动率", "before": "1.2%", "after": "6.8%"}
  ]
}
```

**3. 目标客户**
```json
{
  "types": [
    {
      "type": "美妆/护肤品牌",
      "painPoints": ["账号冷启动困难", "内容同质化"],
      "applicability": "high",
      "priceRange": "¥3000-8000"
    }
  ]
}
```

**4. 获客渠道**
```json
{
  "channels": [
    {
      "name": "小红书搜索拦截",
      "difficulty": "easy",
      "tactics": ["搜索'账号冷启动'关键词", "主动私信提供价值"]
    }
  ]
}
```

**5. 成长路径**
```json
{
  "foundation": {
    "phase": "基础巩固",
    "duration": "1-3个月",
    "goals": ["完成3-5个不同行业的定位项目"],
    "expectedValue": "客单价稳定在¥5000"
  }
}
```

## 🔍 常见问题

### Q1: API返回401 Unauthorized
**A:** 检查JWT Token是否正确配置，或临时禁用认证进行测试

### Q2: AI生成失败
**A:** 检查：
- OPENAI_API_KEY是否配置
- API Key是否有效
- 是否有GPT-4访问权限
- 网络连接是否正常

### Q3: MongoDB连接失败
**A:** 
```bash
# macOS启动MongoDB
brew services start mongodb-community

# 或使用Docker
docker run -d -p 27017:27017 --name mongo mongo:7
```

### Q4: 端口3000已被占用
**A:** 修改 `.env` 中的 `PORT=3001`

## 📊 性能测试

### AI生成耗时
- 单个模块: ~5-10秒
- 全部5个模块（并行）: ~10-15秒
- Token消耗: ~2000-3000 tokens

### 建议优化
1. 添加Redis缓存，避免重复生成
2. 使用消息队列异步处理
3. 实现生成进度推送

## 🎯 集成测试检查清单

- [ ] 健康检查接口正常
- [ ] 用户认证流程通过
- [ ] 项目列表查询成功
- [ ] 项目报告获取成功
- [ ] 统计数据计算正确
- [ ] AI拆解报告生成成功
- [ ] 付费解锁流程正常
- [ ] 合作伙伴列表显示
- [ ] 联系方式交换功能正常

## 🚀 下一步

测试通过后，可以：
1. 集成微信支付
2. 部署到生产环境
3. 配置域名和HTTPS
4. 设置监控和日志
