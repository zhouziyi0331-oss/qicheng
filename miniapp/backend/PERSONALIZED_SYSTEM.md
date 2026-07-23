# 启程OPC后端 - 个性化动态系统完整文档

## 🎯 系统概述

启程OPC后端现在是一个**完整的个性化成长系统**，每个用户的数据都是独一无二的、动态更新的。

### 核心特性

✅ **个性化OC测评** - 每人测评结果不同，生成独特的身份标签  
✅ **动态能力地图** - 随项目完成实时更新能力标签  
✅ **深度对比模式** - 历史vs当前的成长对比分析  
✅ **多维能力雷达图** - 8个维度追踪能力成长  
✅ **真实项目接单** - 用户接真实项目，非模拟练习  
✅ **收入提现系统** - 真实的财务管理  
✅ **动态成长路径** - AI根据个人情况动态调整  
✅ **毕业报告** - 完整学习历程总结  

---

## 📊 数据模型架构

### 1. Assessment (OC测评)
每个用户可以进行多次测评，记录能力成长。

```typescript
{
  userId: ObjectId,
  assessmentNumber: 1,  // 第几次测评
  answers: [
    {
      questionId: "Q1",
      answer: "A"
    }
  ],
  result: {
    identityTags: ["创新者", "执行者"],  // 身份标签
    abilityScores: [
      {
        dimension: "沟通表达力",
        score: 75,
        level: "中级"
      }
    ],
    personalityType: "INTJ",
    strengthAreas: ["逻辑思维", "执行力"],
    improvementAreas: ["团队协作"]
  }
}
```

### 2. AbilityRadar (能力雷达图)
多维度追踪用户能力，每完成项目或测评生成新快照。

```typescript
{
  userId: ObjectId,
  snapshotNumber: 3,  // 第几个快照
  triggerType: "project_completed",  // 触发类型
  dimensions: [
    {
      name: "沟通表达力",
      score: 78,
      level: "中级",
      growth: +5,  // 相比上次的成长
      tags: ["清晰表达", "有效沟通"]
    }
  ],
  overallScore: 72,
  rank: "进阶"  // 新手/进阶/熟练/专家/大师
}
```

### 3. ComparisonReport (深度对比报告)
对比规则：
- 第1次：测评 vs 第1次项目
- 第2次：第2次项目 vs 第1次项目
- 第N次：第N次项目 vs 第(N-1)次项目

```typescript
{
  userId: ObjectId,
  comparisonNumber: 2,
  beforeSnapshot: {
    type: "project",
    refId: ObjectId,
    date: Date,
    overallScore: 65
  },
  afterSnapshot: {
    type: "project",
    refId: ObjectId,
    date: Date,
    overallScore: 72
  },
  analysis: {
    dimensionChanges: [
      {
        dimension: "沟通表达力",
        beforeScore: 70,
        afterScore: 78,
        change: +8,
        changePercent: "+11.4%",
        evaluation: "AI评价..."
      }
    ],
    newAbilities: ["项目管理"],
    improvedAbilities: ["沟通表达", "执行力"],
    overallGrowth: 7,
    summary: "AI总结...",
    recommendations: ["建议1", "建议2"]
  }
}
```

### 4. RealProject (真实项目)
用户从平台接的真实项目。

```typescript
{
  userId: ObjectId,
  projectNumber: 5,  // 用户的第几个项目
  title: "设计电商首页",
  category: "UI设计",
  difficulty: "medium",
  budget: 3000,
  actualEarnings: 3000,
  platformCommission: 450,  // 15%抽成
  netIncome: 2550,
  status: "completed",
  clientRating: {
    score: 4.8,
    comment: "非常满意",
    tags: ["高效", "专业"]
  },
  abilitiesGained: ["UI设计"],
  abilitiesImproved: ["沟通表达"]
}
```

### 5. Income (收入记录)
```typescript
{
  userId: ObjectId,
  source: "real_project",  // real_project/referral/bonus
  sourceRefId: ObjectId,  // 项目ID
  amount: 2550,
  description: "完成项目：设计电商首页",
  status: "confirmed"
}
```

### 6. Withdrawal (提现记录)
```typescript
{
  userId: ObjectId,
  amount: 2000,
  fee: 20,  // 1%手续费
  actualAmount: 1980,
  withdrawalMethod: "wechat",
  withdrawalAccount: "****1234",  // 脱敏
  status: "completed"
}
```

