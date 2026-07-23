# OPC测评系统恢复计划

**发现时间**: 2026-07-17  
**问题**: OPC测评系统（36题+7标签+项目匹配）完全丢失

---

## 🔍 问题分析

### 历史版本有什么？

根据GitHub提交 `a91c078f` (2026-04-12)，之前开发了**完整的OPC系统 - 100%完成**：

#### 核心功能
1. **能力画像诊断**
   - 36道工作场景测试题
   - 7种人格标签：视觉叙事者、系统构建者、创意执行者、逻辑拆解者、稳健交付者、探索整合者、混合型
   - 六维度能力画像
   - 人格标签生成算法

2. **项目匹配系统**
   - 智能匹配算法（常规项目 + 冒险项目）
   - 基于OPC人格标签的匹配理由生成
   - 冒险项目占比20%
   - 匹配理由示例："你习惯先搭框架再填细节，这个项目正好需要这种工作方式"

3. **AI导师集成**
   - 导师观察表（卡点/突破/习惯形成）
   - 接单欢迎消息（连接OPC人格和生命问题）
   - 里程碑夸奖（对比式反馈）
   - 打回修改措辞规范

4. **OPC成长报告**
   - 成长叙事时间线
   - 工作风格演变分析
   - 万字级报告生成逻辑

5. **等级体系**
   - 等级名称：涉水者→试流者→行舟者→知向者→自流者→河成者
   - 跳级挑战机制
   - 基于导师观察的升级条件

6. **平台关系定位**
   - 第2单完成推送
   - OPC故事墙
   - "找到属于自己的河"理念

#### 技术实现
- **数据库**: 4个新表（opc_test_questions, user_opc_results, mentor_observations, story_wall）
- **后端**: 5个Controller（opcController, matchController, mentorController, levelController, milestoneController）
- **前端**: 2个完整页面（测试页面 + 结果页面）
- **代码量**: 约3750行真实代码
- **API**: 18个端点

---

## 📊 当前状态

### ✅ 仍然存在的部分

#### 1. 前端API定义 (src/services/api.ts)
```typescript
// 旧版OPC API
export const opcAPI = {
  submitTest: (userId, answers) => request('/opc/submit', ...),
  getResult: (userId) => request(`/opc/result/${userId}`),
  generateReport: (userId) => request(`/opc/report/${userId}`)
}

// OPC v2.0 能力画像测试 API
export const opcV2API = {
  startAssessment: () => request('/opc-v2/start', ...),
  submitAnswer: (assessmentId, data) => ...,
  completeAssessment: (assessmentId) => ...,
  getProgress: (assessmentId) => ...,
  getResult: (assessmentId) => ...,
  getLatestResult: () => ...,
  generateIdentityCard: (options) => ...,
  getIdentityCards: (limit) => ...,
  deleteIdentityCard: (cardId) => ...
}
```

#### 2. 后端简化版实现
- **存在**: `/api/growth/assessment` (通过growth.routes.ts)
- **存在**: assessment.service.ts（简化的AI测评）
- **存在**: Assessment模型
- **存在**: AbilityRadar模型

**但是**：
- ❌ 没有36道标准题库
- ❌ 没有7种人格标签算法
- ❌ 没有项目匹配系统
- ❌ 没有OPC v2.0的所有端点
- ❌ 没有身份卡片生成

#### 3. 前端页面
- **可能存在**: src/pages/opc-test/ (需要检查)
- **理念文案**: "发现你的河道"、"这不是考试，是一面镜子"

### ❌ 完全丢失的部分

#### 1. 后端API - 大部分缺失
- `/api/opc/submit` ❌
- `/api/opc/result/:userId` ❌
- `/api/opc/report/:userId` ❌
- `/api/opc-v2/*` 全系列 ❌
- `/api/opc/identity-cards` ❌

**仅存在**:
- `/api/growth/assessment` ✅ (简化版)
- `/api/growth/assessments` ✅
- `/api/growth/assessment/latest` ✅

#### 2. 核心数据 - 完全缺失
- ❌ 36道测试题数据
- ❌ 7种人格标签算法
- ❌ 项目匹配算法
- ❌ 匹配理由生成逻辑

#### 3. 导师系统集成 - 完全缺失
- ❌ mentor_observations表
- ❌ 导师观察记录API
- ❌ 基于OPC的欢迎消息生成

