# 启程项目 - 系统测试计划

生成时间: 2026-05-03

---

## 📋 测试概览

### 测试目标
验证已实现的140+个API端点和33个前端页面的功能完整性、性能和用户体验。

### 测试范围
- ✅ 后端API: 17个模块，~140个端点
- ✅ 前端页面: 37个页面（33个有API调用）
- ✅ 端到端流程: 5个核心业务流程
- ✅ 性能测试: 响应时间、并发处理
- ✅ 安全测试: 认证、授权、数据验证

---

## 🎯 Phase 1: 核心功能测试（P0 - 立即执行）

### 1.1 认证系统测试

#### 测试用例 1: 用户注册
```bash
# 测试注册API
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13800138000",
    "password": "Test123456",
    "code": "123456",
    "role": "student"
  }'
```

**预期结果**:
- ✅ 返回 201 状态码
- ✅ 返回 JWT token
- ✅ 返回用户基本信息
- ✅ 数据库创建用户记录

#### 测试用例 2: 用户登录
```bash
# 测试登录API
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13800138000",
    "password": "Test123456"
  }'
```

**预期结果**:
- ✅ 返回 200 状态码
- ✅ 返回有效的 JWT token
- ✅ Token 包含用户ID和角色信息

#### 测试用例 3: 获取当前用户信息
```bash
# 测试获取用户信息API
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**预期结果**:
- ✅ 返回 200 状态码
- ✅ 返回完整用户信息
- ✅ 无token时返回 401

---

### 1.2 OPC测评系统测试

#### 测试用例 4: 获取测评题目
```bash
# 测试获取OPC题目
curl -X GET http://localhost:3000/api/v1/opc/questions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**预期结果**:
- ✅ 返回 36 道题目
- ✅ 每题包含 6 个维度的权重
- ✅ 题目格式正确（question, options, weights）

#### 测试用例 5: 提交测评答案
```bash
# 测试提交OPC答案
curl -X POST http://localhost:3000/api/v1/opc/submit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": [
      {"questionId": 1, "answer": "A"},
      {"questionId": 2, "answer": "B"},
      ...
    ]
  }'
```

**预期结果**:
- ✅ 返回 200 状态码
- ✅ 计算六维得分（d1-d6）
- ✅ 返回人格类型
- ✅ 返回职业建议

#### 测试用例 6: 获取测评结果
```bash
# 测试获取OPC结果
curl -X GET http://localhost:3000/api/v1/opc/result \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**预期结果**:
- ✅ 返回六维雷达图数据
- ✅ 返回人格标签
- ✅ 返回成长建议

---

### 1.3 任务系统测试

#### 测试用例 7: 获取推荐任务
```bash
# 测试AI任务匹配
curl -X GET http://localhost:3000/api/v1/tasks/matched \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**预期结果**:
- ✅ 返回匹配度排序的任务列表
- ✅ 每个任务包含匹配分数
- ✅ 基于OPC结果推荐

#### 测试用例 8: 申请任务
```bash
# 测试申请任务
curl -X POST http://localhost:3000/api/v1/tasks/123/apply \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "我对这个任务很感兴趣"
  }'
```

**预期结果**:
- ✅ 返回 200 状态码
- ✅ 创建任务申请记录
- ✅ 发送通知给企业

#### 测试用例 9: 提交任务
```bash
# 测试提交任务
curl -X POST http://localhost:3000/api/v1/tasks/123/submit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deliverables": "https://example.com/work.pdf",
    "description": "已完成所有要求"
  }'
```

**预期结果**:
- ✅ 任务状态更新为 "submitted"
- ✅ 触发AI审核
- ✅ 通知企业审核

---

### 1.4 AI导师系统测试

#### 测试用例 10: 发送消息给AI导师
```bash
# 测试AI导师对话
curl -X POST http://localhost:3000/api/v1/mentor/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "我对未来感到迷茫，不知道该做什么"
  }'
```

**预期结果**:
- ✅ 返回AI生成的回复
- ✅ 回复基于学生的OPC结果
- ✅ 保存对话历史