### 7. DynamicGrowthPath (动态成长路径)
AI根据用户当前状态动态生成。

```typescript
{
  userId: ObjectId,
  versionNumber: 3,
  currentState: {
    overallLevel: "进阶",
    strongestAbilities: ["执行力", "逻辑思维", "沟通力"],
    weakestAbilities: ["创新力", "协作力"],
    completedProjects: 5,
    totalEarnings: 12500
  },
  phases: [
    {
      phaseNumber: 1,
      phaseName: "能力巩固期",
      goal: "进一步提升执行力，达到高级水平",
      duration: "1-2个月",
      actions: [
        {
          actionType: "do_project",
          title: "接中等难度项目",
          priority: "high",
          expectedOutcome: "提升执行力到80分"
        }
      ],
      recommendedProjects: [
        {
          category: "UI设计",
          difficulty: "medium",
          reason: "符合当前能力水平"
        }
      ]
    }
  ],
  predictions: {
    expectedLevel: "熟练",
    expectedTimeframe: "3-4个月",
    expectedEarnings: 30000
  }
}
```

### 8. GraduationReport (毕业报告)
用户完整学习历程的总结。

```typescript
{
  userId: ObjectId,
  journeySummary: {
    totalDays: 120,
    assessmentCount: 3
  },
  projectAchievements: {
    practiceProjects: 4,
    realProjects: 8,
    clientSatisfaction: 4.7
  },
  abilityGrowth: {
    initialLevel: "新手",
    finalLevel: "熟练",
    levelUpCount: 2,
    dimensionGrowth: [...],
    totalAbilityCount: 15
  },
  financialSummary: {
    totalEarnings: 25600,
    averageProjectEarnings: 3200
  },
  aiEvaluation: {
    overallAssessment: "AI整体评价...",
    growthStory: "AI成长故事...",
    futureRecommendations: [...]
  },
  certificate: {
    certificateId: "OPC-xxx",
    level: "高级",
    specialization: ["UI设计", "执行力", "沟通力"]
  }
}
```

---

## 🔌 API接口文档

### 个人成长模块 (`/api/growth`)

#### 1. OC测评相关

**提交测评**
```http
POST /api/growth/assessment
Authorization: Bearer {token}

Request:
{
  "answers": [
    {
      "questionId": "Q1",
      "answer": "A"
    }
  ]
}

Response:
{
  "success": true,
  "data": {
    "assessmentId": "xxx",
    "assessmentNumber": 1,
    "result": {
      "identityTags": ["创新者", "执行者"],
      "abilityScores": [...],
      "personalityType": "INTJ"
    }
  }
}
```

**获取测评历史**
```http
GET /api/growth/assessments
```

**获取最新测评**
```http
GET /api/growth/assessment/latest
```

#### 2. 能力雷达图相关

**获取雷达图历史**
```http
GET /api/growth/ability-radar
```

**获取最新雷达图**
```http
GET /api/growth/ability-radar/latest
```

**对比两个雷达图**
```http
GET /api/growth/ability-radar/compare?snapshot1=1&snapshot2=3
```

#### 3. 深度对比报告

**获取对比报告历史**
```http
GET /api/growth/comparison-reports
```

**获取最新对比报告**
```http
GET /api/growth/comparison-reports/latest
```

#### 4. 动态成长路径

**生成/更新成长路径**
```http
POST /api/growth/growth-path/generate
```

**获取最新成长路径**
```http
GET /api/growth/growth-path/latest
```

**更新里程碑状态**
```http
POST /api/growth/growth-path/milestone
{
  "milestoneTitle": "完成第一个真实项目",
  "completed": true
}
```

#### 5. 毕业报告

**生成毕业报告**
```http
POST /api/growth/graduation-report/generate
```

**获取毕业报告**
```http
GET /api/growth/graduation-report

Response (未解锁):
{
  "success": true,
  "data": {
    "isUnlocked": false,
    "preview": {
      "journeySummary": {...},
      "projectAchievements": {...}
    },
    "message": "完整报告需要解锁"
  }
}
```

**解锁毕业报告**
```http
POST /api/growth/graduation-report/unlock
```

---

### 真实项目模块 (`/api/real-projects`)

**获取可接单项目**
```http
GET /api/real-projects/available?category=UI设计&difficulty=medium
```

**获取我的项目**
```http
GET /api/real-projects/my/projects?status=in_progress
```

