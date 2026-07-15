# 企业端 - 缺失功能清单

**整体完成度**: 50%  
**需要补充**: 50%  

---

## 📋 按优先级分类

### P0 - 必须立即实现（阻塞核心流程）

#### 1. AI需求拆解引擎（完全缺失）

**现状**: 企业直接填写需求表单，无AI辅助  
**应该**: AI三层翻译（拆解→补全→入库）

**需要开发的页面**:
```
company-web/src/pages/tasks/
├── create-with-ai.tsx     # AI辅助发布页
└── components/
    ├── AIRequirementParser.tsx    # AI需求解析
    ├── StandardizedQuestion.tsx   # 标准化反问
    └── RequirementPreview.tsx     # 结构化预览
```

**UI交互流程**:
```
步骤1: 企业口语化输入
"我想做一个电商的商品详情页，要那种很高级的感觉，
 预算3000左右，一周内要"

↓ AI自动拆解

步骤2: AI结构化展示
项目类型：UI设计
交付物：电商商品详情页设计稿
风格要求：高级感
预算：¥3,000
周期：7天
验收标准：[AI生成待确认]

↓ AI发现缺失信息

步骤3: AI标准化反问
为了更精准匹配人才，请补充：
1. 商品详情页的具体尺寸？(移动端/PC端/响应式)
2. 需要包含哪些模块？(轮播图/参数表/评价区...)
3. 参考风格？(可上传参考图)

↓ 企业补充

步骤4: 完整需求入库
需求已标准化，正在匹配人才...
```

**需要开发的API**:
```typescript
// 1. AI解析需求
POST /api/v1/company/tasks/parse-requirement
Body: { rawRequirement: "我想做一个..." }
Response: {
  parsed: {
    projectType: 'UI设计',
    deliverable: '电商商品详情页',
    budget: 3000,
    deadline: 7,
    ...
  },
  missingFields: ['尺寸', '模块', '参考风格'],
  standardizedQuestions: [
    { field: '尺寸', question: '商品详情页的具体尺寸？', options: ['移动端', 'PC端', '响应式'] }
  ]
}

// 2. 补全信息后提交
POST /api/v1/company/tasks/submit-with-completion
Body: {
  parsed: {...},
  completedFields: {...}
}
Response: {
  taskId: 'xxx',
  vectorized: true,
  matchingStarted: true
}
```

**后端需要**:
```typescript
// backend/src/services/requirementParserService.ts
class RequirementParserService {
  // AI解析口语化需求
  async parseRawRequirement(raw: string): Promise<ParsedRequirement>
  
  // 生成标准化反问
  async generateStandardizedQuestions(parsed: ParsedRequirement): Promise<Question[]>
  
  // 向量化需求存入数据库
  async vectorizeAndStore(requirement: Requirement): Promise<void>
}
```

---

#### 2. 人才精准推荐列表（完全缺失）

**现状**: 企业发布任务后只能等学生来接单  
**应该**: 发布后立即推荐3-5名精准匹配的学生

**需要开发的页面**:
```
company-web/src/pages/tasks/
├── talent-recommendations.tsx  # 人才推荐列表页
└── components/
    ├── TalentCard.tsx              # 人才卡片
    ├── MatchScore.tsx              # 匹配度分数
    ├── MatchReason.tsx             # 匹配理由
    └── InviteButton.tsx            # 邀请按钮
```

**UI设计要点**:
```
为您推荐3名最匹配的人才

┌─────────────────────────────────────┐
│ 王小明  Lv.3 实践者                  │
│ 匹配度：92分 ⭐⭐⭐⭐⭐                │
│                                     │
│ 为什么推荐给他：                     │
│ • 擅长电商UI设计（完成过8个类似项目）│
│ • Figma熟练度：高级                  │
│ • 平均交付周期：5天（符合您的要求）  │
│ • 客户评分：4.8/5.0                  │
│                                     │
│ 历史作品：[3张缩略图]                │
│                                     │
│ [ 查看详情 ]  [ 定向邀请 ¥50 ]       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 李小红  Lv.2 实践者                  │
│ 匹配度：88分 ⭐⭐⭐⭐                 │
│ ...                                 │
└─────────────────────────────────────┘

说明：系统已自动向前2名发送免费邀请
     如需定向指定，可支付 ¥50 强制邀请
```

