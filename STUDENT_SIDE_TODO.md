# 学生端 - 缺失功能清单

**整体完成度**: 58%  
**需要补充**: 42%  

---

## 📋 按优先级分类

### P0 - 必须立即实现（阻塞核心流程）

#### 1. 定向邀约接收界面（完全缺失）

**现状**: 学生看到公开任务列表，抢单模式  
**应该**: 学生只看到"被邀请的任务"，非公开模式

**需要开发的页面**:
```
miniapp/src/pages/invitations/
├── index.tsx              # 邀请列表页（替代当前的任务广场）
├── detail.tsx             # 邀请详情页
└── components/
    ├── InvitationCard.tsx      # 邀请卡片
    ├── InvitationReason.tsx    # "为什么邀请你"理由展示
    └── AcceptButton.tsx        # 接受邀请按钮
```

**需要开发的API**:
```typescript
// 1. 获取我的邀请列表
GET /api/v1/invitations/my-invitations
Response: {
  pending: Invitation[],     // 待响应
  accepted: Invitation[],    // 已接受
  declined: Invitation[],    // 已拒绝
  expired: Invitation[]      // 已过期
}

// 2. 接受邀请
POST /api/v1/invitations/:invitationId/accept

// 3. 拒绝邀请
POST /api/v1/invitations/:invitationId/decline
```

**UI设计要点**:
- 顶部徽章："你被XX企业邀请参与此项目"
- 展示邀请理由（AI生成的匹配分析）
- 倒计时："24小时内响应，否则邀请失效"
- 接受/拒绝按钮

**数据库表**:
```sql
-- 需要创建
CREATE TABLE task_invitations (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id),
  student_id UUID REFERENCES users(id),
  status VARCHAR(20), -- pending/accepted/declined/expired
  invitation_reason TEXT, -- AI生成的邀请理由
  invited_at TIMESTAMP,
  responded_at TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '24 hours')
);
```

---

#### 2. 首单资金保障提示（完全缺失）

**现状**: 学生不知道平台会垫付  
**应该**: 首单页面明确提示"24小时垫付保障"

**需要修改的页面**:
```
miniapp/src/pages/tasks/detail.tsx
```

**UI设计要点**:
- 顶部横幅（仅首单显示）："🎉 首单保障：验收通过后24小时到账"
- 底部信任标识："平台自有资金垫付，无需等待企业结算"

**需要的API**:
```typescript
// 查询是否首单
GET /api/v1/students/is-first-order
Response: { isFirstOrder: boolean }
```

---

#### 3. 分阶段资金到账通知（完全缺失）

**现状**: 学生不知道什么时候能拿到钱  
**应该**: 每个阶段完成后，显示已解锁金额

**需要开发的组件**:
```
miniapp/src/components/ProgressPayment/
├── PaymentTimeline.tsx    # 资金到账时间线
├── UnlockedAmount.tsx     # 已解锁金额展示
└── NextMilestone.tsx      # 下一阶段解锁条件
```

**UI设计要点**:
```
任务进度
├─ 初稿提交 ✅ 已解锁 ¥200
├─ 中期审核 ✅ 已解锁 ¥300
├─ 终稿交付 🔄 进行中（完成后解锁 ¥500）
└─ 企业验收 ⏳ 等待中（72小时内到账）
```

**需要的API**:
```typescript
// 获取任务资金解锁状态
GET /api/v1/orders/:orderId/payment-status
Response: {
  totalAmount: 1000,
  unlocked: 500,
  pending: 500,
  milestones: [
    { stage: 'draft', amount: 200, status: 'unlocked', unlockedAt: '2026-06-20' },
    { stage: 'mid', amount: 300, status: 'unlocked', unlockedAt: '2026-06-22' },
    { stage: 'final', amount: 500, status: 'pending', expectedAt: '2026-06-25' }
  ]
}
```

---

#### 4. 能力核验二次确认（完全缺失）

**现状**: 学生接受邀请后直接开始  
**应该**: 接受邀请后，AI进行第二轮能力核验

**需要开发的页面**:
```
miniapp/src/pages/invitations/verify.tsx  # 能力核验页
```

**UI设计要点**:
```
能力核验

该项目需要以下能力：
✅ Figma设计（你的等级：Lv.3）
✅ 电商场景经验（你的案例：5个）
⚠️  响应式布局（你的案例：1个，建议补充）

AI评估：你有87%的把握完成此项目

[ 我准备好了，开始项目 ]  [ 我需要再准备准备 ]
```

**需要的API**:
```typescript
// AI二次能力核验
POST /api/v1/invitations/:invitationId/verify
Response: {
  passed: boolean,
  confidence: 87,
  matchedSkills: [...],
  weakSkills: [...]
}
```

