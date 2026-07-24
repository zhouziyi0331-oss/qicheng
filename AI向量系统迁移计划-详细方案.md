# 🔄 AI向量系统迁移计划 - 详细方案

## 🎯 项目概述

### 源项目：ai-project-mentor
- **核心技术**：自研向量系统（特征工程）
- **优势**：不依赖OpenAI API，完全本地化
- **向量维度**：86维（任务）+ 74维（学生）

### 目标项目：qicheng
- **当前状态**：使用Qdrant + Python embedding
- **目标**：迁移到自研向量系统
- **保持**：两个项目独立

---

## 📊 技术对比

### 旧系统（qicheng当前）
```
技术栈：
- Qdrant向量数据库
- Python embedding_service.py
- OpenAI Embedding API（可能需要）

优点：
✅ 成熟的向量数据库
✅ 高性能

缺点：
❌ 依赖外部服务
❌ 需要运行Python服务
❌ 可能需要OpenAI API费用
```

### 新系统（ai-project-mentor）
```
技术栈：
- 纯TypeScript实现
- 基于特征工程
- 无外部依赖

优点：
✅ 完全本地化
✅ 无API费用
✅ 可解释性强
✅ 纯Node.js，无需Python

技术特点：
- 任务向量：86维
  - 技能向量：64维（8类×8技能）
  - 领域向量：7维
  - 难度/复杂度/时间：3维
  - 交付物类型：10维
  - 工具/步骤数量：2维

- 学生向量：74维
  - 技能熟练度：64维
  - 领域经验：7维
  - 学习速度/可靠性等：3维
```

---

## 🔍 核心文件分析

### ai-project-mentor的向量系统

```typescript
backend/src/services/
├── real-vector-generation.ts      // 核心：向量生成服务
│   ├── generateTaskVector()       // 生成任务向量（86维）
│   ├── generateStudentVector()    // 生成学生向量（74维）
│   ├── calculateSimilarity()      // 计算相似度
│   └── matchTasksToStudents()     // 任务匹配
│
└── 特征工程模块：
    ├── 技能分类体系（64维）
    ├── 领域关键词（7维）
    ├── 难度指标
    ├── 复杂度计算
    └── 交付物类型识别
```

---

## 📋 迁移步骤

### 阶段1：准备工作（1小时）

#### 1.1 复制核心文件
```bash
# 从ai-project-mentor复制向量服务
cp /Users/alwan/code/ai-project-mentor/backend/src/services/real-vector-generation.ts \
   /Users/alwan/code/qicheng/miniapp/backend/src/services/vectorGeneration.service.ts
```

#### 1.2 调整依赖
```typescript
// 修改Prisma引用为MongoDB模型
// 从：import { PrismaClient } from '@prisma/client'
// 到：import { Task, Student } from '../models'
```

#### 1.3 安装依赖
```bash
cd /Users/alwan/code/qicheng/miniapp/backend
# 检查是否需要新依赖（通常不需要，纯TypeScript实现）
```

---

### 阶段2：核心迁移（3小时）

#### 2.1 创建新的向量服务

**文件**：`backend/src/services/vectorGeneration.service.ts`

