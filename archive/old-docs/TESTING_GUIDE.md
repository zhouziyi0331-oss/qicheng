# 启程项目 - 启动和测试指南

## 📋 前置准备

### 1. 环境要求
- Node.js 20+
- Python 3.11+
- PostgreSQL 16+
- Redis 7+
- Docker (可选)

### 2. 环境变量配置

#### 后端 (.env)
```bash
# 数据库
DATABASE_URL=postgresql://postgres:password@localhost:5432/qicheng
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# AI服务
AI_SERVICE_URL=http://localhost:8001
AI_TIMEOUT=10000

# Anthropic API
ANTHROPIC_API_KEY=sk-ant-xxx

# 阿里云OSS
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY_ID=your-access-key
OSS_ACCESS_KEY_SECRET=your-secret-key
OSS_BUCKET=qicheng-uploads

# 环境
NODE_ENV=development
PORT=3000
```

#### AI服务 (.env)
```bash
ANTHROPIC_API_KEY=sk-ant-xxx
PORT=8001
```

#### 前端 (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:3000
```

---

## 🚀 启动服务

### 方法1: 使用一键启动脚本（推荐）

```bash
cd qicheng
chmod +x start-all.sh
./start-all.sh
```

### 方法2: 手动启动各服务

#### 1. 启动数据库服务
```bash
# 使用Docker启动PostgreSQL和Redis
docker-compose up -d postgres redis

# 或使用本地服务
brew services start postgresql@16
brew services start redis
```

#### 2. 执行数据库迁移
```bash
cd backend

# 设置数据库连接
export DATABASE_URL="postgresql://postgres:password@localhost:5432/qicheng"

# 执行迁移
psql $DATABASE_URL -f migrations/000_extensions.sql
psql $DATABASE_URL -f migrations/001_init_schema.sql
psql $DATABASE_URL -f migrations/002_indexes.sql
psql $DATABASE_URL -f migrations/003_seed_data.sql
psql $DATABASE_URL -f migrations/011_new_features.sql

# 验证迁移
psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;"
```

#### 3. 启动后端服务
```bash
cd backend
npm install
npm run dev

# 验证: http://localhost:3000/health
```

#### 4. 启动AI服务
```bash
cd ai-service
pip install -r requirements.txt
python main.py

# 验证: http://localhost:8001/health
```

#### 5. 启动前端
```bash
cd frontend
npm install
npm run dev

# 访问: http://localhost:3002
```

#### 6. 启动小程序（可选）
```bash
cd miniapp
npm install
npm run dev:weapp

# 使用微信开发者工具打开 miniapp 目录
```

---

## 🧪 测试新增功能

### 1. AI拆解指导测试

#### 步骤：
1. 登录学生账号
2. 进入任务大厅，接受一个任务
3. 进入任务详情页
4. 点击"获取AI拆解"按钮
5. 验证返回的步骤、提示和资源

#### API测试：
```bash
# 获取token
TOKEN=$(curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","password":"password123"}' \
  | jq -r '.data.token')

# 测试AI拆解API
curl -X GET http://localhost:3000/api/v1/tasks/{task_id}/breakdown \
  -H "Authorization: Bearer $TOKEN" \
  | jq
```

#### 预期结果：
```json
{
  "success": true,
  "data": {
    "steps": ["步骤1", "步骤2", "步骤3"],
    "tips": ["提示1", "提示2"],
    "resources": ["资源1", "资源2"]
  }
}
```

---

### 2. 跳级挑战测试

#### 步骤：
1. 登录学生账号（等级 < 5）
2. 进入能力图谱页面
3. 点击"🚀 跳级挑战"按钮
4. 完成5道测试题
5. 提交并查看结果

#### API测试：
```bash
# 提交跳级挑战
curl -X POST http://localhost:3000/api/v1/student/level-challenge \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": {
      "q1": ["ChatGPT", "Claude"],
      "q2": "我完成过3个AI辅助的内容创作项目...",
      "q3": "B",
      "q4": "A",
      "q5": "通过分析用户需求，使用AI工具..."
    }
  }' | jq