#### 测试用例 11: 获取对话历史
```bash
# 测试获取对话历史
curl -X GET http://localhost:3000/api/v1/mentor/history \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**预期结果**:
- ✅ 返回完整对话历史
- ✅ 按时间倒序排列
- ✅ 包含消息内容和时间戳

---

### 1.5 能力系统测试

#### 测试用例 12: 获取能力雷达图
```bash
# 测试获取能力数据
curl -X GET http://localhost:3000/api/v1/ability/radar \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**预期结果**:
- ✅ 返回六维能力数据（d1-d6）
- ✅ 返回等级和总分
- ✅ 返回排名信息

#### 测试用例 13: 任务完成后更新能力
```bash
# 测试能力更新
curl -X POST http://localhost:3000/api/v1/ability/update-after-task \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "123",
    "taskType": "design",
    "rating": 5
  }'
```

**预期结果**:
- ✅ 相关能力维度增加
- ✅ 返回更新后的能力数据
- ✅ 检查是否升级

---

## 🎯 Phase 2: 前端集成测试（P0 - 立即执行）

### 2.1 学生端小程序测试

#### 测试流程 1: 完整注册登录流程
1. 打开学生端小程序
2. 点击"注册"
3. 输入手机号: 13800138001
4. 获取验证码
5. 输入验证码和密码
6. 完成注册
7. 自动登录

**验证点**:
- [ ] 注册成功后自动登录
- [ ] Token 正确保存到本地存储
- [ ] 跳转到首页

#### 测试流程 2: OPC测评完整流程
1. 登录后点击"开始测评"
2. 完成36道题目
3. 提交答案
4. 查看测评结果
5. 查看六维雷达图
6. 查看职业建议

**验证点**:
- [ ] 36题全部显示
- [ ] 答案可以正常选择
- [ ] 进度条正确显示
- [ ] 提交后显示结果
- [ ] 雷达图正确渲染
- [ ] 职业建议显示

#### 测试流程 3: 任务浏览和申请
1. 进入"任务市场"
2. 浏览推荐任务
3. 点击任务查看详情
4. 点击"申请任务"
5. 填写申请理由
6. 提交申请
7. 查看"我的任务"

**验证点**:
- [ ] 任务列表正确加载
- [ ] 任务详情显示完整
- [ ] 申请成功提示
- [ ] "我的任务"中显示申请的任务

#### 测试流程 4: AI导师对话
1. 进入"AI导师"页面
2. 输入问题："我不知道自己适合做什么"
3. 发送消息
4. 查看AI回复
5. 继续对话

**验证点**:
- [ ] 消息发送成功
- [ ] AI回复及时显示
- [ ] 对话历史保存
- [ ] 界面流畅

#### 测试流程 5: 能力图谱查看
1. 进入"能力图谱"页面
2. 查看六维雷达图
3. 查看能力详情
4. 查看成长建议

**验证点**:
- [ ] 雷达图正确渲染
- [ ] 六维数据显示
- [ ] 等级和排名显示
- [ ] 建议内容显示

---

## 🎯 Phase 3: 端到端业务流程测试（P1）

### 3.1 完整任务流程测试

#### E2E测试 1: 从发布到完成
1. **企业端**: 发布任务
2. **系统**: AI匹配学生
3. **学生端**: 查看推荐任务
4. **学生端**: 申请任务
5. **企业端**: 审核申请
6. **企业端**: 接受申请
7. **学生端**: 开始任务
8. **学生端**: 更新进度
9. **学生端**: 提交作品
10. **系统**: AI审核
11. **企业端**: 最终验收
12. **系统**: 发放报酬
13. **学生端**: 查看余额增加
14. **系统**: 更新能力值

**验证点**:
- [ ] 每个步骤状态正确
- [ ] 通知及时发送
- [ ] 金额计算正确
- [ ] 能力值正确更新

---

## 🎯 Phase 4: 性能测试（P1）

### 4.1 API响应时间测试

#### 性能指标
- 认证API: < 100ms
- 查询API: < 200ms
- 复杂计算API (OPC): < 500ms
- AI对话API: < 2000ms

