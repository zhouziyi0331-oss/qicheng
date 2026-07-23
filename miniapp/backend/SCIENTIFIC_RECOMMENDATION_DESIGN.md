# 科学的多维度推荐系统设计

## 🎯 业务目标明确定义

### 核心KPI（可量化）
```
1. 完成率目标: ≥ 85%
2. 按时完成率: ≥ 80%
3. 企业满意度: ≥ 4.0/5.0
4. 学生满意度: ≥ 4.0/5.0
5. 接单率: ≥ 40%（推荐转化率）
```

### 业务逻辑
```
准确推荐 = 能力匹配 + 意愿匹配

能力匹配 → 完成率、质量分
意愿匹配 → 接单率、满意度
```

---

## 📐 维度1：技能匹配度（40%）

### 明确定义
```
技能匹配度 = 学生掌握的技能 与 项目需要的技能 的匹配程度
```

### 计算规则（明确、可验证）

#### 规则1：基础向量相似度
```typescript
baseScore = 1 - vectorDistance
范围: [0, 1]
说明: 向量越近，技能越相似
```

#### 规则2：必需技能覆盖率
```typescript
requiredSkillsCoverage = 匹配的必需技能数 / 总必需技能数

例：
项目需要: [平面设计(必需), 品牌设计(必需), Illustrator(优先)]
学生有: [平面设计, UI设计]

必需技能: 2个
匹配: 1个（平面设计）
覆盖率 = 1/2 = 50%
```

#### 规则3：技能权重加成
```typescript
学生标签有权重（0-1），代表熟练程度

平面设计 weight=0.9 → 非常熟练
平面设计 weight=0.3 → 刚学会

skillStrength = 匹配技能的平均权重

加成系数 = 1 + (skillStrength * 0.2)
最大加成: 20%
```

#### 最终公式
```typescript
技能匹配分 = baseScore * (1 + coverageRate * 0.3) * (1 + skillStrength * 0.2)

归一化到 [0, 1]
```

### 边界和阈值
```
≥ 0.9: 完美匹配（必需技能100%覆盖 + 高熟练度）
0.7-0.89: 良好匹配（必需技能≥80%覆盖）
0.5-0.69: 基本匹配（必需技能≥50%覆盖）
< 0.5: 不匹配（必需技能<50%）

硬性规则: 必需技能覆盖率 < 30% → 直接过滤，不推荐
```

### 假设 vs 验证
```
【假设】向量相似度代表技能相似度
【验证方法】对比：推荐的项目 vs 学生实际完成情况

【假设】标签权重代表熟练程度
【验证方法】对比：高权重技能的项目 vs 完成质量

【假设】必需技能覆盖率影响完成率
【验证方法】统计：覆盖率 vs 实际完成率的相关性
```

---

## 📐 维度2：难度适配度（25%）

### 明确定义
```
难度适配度 = 学生能力水平 与 项目难度 的匹配程度
目标: 略有挑战但可以完成
```

### 学生能力分计算（可量化）

#### 能力分公式（0-100分）
```typescript
能力分 = 
  等级基础分（0-50） +
  项目经验分（0-20） +
  完成率加分（0-15） +
  评分加分（0-15）

具体：
1. 等级基础分 = Level * 5（最高50分）
   Level 1 → 5分
   Level 5 → 25分
   Level 10 → 50分

2. 项目经验分 = min(完成项目数 * 2, 20)
   完成10个项目 → 20分

3. 完成率加分 = 完成率 * 15
   完成率100% → 15分
   完成率85% → 12.75分

4. 评分加分 = (平均评分/5) * 15
   评分5.0 → 15分
   评分4.0 → 12分
```

### 项目难度分计算（可量化）

#### 难度分公式（0-100分）
```typescript
难度分 = 
  基础难度分（0-40） +
  技能要求分（0-30） +
  时间压力分（0-15） +
  质量要求分（0-15）

具体：
1. 基础难度分
   easy → 10分
   medium → 25分
   hard → 35分
   expert → 40分

2. 技能要求分 = min(必需技能数 * 5, 30)
   需要6个技能 → 30分
   需要3个技能 → 15分

3. 时间压力分 = 
   if (deadline紧急) → 15分
   if (deadline正常) → 8分
   if (无deadline) → 0分

4. 质量要求分
   basic → 5分
   professional → 10分
   premium → 12分
   enterprise → 15分
```

