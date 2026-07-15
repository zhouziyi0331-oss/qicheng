# 启程产品 - 前后端集成检查与系统架构说明

## 📡 前后端连接状态检查

### ✅ 已验证的连接关系

**前端配置 (miniapp/src/services/api.ts)**
```typescript
const BASE_URL = getApiUrl('/api/v1')
// 所有请求格式: BASE_URL + endpoint
// 例如: /api/v1/case-library/search
```

**后端路由注册 (backend/src/app.ts:376-389)**
```typescript
app.use('/api/v1/case-library', caseLibraryRoutes)              // ✅ 匹配
app.use('/api/v1/mentor-relationship', mentorRelationshipRoutes) // ✅ 匹配
app.use('/api/v1/opc-stories', opcStoryRoutes)                  // ✅ 匹配
app.use('/api/v1/company-student-bridge', companyStudentBridgeRoutes) // ✅ 匹配
app.use('/api/v1/demand-decomposition', demandDecompositionRoutes)    // ✅ 匹配
```

### 🔍 需要修复的前端API调用路径

**问题1：案例库API路径不匹配**
- 前端: `/case-library/search`
- 后端: `/api/v1/case-library/...`
- ❌ 前端应该使用相对路径，但BASE_URL已包含 `/api/v1`

**问题2：前端API调用缺少基础路径前缀**
- 某些API调用直接使用 `/case-library/xxx` 
- 应该使用完整路径或确保BASE_URL正确拼接

---

## 🏗️ 系统架构与模块分工边界

### 1️⃣ **核心架构层次**

```
┌─────────────────────────────────────────────────────────────┐
│                     用户界面层 (Frontend)                     │
│  Taro + React 小程序 (miniapp/src/pages)                    │
└─────────────────────────────────────────────────────────────┘
                              ↓ HTTP REST API
┌─────────────────────────────────────────────────────────────┐
│                    API网关层 (Routes)                        │
│  Express路由 (backend/src/routes)                           │
│  - 鉴权中间件 (requireAuth, requireRole)                     │
│  - 请求验证                                                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   业务逻辑层 (Services)                       │
│  backend/src/services                                       │
│  - 核心业务逻辑                                              │
│  - 数据处理与计算                                            │
│  - 外部服务集成                                              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    数据持久层 (Database)                      │
│  PostgreSQL + migrations                                    │
└─────────────────────────────────────────────────────────────┘
```

---

### 2️⃣ **业务模块分工边界**

#### **A. 身份认知系统** (Identity & Growth)
- **负责人**: opcV2PersonalityService, opcIdentityCardService
- **职责**:
  - OPC人格测评（38题、六维度）
  - 身份卡片生成与分享
  - 人格标签推断
- **数据表**: opc_test_results, opc_identity_cards
- **API端点**: `/api/v1/opc/*`

#### **B. 资产可视化系统** (Asset Dashboard)
- **负责人**: assetDashboardService, growthComparisonService
- **职责**:
  - 能力估值计算（市场价值、成长趋势）
  - 资产仪表盘数据聚合
  - 入驻时vs当前对比
- **数据表**: asset_snapshots, growth_comparison_snapshots
- **API端点**: `/api/v1/asset-dashboard/*`, `/api/v1/growth-comparison/*`

#### **C. 游戏化成长系统** (Gamification)
- **负责人**: growthTrackingService, levelUpService
- **职责**:
  - 升级通关仪式
  - 思考值、碎片、徽章
  - 成长轨迹记录
- **数据表**: level_up_ceremonies, badges, growth_events
- **API端点**: `/api/v1/level-up/*`

#### **D. AI导师系统** (Mentor AI)
- **负责人**: mentorService, mentorContextEnhancer, mentorPromptService
- **职责**:
  - 苏格拉底式对话
  - 情绪检测与羞耻感消除
  - 真实案例引用
  - 多Agent编排（PBL、Debug、Career）
- **数据表**: mentor_sessions, mentor_messages, mentor_growth_observations
- **API端点**: `/api/v1/mentor/*`

#### **E. 案例库系统** (Case Library)
- **负责人**: caseLibraryService
- **职责**:
  - 从导师观察中提取案例
  - 案例搜索与推荐
  - 有帮助度投票
- **数据表**: case_library, case_helpfulness_votes
- **API端点**: `/api/v1/case-library/*`

#### **F. 引路人机制** (Mentor Relationship)
- **负责人**: mentorRelationshipService
- **职责**:
  - 资格检查（任务数、等级、评分）
  - 引路人匹配（OPC相似度、专业匹配）
  - 互动记录