```typescript
import { Task, Student } from '../models'

/**
 * 自研向量生成服务
 * 完全基于特征工程，不依赖OpenAI API
 */

// 技能分类体系 (8类 × 8技能 = 64维)
const SKILL_CATEGORIES = {
  'AI工具使用': ['ChatGPT', 'Claude', 'Midjourney', 'Stable Diffusion', ...],
  '内容创作': ['文案写作', '视频剪辑', '图像设计', ...],
  '技术开发': ['Python', 'JavaScript', 'API集成', ...],
  '数据分析': ['数据清洗', '可视化', '统计分析', ...],
  '营销推广': ['社交媒体', 'SEO', '广告投放', ...],
  '项目管理': ['需求分析', '进度管理', '团队协作', ...],
  '设计思维': ['用户研究', '原型设计', '交互设计', ...],
  '商业分析': ['市场调研', '竞品分析', '商业模式', ...]
}

// 领域分类 (7维)
const DOMAIN_KEYWORDS = {
  'ecommerce': ['电商', '跨境', '店铺', ...],
  'content': ['内容', '创作', '自媒体', ...],
  'service': ['服务', '餐饮', '酒店', ...],
  'tech': ['技术', '开发', '产品', ...],
  'education': ['教育', '培训', '课程', ...],
  'government': ['政府', '乡村', '农业', ...],
  'startup': ['创业', '自由职业', '副业', ...]
}

export class VectorGenerationService {
  
  /**
   * 生成任务向量（86维）
   */
  async generateTaskVector(taskDescription: string, requirements: any): Promise<number[]> {
    // 1. 技能向量 (64维)
    const skillVector = this.extractSkillVector(taskDescription, requirements)
    
    // 2. 领域向量 (7维)
    const domainVector = this.extractDomainVector(taskDescription)
    
    // 3. 难度分数 (1维)
    const difficultyScore = this.calculateDifficultyScore(taskDescription, requirements)
    
    // 4. 复杂度分数 (1维)
    const complexityScore = this.calculateComplexityScore(taskDescription, requirements)
    
    // 5. 时间估算 (1维)
    const timeEstimate = this.estimateTime(taskDescription, requirements) / 20
    
    // 6. 交付物类型 (10维)
    const deliverableType = this.extractDeliverableType(taskDescription, requirements)
    
    // 7. 工具数量 (1维)
    const toolCount = Math.min(this.countTools(taskDescription, requirements) / 5, 1)
    
    // 8. 步骤数量 (1维)
    const stepCount = Math.min(this.countSteps(requirements) / 10, 1)
    
    return [
      ...skillVector,
      ...domainVector,
      difficultyScore,
      complexityScore,
      timeEstimate,
      ...deliverableType,
      toolCount,
      stepCount
    ]
  }
  
  /**
   * 生成学生向量（74维）
   */
  async generateStudentVector(studentId: string): Promise<number[]> {
    // 从数据库获取学生数据
    const student = await Student.findById(studentId)
    const completedTasks = await Task.find({ 
      studentId, 
      status: 'completed' 
    })
    
    // 1. 技能熟练度 (64维)
    const skillProficiency = this.calculateSkillProficiency(student, completedTasks)
    
    // 2. 领域经验 (7维)
    const domainExperience = this.calculateDomainExperience(completedTasks)
    
    // 3. 学习速度 (1维)
    const learningSpeed = this.calculateLearningSpeed(completedTasks)
    
    // 4. 可靠性 (1维)
    const reliability = this.calculateReliability(completedTasks)
    
    // 5. 完成率 (1维)
    const completionRate = this.calculateCompletionRate(student)
    
    return [
      ...skillProficiency,
      ...domainExperience,
      learningSpeed,
      reliability,
      completionRate
    ]
  }
  
  /**
   * 计算相似度（余弦相似度）
   */
  calculateSimilarity(vector1: number[], vector2: number[]): number {
    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0
    
    for (let i = 0; i < vector1.length; i++) {
      dotProduct += vector1[i] * vector2[i]
      norm1 += vector1[i] * vector1[i]
      norm2 += vector2[i] * vector2[i]
    }
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
  }
  
  /**
   * 任务匹配
   */
  async matchTasksToStudents(taskId: string, limit: number = 10) {
    // 1. 生成任务向量
    const task = await Task.findById(taskId)
    const taskVector = await this.generateTaskVector(task.description, task.requirements)
    
    // 2. 获取所有活跃学生
    const students = await Student.find({ status: 'active' })
    
    // 3. 计算每个学生的匹配度
    const matches = await Promise.all(students.map(async (student) => {
      const studentVector = await this.generateStudentVector(student._id)
      const similarity = this.calculateSimilarity(taskVector, studentVector)
      
      return {
        studentId: student._id,
        student: student,
        similarity: similarity,
        matchScore: similarity * 100 // 转换为百分比
      }
    }))
    
    // 4. 排序并返回前N个
    return matches
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
  }
  
  // ... 其他辅助方法
  private extractSkillVector() { ... }
  private extractDomainVector() { ... }
  private calculateDifficultyScore() { ... }
  private calculateComplexityScore() { ... }
  // ...
}

export const vectorGenerationService = new VectorGenerationService()
```

#### 2.2 更新任务匹配控制器

**文件**：`backend/src/controllers/taskMatch.controller.ts`

```typescript
import { vectorGenerationService } from '../services/vectorGeneration.service'

export class TaskMatchController {
  /**
   * POST /api/tasks/:taskId/match
   * 为任务匹配合适的学生
   */
  async matchStudents(req: Request, res: Response) {
    try {
      const { taskId } = req.params
      const { limit = 10 } = req.query
      
      // 使用新的向量系统
      const matches = await vectorGenerationService.matchTasksToStudents(
        taskId,
        parseInt(limit as string)
      )
      
      res.json({
        success: true,
        matches: matches.map(m => ({
          studentId: m.studentId,
          studentName: m.student.nickname,
          matchScore: Math.round(m.matchScore),
          similarity: m.similarity.toFixed(4)
        }))
      })
      
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }
}
```

#### 2.3 保存学生向量到数据库

**更新Student模型**：

```typescript
// backend/src/models/Student.ts
interface IStudent {
  // ... 现有字段
  
  // 新增：向量缓存
  vectorCache?: {
    vector: number[],        // 74维向量
    lastUpdated: Date,       // 最后更新时间
    version: string          // 向量版本（用于识别算法变化）
  }
}
```

---

### 阶段3：测试验证（2小时）

#### 3.1 单元测试

**文件**：`backend/src/tests/vectorGeneration.test.ts`

