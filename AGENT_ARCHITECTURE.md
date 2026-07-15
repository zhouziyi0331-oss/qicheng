# Agent管理边界与协调逻辑详解

## 🎯 核心架构：事件驱动的Agent编排系统

### 一、编排器核心职责（Orchestrator）

**文件**: `backend/src/orchestrator/agentOrchestrator.ts`

```
┌────────────────────────────────────────────────┐
│         AgentOrchestrator (编排器核心)          │
│  职责：                                         │
│  1. 监听系统事件                                 │
│  2. 决定唤醒哪个/哪些Agent                       │
│  3. 管理Agent间协作（串行/并行）                  │
│  4. 统一记忆读写接口                             │
│  5. 记录事件日志与性能监控                       │
└────────────────────────────────────────────────┘
```

**核心机制**：
- **事件路由表** (`eventAgentMap`): 每个事件类型 → 对应的Agent列表
- **串行执行**: 多个Agent按顺序调用，前一个失败不影响后续
- **超时保护**: 每个Agent调用30秒超时
- **日志记录**: 所有事件和调用结果存入 `orchestrator_event_log` 表

---

## 🤖 Agent分类与职责边界

### 类型A：**主导师Agent** (mentorCompanionAgent)
**状态**: ✅ 已实现（增强版）
**触发事件**: 
- `STUDENT_MESSAGE` - 学生主动对话
- `TASK_ACCEPTED` - 任务接取欢迎
- `TASK_COMPLETED` - 任务完成祝贺
- `EMOTION_DISTRESS` - 情绪低落安慰
- `STUCK_DETECTED` - 卡壳引导
- `PROACTIVE_CHECKIN_TRIGGER` - 主动关怀

**职责边界**:
```typescript
mentorCompanionAgent {
  职责：
    ✅ 苏格拉底式对话引导
    ✅ 情绪检测与安慰（羞耻感消除）
    ✅ 从案例库引用真实案例
    ✅ 12种触发场景的个性化响应
    ✅ 6层记忆系统管理
    
  不负责：
    ❌ 项目式学习的阶段规划（PBL Agent职责）
    ❌ 代码调试诊断（Debug Agent职责）
    ❌ 职业路径规划（Career Agent职责）
    ❌ 需求拆解（Demand Parser Agent职责）
}
```

**12种触发场景** (`MentorTrigger` 枚举):
1. `USER_INITIATED` - 学生主动对话
2. `TASK_ACCEPTED` - 任务接取
3. `STUCK_HELP_REQUEST` - 主动求助
4. `EMOTIONAL_DISTRESS_DETECTED` - 情绪低落
5. `TASK_COMPLETED` - 任务完成
6. `PROACTIVE_CHECKIN` - 主动关怀
7. `TASK_REJECTED_COMFORT` - 质控打回安慰
8. `MILESTONE_REACHED` - 里程碑达成
9. `LONG_SILENCE` - 长时间未活跃
10. `BREAKTHROUGH_MOMENT` - 突破性时刻
11. `PATTERN_RECOGNITION` - 模式识别
12. `RELATIONSHIP_DEEPENING` - 关系深化

**会话隔离**:
- 每个对话有独立 `sessionId`
- 记忆分6层（L1即时 → L6关系）
- 与其他Agent不共享上下文

---

### 类型B：**PBL Agent** (PBL项目式学习导师)
**状态**: ✅ 已实现
**文件**: `backend/src/services/pblAgentService.ts`
**触发方式**: 学生主动选择"PBL模式"

**职责边界**:
```typescript
PBLAgent {
  职责：
    ✅ 分析用户初始问题 → 提取学习目标
    ✅ 生成苏格拉底式开场问题
    ✅ 项目分阶段管理（milestones）
    ✅ 反思日记（retrospective）生成
    ✅ 长周期项目进度跟进
    
  不负责：
    ❌ 通用对话（主导师职责）
    ❌ 情绪安慰（主导师职责）
    ❌ 快速答疑（主导师职责）
}
```

**独立会话**:
- 独立的 `pbl_projects` 表
- 独立的 `pbl_socratic_dialogues` 对话表
- 与主导师完全隔离，互不影响

**数据表**:
```sql
pbl_projects          -- 项目总表
pbl_milestones        -- 里程碑
pbl_socratic_dialogues -- 苏格拉底式对话记录
pbl_retrospectives    -- 反思日记
```