#### 4. 等级体系 - 完全缺失
- ❌ 等级名称（涉水者等）
- ❌ 跳级挑战机制
- ❌ 基于导师观察的升级

#### 5. 故事墙 - 完全缺失
- ❌ story_wall表
- ❌ 故事墙API
- ❌ "已经找到自己河道的人"

---

## 💡 为什么会丢失？

### 分析
1. **大规模重构**
   - 2026年4月完成了OPC系统100%开发
   - 后续发生了代码重构，简化了测评系统
   - 只保留了核心的AI测评服务
   - 删除了复杂的题库、匹配、导师观察等功能

2. **简化决策**
   - 从36道题简化为动态AI测评
   - 从固定人格标签简化为AI生成身份标签
   - 从复杂匹配算法简化为基础查询

3. **未完成集成**
   - 前端API定义保留了（opcAPI, opcV2API）
   - 但后端只实现了一小部分
   - 导致前后端严重不匹配

---

## 🎯 恢复计划

### 方案A: 完整恢复历史版本（推荐）

**优势**:
- 完整的产品理念和用户体验
- 科学的36题测评体系
- 精准的7种人格标签
- 智能项目匹配
- 导师系统深度集成

**劣势**:
- 开发工作量大（约5-7天）
- 需要重新实现所有Controller
- 需要导入36题数据

#### Phase 1: 恢复OPC核心测评 (P1)

##### Step 1: 创建36题题库
```sql
-- backend/migrations/017_opc_test_questions_data.sql
INSERT INTO opc_test_questions (question_id, question_text, dimension, options) VALUES
(1, '你收到一个紧急任务，同时手头还有两个项目在进行...', 'execution', [...]),
(2, '团队讨论时，你通常...', 'communication', [...]),
...
(36, '...', 'learning', [...]);
```

##### Step 2: 实现人格标签算法
```typescript
// backend/src/services/opc.service.ts
export class OPCService {
  
  // 7种人格标签生成算法
  private calculatePersonalityTag(scores: Record<string, number>): string {
    const { visual, systematic, creative, logical, stable, exploratory } = scores
    
    // 视觉叙事者：视觉表达 > 80, 创意思维 > 70
    if (visual > 80 && creative > 70) {
      return '视觉叙事者'
    }
    
    // 系统构建者：逻辑分析 > 80, 系统化 > 75
    if (logical > 80 && systematic > 75) {
      return '系统构建者'
    }
    
    // 创意执行者：创意思维 > 75, 执行力 > 70
    if (creative > 75 && scores.execution > 70) {
      return '创意执行者'
    }
    
    // 逻辑拆解者：逻辑分析 > 80, 问题解决 > 75
    if (logical > 80 && scores.problemSolving > 75) {
      return '逻辑拆解者'
    }
    
    // 稳健交付者：稳定性 > 80, 执行力 > 75
    if (stable > 80 && scores.execution > 75) {
      return '稳健交付者'
    }
    
    // 探索整合者：探索性 > 75, 学习力 > 70
    if (exploratory > 75 && scores.learning > 70) {
      return '探索整合者'
    }
    
    // 混合型：没有明显优势维度
    return '混合型'
  }
  
  // 提交测评
  async submitAssessment(userId: string, answers: any[]) {
    // 1. 计算各维度分数
    const scores = this.calculateScores(answers)
    
    // 2. 生成人格标签
    const personalityTag = this.calculatePersonalityTag(scores)
    
    // 3. 保存结果
    const assessment = await Assessment.create({
      userId,
      answers,
      result: {
        identityTags: [personalityTag],
        abilityScores: Object.entries(scores).map(([dim, score]) => ({
          dimension: dim,
          score
        })),
        personalityType: personalityTag
      }
    })
    
    // 4. 更新用户表
    await User.findByIdAndUpdate(userId, {
      personalityTag,
      opcCompleted: true
    })
    
    return assessment
  }
}
```