---

### P1 - 重要但不紧急（增强体验）

#### 5. 零门槛跳级测试（完全缺失）

**现状**: 学生只能按部就班升级  
**应该**: 随时可以申请高阶能力测试

**需要开发的页面**:
```
miniapp/src/pages/level-up/
├── skip-test.tsx          # 跳级测试页
├── test-questions.tsx     # 测试题目页
└── test-result.tsx        # 测试结果页
```

**UI设计要点**:
```
跳级测试

你当前是 Lv.1 入门者
你可以申请测试：
- Lv.2 实践者（通过即跳级）
- Lv.3 熟练者（通过即跳级）

[ 申请 Lv.2 测试 ]
[ 申请 Lv.3 测试 ]

说明：
• 测试完全免费
• 通过即跳级，失败无惩罚
• 失败后完成2次常规任务即可再次申请
```

**需要的API**:
```typescript
// 1. 获取可申请的跳级测试
GET /api/v1/students/available-skip-tests
Response: {
  currentLevel: 1,
  availableTests: [
    { targetLevel: 2, testId: 'xxx', canApply: true },
    { targetLevel: 3, testId: 'yyy', canApply: false, reason: '需先通过Lv.2' }
  ]
}

// 2. 申请跳级测试
POST /api/v1/students/apply-skip-test
Body: { targetLevel: 2 }

// 3. 提交测试答案
POST /api/v1/students/submit-skip-test
Body: { testId: 'xxx', answers: [...] }

// 4. 获取测试结果
GET /api/v1/students/skip-test-result/:testId
Response: {
  passed: boolean,
  score: 85,
  feedback: '...',
  levelUpTo: 2,  // 通过才有
  nextAttemptAfter: 2  // 失败才有：完成2次任务后可再申请
}
```

**数据库表**:
```sql
-- 需要创建
CREATE TABLE level_skip_tests (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES users(id),
  target_level INT,
  test_type VARCHAR(50),
  questions JSONB,
  answers JSONB,
  score INT,
  passed BOOLEAN,
  taken_at TIMESTAMP,
  result_at TIMESTAMP
);

CREATE TABLE level_skip_attempts (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES users(id),
  target_level INT,
  attempt_count INT DEFAULT 0,
  last_failed_at TIMESTAMP,
  tasks_completed_since_failure INT DEFAULT 0,
  can_retry_after INT DEFAULT 2
);
```

---

#### 6. 成长对比卡片（完全缺失）

**现状**: 学生看不到自己的进步  
**应该**: 第5单/第10单时弹窗展示成长对比

**需要开发的组件**:
```
miniapp/src/components/GrowthComparison/
├── ComparisonModal.tsx    # 成长对比弹窗
├── MetricCard.tsx         # 单项指标卡片
└── TrendChart.tsx         # 趋势图
```

**UI设计要点**:
```
🎉 你的第10单完成了！

看看你的成长：

第1单                    第10单
7天完成        →        2天完成 ⬆️ 提速71%
卡住3次        →        0次卡住 ⬆️ 独立性+100%
AI求助9次      →        AI求助2次 ⬆️ 自主性+78%
客户评分72分   →        客户评分92分 ⬆️ 质量+28%

你已经是一个独立的创作者了！

[ 继续接单 ]  [ 分享成长 ]
```

**需要的API**:
```typescript
// 获取成长对比数据
GET /api/v1/students/growth-comparison
Response: {
  shouldShow: boolean,  // 是否应该展示（第5单/第10单）
  milestone: 10,        // 当前里程碑
  comparison: {
    firstOrder: { days: 7, stuckCount: 3, aiHelpCount: 9, rating: 72 },
    currentOrder: { days: 2, stuckCount: 0, aiHelpCount: 2, rating: 92 },
    improvements: {
      speed: 71,
      independence: 100,
      autonomy: 78,
      quality: 28
    }
  }
}
```

**触发时机**:
- 第5单完成后
- 第10单完成后
- 每升一级后

---

#### 7. 资产仪表盘（完全缺失）

**现状**: 学生不知道自己积累了多少能力价值  
**应该**: 显示"你的能力折合市场估值约¥6,000/月"

**需要开发的页面**:
```
miniapp/src/pages/asset-dashboard/
├── index.tsx              # 资产仪表盘主页
├── components/
│   ├── ValueCard.tsx          # 能力估值卡片
│   ├── SkillRadar.tsx         # 技能雷达图
│   ├── IncomeChart.tsx        # 收入趋势图
│   └── MarketComparison.tsx   # 市场对比
```