### 匹配度计算（明确边界）

```typescript
gap = 学生能力分 - 项目难度分

// 最佳区间：略低到适度挑战
if (gap >= -10 && gap <= 15) {
  // 最佳挑战区
  score = 1.0 - Math.abs(gap - 2.5) * 0.01
  label = gap < 0 ? "略有挑战" : "刚刚好"
}
else if (gap < -10 && gap >= -25) {
  // 有难度但可尝试
  score = 0.6 - (gap + 10) * 0.02
  label = "有挑战"
}
else if (gap < -25) {
  // 太难，不推荐
  score = 0.3
  label = "超出能力"
}
else if (gap > 15 && gap <= 30) {
  // 太简单
  score = 0.8 - (gap - 15) * 0.01
  label = "轻松完成"
}
else {
  // 远低于能力
  score = 0.5
  label = "过于简单"
}
```

### 边界和阈值（明确定义）
```
能力分 - 难度分的gap:

[-10, 15]: 最佳区间（score 0.88-1.0）
  -10 → "略有挑战"（需努力但可完成）
  0 → "刚刚好"（能力完全匹配）
  15 → "轻松完成"（能力稍高）

[-25, -10): 有难度区间（score 0.45-0.6）
  可以尝试，但需要学习新技能

< -25: 过难区间（score 0.3）
  硬性规则: gap < -30 → 直接过滤

> 30: 过于简单（score 0.5）
  硬性规则: gap > 40 → 降低推荐优先级
```

### 假设 vs 验证
```
【假设】能力分代表真实能力
【验证方法】统计：能力分高的学生 vs 实际完成率

【假设】gap在[-10,15]是最佳区间
【验证方法】A/B测试：不同gap区间 vs 完成率和满意度

【假设】gap < -30 不应该推荐
【验证方法】统计：gap < -30的项目 vs 放弃率
```

---

## 📐 维度3：历史成功率（20%）

### 明确定义
```
历史成功率 = 基于学生过往表现，预测此次成功的概率
```

### 计算规则（基于真实数据）

#### 规则1：历史完成率
```typescript
if (totalProjects >= 5) {
  completionRate = 完成项目数 / 接受项目数
} else {
  // 新用户，使用平台平均值
  completionRate = 0.85（平台平均）
}
```

#### 规则2：相似项目成功率
```typescript
// 找出学生做过的相似项目
similarProjects = 学生历史项目.filter(p => 
  p.category === 当前项目.category &&
  p.difficulty === 当前项目.difficulty
)

if (similarProjects.length > 0) {
  similarSuccessRate = similarProjects完成数 / similarProjects总数
} else {
  similarSuccessRate = completionRate
}
```

#### 规则3：技能稳定性
```typescript
// 学生在该技能上的项目完成情况
skillProjects = 学生历史项目.filter(p =>
  p.tags.includes(当前项目主要技能)
)

if (skillProjects.length >= 3) {
  skillSuccessRate = skillProjects完成数 / skillProjects总数
} else {
  skillSuccessRate = completionRate
}
```

#### 最终公式
```typescript
历史成功率 = 
  completionRate * 0.4 +
  similarSuccessRate * 0.3 +
  skillSuccessRate * 0.3

范围: [0, 1]
```

### 边界和阈值
```
≥ 0.85: 高成功率（强烈推荐）
0.70-0.84: 中等成功率（可以推荐）
0.50-0.69: 低成功率（谨慎推荐）
< 0.50: 极低成功率（不推荐）

硬性规则: 历史成功率 < 0.4 → 直接过滤
```

### 假设 vs 验证
```
【假设】历史完成率预测未来表现
【验证方法】统计：历史完成率高 vs 新项目完成率

【假设】相似项目经验影响成功率
【验证方法】统计：有相似经验 vs 无相似经验的完成率对比

【假设】技能稳定性影响成功
【验证方法】统计：该技能项目成功率 vs 总体成功率
```

---

## 📐 维度4：兴趣匹配度（10%）

### 明确定义
```
兴趣匹配度 = 学生对该类型项目的偏好程度
目标: 提高接单率
```

### 计算规则（基于行为数据）