---

### 类型C：**需求拆解Agent** (demandParserAgent)
**状态**: ✅ 已实现
**触发事件**: `ENTERPRISE_POST_TASK` - 企业发布大需求

**职责边界**:
```typescript
demandParserAgent {
  职责：
    ✅ 调用Claude API分析大需求
    ✅ 拆解为独立可交付的子任务
    ✅ 评估每个子任务的技能、难度、工时
    ✅ 保存拆解结果到数据库
    
  不负责：
    ❌ 子任务推送给学生（由 demandDecompositionService 负责）
    ❌ 学生接受/拒绝逻辑（由 demandDecompositionService 负责）
    ❌ 对话引导（主导师职责）
}
```

**无状态特性**:
- 单次调用完成，无会话保持
- 直接调用Claude API（不走mentorService）
- 结果存入 `demand_decompositions` 和 `subtasks` 表

**调用流程**:
```
企业发布需求
  → orchestrator.triggerEvent(ENTERPRISE_POST_TASK)
  → demandParserAgent.handler()
  → taskBreakdownService.breakdownTask()
  → Claude API调用
  → 返回拆解结果
  → 保存到数据库
```

---

### 类型D：**报告生成Agent** (reportGeneratorAgent)
**状态**: ✅ 已实现
**触发事件**: 
- `GENERATE_REPORT` - 主动生成
- `REPORT_PURCHASE` - 企业购买
- `LEVEL_UPGRADED` - 升级触发

**职责边界**:
```typescript
reportGeneratorAgent {
  职责：
    ✅ 聚合学生成长数据（任务、技能、轨迹）
    ✅ 生成多维度报告（综合/摘要/成长）
    ✅ AI生成文案（亮点、建议、趋势分析）
    ✅ 保存报告到数据库
    
  不负责：
    ❌ 报告展示UI（前端职责）
    ❌ 报告推送通知（reportTriggerService职责）
    ❌ 对话交互（主导师职责）
}
```

**数据来源**:
```sql
SELECT 数据 FROM
  tasks              -- 任务记录
  growth_events      -- 成长事件
  ability_map        -- 能力图谱
  mentor_sessions    -- 导师对话
  opc_test_results   -- OPC人格测评
```

---

### 类型E：**升级通关仪式Agent** (levelUpCeremonyAgent)
**状态**: ✅ 已实现 (Phase 1.4)
**触发事件**: `LEVEL_UPGRADED`

**职责边界**:
```typescript
levelUpCeremonyAgent {
  职责：
    ✅ 生成个性化升级文案（基于OPC）
    ✅ 解锁新权益和功能
    ✅ 触发通关动画数据
    ✅ 推送升级通知
    
  不负责：
    ❌ 经验值计算（growthTrackingService职责）
    ❌ 等级判定（growthTrackingService职责）
    ❌ UI渲染（前端职责）
}
```

---

### 类型F：**占位Agent** (未来实现)

#### 1. **天赋测评Agent** (talentAssessmentAgent)
**状态**: 🚧 Phase R3规划
**触发**: `STUDENT_REGISTERED` - 学生注册
**职责**: 新用户onboarding引导、初始能力评估

#### 2. **质控Agent** (qualityControlAgent)
**状态**: 🚧 Phase R2规划
**触发**: `TASK_SUBMITTED` - 任务提交
**职责**: 自动化质量检查、反馈生成

#### 3. **进度提醒Agent** (schedulerAgent)
**状态**: 🚧 Phase R2规划
**触发**: `DEADLINE_APPROACHING` - 截止日期临近
**职责**: 智能提醒、进度催促

---

## 🔀 Agent协调逻辑

### 1. **串行协作** (Sequential)
**场景**: 任务提交后，先质控再安慰

```typescript
// 事件路由配置
this.eventAgentMap.set(
  AgentEvent.TASK_SUBMITTED, 
  ['qualityControlAgent', 'mentorCompanionAgent']  // 按顺序执行
);
```

**执行流程**:
```
任务提交事件触发
  ↓
1. qualityControlAgent 检查质量
  → 返回结果 {passed: false, issues: [...]}
  ↓
2. mentorCompanionAgent 收到上一步结果
  → 根据质控结果安慰学生
  → 引导修改
```

