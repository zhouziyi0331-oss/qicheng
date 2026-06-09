# 使命是河 - 剩余功能实现指南

## 已完成功能（P0-P1）

### ✅ P0: 文案和理念升级（已完成）
1. 首页文案：热情火花转换成技能，让生命资产漏出来
2. OPC结果页：增加"你的河道"板块
3. 任务匹配：从功能性改为可能性
4. 个人中心：从成就改为生命资产

### ✅ P1-5: 生命问题记录器（已完成）
- 数据库表：life_questions
- 后端API：保存/获取/反思
- 前端页面：life-question/index
- 首页入口：完成OPC后显示

### ✅ P1-6: 热情火花捕捉器（后端已完成）
- 数据库表：passion_sparks
- 后端API：捕捉/获取/标记探索
- 前端页面：待开发

---

## 待完成功能（P1-P3）

### P1-7: AI导师对话升级

**核心改造：**
```typescript
// 旧Prompt
你是一个AI导师，帮助学生完成任务

// 新Prompt
你是一个先走过这条河的人，不是来教技能的，是来帮学生看见自己的。

核心原则：
1. 不问"你学会了什么技能"，问"你发现了什么关于自己的事"
2. 不说"你做错了"，说"你注意到这里可以不一样吗？"
3. 捕捉热情火花："你刚才说XX的时候，听起来很有热情"
4. 连接生命问题："这个和你的生命问题有关系吗？"
```

**实现步骤：**
1. 修改 `backend/src/controllers/mentorController.ts`
2. 更新AI Prompt模板
3. 在对话中自动捕捉热情火花
4. 在关键节点询问生命问题

---

### P2-8: 合伙人关系系统

**数据库设计：**
```sql
CREATE TABLE partnerships (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES users(id),
  student_id UUID REFERENCES users(id),
  relationship_level VARCHAR(20), -- 'hired', 'trusted', 'partner'
  collaboration_count INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  partnership_terms JSONB
);
```

**触发逻辑：**
- 第1次合作：雇佣关系
- 第2次合作：开始建立信任
- 第3次合作后：触发"合伙人邀请"

**前端页面：**
- 企业端：发起合伙人邀请
- 学生端：接受/拒绝邀请
- 合伙人权益展示

---

### P2-9: 探索模式加速器

**项目标签扩展：**
```typescript
// 不只是技能标签
tags: ['Figma', 'Python']

// 增加探索标签
exploreTags: [
  '🔍 探索新工具',
  '🎨 探索新风格',
  '🤝 探索新协作方式',
  '💡 探索新思路'
]
```

**项目描述增加：**
```
"这个项目可能帮你探索什么模式？"
- 示例："这个项目可能帮你探索：如何用AI快速验证想法"
```

**完成后反思：**
```
不只是"评价任务"
增加"探索反思"：
- "这个项目让你发现了什么新模式？"
- "你在这个项目中找到了什么更好的做法？"
```

---

### P2-10: 穿越感时刻记录

**数据库设计：**
```sql
CREATE TABLE flow_moments (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES users(id),
  task_id UUID REFERENCES tasks(id),
  moment_text TEXT,
  duration_minutes INTEGER,
  captured_at TIMESTAMP
);
```

**AI导师捕捉：**
```
在项目执行中，AI会问：
- "你刚才做这个的时候，有没有感觉时间过得特别快？"
- "你注意到自己刚才特别投入吗？"
```

**前端展示：**
- 个人中心显示："你的穿越感时刻"
- 可以看到模式："你在XX类型的事情上最有穿越感"

---

### P3-11: OPC孵化计划

**触发条件：**
- 完成20个项目
- 等级达到Lv.4（自流者）
- 找到了自己的热情方向

**孵化内容：**
1. OPC成长报告（¥299）免费
2. 独立接单资格（可以脱离平台）
3. 联合体组建支持（可以邀请其他学生组队）
4. 创业资源对接（投资人、导师、场地）

**数据库设计：**
```sql
CREATE TABLE opc_incubation (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES users(id),
  status VARCHAR(20), -- 'applying', 'incubating', 'graduated'
  passion_direction TEXT,
  team_members UUID[],
  monthly_updates JSONB[],
  created_at TIMESTAMP
);
```

---

### P3-12: 联合体组建功能

**功能描述：**
- Lv.4学生可以创建联合体
- 邀请其他学生加入
- 共同接单，收益分成
- 联合体有自己的品牌

**数据库设计：**
```sql
CREATE TABLE alliances (
  id UUID PRIMARY KEY,
  name VARCHAR(100),
  founder_id UUID REFERENCES users(id),
  members UUID[],
  brand_description TEXT,
  created_at TIMESTAMP
);
```

---

## 快速实施建议

### 优先级排序：
1. **P1-7 (AI导师升级)** - 最核心，影响所有交互
2. **P2-10 (穿越感记录)** - 配合AI导师，捕捉关键时刻
3. **P2-9 (探索加速器)** - 项目标签扩展，简单但有效
4. **P2-8 (合伙人系统)** - 长期关系建立
5. **P3-11/12 (孵化和联合体)** - 长期规划

### 实施时间估算：
- P1-7: 2-3天（AI Prompt重写 + 对话逻辑）
- P2-10: 1天（数据库 + 捕捉逻辑）
- P2-9: 1天（标签扩展 + 反思页面）
- P2-8: 2天（关系系统 + 前端页面）
- P3-11: 3天（孵化流程 + 资源对接）
- P3-12: 2天（联合体创建 + 管理）

**总计：约11-13天**

---

## 关键文件清单

### 需要修改的文件：
1. `backend/src/controllers/mentorController.ts` - AI导师Prompt
2. `miniapp/src/pages/mentor/index.tsx` - AI导师对话页面
3. `miniapp/src/pages/tasks/detail.tsx` - 任务详情（增加探索标签）
4. `miniapp/src/pages/rate-task/index.tsx` - 评价页面（增加探索反思）

### 需要新建的文件：
1. `backend/migrations/022_partnerships.sql`
2. `backend/migrations/023_flow_moments.sql`
3. `backend/migrations/024_opc_incubation.sql`
4. `backend/migrations/025_alliances.sql`
5. `backend/src/controllers/partnershipController.ts`
6. `backend/src/controllers/flowMomentController.ts`
7. `miniapp/src/pages/partnership/index.tsx`
8. `miniapp/src/pages/flow-moments/index.tsx`

---

## 测试清单

### P1-7 测试：
- [ ] AI导师不再说"你做错了"
- [ ] AI导师会捕捉热情火花
- [ ] AI导师会询问生命问题
- [ ] 对话记录中有穿越感时刻

### P2-8 测试：
- [ ] 第3次合作后触发合伙人邀请
- [ ] 学生可以接受/拒绝邀请
- [ ] 合伙人权益正确显示

### P2-9 测试：
- [ ] 项目详情显示探索标签
- [ ] 完成后有探索反思问题
- [ ] 反思记录正确保存

### P2-10 测试：
- [ ] AI导师正确捕捉穿越感时刻
- [ ] 个人中心显示穿越感列表
- [ ] 可以看到穿越感模式

---

**当前进度：P0-P1 完成（约40%），P2-P3 待开发（约60%）**

**建议：先完成P1-7（AI导师升级），这是整个系统的核心！**