**需要的API**:
```typescript
// 1. 获取人才推荐列表
GET /api/v1/company/tasks/:taskId/recommended-talents
Response: {
  recommendations: [
    {
      studentId: 'xxx',
      name: '王小明',
      level: 3,
      matchScore: 92,
      matchReasons: [
        '擅长电商UI设计（完成过8个类似项目）',
        'Figma熟练度：高级',
        '平均交付周期：5天（符合您的要求）'
      ],
      portfolio: ['url1', 'url2', 'url3'],
      avgRating: 4.8,
      completedProjects: 12,
      invitationStatus: 'auto_invited'  // auto_invited / not_invited
    }
  ],
  autoInvitedCount: 2
}

// 2. 定向邀请（付费）
POST /api/v1/company/tasks/:taskId/invite-talent
Body: { studentId: 'xxx', invitationType: 'paid' }
Response: {
  invitationId: 'xxx',
  cost: 50,
  status: 'invited'
}

// 3. 查看人才详情
GET /api/v1/company/talents/:studentId/profile
Response: {
  profile: {...},
  portfolio: [...],
  completedProjects: [...],
  collaborationHistory: [...]  // 如果之前合作过
}
```

**数据库表**:
```sql
-- 已存在但需要扩展
ALTER TABLE task_invitations ADD COLUMN invitation_type VARCHAR(20);
-- 'auto' (系统自动邀请) / 'paid' (企业付费定向)

CREATE TABLE talent_recommendations (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id),
  student_id UUID REFERENCES users(id),
  match_score INT,
  match_reasons JSONB,
  recommended_at TIMESTAMP DEFAULT NOW(),
  rank INT
);
```

---

#### 3. 定向指定付费功能（完全缺失）

**现状**: 企业无法指定特定学生  
**应该**: 支付¥50-200可强制邀请特定学生

**需要开发的组件**:
```
company-web/src/components/DirectInvitation/
├── PriceCalculator.tsx    # 定向费用计算
├── PaymentModal.tsx       # 支付弹窗
└── InvitationConfirm.tsx  # 邀请确认
```

**定价规则**:
```typescript
const DIRECT_INVITATION_PRICES = {
  'Lv.3': 50,
  'Lv.4': 100,
  'Lv.5': 200
};
```

**UI设计要点**:
```
定向邀请 - 王小明 (Lv.3)

定向费用：¥50

定向邀请的好处：
✅ 强制推送给该学生（优先级最高）
✅ 学生会收到"被企业看中"的认可通知
✅ 附带行业科普和能力匹配分析
✅ 提高接单概率约60%

[ 取消 ]  [ 支付并邀请 ]
```

**需要的API**:
```typescript
// 1. 计算定向费用
GET /api/v1/company/calculate-invitation-cost?studentId=xxx
Response: {
  studentLevel: 3,
  cost: 50,
  expectedAcceptRate: 60
}

// 2. 支付并定向邀请
POST /api/v1/company/tasks/:taskId/direct-invite
Body: {
  studentId: 'xxx',
  paymentMethod: 'wechat'
}
Response: {
  invitationId: 'xxx',
  paymentId: 'xxx',
  qrCode: 'data:image/png;base64,...'  // 支付二维码
}
```

---

#### 4. 72小时自动结算提示（完全缺失）

**现状**: 企业不知道什么时候需要验收  
**应该**: 学生交付后，倒计时提示"72小时内未操作将自动通过"

**需要修改的页面**:
```
company-web/src/pages/tasks/review.tsx  # 验收页
```