##### Step 3: 实现项目匹配算法
```typescript
// backend/src/services/match.service.ts
export class MatchService {
  
  // 智能项目匹配
  async matchProjects(userId: string) {
    const user = await User.findById(userId)
    const projects = await RealProject.find({ status: 'open' })
    
    const matches = []
    
    for (const project of projects) {
      // 计算匹配分数
      const score = this.calculateMatchScore(user, project)
      
      // 判断是否为冒险项目
      const isStretch = project.level > user.level && project.level <= user.level + 2
      
      // 生成匹配理由
      const reason = this.generateMatchReason(user.personalityTag, project)
      
      matches.push({
        project,
        score,
        isStretch,
        reason
      })
    }
    
    // 排序：常规项目优先，但保留20%冒险项目
    const sorted = matches.sort((a, b) => b.score - a.score)
    const stretchCount = Math.floor(sorted.length * 0.2)
    const regular = sorted.filter(m => !m.isStretch)
    const stretch = sorted.filter(m => m.isStretch).slice(0, stretchCount)
    
    return [...regular, ...stretch]
  }
  
  // 生成匹配理由
  private generateMatchReason(personalityTag: string, project: any): string {
    const reasons = {
      '视觉叙事者': '这个项目需要强大的视觉表达能力，正好适合你',
      '系统构建者': '你习惯先搭框架再填细节，这个项目正好需要这种工作方式',
      '创意执行者': '这个项目需要创意+落地能力的组合，很适合你',
      '逻辑拆解者': '项目需要把复杂问题拆解成可执行步骤，这是你的强项',
      '稳健交付者': '这个项目看重按时交付和质量稳定，你可以胜任',
      '探索整合者': '项目需要探索新领域并整合资源，正好匹配你的风格',
      '混合型': '这个项目需要多方面的能力，适合你的全面风格'
    }
    
    return reasons[personalityTag] || '这个项目可能让你发现自己'
  }
}
```

##### Step 4: 创建OPC Controller
```typescript
// backend/src/controllers/opc.controller.ts
import { opcService } from '../services/opc.service'
import { matchService } from '../services/match.service'

export const submitOPCTest = async (req, res) => {
  try {
    const userId = req.user!.userId
    const { answers } = req.body
    
    const result = await opcService.submitAssessment(userId, answers)
    
    res.json(result)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}

export const getOPCResult = async (req, res) => {
  try {
    const { userId } = req.params
    
    const assessment = await Assessment.findOne({ userId }).sort({ createdAt: -1 })
    
    if (!assessment) {
      return res.status(404).json({ error: '未找到测评结果' })
    }
    
    res.json(assessment)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}

export const getMatchedProjects = async (req, res) => {
  try {
    const userId = req.user!.userId
    
    const matches = await matchService.matchProjects(userId)
    
    res.json(matches)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}

export const generateOPCReport = async (req, res) => {
  try {
    const { userId } = req.params
    
    // 生成万字级成长报告
    const report = await opcService.generateGrowthReport(userId)
    
    res.json(report)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}
```

##### Step 5: 注册路由
```typescript
// backend/src/routes/opc.routes.ts
import { Router } from 'express'
import { authenticate } from '../middlewares/auth'
import * as opcController from '../controllers/opc.controller'

const router = Router()

router.use(authenticate)

// OPC测评
router.post('/submit', opcController.submitOPCTest)
router.get('/result/:userId', opcController.getOPCResult)
router.get('/report/:userId', opcController.generateOPCReport)

// 项目匹配
router.get('/match/projects', opcController.getMatchedProjects)

export default router

// 在 index.ts 中注册
app.use('/api/opc', opcRoutes)
```

**预计时间**: 3-4天  
**工作量**:
- 36题数据导入（1小时）
- OPCService实现（1天）
- MatchService实现（1天）
- OPCController实现（0.5天）
- 路由注册（0.5天）
- 测试和调试（1天）

---

#### Phase 2: 集成导师系统 (P1)

##### Step 1: 创建导师观察表
```typescript
// backend/src/models/MentorObservation.ts
export interface IMentorObservation extends Document {
  userId: mongoose.Types.ObjectId
  taskId: mongoose.Types.ObjectId
  observationType: 'stuck' | 'breakthrough' | 'habit_formed'
  observationText: string
  context: string
  createdAt: Date
}
```