#### 规则1：类别偏好
```typescript
// 统计学生历史接单的类别分布
categoryPreference = {
  'design': 接design项目数 / 总项目数,
  'development': 接development项目数 / 总项目数,
  ...
}

categorScore = categoryPreference[当前项目类别] || 0.5
```

#### 规则2：主动查看行为
```typescript
// 如果学生多次查看该类别项目
viewCount = 该类别项目被该学生查看次数

if (viewCount >= 5) {
  viewScore = 1.0
} else if (viewCount >= 2) {
  viewScore = 0.8
} else {
  viewScore = categoryScore
}
```

#### 规则3：评分偏好
```typescript
// 学生对该类别项目的平均评分
avgRating = 该类别项目的平均评分

if (avgRating >= 4.5) {
  ratingScore = 1.0
} else if (avgRating >= 4.0) {
  ratingScore = 0.8
} else {
  ratingScore = categoryScore
}
```

#### 最终公式
```typescript
if (totalProjects < 3) {
  // 冷启动：使用标签匹配
  兴趣匹配度 = 标签匹配度
} else {
  兴趣匹配度 = 
    categoryScore * 0.5 +
    viewScore * 0.3 +
    ratingScore * 0.2
}
```

### 边界和阈值
```
≥ 0.8: 高兴趣（经常接这类项目）
0.6-0.79: 中等兴趣（偶尔接）
0.4-0.59: 低兴趣（很少接）
< 0.4: 无兴趣

说明: 兴趣低不过滤，只影响排序
```

### 假设 vs 验证
```
【假设】历史类别分布代表兴趣
【验证方法】统计：高兴趣类别 vs 接单率

【假设】查看行为代表意愿
【验证方法】统计：多次查看 vs 最终接单

【假设】高评分代表偏好
【验证方法】统计：高评分类别 vs 重复接单率
```

---

## 📐 维度5：预算匹配度（5%）

### 明确定义
```
预算匹配度 = 项目预算 与 学生期望预算 的匹配程度
```

### 计算规则

```typescript
if (totalProjects < 3) {
  // 新用户，不影响推荐
  预算匹配度 = 1.0
} else {
  // 计算学生历史接单预算范围
  avgBudget = 历史项目平均预算
  stdDev = 预算标准差
  
  minPreference = avgBudget - stdDev
  maxPreference = avgBudget + stdDev
  
  if (项目预算 >= minPreference && 项目预算 <= maxPreference) {
    预算匹配度 = 1.0
  } else if (项目预算 > maxPreference) {
    // 高于期望，加分
    预算匹配度 = 1.0 + min((项目预算 - maxPreference) / maxPreference * 0.2, 0.2)
  } else {
    // 低于期望，减分
    预算匹配度 = max(0.6, 项目预算 / minPreference)
  }
}
```

### 边界和阈值
```
> 1.0: 超出期望（加分项）
= 1.0: 符合期望
0.6-0.99: 低于期望但可接受
< 0.6: 远低于期望

说明: 预算权重低，只是微调
```

---

## 📐 维度6：时间匹配度（5%）

### 明确定义
```
时间匹配度 = 项目预计工时 与 学生可用时间 的匹配程度
```

### 计算规则

```typescript
// 估算项目工时
estimatedHours = 
  基础工时[difficulty] * 
  (1 - 技能匹配度 * 0.3) * // 技能越高，时间越短
  复杂度系数

基础工时:
  easy: 10小时
  medium: 25小时
  hard: 50小时
  expert: 80小时

// 学生可用时间（从用户设置获取，默认30小时/周）
availableHours = 学生设置的每周可用时间 || 30

// 匹配度
if (estimatedHours <= availableHours) {
  时间匹配度 = 1.0
} else if (estimatedHours <= availableHours * 1.5) {
  时间匹配度 = 0.8
} else {
  时间匹配度 = max(0.5, availableHours / estimatedHours)
}
```

### 边界和阈值
```
= 1.0: 时间充足
= 0.8: 时间稍紧
< 0.8: 时间不足

硬性规则: 时间匹配度 < 0.5 → 提示用户"时间可能不够"
```

---

## 🎯 综合评分公式

### 权重配置（基于业务目标）