**UI设计要点**:
```
待验收交付物

学生已提交最终交付物

⏰ 72小时倒计时：还剩 48小时23分钟
   超时未操作将自动验收通过并结算尾款

交付物预览：
[图片/视频/文档预览]

AI审核结果：✅ 通过（质量评分：85分）
AI审核意见：整体符合需求，细节处理到位

[ 通过验收 ]  [ 打回修改 ]  [ 需要企业内部讨论 ]
```

**需要的API**:
```typescript
// 获取待验收任务（含倒计时）
GET /api/v1/company/tasks/pending-review
Response: {
  tasks: [
    {
      taskId: 'xxx',
      submittedAt: '2026-06-27 14:00:00',
      autoApproveAt: '2026-06-30 14:00:00',
      remainingHours: 48.4,
      aiReview: {
        passed: true,
        score: 85,
        feedback: '...'
      }
    }
  ]
}
```

**后端定时任务**:
```typescript
// backend/src/jobs/autoApprovalJob.ts
// 每小时执行一次，检查超过72小时未验收的任务
async function autoApproveExpiredTasks() {
  const expiredTasks = await query(`
    SELECT id FROM orders 
    WHERE status = 'submitted' 
    AND submitted_at < NOW() - INTERVAL '72 hours'
  `);
  
  for (const task of expiredTasks) {
    await approveTask(task.id, 'auto');
    await settlePayment(task.id);
    await notifyBothParties(task.id);
  }
}
```

---

#### 5. 大师兜底触发界面（完全缺失）

**现状**: 学生交付不达标时，企业需要反复打回  
**应该**: 打回3次后，自动触发大师兜底

**需要开发的组件**:
```
company-web/src/components/MasterIntervention/
├── InterventionNotice.tsx     # 大师介入通知
├── MasterProgress.tsx         # 大师处理进度
└── QualityGuarantee.tsx       # 质量保障说明
```

**UI设计要点**:
```
质量保障已启动

该任务已被打回3次，平台已启动大师兜底机制

当前状态：
✅ 大师已接手（张大师，从业8年）
🔄 预计2天内完成修改
✅ 质量保障：不达标全额退款

大师处理进度：
[进度条 60%]

您无需额外操作，大师会直接完成修改后提交

说明：大师服务费由学生本单收入扣除，
     您无需支付额外费用
```

**需要的API**:
```typescript
// 1. 检查是否触发大师兜底
GET /api/v1/company/tasks/:taskId/intervention-status
Response: {
  rejectionCount: 3,
  interventionTriggered: true,
  master: {
    id: 'xxx',
    name: '张大师',
    experience: '8年',
    rating: 4.9
  },
  progress: 60,
  estimatedCompletion: '2026-07-02'
}

// 2. 查看大师处理日志
GET /api/v1/company/tasks/:taskId/master-log
Response: {
  logs: [
    { time: '2026-06-29 10:00', action: '大师已接手' },
    { time: '2026-06-29 14:00', action: '完成初步修改' },
    { time: '2026-06-30 09:00', action: '等待终审' }
  ]
}
```

**数据库表**:
```sql
-- 需要创建
CREATE TABLE master_interventions (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id),
  order_id UUID REFERENCES orders(id),
  master_id UUID REFERENCES users(id),
  reason VARCHAR(50), -- 'multiple_rejections' / 'quality_issue'
  triggered_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  status VARCHAR(20), -- 'assigned' / 'in_progress' / 'completed'
  progress INT DEFAULT 0
);
```

---

### P1 - 重要但不紧急（增强体验）

#### 6. 企业仪表盘（完全缺失）

**需要开发的页面**:
```
company-web/src/pages/dashboard/
├── index.tsx              # 仪表盘主页
└── components/
    ├── InvestmentROI.tsx      # 投入产出看板
    ├── CollaborationHistory.tsx  # 合作档案
    ├── TalentNetwork.tsx      # 人才网络地图
    └── StatsCards.tsx         # 统计卡片
```