##### Step 2: 实现导师观察API
```typescript
// backend/src/controllers/mentor.controller.ts
export const recordObservation = async (req, res) => {
  try {
    const userId = req.user!.userId
    const { taskId, observationType, observationText, context } = req.body
    
    await MentorObservation.create({
      userId,
      taskId,
      observationType,
      observationText,
      context
    })
    
    res.json({ success: true })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}

export const generateWelcomeMessage = async (req, res) => {
  try {
    const userId = req.user!.userId
    const { taskId } = req.body
    
    // 获取用户OPC信息
    const user = await User.findById(userId)
    const assessment = await Assessment.findOne({ userId }).sort({ createdAt: -1 })
    const task = await RealProject.findById(taskId)
    
    // 生成个性化欢迎消息
    const message = `这个项目有意思——它需要${task.requiredSkills[0]}能力，你上次测试时发现自己是${user.personalityTag}，这次正好试试。

对了，你的生命问题是"${user.lifeQuestion || '未设置'}"，做这个项目的时候，可以留意一下，说不定会有线索。`
    
    res.json({ message })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}
```

**预计时间**: 1-2天

---

#### Phase 3: 实现等级体系 (P2)

##### Step 1: 更新等级名称
```typescript
// backend/src/constants/levels.ts
export const LEVEL_NAMES = {
  0: '涉水者',
  1: '试流者',
  2: '行舟者',
  3: '知向者',
  4: '自流者',
  5: '河成者'
}
```

##### Step 2: 实现跳级挑战
```typescript
// backend/src/models/StretchChallenge.ts
export interface IStretchChallenge extends Document {
  userId: mongoose.Types.ObjectId
  fromLevel: number
  toLevel: number
  taskId: mongoose.Types.ObjectId
  status: 'in_progress' | 'succeeded' | 'failed'
  startedAt: Date
  completedAt?: Date
}

// backend/src/services/level.service.ts
export class LevelService {
  
  async checkUpgradeEligibility(userId: string) {
    const user = await User.findById(userId)
    const completedTasks = await RealProject.countDocuments({
      studentId: userId,
      status: 'completed'
    })
    const avgRating = await this.getAverageRating(userId)
    const habitsFormed = await MentorObservation.countDocuments({
      userId,
      observationType: 'habit_formed'
    })
    
    // 升级条件
    const requirements = LEVEL_REQUIREMENTS[user.level + 1]
    
    return {
      canUpgrade: 
        completedTasks >= requirements.tasks &&
        avgRating >= requirements.rating &&
        habitsFormed >= requirements.habits,
      progress: {
        tasks: `${completedTasks}/${requirements.tasks}`,
        rating: avgRating.toFixed(1),
        habits: `${habitsFormed}/${requirements.habits}`
      }
    }
  }
  
  async startStretchChallenge(userId: string, taskId: string) {
    const user = await User.findById(userId)
    
    // 检查是否符合跳级条件
    const recentTasks = await RealProject.find({
      studentId: userId,
      status: 'completed'
    }).sort({ completedAt: -1 }).limit(3)
    
    const avgRating = recentTasks.reduce((sum, t) => sum + t.rating, 0) / 3
    
    if (avgRating < 4.5) {
      throw new Error('最近3单评分需要≥4.5才能申请跳级')
    }
    
    // 创建跳级挑战
    const challenge = await StretchChallenge.create({
      userId,
      fromLevel: user.level,
      toLevel: user.level + 2,
      taskId,
      status: 'in_progress',
      startedAt: new Date()
    })
    
    return challenge
  }
}
```

**预计时间**: 2-3天

---

#### Phase 4: 实现故事墙 (P2)

```typescript
// backend/src/models/StoryWall.ts
export interface IStoryWall extends Document {
  userId: mongoose.Types.ObjectId
  personalityTag: string
  storyText: string
  currentStatus: 'independent' | 'team' | 'studio'
  submittedAt: Date
}

// backend/src/controllers/story.controller.ts
export const getStoryWall = async (req, res) => {
  try {
    const stories = await StoryWall.find()
      .populate('userId', 'nickname avatar')
      .sort({ submittedAt: -1 })
      .limit(20)
    
    res.json(stories)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}

export const submitStory = async (req, res) => {
  try {
    const userId = req.user!.userId
    const { storyText, currentStatus } = req.body
    
    const user = await User.findById(userId)
    
    const story = await StoryWall.create({
      userId,
      personalityTag: user.personalityTag,
      storyText,
      currentStatus,
      submittedAt: new Date()
    })
    
    res.json(story)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}
```

**预计时间**: 1天

---

### 方案B: 保持现状，只修复关键接口（快速）

**优势**:
- 快速（1-2天）
- 只需修复前后端不匹配
- 利用现有AI测评服务