**UI设计要点**:
```
你的能力资产

市场估值：¥6,200/月 ↑12% vs 上月

技能资产
├─ Figma设计        Lv.3  市场价 ¥150/时
├─ 短视频剪辑      Lv.2  市场价 ¥100/时
└─ 文案策划        Lv.2  市场价 ¥80/时

经验资产
├─ 电商场景        5个案例  ★★★★☆
├─ 教育场景        3个案例  ★★★☆☆
└─ 企业服务        2个案例  ★★☆☆☆

收入统计
├─ 本月收入        ¥3,200  ↑15%
├─ 累计收入        ¥12,500
└─ 平均单价        ¥500    ↑8%

市场对比
你的能力组合在市场上超过了 78% 的同龄人
```

**需要的API**:
```typescript
// 获取资产仪表盘数据
GET /api/v1/students/asset-dashboard
Response: {
  marketValue: 6200,
  valueChange: 12,  // vs上月
  skills: [
    { name: 'Figma设计', level: 3, hourlyRate: 150 },
    { name: '短视频剪辑', level: 2, hourlyRate: 100 }
  ],
  experiences: [
    { domain: '电商场景', caseCount: 5, rating: 4.2 }
  ],
  income: {
    thisMonth: 3200,
    total: 12500,
    avgOrderPrice: 500
  },
  marketPercentile: 78
}
```

---

#### 8. 身份宣言卡片（完全缺失）

**现状**: 学生无法分享自己的成长  
**应该**: 可生成并分享"我是启程认证的「系统构建者」Lv.3"卡片

**需要开发的页面**:
```
miniapp/src/pages/identity-card/
├── index.tsx              # 身份卡片生成页
├── preview.tsx            # 卡片预览页
└── share.tsx              # 分享页
```

**UI设计要点**:
```
生成的图片卡片：

┌─────────────────────────┐
│      启程认证           │
│                         │
│    系统构建者 Lv.3      │
│                         │
│  王小明                 │
│  完成12个项目           │
│  累计收入 ¥8,500        │
│  客户好评率 96%         │
│                         │
│  [启程Logo]             │
│  qicheng.ai/u/xxx       │
└─────────────────────────┘

[ 保存图片 ]  [ 分享到微信 ]
```

**需要的API**:
```typescript
// 生成身份卡片
POST /api/v1/students/generate-identity-card
Response: {
  cardImageUrl: 'https://oss.qicheng.ai/cards/xxx.png',
  shareUrl: 'https://qicheng.ai/u/xxx',
  shareText: '我在启程完成了12个项目，成为了认证的「系统构建者」Lv.3'
}
```

**后端需要**:
- 图片生成服务（Canvas/Puppeteer）
- OSS上传
- 短链生成

---

#### 9. 引路人机制（完全缺失）

**现状**: 优秀学生无法带新人  
**应该**: 完成5单后，可邀请新人，主页显示"曾指引过X人"

**需要开发的页面**:
```
miniapp/src/pages/mentor-system/
├── become-mentor.tsx      # 成为引路人页
├── my-mentees.tsx         # 我的学员页
├── invite.tsx             # 邀请新人页
└── components/
    ├── MentorBadge.tsx        # 引路人徽章
    └── MenteeProgress.tsx     # 学员进度卡片
```

**UI设计要点**:
```
成为引路人

你已完成 8 个项目，可以成为引路人了！

成为引路人后，你可以：
✅ 邀请朋友加入启程（专属邀请码）
✅ 获得「引路人」专属徽章
✅ 你的学员完成首单后，你获得 ¥50 奖励
✅ 主页显示"曾指引过 X 人"

[ 生成我的邀请码 ]

---

我的学员（3人）

王小明      Lv.1  完成2单  ✅ 首单奖励已到账
李小红      Lv.0  完成1单
张小华      Lv.0  刚加入    ⏳ 等待完成首单
```

**需要的API**:
```typescript
// 1. 检查是否可以成为引路人
GET /api/v1/students/can-be-mentor
Response: {
  canBeMentor: boolean,
  currentOrders: 8,
  requiredOrders: 5
}

// 2. 成为引路人（生成邀请码）
POST /api/v1/students/become-mentor
Response: {
  inviteCode: 'QICHENG8X9Y',
  inviteUrl: 'https://qicheng.ai/invite/QICHENG8X9Y'
}

// 3. 获取我的学员列表
GET /api/v1/students/my-mentees
Response: {
  mentees: [
    {
      name: '王小明',
      level: 1,
      ordersCompleted: 2,
      firstOrderCompleted: true,
      rewardReceived: true,
      joinedAt: '2026-06-01'
    }
  ],
  totalMentees: 3,
  totalRewards: 100
}
```