```typescript
// 标准权重
const STANDARD_WEIGHTS = {
  skillMatch: 0.40,      // 技能最重要（影响完成率）
  difficultyFit: 0.25,   // 难度适配（影响质量和完成率）
  successProb: 0.20,     // 历史成功率（最直接的预测）
  interestMatch: 0.10,   // 兴趣（影响接单率）
  budgetFit: 0.03,       // 预算（影响接单意愿）
  timeFit: 0.02          // 时间（基础筛选）
}

// 根据学生经验调整权重
if (学生经验 < 3个项目) {
  // 新手：更看重难度和成功率
  weights.difficultyFit = 0.35
  weights.successProb = 0.15
  weights.skillMatch = 0.35
} else if (学生等级 >= 6) {
  // 高级：更看重技能和兴趣
  weights.skillMatch = 0.45
  weights.interestMatch = 0.15
  weights.difficultyFit = 0.20
}
```

### 最终评分
```typescript
finalScore = 
  技能匹配度 * weights.skillMatch +
  难度适配度 * weights.difficultyFit +
  历史成功率 * weights.successProb +
  兴趣匹配度 * weights.interestMatch +
  预算匹配度 * weights.budgetFit +
  时间匹配度 * weights.timeFit

范围: [0, 1]
转换为百分制: finalScore * 100
```

---

## 🚫 硬性过滤规则（边界清晰）

```typescript
// 以下情况直接过滤，不推荐

1. 必需技能覆盖率 < 30%
   理由: 缺少核心技能，无法完成

2. 能力差距 gap < -30
   理由: 远超学生能力，失败率极高

3. 历史成功率 < 40%（且有5个以上项目）
   理由: 学生历史表现差，不适合推荐

4. 时间匹配度 < 0.3
   理由: 时间完全不够

5. finalScore < 0.4
   理由: 综合匹配度太低
```

---

## 📊 反馈机制设计

### 收集的数据
```typescript
interface ProjectFeedback {
  // 推荐时的数据
  recommendationScore: number
  recommendationRank: number
  各维度得分: {...}
  
  // 用户行为
  viewed: boolean            // 是否查看
  viewedAt: Date
  accepted: boolean          // 是否接单
  acceptedAt: Date
  
  // 完成情况
  completed: boolean
  completedAt: Date
  onTime: boolean
  
  // 评价
  studentRating: number      // 学生评分（1-5）
  clientRating: number       // 企业评分（1-5）
  
  // 实际数据
  actualDifficulty: number   // 学生反馈的实际难度
  actualHours: number        // 实际花费时间
}
```

### 验证方法
```typescript
// 每周运行一次验证

1. 技能匹配度验证
   统计: 技能匹配度高 vs 完成率、质量分
   if (相关性 < 0.6) → 调整技能匹配算法

2. 难度适配度验证
   统计: gap值 vs 完成率
   找出最佳gap区间

3. 成功率预测验证
   统计: 预测成功率 vs 实际完成率
   计算预测准确度

4. 兴趣匹配度验证
   统计: 兴趣匹配度 vs 接单率
   if (相关性 < 0.5) → 调整兴趣算法

5. 整体推荐质量
   统计: finalScore > 0.7的推荐 vs 接单率、完成率
   目标: 接单率 > 40%, 完成率 > 85%
```

### 迭代优化流程
```
1. 收集1000个推荐的反馈数据
2. 统计分析各维度与业务目标的相关性
3. 调整权重和阈值
4. A/B测试新算法 vs 旧算法
5. 如果新算法更好 → 全量上线
6. 重复以上流程
```

---

## 📋 可量化指标汇总

### 算法指标
```
1. 推荐准确率 = 
   (finalScore > 0.7的推荐中，实际完成的数量) / 总推荐数
   目标: > 70%

2. 接单转化率 = 接单数 / 推荐数
   目标: > 40%

3. 完成率 = 完成数 / 接单数
   目标: > 85%

4. 满意度 = 平均评分
   目标: > 4.0/5.0
```

### 各维度准确性
```
1. 技能匹配预测准确度 = 
   (技能匹配度 > 0.8的项目完成率) vs (总体完成率)
   目标: 提升 > 15%

2. 难度适配预测准确度 =
   (gap在[-10,15]的项目完成率) vs (其他gap的完成率)
   目标: 提升 > 20%

3. 成功率预测误差 =
   |预测成功率 - 实际完成率|
   目标: < 15%
```

---

**这才是一个科学的、有边界的、可验证的推荐系统！**

下一步：根据这个设计重新实现代码。
