# 🎯 AI任务拆解 - 企业和学生之间的翻译器

## 核心问题

**现实场景**：
```
企业：我要一个海报
  ↓
问题：什么行业？什么风格？什么尺寸？用在哪里？
  ↓
学生：不知道怎么做，需要什么技能？怎么拆解步骤？
```

**AI导师的作用**：
- 帮企业澄清需求
- 把模糊需求转化为清晰任务
- 为学生拆解执行步骤
- 匹配合适的学生

---

## 🔄 完整流程

### 阶段1：企业发布任务

#### Step 1: 企业输入原始需求

```typescript
POST /api/task-breakdown/analyze

Request:
{
  "rawInput": "我要一个海报，宣传新产品",
  "industry": "美妆"
}
```

#### Step 2: AI判断是否需要追问

**如果信息不足**：
```json
Response:
{
  "success": true,
  "needsClarification": true,
  "questions": [
    {
      "question": "这个海报用在哪里？",
      "options": ["小红书", "微信朋友圈", "户外广告", "淘宝详情页"],
      "required": true
    },
    {
      "question": "目标受众是谁？",
      "options": ["18-25岁女性", "25-35岁女性", "35-45岁女性"],
      "required": true
    },
    {
      "question": "预算范围？",
      "options": ["300-500元", "500-1000元", "1000-2000元"],
      "required": false
    }
  ]
}
```

**前端显示追问界面**，企业回答后再次调用：

```typescript
POST /api/task-breakdown/analyze

Request:
{
  "rawInput": "我要一个海报，宣传新产品",
  "industry": "美妆",
  "additionalInfo": {
    "usage": "小红书",
    "targetAudience": "18-25岁女性",
    "budget": "300-500元"
  }
}
```

#### Step 3: AI生成结构化任务

