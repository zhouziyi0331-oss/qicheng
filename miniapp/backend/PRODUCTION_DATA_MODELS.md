# 生产级推荐系统 - 标准化数据模型

## 🎯 目标：建立标准化、系统化的数据结构

---

## 1. 学生能力模型（StudentAbilityProfile）

### 完整数据结构
```typescript
interface StudentAbilityProfile {
  userId: string
  
  // 基础能力
  basicAbility: {
    level: number                    // 等级 1-10
    experience: number               // 经验值
    totalProjects: number            // 完成项目数
    abilityScore: number             // 综合能力分 0-100
  }
  
  // 技能画像
  skillProfile: {
    primarySkills: SkillItem[]       // 核心技能（权重>0.7）
    secondarySkills: SkillItem[]     // 次要技能（权重0.4-0.7）
    learningSkills: SkillItem[]      // 学习中（权重<0.4）
    skillStability: number           // 技能稳定性 0-1
  }
  
  // 历史表现
  performance: {
    completionRate: number           // 完成率 0-1
    averageRating: number            // 平均评分 0-5
  }
  
  // 向量数据
  vector: {
    qdrantId: string
    vectorData: number[]
    lastUpdated: Date
  }
}
```

---

## 2. 项目评级模型（ProjectRatingProfile）

### 完整数据结构
```typescript
interface ProjectRatingProfile {
  projectId: string
  title: string
  category: string
  budget: number
  
  // 难度评级
  difficultyRating: {
    level: 'easy' | 'medium' | 'hard' | 'expert'
    score: number                    // 难度分 0-100
    recommendedLevel: number         // 推荐学生等级
  }
  
  // 技能要求
  skillRequirements: {
    requiredSkills: string[]
    totalComplexity: number
  }
  
  // 向量数据
  vector: {
    qdrantId: string
    vectorData: number[]
  }
}
```

---

## 3. 推荐结果模型（RecommendationResult）

### 标准响应格式
```typescript
interface RecommendationResult {
  // 推荐列表
  recommendations: RecommendedProject[]
  
  // 统计信息
  statistics: {
    totalCandidates: number
    recommendedCount: number
    avgMatchScore: number
  }
  
  // 学生快照
  studentSnapshot: {
    level: number
    abilityScore: number
    topSkills: string[]
  }
}

interface RecommendedProject {
  // 项目信息
  project: {
    projectId: string
    title: string
    category: string
    budget: number
    difficulty: string
  }
  
  // 综合评分
  overallScore: number               // 0-100
  rank: number
  
  // 各维度得分
  scores: {
    skillMatch: {
      score: number
      matchedSkills: string[]
      coverageRate: number
    }
    difficultyFit: {
      score: number
      challengeLevel: string
      gap: number
    }
    interestMatch: {
      score: number
    }
    successProbability: {
      score: number
      confidence: 'low' | 'medium' | 'high'
    }
  }
  
  // 推荐理由
  recommendation: {
    reasons: string[]
    highlights: string[]
    tags: string[]
  }
  
  // 预测数据
  predictions: {
    completionProbability: number
    expectedRating: number
  }
}
```

---

## 4. 评分标准定义

### 能力等级标准
```typescript
const ABILITY_LEVELS = {
  1: { name: '入门新手', range: [0, 10] },
  2: { name: '初级学徒', range: [11, 20] },
  3: { name: '初级从业者', range: [21, 35] },
  4: { name: '中级从业者', range: [36, 50] },
  5: { name: '中高级', range: [51, 65] },
  6: { name: '高级专业', range: [66, 75] },
  7: { name: '资深专家', range: [76, 85] },
  8: { name: '行业大师', range: [86, 92] },
  9: { name: '领域权威', range: [93, 97] },
  10: { name: '传奇', range: [98, 100] }
}
```

### 难度评级标准
```typescript
const DIFFICULTY_STANDARDS = {
  easy: {
    score: [0, 30],
    requiredLevel: [1, 3],
    estimatedHours: [5, 15]
  },
  medium: {
    score: [31, 55],
    requiredLevel: [3, 5],
    estimatedHours: [15, 40]
  },
  hard: {
    score: [56, 75],
    requiredLevel: [5, 7],
    estimatedHours: [40, 80]
  },
  expert: {
    score: [76, 100],
    requiredLevel: [7, 10],
    estimatedHours: [80, 200]
  }
}
```

### 匹配度评分标准
```typescript
const MATCH_SCORE_LEVELS = {
  perfect: { range: [90, 100], label: '完美匹配' },
  excellent: { range: [80, 89], label: '优秀匹配' },
  good: { range: [70, 79], label: '良好匹配' },
  fair: { range: [60, 69], label: '尚可匹配' },
  poor: { range: [50, 59], label: '较弱匹配' },
  bad: { range: [0, 49], label: '不匹配' }
}
```

---

## 5. API响应标准格式

### 获取推荐接口
```
GET /api/recommendations/projects
Response:
{
  "success": true,
  "data": {
    "recommendations": [...],
    "statistics": {...},
    "studentSnapshot": {...}
  },
  "timestamp": "2026-07-17T21:30:00Z"
}
```

### 获取推荐详情
```
GET /api/recommendations/projects/:projectId/details
Response:
{
  "success": true,
  "data": {
    "project": {...},
    "matchAnalysis": {...},
    "scoreBreakdown": {...},
    "actionGuide": {...}
  }
}
```

---

**这是标准化数据模型文档，作为整个系统的数据规范**