**UI设计要点**:
```
企业仪表盘

投入产出
├─ 累计投入        ¥28,000
├─ 完成项目        12个
├─ 平均单价        ¥2,333
└─ 投入产出比      1:3.2

合作人才
├─ 合作过的学生    8人
├─ 长期合作伙伴    3人（≥3次合作）
├─ 伯乐标签        ✅ 已获得
└─ 见证成长        帮助2人从Lv.1→Lv.3

人才网络地图
[可视化展示合作过的学生及其能力分布]

近期项目
[项目列表卡片]
```

**需要的API**:
```typescript
// 获取企业仪表盘数据
GET /api/v1/company/dashboard
Response: {
  investment: {
    total: 28000,
    projectCount: 12,
    avgPrice: 2333,
    roi: 3.2
  },
  talents: {
    totalCollaborated: 8,
    longTermPartners: 3,
    badges: ['伯乐'],
    growthWitnessed: 2
  },
  talentNetwork: [
    { studentId: 'xxx', name: '王小明', skills: [...], collaborationCount: 5 }
  ],
  recentProjects: [...]
}
```

---

#### 7. 合作档案系统（完全缺失）

**需要开发的页面**:
```
company-web/src/pages/archive/
├── index.tsx              # 档案列表页
├── detail.tsx             # 单个档案详情
└── search.tsx             # 档案搜索页
```

**UI设计要点**:
```
合作档案

搜索：[按项目类型 / 学生姓名 / 时间范围]

档案列表（12个）

┌─────────────────────────────────────┐
│ 电商商品详情页设计                   │
│ 2026-06-15  王小明  ¥3,000          │
│                                     │
│ 交付物：[3张缩略图]                  │
│ 版权：企业独占                       │
│                                     │
│ [ 查看详情 ]  [ 下载源文件 ]         │
└─────────────────────────────────────┘
```

**需要的API**:
```typescript
// 1. 获取合作档案列表
GET /api/v1/company/archive
Query: { projectType?, studentId?, startDate?, endDate? }
Response: {
  archives: [
    {
      projectId: 'xxx',
      projectName: '电商商品详情页设计',
      completedAt: '2026-06-15',
      studentName: '王小明',
      amount: 3000,
      deliverables: ['url1', 'url2'],
      copyright: 'exclusive'
    }
  ]
}

// 2. 下载交付物源文件
GET /api/v1/company/archive/:projectId/download
Response: { downloadUrl: 'https://...' }
```

---

#### 8. 共享声誉标签展示（完全缺失）

**需要修改的页面**:
```
company-web/src/pages/profile/index.tsx  # 企业主页
```

**UI设计要点**:
```
XX公司

企业标签
├─ 伯乐 ⭐  合作过10名学生
├─ 老搭档 ❤️  与3名学生建立长期合作
└─ 成长见证者 🌱  帮助2人从Lv.1→Lv.3

合作统计
├─ 累计发布项目    12个
├─ 平均评分        4.8/5.0
└─ 学生复购率      60%
```

**需要的API**:
```typescript
// 获取企业标签
GET /api/v1/company/badges
Response: {
  badges: [
    { type: '伯乐', description: '合作过10名学生', earnedAt: '2026-06-01' },
    { type: '老搭档', description: '与3名学生建立长期合作', earnedAt: '2026-06-15' }
  ],
  stats: {
    totalProjects: 12,
    avgRating: 4.8,
    studentRetentionRate: 60
  }
}
```

---

#### 9. 2次好评自动解锁通知（完全缺失）

**需要开发的组件**:
```
company-web/src/components/UnlockNotification/
└── ContactUnlocked.tsx    # 解锁通知弹窗
```

**UI设计要点**:
```
🎉 恭喜！已解锁联系方式

您与 王小明 已完成2次五星好评合作

作为奖励，平台开放双方联系方式：
学生微信：xxxxxxx
学生电话：138xxxx8888

后续您可以直接联系合作，平台永不抽佣

说明：此举是为了鼓励长期合作关系，
     帮助学生独立发展

[ 复制微信号 ]  [ 继续在平台合作 ]
```