```typescript
import { vectorGenerationService } from '../services/vectorGeneration.service'

describe('Vector Generation Service', () => {
  
  test('生成任务向量应该返回86维数组', async () => {
    const vector = await vectorGenerationService.generateTaskVector(
      '使用ChatGPT写一篇电商产品文案',
      { difficulty: 'beginner', deliverables: ['文案'] }
    )
    
    expect(vector).toHaveLength(86)
    expect(vector.every(v => v >= 0 && v <= 1)).toBe(true)
  })
  
  test('计算相似度应该返回0-1之间的值', () => {
    const v1 = Array(86).fill(0.5)
    const v2 = Array(86).fill(0.5)
    
    const similarity = vectorGenerationService.calculateSimilarity(v1, v2)
    
    expect(similarity).toBeGreaterThanOrEqual(0)
    expect(similarity).toBeLessThanOrEqual(1)
  })
  
  test('任务匹配应该返回排序后的结果', async () => {
    // 创建测试任务和学生
    // ...
    
    const matches = await vectorGenerationService.matchTasksToStudents('test_task_id', 5)
    
    expect(matches).toHaveLength(5)
    // 验证结果按相似度降序排列
    for (let i = 0; i < matches.length - 1; i++) {
      expect(matches[i].similarity).toBeGreaterThanOrEqual(matches[i + 1].similarity)
    }
  })
})
```

#### 3.2 API测试

```bash
# 测试任务匹配
curl -X POST http://localhost:3000/api/tasks/test_task_001/match?limit=10 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 阶段4：性能优化（2小时）

#### 4.1 向量缓存策略

```typescript
class VectorGenerationService {
  // 缓存学生向量（24小时有效）
  private studentVectorCache = new Map<string, {
    vector: number[],
    timestamp: number
  }>()
  
  async generateStudentVector(studentId: string): Promise<number[]> {
    // 检查缓存
    const cached = this.studentVectorCache.get(studentId)
    if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
      return cached.vector
    }
    
    // 生成新向量
    const vector = await this._generateStudentVectorInternal(studentId)
    
    // 更新缓存
    this.studentVectorCache.set(studentId, {
      vector,
      timestamp: Date.now()
    })
    
    return vector
  }
}
```

#### 4.2 批量向量生成

```typescript
/**
 * 批量生成学生向量
 */
async generateStudentVectorsBatch(studentIds: string[]): Promise<Map<string, number[]>> {
  const results = new Map()
  
  // 并发生成
  await Promise.all(studentIds.map(async (studentId) => {
    const vector = await this.generateStudentVector(studentId)
    results.set(studentId, vector)
  }))
  
  return results
}
```

---

## 📊 迁移对比

### 前后对比

| 指标 | 旧系统（Qdrant） | 新系统（自研） |
|------|----------------|--------------|
| 依赖 | Qdrant + Python | 纯Node.js |
| API费用 | 可能需要OpenAI | 完全免费 |
| 向量维度 | 不定（OpenAI） | 86维（任务）+ 74维（学生） |
| 可解释性 | 黑盒 | 完全可解释 |
| 性能 | 高 | 中等（可优化） |
| 维护成本 | 高 | 低 |

---

## 🚀 迁移时间表

### 第1天：准备和迁移
- ✅ 上午：复制文件，调整依赖
- ✅ 下午：实现核心向量生成

### 第2天：测试和优化
- ✅ 上午：单元测试，API测试
- ✅ 下午：性能优化，缓存策略

### 第3天：集成和上线
- ✅ 上午：集成到现有系统
- ✅ 下午：全面测试，文档更新

---

## ⚠️ 注意事项

### 1. 保持两个项目独立
- ai-project-mentor：继续独立开发
- qicheng：使用迁移后的代码，但可以独立修改

### 2. 数据迁移
- 不需要迁移现有的Qdrant数据
- 新系统会根据当前数据重新生成向量

### 3. 向后兼容
- 保留旧的vectorCore.service.ts作为备份
- 新系统稳定后再删除旧代码

### 4. 性能监控
- 监控向量生成时间
- 监控匹配查询时间
- 必要时添加数据库索引

---

## 📚 相关文档

- **源项目文档**: `/Users/alwan/code/ai-project-mentor/DATABASE_IMPLEMENTATION.md`
- **向量生成源码**: `/Users/alwan/code/ai-project-mentor/backend/src/services/real-vector-generation.ts`

---

## 🎯 下一步

1. **今天晚上/明天**: 复制核心文件并调整依赖
2. **明天下午**: 实现基本的向量生成和匹配
3. **后天**: 测试、优化和文档

---

**准备好开始迁移了吗？** 🚀

**我可以帮您：**
1. 立即复制文件并开始迁移
2. 先创建测试数据验证概念
3. 先看看ai-project-mentor的完整实现

**您想从哪里开始？**