**特点**:
- 前一个Agent的输出作为后一个的输入
- 某个Agent失败不影响后续（记录错误但继续）
- 适合需要上下文传递的场景

---

### 2. **并行协作** (Parallel)
**场景**: 升级时同时触发报告生成和通关仪式

```typescript
this.eventAgentMap.set(
  AgentEvent.LEVEL_UPGRADED,
  ['reportTriggerAgent', 'levelUpCeremonyAgent']  // 同时执行
);
```

**执行流程**:
```
升级事件触发
  ↓
  ├── reportTriggerAgent（异步）
  │     → 生成成长报告
  │     → 保存到数据库
  │
  └── levelUpCeremonyAgent（异步）
        → 生成通关文案
        → 触发前端动画
  
最后等待所有Agent完成
```

**特点**:
- 所有Agent同时启动
- 互不依赖，并发执行
- 整体耗时 = 最慢Agent的耗时

---

### 3. **触发链** (Trigger Chain)
**场景**: 升级 → 报告生成 → 企业通知

```typescript
// 升级触发报告
AgentEvent.LEVEL_UPGRADED 
  → reportTriggerAgent
  → reportGeneratorAgent.generateReport()
  
// 报告生成后触发企业通知
reportGeneratorAgent.generateReport()
  → companyStudentBridgeService.notifySubscribedCompanies()
  → 推送给关注该学生的企业
```

**跨模块协作示例**:
```typescript
// 学生升级
growthTrackingService.addExperience(userId, 100)
  → 检测到等级提升
  → orchestrator.triggerEvent(LEVEL_UPGRADED)
  → levelUpCeremonyAgent 生成仪式
  → reportTriggerAgent 生成报告
  → companyStudentBridgeService.recordMilestone()
  → 通知订阅的企业
```

---

## 🧠 记忆系统：跨Agent共享机制

### 6层记忆架构

```
┌─────────────────────────────────────────────────┐
│ L1: 即时上下文 (SessionContext)                   │
│ - 当前会话ID、对话历史、情绪状态                    │
│ - 范围: 仅当前会话                                 │
│ - 存储: 内存 (5分钟后过期)                         │
└─────────────────────────────────────────────────┘
           ↓ 汇总到
┌─────────────────────────────────────────────────┐
│ L2: 任务记忆 (TaskContext)                       │
│ - 当前任务的卡点、提示、情绪时间线                  │
│ - 范围: 单个任务周期                               │
│ - 存储: mentor_task_context表                    │
└─────────────────────────────────────────────────┘
           ↓ 汇总到
┌─────────────────────────────────────────────────┐
│ L3: 近期摘要 (RecentSummary)                     │
│ - 30天内任务数、常见卡点类型、情绪趋势              │
│ - 范围: 近30天                                    │
│ - 存储: 动态查询聚合                               │
└─────────────────────────────────────────────────┘
           ↓ 提炼到
┌─────────────────────────────────────────────────┐
│ L4: 成长档案 (GrowthArchive)                     │
│ - 历史里程碑、任务微报告、能力快照                  │
│ - 范围: 全历史                                    │
│ - 存储: growth_events, task_micro_reports表      │
└─────────────────────────────────────────────────┘
           ↓ 提炼到
┌─────────────────────────────────────────────────┐
│ L5: 核心画像 (CoreProfile)                       │
│ - OPC人格标签、能力标签、沟通风格                  │
│ - 范围: 相对稳定                                  │
│ - 存储: student_profiles, opc_test_results表     │
└─────────────────────────────────────────────────┘
           ↓ 提炼到
┌─────────────────────────────────────────────────┐
│ L6: 关系记忆 (RelationshipMemory)                │
│ - 关系阶段、难忘语录、导师承诺、情感锚点            │
│ - 范围: 长期关系                                  │
│ - 存储: mentor_relationship_memory表             │
└─────────────────────────────────────────────────┘
```

**跨Agent共享**:
```typescript
// 统一接口
orchestrator.loadMemory(userId, taskId?)
  → 返回完整6层记忆
  → 所有Agent通过orchestrator访问
  → 保证数据一致性
```

**隔离原则**:
- **主导师**: 访问全部6层
- **PBL Agent**: 仅访问 L5核心画像 + 独立PBL记忆
- **需求拆解Agent**: 仅访问 L5核心画像（技能标签）
- **报告生成Agent**: 访问 L3+L4+L5（聚合数据）