**信息足够后**：
```json
Response:
{
  "success": true,
  "needsClarification": false,
  "data": {
    // 🎯 结构化任务描述
    "structuredTask": {
      "taskType": "平面设计 - 海报设计",
      "industry": "美妆",
      "description": "为美妆品牌新款口红设计小红书宣传海报。目标受众为18-25岁年轻女性，要求风格年轻、时尚、活力。海报将用于小红书平台推广，需要竖版设计（1080x1920）。",
      "requirements": [
        "设计尺寸：1080x1920（竖版）",
        "风格：年轻、时尚、活力",
        "必须包含：产品图、品牌Logo、核心卖点",
        "色调：粉色系、暖色调",
        "文案：需要突出「持久不掉色」「水润不拔干」",
        "符合小红书平台风格（清新、精致）"
      ],
      "deliverables": [
        "海报源文件（PSD或AI格式）",
        "导出图片（JPG格式，1080x1920）",
        "至少3个初稿方案供选择"
      ],
      "skills": [
        "平面设计",
        "配色",
        "排版",
        "产品摄影/修图",
        "文案设计",
        "小红书风格理解"
      ],
      "difficulty": "medium",
      "estimatedTime": "2-3天",
      "suggestedBudget": 500
    },

    // 🎯 学生执行步骤（核心！）
    "executionSteps": [
      {
        "step": 1,
        "title": "需求理解与调研",
        "description": "深入理解客户需求，研究目标受众和竞品",
        "tasks": [
          {
            "task": "分析目标受众（18-25岁女性）的审美偏好",
            "estimatedTime": "30分钟",
            "skills": ["用户研究", "市场分析"]
          },
          {
            "task": "收集小红书上类似产品的爆款海报",
            "estimatedTime": "1小时",
            "skills": ["竞品分析"]
          },
          {
            "task": "确定视觉风格方向（至少3个方向）",
            "estimatedTime": "30分钟",
            "skills": ["视觉设计"]
          }
        ],
        "checkpoints": [
          "已明确目标受众画像和审美偏好",
          "收集了至少10个竞品案例",
          "确定了3个可行的风格方向"
        ],
        "tips": [
          "💡 建议在小红书搜索「口红海报」「美妆海报」，分析点赞高的设计",
          "💡 注意年轻女性偏好的配色：粉色、珊瑚色、暖橘色",
          "💡 可以使用花瓣网、Pinterest收集参考图"
        ]
      },
      {
        "step": 2,
        "title": "设计准备",
        "description": "准备设计素材和确定设计方案",
        "tasks": [
          {
            "task": "选择配色方案（主色+辅助色）",
            "estimatedTime": "30分钟",
            "skills": ["配色"]
          },
          {
            "task": "准备/拍摄产品图片",
            "estimatedTime": "1小时",
            "skills": ["产品摄影", "修图"]
          },
          {
            "task": "设计文案排版方案",
            "estimatedTime": "30分钟",
            "skills": ["排版", "文案设计"]
          }
        ],
        "checkpoints": [
          "配色方案已确定并获得客户初步认可",
          "产品图片清晰、符合要求",
          "文案排版有2-3个方案"
        ],
        "tips": [
          "💡 推荐配色工具：Coolors、Adobe Color",
          "💡 如果没有产品实物，可以使用客户提供的官方图片",
          "💡 文案要简洁有力，突出核心卖点"
        ]
      },
      {
        "step": 3,
        "title": "初稿设计",
        "description": "完成3个不同风格的初稿方案",
        "tasks": [
          {
            "task": "设计方案1（清新风格）",
            "estimatedTime": "2小时",
            "skills": ["平面设计", "排版"]
          },
          {
            "task": "设计方案2（时尚风格）",
            "estimatedTime": "2小时",
            "skills": ["平面设计", "排版"]
          },
          {
            "task": "设计方案3（复古风格）",
            "estimatedTime": "2小时",
            "skills": ["平面设计", "排版"]
          }
        ],
        "checkpoints": [
          "3个初稿风格差异明显",
          "每个初稿都包含：产品图、Logo、文案",
          "尺寸符合要求（1080x1920）"
        ],
        "tips": [
          "💡 推荐工具：Photoshop、Illustrator、Figma",
          "💡 先做低保真草稿，确认方向后再精修",
          "💡 记得保存不同版本，方便后续修改"
        ]
      },
      {
        "step": 4,
        "title": "客户反馈与修改",
        "description": "根据客户反馈调整设计",
        "tasks": [
          {
            "task": "提交初稿给客户评审",
            "estimatedTime": "30分钟",
            "skills": ["沟通"]
          },
          {
            "task": "根据反馈进行修改",
            "estimatedTime": "2-3小时",
            "skills": ["平面设计", "沟通"]
          }
        ],
        "checkpoints": [
          "客户已选定1个方案",
          "修改意见已全部实现",
          "客户确认可以进入终稿阶段"
        ],
        "tips": [
          "💡 修改时记录客户的具体要求，避免理解偏差",
          "💡 如果客户意见模糊，主动提供2-3个修改方向供选择",
          "💡 保持耐心和专业，修改是正常流程"
        ]
      },
      {
        "step": 5,
        "title": "终稿制作与交付",
        "description": "完成最终稿件并交付",
        "tasks": [
          {
            "task": "精修细节（对齐、间距、色彩）",
            "estimatedTime": "1小时",
            "skills": ["平面设计", "细节把控"]
          },
          {
            "task": "导出交付文件",
            "estimatedTime": "30分钟",
            "skills": ["文件处理"]
          },
          {
            "task": "整理源文件并打包",
            "estimatedTime": "30分钟",
            "skills": ["文件管理"]
          }
        ],
        "checkpoints": [
          "设计细节完美无瑕疵",
          "已导出JPG格式（1080x1920）",
          "源文件已整理打包（图层命名清晰）"
        ],
        "tips": [
          "💡 交付前自检清单：尺寸、分辨率、文字无错别字、颜色模式（RGB）",
          "💡 源文件建议合并图层并保留一份可编辑版本",
          "💡 可以额外提供PNG透明背景版本（加分项）"
        ]
      }
    ],

    // 🎯 匹配标签（用于向量匹配学生）
    "matchingTags": [
      {
        "tagName": "平面设计",
        "weight": 1.0,
        "reason": "核心技能要求"
      },
      {
        "tagName": "美妆行业经验",
        "weight": 0.8,
        "reason": "行业经验能更好理解产品特性"
      },
      {
        "tagName": "小红书风格",
        "weight": 0.9,
        "reason": "需要熟悉平台风格"
      },
      {
        "tagName": "年轻化设计",
        "weight": 0.7,
        "reason": "目标受众是年轻女性"
      },
      {
        "tagName": "配色能力",
        "weight": 0.8,
        "reason": "配色是关键"
      }
    ]
  }
}
```

---

### 阶段2：匹配学生

```typescript
POST /api/task-breakdown/match-students

Request:
{
  "matchingTags": [...],
  "structuredTask": {...}
}

Response:
{
  "success": true,
  "data": {
    "matchedStudents": [
      {
        "studentId": "...",
        "name": "小王",
        "matchScore": 95,
        "reason": "擅长平面设计、有美妆行业经验、熟悉小红书风格",
        "portfolio": [...]
      }
    ]
  }
}
```

---

### 阶段3：学生执行任务

#### 学生接单后，查看执行步骤