**触发逻辑**:
```typescript
// backend/src/services/collaborationService.ts
async function checkUnlockCondition(companyId: string, studentId: string) {
  const goodReviewCount = await query(`
    SELECT COUNT(*) FROM orders
    WHERE company_id = $1 AND student_id = $2
    AND company_rating >= 4 AND student_rating >= 4
  `, [companyId, studentId]);
  
  if (goodReviewCount.rows[0].count >= 2) {
    await unlockContactInfo(companyId, studentId);
    await notifyBothParties(companyId, studentId);
  }
}
```

---

#### 10. 复购激励展示（完全缺失）

**需要修改的页面**:
```
company-web/src/pages/tasks/create.tsx  # 发布任务页
```

**UI设计要点**:
```
发布任务

当前优惠等级：银牌会员 🥈

本月已发布：2个项目
服务费折扣：9折（节省 ¥60）

升级提示：
再发布1个项目即可升级金牌会员 🥇
金牌福利：服务费8折 + 优先推荐人才

[ 继续发布 ]
```

**折扣规则**:
```typescript
const DISCOUNT_TIERS = {
  bronze: { threshold: 1, discount: 0.95 },   // 月发1单 9.5折
  silver: { threshold: 3, discount: 0.90 },   // 月发3单 9折
  gold: { threshold: 5, discount: 0.85 },     // 月发5单 8.5折
  platinum: { threshold: 10, discount: 0.80 }  // 月发10单 8折
};
```

---

### P2 - 可以延后（锦上添花）

#### 11. 需求变更确认单（完全缺失）

**需要开发的组件**:
```
company-web/src/components/RequirementChange/
├── ChangeRequest.tsx      # 变更申请
├── ChangeConfirm.tsx      # 双方确认
└── ChangePriceAdjust.tsx  # 价格调整
```

---

#### 12. 年度人才报告（完全缺失）

**需要开发的页面**:
```
company-web/src/pages/annual-report/index.tsx
```

**UI设计要点**:
```
2026年度人才报告

XX公司的人才合作数据

今年您：
├─ 合作了 12 名学生
├─ 见证了 3 人从新手到专业
├─ 累计投入 ¥28,000
└─ 获得了 42 个交付成果

您最喜欢的人才类型：
视觉叙事者（4次合作）

您的伯乐指数：★★★★☆
超过了 85% 的企业

[ 下载PDF报告 ]  [ 分享 ]
```

---

## 📊 开发工作量估算

| 优先级 | 功能模块 | 页面数 | API数 | 预估工时 |
|--------|----------|--------|-------|----------|
| **P0** | AI需求拆解 | 1页+3组件 | 2个 | 5天 |
| **P0** | 人才精准推荐 | 1页+4组件 | 3个 | 4天 |
| **P0** | 定向指定付费 | 3组件 | 2个 | 2天 |
| **P0** | 72小时自动结算 | 1组件 | 1个 | 1天 |
| **P0** | 大师兜底触发 | 3组件 | 2个 | 3天 |
| **P1** | 企业仪表盘 | 1页+4组件 | 1个 | 4天 |
| **P1** | 合作档案 | 3页 | 2个 | 3天 |
| **P1** | 共享标签展示 | 1组件 | 1个 | 1天 |
| **P1** | 解锁通知 | 1组件 | 0个 | 0.5天 |
| **P1** | 复购激励 | 1组件 | 1个 | 1天 |
| **P2** | 需求变更 | 3组件 | 2个 | 2天 |
| **P2** | 年度报告 | 1页 | 1个 | 2天 |
| **总计** | — | **15页** | **18个API** | **28.5天** |

---

## 🎯 实施建议

### 第一批（1.5周）- 需求质量提升
1. AI需求拆解引擎
2. 72小时自动结算提示

### 第二批（1周）- 人才发现
3. 人才精准推荐列表
4. 定向指定付费功能

### 第三批（1周）- 交付保障
5. 大师兜底触发界面
6. 解锁联系方式通知

### 第四批（1.5周）- 企业留存
7. 企业仪表盘
8. 合作档案系统
9. 共享标签展示
10. 复购激励

**总工期**: 5周（28.5工作日）