---

## 📊 事件流完整示例

### 示例1：学生卡住求助

```
1. 前端发送消息
   POST /api/v1/mentor/send
   {userId, sessionId, message: "代码报错了，不知道怎么办"}

2. mentorService检测情绪
   → 检测到负面情绪关键词
   → orchestrator.triggerEvent(EMOTION_DISTRESS)

3. Orchestrator路由
   eventAgentMap.get(EMOTION_DISTRESS) 
   → ['mentorCompanionAgent']

4. mentorCompanionAgent处理
   → loadMemory(userId) 获取6层记忆
   → 检测trigger = EMOTIONAL_DISTRESS_DETECTED
   → mentorContextEnhancer.getRealStuckCase() 
      从case_library查询相似卡点案例
   → 生成安慰话术 + 案例引用
   → 返回给学生

5. 记录日志
   INSERT INTO orchestrator_event_log
   (event_type, user_id, agent_invoked, result, duration_ms)
```

---

### 示例2：企业发布大需求

```
1. 企业发布需求
   POST /api/v1/demand-decomposition/decompose
   {taskId, taskTitle, taskDescription, totalBudget}

2. 触发事件
   orchestrator.triggerEvent(ENTERPRISE_POST_TASK, {
     taskId, 
     context: {taskDescription, enterpriseId}
   })

3. Orchestrator路由
   eventAgentMap.get(ENTERPRISE_POST_TASK)
   → ['demandParserAgent']

4. demandParserAgent处理
   → 调用Claude API
   → 返回拆解结果 {subtasks: [...], totalCost, requiredSkills}
   → 保存到demand_decompositions表

5. 后续推送（非Agent职责）
   demandDecompositionService.pushSubtaskToStudents(subtaskId)
   → 匹配算法计算学生得分
   → INSERT INTO subtask_push_records
   → 前端显示推送通知
```

---

### 示例3：学生升级（多Agent协作）

```
1. 任务完成加经验
   growthTrackingService.addExperience(userId, 150)
   → 检测到 level: 2 → 3

2. 触发升级事件
   orchestrator.triggerEvent(LEVEL_UPGRADED, {
     userId,
     context: {oldLevel: 2, newLevel: 3}
   })

3. Orchestrator并行调用2个Agent
   eventAgentMap.get(LEVEL_UPGRADED)
   → ['reportTriggerAgent', 'levelUpCeremonyAgent']

4a. reportTriggerAgent（异步）
    → reportGeneratorAgent.generateReport(userId)
    → 聚合30天数据
    → AI生成报告文案
    → INSERT INTO growth_reports
    
4b. levelUpCeremonyAgent（异步）
    → 查询OPC人格标签
    → 生成个性化通关文案
    → INSERT INTO level_up_ceremonies
    → 解锁新功能权益

5. 触发企业通知（非Agent，由Service层处理）
   companyStudentBridgeService.recordMilestone()
   → notifySubscribedCompanies()
   → INSERT INTO student_growth_notifications
   → 企业端收到通知
```

---

## 🎯 总结：Agent分工原则

### ✅ 清晰边界
1. **按职能划分**: 对话/项目/拆解/报告/仪式 各司其职
2. **按触发场景划分**: 主动对话/任务事件/系统事件 分开处理
3. **按会话隔离**: 主导师/PBL/独立会话，互不干扰

### ✅ 协调机制
1. **事件驱动**: 所有Agent通过Orchestrator调度
2. **串行/并行**: 根据依赖关系灵活选择
3. **统一记忆**: 通过orchestrator.loadMemory()共享数据

### ✅ 扩展性
1. **新增Agent**: 只需注册到orchestrator + 配置事件路由
2. **修改逻辑**: Agent内部实现独立，不影响其他Agent
3. **监控调试**: 所有调用记录在orchestrator_event_log表

### ❌ 禁止事项
1. **不允许Agent直接调用Agent** (必须通过orchestrator)
2. **不允许跨会话污染** (PBL不能影响主导师)
3. **不允许无限递归** (orchestrator有深度保护)

---

这就是整个系统的Agent管理架构！每个Agent职责明确，通过事件驱动协调，记忆系统统一管理，确保了系统的清晰性和可维护性。
