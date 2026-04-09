# 测试文档

## 测试文件说明

### 1. 单元测试
**文件**: `backend/src/__tests__/new-features.test.ts`

使用Jest和Supertest进行API单元测试，覆盖5个新增API的所有场景。

**运行方式**:
```bash
cd backend
npm test -- new-features.test.ts
```

**测试覆盖**:
- ✅ AI拆解指导API (3个测试用例)
- ✅ 跳级挑战API (3个测试用例)
- ✅ 学生能力画像API (3个测试用例)
- ✅ 任务进度查看API (3个测试用例)
- ✅ 管理端数据API (2个测试用例)

**总计**: 14个测试用例

---

### 2. 端到端测试
**文件**: `test-e2e.sh`

使用Bash脚本进行完整的端到端测试，模拟真实用户操作流程。

**运行方式**:
```bash
cd qicheng
./test-e2e.sh
```

**测试流程**:
1. 检查服务状态
2. 学生登录
3. 企业登录
4. 获取任务列表
5. 测试AI拆解指导
6. 测试跳级挑战
7. 测试学生能力画像
8. 测试任务进度查看

---

## 测试环境准备

### 1. 安装依赖
```bash
# 后端
cd backend
npm install

# 前端
cd frontend
npm install
```

### 2. 配置测试数据库
```bash
# 创建测试数据库
createdb qicheng_test

# 设置环境变量
export NODE_ENV=test
export DATABASE_URL="postgresql://postgres:password@localhost:5432/qicheng_test"

# 执行迁移
npm run db:migrate
```

### 3. 创建测试用户
```sql
-- 学生账号
INSERT INTO users (phone, password_hash, role, nickname)
VALUES ('13800138000', '$2a$10$...', 'student', 'Test Student');

-- 企业账号
INSERT INTO users (phone, password_hash, role)
VALUES ('13900139000', '$2a$10$...', 'company');

-- 管理员账号
INSERT INTO users (phone, password_hash, role)
VALUES ('13700137000', '$2a$10$...', 'admin');
```

---

## 运行所有测试

### 方法1: 使用npm脚本
```bash
cd backend
npm test
```

### 方法2: 运行特定测试
```bash
# 只运行新功能测试
npm test -- new-features.test.ts

# 运行所有API测试
npm test -- --testPathPattern=api

# 查看测试覆盖率
npm test -- --coverage
```

### 方法3: 运行端到端测试
```bash
# 确保所有服务已启动
./start-all.sh

# 运行E2E测试
./test-e2e.sh
```

---

## 测试结果示例

### 单元测试输出
```
PASS  src/__tests__/new-features.test.ts
  New Features API Tests
    GET /api/v1/tasks/:id/breakdown
      ✓ 应该成功获取任务拆解指导 (245ms)
      ✓ 未接单的任务应该返回404 (89ms)
      ✓ 未登录应该返回401 (45ms)
    POST /api/v1/student/level-challenge
      ✓ 应该成功提交跳级挑战 (312ms)
      ✓ 答案格式错误应该返回400 (67ms)
      ✓ 7天内重复挑战应该返回400 (123ms)
    ...

Test Suites: 1 passed, 1 total
Tests:       14 passed, 14 total
Snapshots:   0 total
Time:        5.234s
```

### 端到端测试输出
```
==========================================
启程项目 - 端到端测试
==========================================

[INFO] 检查服务状态...
[INFO] ✅ 后端服务运行正常

[INFO] 步骤1: 学生登录
[INFO] ✅ 学生登录成功 (ID: abc-123)

[INFO] 步骤2: 企业登录
[INFO] ✅ 企业登录成功

[INFO] 步骤3: 获取任务列表
[INFO] ✅ 获取到任务 (ID: task-456)

[INFO] 步骤4: 测试AI拆解指导
[INFO] ✅ AI拆解指导 - 通过 (状态码: 200)

[INFO] 步骤5: 测试跳级挑战
[INFO] ✅ 跳级挑战提交 - 通过 (状态码: 200)

==========================================
测试结果汇总
==========================================
总测试数: 6
通过: 6
失败: 0

✅ 所有测试通过！
```

---

## 常见测试问题

### 1. 测试数据库连接失败
```bash
# 检查数据库是否运行
pg_isready -h localhost -p 5432

# 检查环境变量
echo $DATABASE_URL

# 重新创建测试数据库
dropdb qicheng_test
createdb qicheng_test
npm run db:migrate
```

### 2. 测试超时
```bash
# 增加Jest超时时间
npm test -- --testTimeout=10000
```

### 3. 端到端测试失败
```bash
# 检查所有服务是否运行
curl http://localhost:3000/health
curl http://localhost:8001/health
curl http://localhost:3002

# 查看服务日志
tail -f backend/logs/app.log
tail -f ai-service/logs/app.log
```

### 4. Mock数据问题
如果AI服务不可用，测试会使用降级方案。确保降级逻辑正常工作。

---

## 持续集成配置

### GitHub Actions示例
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd backend
          npm ci
      
      - name: Run migrations
        run: |
          cd backend
          npm run db:migrate
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/qicheng_test
      
      - name: Run tests
        run: |
          cd backend
          npm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/qicheng_test
          REDIS_URL: redis://localhost:6379
```

---

## 测试最佳实践

1. **隔离测试**: 每个测试用例独立，不依赖其他测试
2. **清理数据**: 测试后清理创建的数据
3. **Mock外部服务**: 对AI服务等外部依赖进行Mock
4. **覆盖边界情况**: 测试正常流程和异常情况
5. **保持测试快速**: 单元测试应在几秒内完成

---

## 下一步

- [ ] 增加前端组件测试
- [ ] 增加性能测试
- [ ] 增加安全测试
- [ ] 配置CI/CD自动测试
- [ ] 增加测试覆盖率报告

---

**创建时间**: 2026-04-09  
**版本**: v1.1.0