- **数据表**: mentor_relationships, mentor_interactions, mentor_qualifications
- **API端点**: `/api/v1/mentor-relationship/*`

#### **G. 故事墙系统** (OPC Stories)
- **负责人**: opcStoryService
- **职责**:
  - 故事发布与审核
  - 基于OPC和情绪标签的推荐
  - 共鸣、点赞、评论
- **数据表**: opc_stories, opc_story_likes, opc_story_resonances
- **API端点**: `/api/v1/opc-stories/*`

#### **H. 企业-学生打通** (Company-Student Bridge)
- **负责人**: companyStudentBridgeService
- **职责**:
  - 学生成长通知推送
  - 企业声誉标签管理
  - 订阅与通知偏好
- **数据表**: student_growth_notifications, company_student_reputation_tags
- **API端点**: `/api/v1/company-student-bridge/*`

#### **I. 需求拆解推送** (Demand Decomposition)
- **负责人**: demandDecompositionService
- **职责**:
  - Claude API调用（需求智能拆解）
  - 子任务推送匹配（技能、难度、经验）
  - 响应与接受率统计
- **数据表**: demand_decompositions, subtasks, subtask_push_records
- **API端点**: `/api/v1/demand-decomposition/*`

---

### 3️⃣ **跨模块协作边界**

#### **协作1: AI导师 ↔ 案例库**
```
mentorContextEnhancer.getRealStuckCase()
  → 查询 case_library（优先）
  → 降级查询 mentor_growth_observations
```

#### **协作2: 成长系统 ↔ 企业通知**
```
growthTrackingService.addExperience()
  → 触发等级提升
  → companyStudentBridgeService.recordMilestone()
  → 通知订阅的企业
```

#### **协作3: 引路人 ↔ OPC系统**
```
mentorRelationshipService.findMentorForStudent()
  → 读取 opc_test_results.personality_type
  → 计算OPC相似度得分（30分权重）
```

#### **协作4: 需求拆解 ↔ 学生能力**
```
demandDecompositionService.pushSubtaskToStudents()
  → 读取 student_profiles（等级、技能、评分）
  → 计算匹配分数（100分制）
```

---

### 4️⃣ **Agent分工（AI相关）**

#### **Agent 1: PBL导师** (pblAgentService)
- **触发场景**: 项目式学习、长周期任务
- **职责**: 阶段分解、里程碑规划、进度跟进
- **独立性**: 独立会话上下文，不与主导师共享

#### **Agent 2: Debug导师** (debugAgentService)
- **触发场景**: 代码卡住、测试失败
- **职责**: 错误诊断、解决方案推荐、代码审查
- **独立性**: 独立会话，专注技术问题

#### **Agent 3: Career导师** (careerAgentService)
- **触发场景**: 职业规划、技能提升路径
- **职责**: 行业趋势分析、能力差距识别、学习路径推荐
- **独立性**: 独立会话，长期规划视角

#### **Agent 4: 需求拆解Agent** (Claude API)
- **触发场景**: 企业发布大需求
- **职责**: 将大任务拆解为独立可交付的子任务
- **独立性**: 无状态，单次调用完成

#### **协调机制**:
```
orchestratorService (编排器)
  → 根据学生状态和上下文选择合适的Agent
  → 保持各Agent会话隔离
  → 汇总各Agent输出到主界面
```

---

## 🔧 需要修复的问题

### 1. 前端API路径修复

前端 `api.ts` 中的路径应该是相对于 `BASE_URL` 的，需要确保：
- ✅ 正确: `request('/case-library/search')`（会拼接为 `/api/v1/case-library/search`）
- ❌ 错误: `request('/api/v1/case-library/search')`（会拼接为 `/api/v1/api/v1/...`）

### 2. 缺失的路由文件验证

需要确认以下路由文件是否存在：
- `mentorRelationshipRoutes.ts` ✅
- `companyStudentBridgeRoutes.ts` ✅  
- `opcStoryRoutes.ts` ✅
- `demandDecompositionRoutes.ts` ✅

### 3. API参数对齐检查

需要验证前端调用参数与后端期望参数是否一致（类型、必填项、命名）。

---

## ✅ 验证建议

1. **启动后端服务**: `cd backend && npm run dev`
2. **检查路由注册**: 查看启动日志确认所有路由已加载
3. **API测试**: 使用Postman/curl测试各端点
4. **前端联调**: 小程序连接本地后端，测试完整流程

需要我帮你修复这些路径问题吗？
