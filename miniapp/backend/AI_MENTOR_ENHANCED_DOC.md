# AI导师增强版系统文档

**版本**: 2.0  
**实现时间**: 2026-07-17  
**状态**: ✅ 核心功能已实现

---

## 📋 目录

1. [系统概述](#系统概述)
2. [核心设计理念](#核心设计理念)
3. [功能模块](#功能模块)
4. [API接口](#api接口)
5. [数据模型](#数据模型)
6. [使用流程](#使用流程)
7. [配置说明](#配置说明)

---

## 系统概述

AI导师增强版是一个基于GPT-4的智能引导系统，采用**PBL（Problem-Based Learning，问题导向学习）**和**心理引导式教育**相结合的方法，帮助学生：

- 🎯 通过问题引导自主思考
- 📚 获得个性化学习路径
- ✅ 提交前获得AI审核反馈
- 📈 看见自己的成长轨迹
- 💪 获得情绪支持和鼓励

---

## 核心设计理念

### 角色定位

**"先走过这条河的人"**，不是老师、教练或评委。

### 教育方法

#### ❌ 禁止的表达方式
```
"你做错了"
"这样不对"
"你应该..."
"正确的做法是..."
```

#### ✅ 推荐的表达方式
```
"你注意到这里可以不一样吗？"
"试试换个角度？"
"我之前也在这里卡过，后来发现..."
"你觉得现在的处理方式够好吗？"
```

### 核心任务

1. **PBL引导** - 用模糊词引导学生思考，不直接给答案
2. **学习路径** - 提供以结果为导向的学习建议
3. **作品审核** - 提交前的AI审核，多维度评价
4. **成长见证** - 记录关键时刻，对比成长轨迹
5. **情绪支持** - 识别情绪，提供鼓励和理解

---

## 功能模块

### 1. PBL问题引导流程 ✨

#### Step 1: 问题拆解（模糊词引导）

**接口**: `POST /api/mentor-enhanced/pbl/:taskId/breakdown`

**流程**:
```
学生接单 
  ↓
AI用引导性问题帮助学生理解项目
  - "你觉得这个项目的核心是什么？"
  - "哪些部分可能是关键的？"
  - "你想从哪里开始？"
  ↓
给出模糊的方向提示（不是具体步骤）
  ↓
邀请学生用自己的话表达理解
```

**示例请求**:
```bash
POST /api/mentor-enhanced/pbl/66a587d4c29906132d3f1fe8b/breakdown
Headers: Authorization: Bearer <token>
```

**示例响应**:
```json
{
  "success": true,
  "data": {
    "guidance": "【项目理解引导】\n你接的这个项目很有意思...\n\n【可能的方向】\n...\n\n【接下来】\n试试用你自己的话说说...",
    "nextStep": "student_understanding"
  }
}
```

#### Step 2: 学生确认理解

**接口**: `POST /api/mentor-enhanced/pbl/:taskId/confirm-understanding`

**流程**:
```
学生用自己的话表达对项目的理解
  ↓
AI评估理解是否准确
  ↓
如果准确 → 肯定 + 补充细节 + 鼓励行动
如果偏差 → 引导性问题帮助发现 + 给线索
  ↓
生成初步任务拆解（3-5个大方向）
  ↓
学生开始执行
```

**示例请求**:
```bash
POST /api/mentor-enhanced/pbl/66a587d4c29906132d3f1fe8b/confirm-understanding
Headers: Authorization: Bearer <token>
Body: {
  "understanding": "我理解这个项目是要做一个公众号的排版设计，需要考虑视觉风格、阅读体验和品牌调性"
}
```

**示例响应**:
```json
{
  "success": true,
  "data": {
    "feedback": "你抓住了关键点！视觉风格、阅读体验、品牌调性...",
    "nextStep": "start_working"
  }
}
```

---

### 2. 增强版卡点支持 🆘

**接口**: `POST /api/mentor-enhanced/enhanced/:taskId/stuck`

**功能**:
- 分析卡点本质（不是"不会XX技能"，而是"在XX环节遇到YY挑战"）
- 提供3个可行方向（简单/折中/理想）
- 给出具体的学习路径
- 结合OPC人格特点的鼓励
- 自动识别情绪（焦虑/沮丧/困惑等）

**示例请求**:
```bash
POST /api/mentor-enhanced/enhanced/66a587d4c29906132d3f1fe8b/stuck
Headers: Authorization: Bearer <token>
Body: {
  "stuckPoint": "我不知道怎么选择配色方案，尝试了很多种都不满意",
  "whatTriedSoFar": "试了红色、蓝色、绿色的主色调，都感觉不对"
}
```

**示例响应**:
```json
{
  "success": true,
  "data": {
    "guidance": "## 1. 分析卡点本质\n你遇到的不是'不会配色'，而是'还没找到品牌的情感定位'...\n\n## 2. 可以做什么\n方向A: 从品牌关键词出发...\n方向B: 参考同类型品牌...\n方向C: 做情绪板...\n\n## 3. 学习路径\n...\n\n## 4. 鼓励与支持\n作为'视觉叙事者'，你对颜色的敏感度其实是你的优势...",
    "detectedEmotion": "frustrated"
  }
}
```

---

### 3. 作品审核系统 ✅

**接口**: `POST /api/mentor-enhanced/review/:taskId/submit`

**功能**:
- 多维度评分（质量/完整度/创意）
- 列出具体优点（不说"做得不错"，说"XX部分处理得很细腻"）
- 给出改进建议（按优先级排序）
- 判断是否可以提交给客户
- 提供下一步行动建议

**评分标准**:
- `overallScore`: 总体评分 (0-100)
- `qualityScore`: 质量评分
- `completenessScore`: 完整度评分
- `creativityScore`: 创意评分

**状态判断**:
- `needs_improvement`: 还需要优化 (<70分)
- `good_to_submit`: 可以提交给客户 (70-85分)
- `excellent`: 优秀，超出预期 (>85分)

**示例请求**:
```bash
POST /api/mentor-enhanced/review/66a587d4c29906132d3f1fe8b/submit
Headers: Authorization: Bearer <token>
Body: {
  "submissionUrl": "https://example.com/my-work.pdf",
  "submissionDescription": "这是我完成的第一版设计，使用了蓝色主色调，添加了品牌logo和标题"
}
```

**示例响应**:
```json
{
  "success": true,
  "data": {
    "overallScore": 75,
    "qualityScore": 78,
    "completenessScore": 80,
    "creativityScore": 65,
    "strengths": [
      "整体布局清晰，视觉层次分明",
      "蓝色的选择符合品牌调性",
      "logo放置位置恰当"
    ],
    "improvements": [
      "标题字体可以更大胆一些，目前略显保守",
      "留白可以更多，现在信息密度偏高",
      "可以增加一个视觉焦点元素"
    ],
    "detailedFeedback": "整体来看，这是一个扎实的第一版...",
    "status": "good_to_submit",
    "suggestedActions": [
      "调整标题字号至36-48pt",
      "增加段落间距至1.5倍行距",
      "最后检查：是否有错别字、图片是否清晰"
    ],
    "reviewRound": 1
  }
}
```

---

### 4. 长记忆与成长对比 📈

**接口**: `GET /api/mentor-enhanced/growth/comparison`

**功能**:
- 对比"过去的你" vs "现在的你"
- 分析技能成长、心态变化、热情发现
- 列出克服的关键挑战
- 预测下一步可能性
- 生成个人成长故事

**示例请求**:
```bash
GET /api/mentor-enhanced/growth/comparison
Headers: Authorization: Bearer <token>
```

**示例响应**:
```json
{
  "success": true,
  "data": {
    "hasEnoughData": true,
    "analysis": "## 1. 技能成长\n\n过去：刚开始时，你对设计工具还不太熟悉...\n现在：已经能熟练运用...\n突破点：第5个项目时，你首次尝试...\n\n## 2. 心态变化\n\n过去：经常说'我不会'、'太难了'...\n现在：更多地说'我可以试试'、'换个角度'...\n转折点：在第3个项目卡点时...\n\n## 3. 热情发现\n...\n\n## 4. 克服的挑战\n...\n\n## 5. 下一步可能性\n...",
    "memoriesAnalyzed": 15,
    "projectsCompleted": 8
  }
}
```

---

## API接口

### 完整接口列表

#### PBL流程
```
POST /api/mentor-enhanced/pbl/:taskId/breakdown
POST /api/mentor-enhanced/pbl/:taskId/confirm-understanding
```

#### 卡点支持
```
POST /api/mentor-enhanced/enhanced/:taskId/stuck
```

#### 作品审核
```
POST /api/mentor-enhanced/review/:taskId/submit
```

#### 成长记忆
```
GET /api/mentor-enhanced/growth/comparison
```

---

## 数据模型

### 1. WorkReview（作品审核记录）

```typescript
{
  userId: ObjectId,
  taskId: ObjectId,
  submissionUrl: string,
  submissionDescription: string,
  reviewRound: number,
  
  // 评分
  overallScore: number,
  qualityScore: number,
  completenessScore: number,
  creativityScore: number,
  
  // 反馈
  strengths: string[],
  improvements: string[],
  detailedFeedback: string,
  
  // 状态
  status: 'needs_improvement' | 'good_to_submit' | 'excellent',
  suggestedActions: string[],
  
  // 修订
  studentResponse?: string,
  revisedSubmissionUrl?: string,
  
  createdAt: Date,
  reviewedAt: Date
}
```

### 2. GrowthMemory（成长记忆）

```typescript
{
  userId: ObjectId,
  memoryType: 'skill_breakthrough' | 'mindset_shift' | 'passion_discovery' | 'challenge_overcome' | 'milestone',
  title: string,
  description: string,
  relatedTaskId?: ObjectId,
  relatedConversationId?: ObjectId,
  beforeState?: string,
  afterState?: string,
  emotionalTone?: 'excited' | 'anxious' | 'confused' | 'confident' | 'frustrated' | 'proud',
  significance: number, // 1-10
  tags: string[],
  createdAt: Date
}
```

---

## 使用流程

### 完整学习流程

```
1. 学生接单
   ↓
2. AI进行PBL问题拆解
   POST /api/mentor-enhanced/pbl/:taskId/breakdown
   ↓
3. 学生用自己的话表达理解
   POST /api/mentor-enhanced/pbl/:taskId/confirm-understanding
   ↓
4. 学生开始执行
   ↓
5. 遇到卡点？
   POST /api/mentor-enhanced/enhanced/:taskId/stuck
   ↓
6. 完成初稿
   POST /api/mentor-enhanced/review/:taskId/submit
   ↓
7. 根据AI反馈修改
   ↓
8. 再次提交审核（第2轮）
   ↓
9. 通过审核，提交给客户
   ↓
10. 定期查看成长对比
    GET /api/mentor-enhanced/growth/comparison
```

---

## 配置说明

### 环境变量

在 `.env` 文件中配置：

```bash
# OpenAI API配置
OPENAI_API_KEY=sk-proj-your-actual-api-key-here
OPENAI_MODEL=gpt-4  # 或 gpt-4-turbo

# MongoDB连接
MONGODB_URI=mongodb://localhost:27017/qicheng

# 服务器配置
PORT=3000
NODE_ENV=development
```

### 重要说明

⚠️ **OpenAI API Key 必须配置真实密钥，否则所有AI功能无法使用！**

当前占位符需要替换：
```bash
# ❌ 错误
OPENAI_API_KEY=sk-test-key-placeholder

# ✅ 正确
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
```

---

## 核心特性对比

### 原版 vs 增强版

| 功能 | 原版 | 增强版 |
|------|------|--------|
| 对话引导 | ✅ 基础对话 | ✅ PBL问题引导 |
| 卡点支持 | ⚠️ 简单引导 | ✅ 深度分析+学习路径 |
| 作品审核 | ❌ 无 | ✅ 多维度评分+改进建议 |
| 成长记忆 | ❌ 无 | ✅ 长记忆+对比分析 |
| 情绪识别 | ⚠️ 仅热情火花 | ✅ 6种情绪识别 |
| 学习路径 | ❌ 无 | ✅ 以结果为导向的建议 |
| 鼓励系统 | ⚠️ 基础 | ✅ 结合OPC人格的个性化鼓励 |

---

## 情绪识别关键词

系统会自动识别以下情绪：

```javascript
{
  excited: ['兴奋', '激动', '开心', '太棒了'],
  anxious: ['焦虑', '紧张', '担心', '害怕'],
  confused: ['不懂', '不明白', '困惑', '迷茫'],
  confident: ['我可以', '我能行', '没问题'],
  frustrated: ['烦', '崩溃', '想放弃', '太难了'],
  proud: ['自豪', '骄傲', '成就感', '完成了']
}
```

当检测到负面情绪时，AI会：
1. 调整语气，更温暖、更支持
2. 分享类似经历："我之前也..."
3. 记录到成长记忆，用于未来对比
4. 提供具体可行的下一步

---

## 最佳实践

### 1. PBL引导时机
- ✅ 学生刚接单，还不清楚从哪里开始
- ✅ 项目复杂，需要拆解
- ❌ 学生已经有清晰思路，只是需要确认

### 2. 作品审核频率
- ✅ 第一版完成后必审
- ✅ 重大修改后再审
- ❌ 不要每改一点就审核（给学生自主空间）

### 3. 成长对比查看
- ✅ 完成5个项目后
- ✅ 等级提升时
- ✅ 学生感到迷茫时
- ❌ 不要太频繁（数据积累需要时间）

---

## 技术实现

### 关键文件

```
src/
├── models/
│   ├── WorkReview.ts          # 作品审核模型
│   ├── GrowthMemory.ts        # 成长记忆模型
│   ├── MentorConversation.ts  # 对话记录模型
│   └── FlowMoment.ts          # 穿越感时刻模型
├── services/
│   ├── mentorEnhanced.service.ts  # 增强版AI导师服务（700+行）
│   └── mentor.service.ts           # 原版AI导师服务
├── controllers/
│   └── mentorEnhanced.controller.ts
└── routes/
    └── mentorEnhanced.routes.ts
```

### 代码统计

- **新增模型**: 2个（WorkReview, GrowthMemory）
- **新增服务**: 1个（mentorEnhanced.service.ts, 700+行）
- **新增控制器**: 1个（mentorEnhanced.controller.ts）
- **新增路由**: 1个（5个端点）
- **总代码量**: ~1200行

---

## 待优化功能

### 短期（1-2周）
- [ ] 添加作品审核历史对比
- [ ] 增加学习资源推荐（基于卡点）
- [ ] 优化情绪识别准确率

### 中期（1个月）
- [ ] 添加语音对话支持
- [ ] 实现AI导师主动关怀（定期check-in）
- [ ] 增加同伴学习推荐（匹配相似挑战的学生）

### 长期（3个月）
- [ ] 训练专属模型（基于启程数据）
- [ ] 多模态支持（图片、视频审核）
- [ ] 生成个性化成长报告PDF

---

## 总结

AI导师增强版实现了：

✅ **PBL问题引导** - 用模糊词引导思考，不直接给答案  
✅ **增强版卡点支持** - 深度分析+学习路径+情绪支持  
✅ **作品审核系统** - 多维度评分+具体改进建议  
✅ **长记忆系统** - 记录成长，对比"过去的你"  
✅ **情绪识别** - 6种情绪自动识别+个性化鼓励  

**核心理念**：看见、支持、理解 — 不是教技能，是帮学生看见自己。

---

**文档版本**: v2.0  
**最后更新**: 2026-07-17  
**维护者**: Claude Opus 4.7