**获取项目统计**
```http
GET /api/real-projects/my/stats

Response:
{
  "totalApplied": 10,
  "inProgress": 2,
  "completed": 8,
  "totalEarnings": 25600,
  "avgRating": 4.7
}
```

**申请项目**
```http
POST /api/real-projects/:id/apply
```

**接受项目**
```http
POST /api/real-projects/:id/accept
```

**完成项目**
```http
POST /api/real-projects/:id/complete
{
  "deliverables": [
    {
      "type": "design",
      "url": "https://...",
      "description": "首页设计稿"
    }
  ]
}

// 完成后自动触发：
// 1. 生成新的能力雷达图
// 2. 生成对比报告
// 3. 更新成长路径
```

---

### 财务管理模块 (`/api/financial`)

**查看余额**
```http
GET /api/financial/balance

Response:
{
  "totalIncome": 25600,
  "totalWithdrawal": 10000,
  "availableBalance": 15600
}
```

**收入记录**
```http
GET /api/financial/income?page=1&limit=20
```

**收入统计**
```http
GET /api/financial/income/stats

Response:
{
  "totalIncome": 25600,
  "totalCount": 8,
  "bySource": {
    "real_project": {
      "count": 8,
      "total": 25600
    }
  }
}
```

**申请提现**
```http
POST /api/financial/withdrawal/request
{
  "amount": 2000,
  "withdrawalMethod": "wechat",
  "withdrawalAccount": "wx123456"
}

Response:
{
  "success": true,
  "data": {
    "amount": 2000,
    "fee": 20,
    "actualAmount": 1980,
    "status": "pending"
  },
  "message": "提现申请已提交，预计1-3个工作日到账"
}
```

**提现记录**
```http
GET /api/financial/withdrawal?status=completed
```

**取消提现**
```http
POST /api/financial/withdrawal/:id/cancel
```

---

## 🔄 自动化流程

### 完成项目后的自动触发

当用户完成一个真实项目时，系统会自动：

1. **创建收入记录** ✅
   ```
   Income.create({
     source: 'real_project',
     amount: netIncome,
     status: 'confirmed'
   })
   ```

2. **生成新的能力雷达图** ✅
   ```
   AI分析项目对能力的影响 → 更新各维度分数 → 生成新快照
   ```

3. **生成对比报告** ✅
   ```
   对比上一次快照 vs 当前快照 → AI生成成长分析
   ```

4. **更新成长路径** ✅
   ```
   根据新的能力状态 → AI重新生成个性化建议
   ```

### 完成测评后的自动触发

1. **生成能力雷达图** ✅
2. **如果是第一次测评** → 初始化能力基线

---

## 🎨 前端集成示例

### 1. OC测评流程

```typescript
// 1. 展示测评问卷
const questions = getAssessmentQuestions()

// 2. 用户完成测评
const answers = [
  { questionId: "Q1", answer: "A" },
  { questionId: "Q2", answer: ["选项1", "选项2"] }
]

// 3. 提交测评
const result = await api.post('/api/growth/assessment', { answers })

// 4. 展示结果
console.log(result.data.result.identityTags)  // ["创新者", "执行者"]
console.log(result.data.result.abilityScores)  // 8个维度评分
```

### 2. 能力雷达图展示

```typescript
// 获取最新雷达图
const radar = await api.get('/api/growth/ability-radar/latest')

// 使用ECharts展示
const chartData = radar.data.dimensions.map(d => ({
  name: d.name,
  value: d.score,
  max: 100
}))

// 显示成长标识
radar.data.dimensions.forEach(d => {
  if (d.growth > 0) {
    showGrowthBadge(d.name, `+${d.growth}`)
  }
})
```

### 3. 深度对比展示

```typescript
// 获取最新对比报告
const report = await api.get('/api/growth/comparison-reports/latest')

// 展示各维度变化
report.data.analysis.dimensionChanges.forEach(change => {
  showDimensionChange({
    dimension: change.dimension,
    before: change.beforeScore,
    after: change.afterScore,
    change: change.change,  // +8
    percent: change.changePercent,  // "+11.4%"
    evaluation: change.evaluation  // AI评价
  })
})

// 展示新增能力
report.data.analysis.newAbilities.forEach(ability => {
  showNewAbilityBadge(ability)
})
```

### 4. 真实项目接单流程