```

#### 预期结果：
```json
{
  "success": true,
  "data": {
    "passed": true,
    "score": 85,
    "old_level": 1,
    "new_level": 3,
    "level_up": 2
  }
}
```

---

### 3. 学生能力画像测试

#### 步骤：
1. 登录企业账号
2. 进入任务列表
3. 点击某个学生的昵称
4. 查看学生能力画像弹窗

#### API测试：
```bash
# 企业登录
COMPANY_TOKEN=$(curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"13900139000","password":"password123"}' \
  | jq -r '.data.token')

# 查看学生画像
curl -X GET http://localhost:3000/api/v1/tasks/student-profile/{student_id} \
  -H "Authorization: Bearer $COMPANY_TOKEN" \
  | jq
```

#### 预期结果：
```json
{
  "success": true,
  "data": {
    "nickname": "学生USER",
    "opc_label": "AI实践探索者",
    "level": 2,
    "abilities": {
      "d1": 75,
      "d2": 80,
      "d3": 70,
      "d4": 85,
      "d5": 78,
      "d6": 72
    },
    "contact_unlocked": false
  }
}
```

---

### 4. 任务进度查看测试

#### 步骤：
1. 学生接受任务并开始执行
2. 企业或学生进入任务详情页
3. 查看实时进度

#### API测试：
```bash
# 查看任务进度
curl -X GET http://localhost:3000/api/v1/tasks/{task_id}/progress/{assignment_id} \
  -H "Authorization: Bearer $TOKEN" \
  | jq
```

#### 预期结果：
```json
{
  "success": true,
  "data": {
    "status": "in_progress",
    "progress": 60,
    "steps": [
      {
        "step_number": 1,
        "title": "理解任务要求",
        "status": "completed"
      },
      {
        "step_number": 2,
        "title": "开始执行",
        "status": "in_progress"
      }
    ]
  }
}
```

---

### 5. 管理端数据图表测试

#### 步骤：
1. 登录管理员账号
2. 进入管理后台
3. 查看数据看板
4. 验证三个图表正常显示

#### API测试：
```bash
# 管理员登录
ADMIN_TOKEN=$(curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"13700137000","password":"admin123"}' \
  | jq -r '.data.token')

# 获取看板数据
curl -X GET http://localhost:3000/api/v1/admin/dashboard \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | jq
```

#### 预期结果：
```json
{
  "success": true,
  "data": {
    "users": {...},
    "tasks": {...},
    "charts": {
      "userGrowth": [...],
      "taskStatus": [...],
      "monthlyRevenue": [...]
    }
  }
}
```

---

## 🔍 常见问题排查

### 1. 数据库连接失败
```bash
# 检查PostgreSQL是否运行
pg_isready -h localhost -p 5432

# 检查数据库是否存在
psql -U postgres -l | grep qicheng

# 创建数据库（如果不存在）
createdb -U postgres qicheng
```

### 2. Redis连接失败
```bash
# 检查Redis是否运行
redis-cli ping

# 启动Redis
redis-server
```

### 3. AI服务调用失败
```bash
# 检查AI服务是否运行
curl http://localhost:8001/health

# 检查Anthropic API Key
echo $ANTHROPIC_API_KEY

# 查看AI服务日志
cd ai-service
tail -f logs/app.log
```

### 4. 前端API调用失败
```bash
# 检查环境变量
cat frontend/.env.local

# 检查后端是否运行
curl http://localhost:3000/health

# 查看浏览器控制台错误
```

---

## 📊 性能监控

### 1. 后端性能
```bash
# 查看API响应时间
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/api/v1/tasks/market

# curl-format.txt 内容：
# time_total: %{time_total}s
```

### 2. 数据库性能
```sql
-- 查看慢查询
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- 查看表大小
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 3. Redis监控
```bash
# 查看Redis信息
redis-cli info stats

# 查看内存使用
redis-cli info memory
```

---

## 🎯 测试检查清单

- [ ] 数据库迁移成功执行
- [ ] 所有服务正常启动
- [ ] 健康检查接口返回正常
- [ ] AI拆解功能正常工作
- [ ] 跳级挑战功能正常工作
- [ ] 学生能力画像正常显示
- [ ] 任务进度实时更新
- [ ] 管理端图表正常渲染
- [ ] 小程序功能与网页端一致
- [ ] 错误处理和降级方案正常

---

## 📝 下一步

测试完成后，可以进行：
1. 编写自动化测试用例
2. 完善项目文档
3. 准备生产环境部署
4. 性能优化和压力测试

---

**创建时间**: 2026-04-09  
**版本**: v1.1.0