```typescript
// 前端展示executionSteps
每个步骤显示：
- 标题和描述
- 具体任务列表（带预计时间）
- 检查点（自检清单）
- AI导师建议
```

#### 学生执行到某一步时，获取详细指导

```typescript
POST /api/task-breakdown/step-guidance

Request:
{
  "taskId": "...",
  "currentStep": 1,
  "studentContext": {
    "level": 5,
    "skills": ["平面设计", "配色"],
    "completedProjects": 12
  }
}

Response:
{
  "success": true,
  "data": {
    "guidance": "
# 第1步：需求理解与调研

## 具体怎么做

### 1. 分析目标受众
- 打开小红书，搜索「18岁女生口红」「大学生口红推荐」
- 查看评论区，了解她们的痛点：
  - 持久度？
  - 价格？
  - 颜色？
  - 质地？
- 总结3-5个关键需求

### 2. 收集竞品案例
推荐搜索：
- 小红书：「口红海报」「美妆海报」「产品海报」
- 花瓣网：搜索「化妆品海报」
- Behance：搜索「cosmetic poster」

保存至少10个案例，分析：
- 配色（记录色值）
- 排版（文字位置、大小）
- 产品展示方式（俯拍？侧面？）

### 3. 确定3个风格方向
基于调研，提炼3个方向：
1. 清新自然风（粉色+白色，简约）
2. 时尚高级风（金色+黑色，质感）
3. 活力年轻风（橙色+黄色，俏皮）

每个方向用moodboard呈现（收集3-5张参考图）

## 常见问题

Q: 找不到好的参考怎么办？
A: 试试这些关键词：「ins风海报」「日系美妆」「韩系美妆」

Q: 不确定客户喜欢哪种风格？
A: 把3个moodboard发给客户，让TA选择

## 推荐工具

- 花瓣网：收集灵感
- Eagle：管理参考图片
- Notion：整理调研笔记

## 自检清单

- [ ] 已分析目标受众的审美偏好
- [ ] 收集了至少10个竞品案例
- [ ] 提炼了3个可行的风格方向
- [ ] 每个方向有moodboard支撑

完成后进入第2步！
    ",
    "step": 1
  }
}
```

---

## 🎯 核心价值

### 1. 帮企业澄清需求
- 模糊输入："我要一个海报"
- AI追问：用途？受众？预算？
- 清晰输出：结构化任务描述

### 2. 帮学生拆解步骤
- 不再是"做一个海报"（太模糊）
- 而是5个清晰步骤，每步都有：
  - 具体任务
  - 预计时间
  - 检查点
  - AI建议

### 3. 实时指导
- 学生卡在某一步？
- 调用`/step-guidance`
- 获得详细的操作指南

### 4. 精准匹配
- 基于匹配标签
- 在向量空间中搜索学生
- 找到最合适的人

---

## 📋 前端集成

### 企业端

```typescript
// 1. 企业输入
const [rawInput, setRawInput] = useState("我要一个海报")

// 2. 提交分析
const result = await api.post('/task-breakdown/analyze', {
  rawInput,
  industry
})

// 3. 如果需要追问
if (result.needsClarification) {
  // 显示问题表单
  showQuestions(result.questions)
}

// 4. 如果拆解完成
if (!result.needsClarification) {
  // 显示结构化任务
  showStructuredTask(result.structuredTask)
  // 显示执行步骤
  showExecutionSteps(result.executionSteps)
  // 匹配学生
  matchStudents(result.matchingTags)
}
```

### 学生端

```typescript
// 1. 查看任务详情（包含executionSteps）
const task = await api.get(`/real-projects/${projectId}`)

// 2. 显示步骤
task.executionSteps.map(step => (
  <StepCard
    title={step.title}
    tasks={step.tasks}
    checkpoints={step.checkpoints}
    tips={step.tips}
  />
))

// 3. 执行到某一步，获取详细指导
const guidance = await api.post('/task-breakdown/step-guidance', {
  taskId: projectId,
  currentStep: 2
})

// 4. 显示Markdown格式的指导
showGuidance(guidance.guidance)
```

---

## 🎉 总结

**这才是AI导师真正的价值！**

不是：
- ❌ 简单的推荐
- ❌ 模板化的回复
- ❌ 只有标签匹配

而是：
- ✅ 理解模糊需求
- ✅ 追问关键信息
- ✅ 生成清晰的任务描述
- ✅ 为学生拆解详细步骤
- ✅ 实时提供具体指导
- ✅ 精准匹配合适的人

**让企业和学生之间的沟通变得简单、清晰、高效！** 🚀