**劣势**:
- 失去了完整的产品理念
- 没有固定题库和人格标签
- 没有项目匹配算法
- 用户体验不完整

#### 实施步骤

##### 1. 适配前端API到现有后端
```typescript
// 修改前端 src/services/api.ts
export const opcAPI = {
  // 映射到现有的 /api/growth/assessment
  submitTest: (userId: string, answers: any[]) =>
    request('/growth/assessment', { method: 'POST', data: { answers } }),
  
  // 映射到现有的 /api/growth/assessment/latest
  getResult: (userId: string) =>
    request('/growth/assessment/latest'),
  
  // 暂时返回空，后续实现
  generateReport: (userId: string) =>
    Promise.resolve({ message: '报告生成功能开发中' })
}

// OPC v2.0 暂时禁用
export const opcV2API = {
  startAssessment: () => Promise.reject('功能开发中'),
  // ... 其他方法都返回Promise.reject
}
```

##### 2. 前端显示提示
```typescript
// 在OPC测试页面添加提示
<View className="notice">
  <Text>测评系统升级中，当前使用AI智能测评</Text>
</View>
```

**预计时间**: 1天

---

## 📋 完整实施清单

### 方案A - 完整恢复（推荐）

#### P0 - 必须立即完成
- [ ] 修复BASE_URL不匹配（5分钟）

#### P1 - OPC核心功能（1周）
- [ ] 导入36题数据
- [ ] 实现7种人格标签算法
- [ ] 实现OPCService
- [ ] 实现MatchService（项目匹配）
- [ ] 创建OPCController
- [ ] 注册/api/opc路由
- [ ] 实现导师观察表
- [ ] 实现导师欢迎消息生成
- [ ] 测试所有端点

#### P2 - 等级与故事墙（1周）
- [ ] 更新等级名称
- [ ] 实现跳级挑战机制
- [ ] 基于导师观察的升级条件
- [ ] 创建故事墙表
- [ ] 实现故事墙API
- [ ] 前端页面集成

#### P3 - 体验优化
- [ ] OPC成长报告生成
- [ ] 身份卡片生成
- [ ] 资产仪表盘
- [ ] 可视化优化

### 方案B - 快速修复

#### P0 - 立即完成（1天）
- [ ] 修复BASE_URL
- [ ] 适配前端API到现有后端
- [ ] 添加功能开发中提示

---

## 💰 成本估算

### 方案A - 完整恢复
- P0: 5分钟
- P1: 5-7天（40-56小时）
- P2: 5-7天（40-56小时）
- P3: 3-5天（24-40小时）

**总计**: 约15-20天（120-160小时）

### 方案B - 快速修复
- P0: 1天（8小时）

**总计**: 1天

---

## 🎯 建议

### 如果追求完整产品体验 → 选择方案A
- 完整的OPC理念和用户体验
- 科学的测评体系
- 智能项目匹配
- 导师系统深度集成
- "使命是河"理念完整落地

### 如果追求快速上线 → 选择方案B
- 1天快速修复
- 利用现有AI测评
- 基础功能可用
- 后续逐步完善

---

## 📚 参考文档

1. **GitHub历史提交**: `a91c078f` - OPC系统100%完成报告
2. **完整设计文档**: OPC_SYSTEM_100_PERCENT_COMPLETE.md (历史版本)
3. **36题题库**: backend/migrations/017_opc_test_questions_data.sql (历史版本)
4. **实现参考**:
   - 当前assessment.service.ts（AI测评）
   - 历史opcController.ts（完整实现）
   - 历史matchController.ts（项目匹配）

---

## 🚀 开始恢复

**推荐顺序**（方案A）:
1. 修复BASE_URL（P0，5分钟）
2. 导入36题数据（P1，1小时）
3. 实现人格标签算法（P1，1天）
4. 实现项目匹配系统（P1，1天）
5. 创建OPC API（P1，2天）
6. 集成导师系统（P1，2天）
7. 实现等级体系（P2，3天）
8. 实现故事墙（P2，1天）

**第一步从这里开始**: 修复 `src/services/api.ts` 第5行的BASE_URL

---

*报告生成时间: 2026-07-17*  
*状态: 等待决策*  
*优先级: P1（高优先级）*  
*建议方案: 方案A（完整恢复）*