#### 测试工具
```bash
# 使用 Apache Bench 测试
ab -n 1000 -c 10 http://localhost:3000/api/v1/tasks/matched
```

#### 测试场景
1. **并发登录**: 100个用户同时登录
2. **任务列表**: 50个用户同时查询任务
3. **OPC提交**: 20个用户同时提交测评
4. **AI对话**: 10个用户同时对话

**目标**:
- [ ] 95%请求 < 200ms
- [ ] 99%请求 < 500ms
- [ ] 无请求失败
- [ ] 无内存泄漏

---

## 🎯 Phase 5: 安全测试（P1）

### 5.1 认证授权测试

#### 测试用例 14: 无Token访问保护接口
```bash
curl -X GET http://localhost:3000/api/v1/tasks/matched
```

**预期结果**:
- ✅ 返回 401 Unauthorized
- ✅ 返回错误信息

#### 测试用例 15: 过期Token访问
```bash
curl -X GET http://localhost:3000/api/v1/tasks/matched \
  -H "Authorization: Bearer EXPIRED_TOKEN"
```

**预期结果**:
- ✅ 返回 401 Unauthorized
- ✅ 提示Token过期

#### 测试用例 16: 跨角色访问
```bash
# 学生Token访问企业接口
curl -X GET http://localhost:3000/api/v1/company/dashboard \
  -H "Authorization: Bearer STUDENT_TOKEN"
```

**预期结果**:
- ✅ 返回 403 Forbidden
- ✅ 提示权限不足

### 5.2 SQL注入测试

#### 测试用例 17: SQL注入尝试
```bash
curl -X GET "http://localhost:3000/api/v1/tasks?search='; DROP TABLE users; --" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**预期结果**:
- ✅ 参数被正确转义
- ✅ 数据库未受影响
- ✅ 返回正常结果或错误

### 5.3 XSS测试

#### 测试用例 18: XSS脚本注入
```bash
curl -X POST http://localhost:3000/api/v1/tasks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "<script>alert(\"XSS\")</script>",
    "description": "Normal description"
  }'
```

**预期结果**:
- ✅ 脚本被转义或拒绝
- ✅ 数据库存储安全内容
- ✅ 前端显示时不执行脚本

---

## 📊 测试报告模板

### 测试执行记录

| 测试用例 | 状态 | 执行时间 | 备注 |
|---------|------|---------|------|
| 用户注册 | ⏳ | - | - |
| 用户登录 | ⏳ | - | - |
| OPC测评 | ⏳ | - | - |
| 任务匹配 | ⏳ | - | - |
| AI导师 | ⏳ | - | - |
| 能力更新 | ⏳ | - | - |

### 性能测试结果

| API端点 | 平均响应时间 | P95 | P99 | 状态 |
|---------|-------------|-----|-----|------|
| /auth/login | - | - | - | ⏳ |
| /tasks/matched | - | - | - | ⏳ |
| /opc/submit | - | - | - | ⏳ |
| /mentor/chat | - | - | - | ⏳ |

### 发现的问题

| 问题ID | 严重程度 | 描述 | 状态 |
|--------|---------|------|------|
| - | - | - | - |

---

## 🚀 测试执行计划

### Week 1: 核心功能测试
- Day 1-2: 认证系统 + OPC测评
- Day 3-4: 任务系统 + AI导师
- Day 5: 能力系统 + 其他模块

### Week 2: 集成测试
- Day 1-2: 前端页面测试
- Day 3-4: 端到端流程测试
- Day 5: 修复发现的问题

### Week 3: 性能和安全测试
- Day 1-2: 性能测试和优化
- Day 3-4: 安全测试和加固
- Day 5: 最终验证和报告

---

## ✅ 测试完成标准

- [ ] 所有P0测试用例通过
- [ ] 核心业务流程端到端验证
- [ ] API响应时间达标
- [ ] 无严重安全漏洞
- [ ] 前端页面功能正常
- [ ] 测试覆盖率 > 80%
- [ ] 生成完整测试报告

---

**下一步**: 开始执行 Phase 1 核心功能测试