**数据库表**:
```sql
-- 需要创建
CREATE TABLE mentor_relationships (
  id UUID PRIMARY KEY,
  mentor_id UUID REFERENCES users(id),
  mentee_id UUID REFERENCES users(id),
  invite_code VARCHAR(20),
  mentee_first_order_completed BOOLEAN DEFAULT FALSE,
  reward_paid BOOLEAN DEFAULT FALSE,
  reward_amount DECIMAL(10,2) DEFAULT 50.00,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE invite_codes (
  code VARCHAR(20) PRIMARY KEY,
  mentor_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  usage_count INT DEFAULT 0
);
```

---

#### 10. 同类数据展示（完全缺失）

**现状**: 学生不知道有多少同类人  
**应该**: "全国有12,843个和你一样的视觉叙事者，63%已完成首单"

**需要修改的页面**:
```
miniapp/src/pages/profile/index.tsx  # 个人中心
```

**UI设计要点**:
```
你的人格标签：视觉叙事者

全国数据
├─ 同类人数        12,843人
├─ 首单完成率      63%
├─ 平均单价        ¥520
└─ 平均月收入      ¥3,200

你在同类中的排名
├─ 作品质量        Top 15% ⬆️
├─ 接单速度        Top 28%
└─ 客户评分        Top 12% ⬆️
```

**需要的API**:
```typescript
// 获取同类数据
GET /api/v1/students/peer-stats
Response: {
  personalityLabel: '视觉叙事者',
  peerStats: {
    totalPeers: 12843,
    firstOrderCompletionRate: 63,
    avgOrderPrice: 520,
    avgMonthlyIncome: 3200
  },
  myRanking: {
    qualityPercentile: 15,
    speedPercentile: 28,
    ratingPercentile: 12
  }
}
```

---

### P2 - 可以延后（锦上添花）

#### 11. 成长时间线（完全缺失）

**需要开发的页面**:
```
miniapp/src/pages/growth-timeline/index.tsx
```

**UI设计要点**:
```
我的成长时间线

2026-06-01  🎯 加入启程
2026-06-03  ✨ 完成OPC测评，成为「视觉叙事者」
2026-06-05  💰 完成首单，收入 ¥300
2026-06-12  📈 升级到 Lv.1 入门者
2026-06-20  🎉 完成第5单，解锁引路人资格
2026-06-28  🚀 升级到 Lv.2 实践者
```

---

#### 12. 2单后解锁联系方式展示（完全缺失）

**现状**: 学生不知道什么时候能脱离平台  
**应该**: 与企业合作2次后，显示"已解锁联系方式"

**需要修改的页面**:
```
miniapp/src/pages/orders/detail.tsx  # 订单详情
```

**UI设计要点**:
```
与 XX企业 的合作记录

合作次数：2次
双方评分：均为 5星 ⭐⭐⭐⭐⭐

🎉 已解锁联系方式！
后续可直接联系合作，平台永不抽佣

企业联系人：张经理
微信号：xxxxxxx
电话：138xxxx8888

[ 复制微信号 ]  [ 拨打电话 ]
```

---

## 📊 开发工作量估算

| 优先级 | 功能模块 | 页面数 | API数 | 预估工时 |
|--------|----------|--------|-------|----------|
| **P0** | 定向邀约接收 | 3页 | 3个 | 3天 |
| **P0** | 首单保障提示 | 1组件 | 1个 | 0.5天 |
| **P0** | 分阶段资金通知 | 2组件 | 1个 | 2天 |
| **P0** | 能力核验确认 | 1页 | 1个 | 1天 |
| **P1** | 跳级测试系统 | 3页 | 4个 | 5天 |
| **P1** | 成长对比卡片 | 3组件 | 1个 | 2天 |
| **P1** | 资产仪表盘 | 1页+4组件 | 1个 | 4天 |
| **P1** | 身份宣言卡片 | 3页 | 1个 | 3天 |
| **P1** | 引路人机制 | 4页 | 3个 | 5天 |
| **P1** | 同类数据展示 | 1组件 | 1个 | 1天 |
| **P2** | 成长时间线 | 1页 | 1个 | 2天 |
| **P2** | 解锁联系方式 | 1组件 | 0个 | 0.5天 |
| **总计** | — | **21页** | **18个API** | **29.5天** |

---

## 🎯 实施建议

### 第一批（1周）- 定向邀约核心
1. 定向邀约接收界面
2. 能力核验确认
3. 首单保障提示

### 第二批（1周）- 资金透明化
4. 分阶段资金通知
5. 解锁联系方式展示

### 第三批（1.5周）- 成长激励
6. 跳级测试系统
7. 成长对比卡片
8. 资产仪表盘

### 第四批（1.5周）- 传播增长
9. 身份宣言卡片
10. 引路人机制
11. 同类数据展示
12. 成长时间线

**总工期**: 5周（29.5工作日）