```typescript
// 1. 浏览可用项目
const projects = await api.get('/api/real-projects/available?difficulty=medium')

// 2. 申请项目
await api.post(`/api/real-projects/${projectId}/apply`)

// 3. 接受项目（开始工作）
await api.post(`/api/real-projects/${projectId}/accept`)

// 4. 完成项目
await api.post(`/api/real-projects/${projectId}/complete`, {
  deliverables: [...]
})

// 5. 系统自动更新能力、生成报告
```

### 5. 成长路径展示

```typescript
// 获取最新成长路径
const path = await api.get('/api/growth/growth-path/latest')

// 展示当前状态
showCurrentState(path.data.currentState)

// 展示各阶段
path.data.phases.forEach(phase => {
  showPhase({
    name: phase.phaseName,
    goal: phase.goal,
    actions: phase.actions,
    recommendedProjects: phase.recommendedProjects
  })
})

// 展示预测
showPredictions(path.data.predictions)
```

---

## 💡 核心价值

### 1. 完全个性化
- ❌ 不再有通用的测评结果
- ✅ 每个人的身份标签都不同
- ✅ 能力地图随项目动态更新
- ✅ 成长路径完全定制化

### 2. 实时动态更新
- ❌ 不再是一次性的报告
- ✅ 每完成一个项目，能力标签更新
- ✅ 雷达图实时生成新快照
- ✅ 对比报告自动生成
- ✅ 成长路径自动调整

### 3. 真实项目接单
- ❌ 不再是模拟的练习项目
- ✅ 真实的项目接单
- ✅ 真实的收入
- ✅ 真实的客户评价
- ✅ 真实的能力提升

### 4. 完整财务系统
- ✅ 每个人的收入不同
- ✅ 提现记录独立
- ✅ 实时余额查询

---

## 📈 数据流程图

```
用户注册
  ↓
第1次OC测评 → 生成初始能力雷达图 (快照#1)
  ↓
完成实践项目1-4
  ↓
完成第1个真实项目 → 生成新雷达图 (快照#2) → 生成对比报告#1 (测评 vs 项目1) → 更新成长路径#1
  ↓
收入到账 → 可提现
  ↓
完成第2个真实项目 → 生成新雷达图 (快照#3) → 生成对比报告#2 (项目2 vs 项目1) → 更新成长路径#2
  ↓
...
  ↓
完成第N个真实项目 → 雷达图 → 对比报告 → 成长路径
  ↓
达到毕业条件
  ↓
生成毕业报告 → 颁发证书
```

---

## 🚀 部署说明

### 环境变量 (.env)
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/qicheng_opc

# OpenAI (必须配置，用于AI生成)
OPENAI_API_KEY=sk-xxx

# JWT
JWT_SECRET=your-secret-key

# 微信相关
WECHAT_APPID=xxx
WECHAT_SECRET=xxx

# 服务器
PORT=3000
NODE_ENV=production
```

### 启动命令
```bash
cd backend
npm install
npm run build
npm start

# 或使用启动脚本
./start.sh
```

---

## ✅ 完整功能清单

### 数据模型 (9个)
- [x] Assessment - OC测评
- [x] AbilityRadar - 能力雷达图
- [x] ComparisonReport - 对比报告
- [x] DynamicGrowthPath - 成长路径
- [x] GraduationReport - 毕业报告
- [x] RealProject - 真实项目
- [x] Income - 收入记录
- [x] Withdrawal - 提现记录
- [x] (原有4个) User, PracticeProject, DecompositionReport, Collaboration

### AI服务 (6个)
- [x] AssessmentService - 测评分析
- [x] AbilityRadarService - 雷达图生成
- [x] ComparisonReportService - 对比分析
- [x] DynamicGrowthPathService - 成长路径规划
- [x] GraduationReportService - 毕业报告生成
- [x] RealProjectService - 项目管理

### 其他服务 (2个)
- [x] FinancialService - 财务管理
- [x] (原有3个) AIDecompositionService, AuthService, PaymentService

### API接口 (50+个)
- [x] 个人成长模块 (16个接口)
- [x] 真实项目模块 (7个接口)
- [x] 财务管理模块 (6个接口)
- [x] (原有20+个) 认证、实践、联系方式、支付、管理

### 自动化流程
- [x] 项目完成后自动触发能力更新
- [x] 自动生成对比报告
- [x] 自动更新成长路径
- [x] 自动创建收入记录

---

**🎉 系统已100%完成个性化动态改造！**

每个用户的数据都是独一无二的、实时更新的、完全动态的！
