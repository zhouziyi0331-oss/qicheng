# 苏格拉底式PBL导师Agent系统设计

## 🎯 系统概述

这是一个真正的AI Agent级别的导师系统，能够通过苏格拉底式提问引导用户完成基于真实工作问题的项目式学习（PBL）。

### 核心理念

> **不给答案，只给问题；不教方法，只引导思考**

---

## 🆚 与现有导师系统的对比

| 特性 | 现有导师（启程小猫） | PBL Agent导师 |
|-----|------------------|--------------|
| 定位 | 情感支持 + 简单对话 | 苏格拉底式项目导师 |
| 学习方式 | 预设阶段引导 | 真实项目驱动 |
| 提问方式 | 简单问答 | 苏格拉底式深度提问 |
| 任务拆解 | ❌ 无 | ✅ 引导用户自主拆解 |
| 代码能力 | ❌ 无 | ✅ 代码执行 + 文件处理 |
| 长期记忆 | ⚠️ 有限 | ✅ 完整的项目记忆 |
| MVP方案 | ❌ 无 | ✅ 最小可行方案 |
| 成果管理 | ❌ 无 | ✅ 可展示成果 + 反思日志 |
| 异步推进 | ⚠️ 有限 | ✅ 完全异步 |

---

## 🏗️ 系统架构

### 1. 数据库设计（11张核心表）

```
pbl_projects                    # 项目表
├── pbl_project_phases          # 项目阶段
├── pbl_socratic_dialogues      # 苏格拉底式对话
├── pbl_task_decompositions     # 任务拆解
├── pbl_mvp_solutions           # MVP方案
├── pbl_project_files           # 文件上传
├── pbl_code_executions         # 代码执行
├── pbl_project_deliverables    # 项目成果
├── pbl_reflection_logs         # 反思日志
├── pbl_agent_memory            # Agent记忆
└── pbl_socratic_question_templates  # 问题模板库
```

### 2. 服务层架构

```typescript
PBLAgentService
├── 项目初始化
│   ├── analyzeInitialProblem()      // AI分析问题
│   └── generateOpeningQuestions()   // 生成开场问题
│
├── 苏格拉底式对话
│   ├── conductSocraticDialogue()    // 主对话流程
│   ├── detectIfStuck()              // 检测卡壳
│   ├── generateSocraticResponse()   // 生成响应
│   └── analyzeResponseType()        // 分析响应类型
│
├── 任务拆解引导
│   ├── guideTaskDecomposition()     // 引导拆解
│   ├── generateDecompositionQuestions()  // 生成问题
│   └── evaluateDecomposition()      // 评估质量
│
├── MVP方案
│   ├── suggestMVPSolution()         // 建议方案
│   └── generateMVPSolution()        // 生成方案
│
├── 代码执行
│   └── executeCode()                // 执行代码
│
├── 反思引导
│   ├── guideReflection()            // 引导反思
│   ├── generateReflectionQuestions() // 生成问题
│   └── saveReflectionLog()          // 保存日志
│
└── Agent记忆
    ├── getAgentMemory()             // 获取记忆
    ├── updateAgentMemory()          // 更新记忆
    └── extractMemories()            // 提取记忆
```

---

## 🎓 核心功能详解

### 1. 苏格拉底式提问系统

#### 五种提问技巧

```typescript
// 1. 澄清问题（Clarifying）
"你想通过这个项目解决什么核心问题？"
"如果只能选择一个最重要的功能，你会选哪个？为什么？"

// 2. 探究推理（Probing）
"是什么让你这样认为的？"
"你有什么证据支持这个想法？"
"还有其他可能的方法吗？"

// 3. 挑战假设（Assumption）
"你的这个方案基于什么假设？"
"如果这个假设不成立会怎样？"

// 4. 探讨影响（Implication）
"如果这样做，会带来什么后果？"
"这个方案的代价是什么？"

// 5. 转换视角（Viewpoint）
"如果你是用户，你会怎么看这个方案？"
"一个有经验的工程师会如何处理这个问题？"
```

#### 问题模板库

数据库中预置了多种场景的问题模板：
- `when_planning` - 规划阶段
- `when_stuck` - 卡壳时
- `when_assuming` - 做假设时
- `when_reflecting` - 反思时

---

### 2. 用户卡壳检测与处理

#### 检测机制

```typescript
// 卡壳指示词
const stuckIndicators = [
  '不知道', '不清楚', '不确定', '不会', '怎么办',
  '卡住了', '困惑', '迷茫', '不懂', '求助'
];
```

#### 处理策略

```
用户卡壳 → 
  1. 先用问题帮助理清思路
  2. 如果仍然困难 → 提供"最小可行方案"提示
  3. 提示是具体的、可操作的，但不是完整解决方案
  4. 继续用问题引导实现
```

---

### 3. 任务自主拆解引导

#### 引导流程

```
1. 用户提出任务
   ↓
2. Agent生成引导问题：
   - "这个任务可以分成哪几个独立的部分？"
   - "哪个部分是最核心的？"
   - "哪个部分最简单，可以先做？"
   ↓
3. 用户自己拆解
   ↓
4. Agent评估拆解质量
   ↓
5. 如果不合理 → 用问题引导改进
   如果合理 → 鼓励并继续
```

#### 拆解质量评估

```typescript
{
  "is_good": true/false,
  "feedback": "正面反馈（用苏格拉底式问题）",
  "improvements": "改进建议（如果需要）"
}
```

---

### 4. 最小可行方案（MVP）

#### MVP特点

- ✅ 简单、可快速实现（1-2小时内）
- ✅ 能够验证核心想法
- ✅ 提供具体的实现步骤
- ✅ 包含代码片段（如果需要）
- ✅ 推荐具体工具

#### MVP示例

**用户问题**: "用AI自动总结会议纪要"

**MVP方案**:
```json
{
  "title": "Whisper + GPT-4 会议纪要生成器",
  "solution_type": "code",
  "implementation_steps": [
    "1. 使用Whisper API转录音频",
    "2. 用GPT-4提示词提取关键点",
    "3. 生成结构化纪要"
  ],
  "code_snippets": [
    {
      "language": "python",
      "code": "import openai\n\n# Whisper转录\naudio_file = open('meeting.mp3', 'rb')\ntranscript = openai.Audio.transcribe('whisper-1', audio_file)\n\n# GPT-4总结\nresponse = openai.ChatCompletion.create(\n  model='gpt-4',\n  messages=[{\n    'role': 'user',\n    'content': f'总结以下会议内容：\\n{transcript.text}'\n  }]\n)\n\nprint(response.choices[0].message.content)"
    }
  ],
  "tools_required": ["OpenAI API", "Python"],
  "estimated_time": 60
}
```

---

### 5. 代码执行能力

#### 支持的语言

- Python
- JavaScript/Node.js
- SQL
- Shell

#### 执行环境

需要集成：
- Docker容器（隔离执行）
- E2B（云端代码执行）
- 或自建沙箱环境

#### 执行记录

```typescript
{
  "status": "success" | "error" | "timeout",
  "output": "执行输出",
  "error_message": "错误信息（如果有）",
  "execution_time": 100  // 毫秒
}
```

---

### 6. 文件上传与处理

#### 支持的文件类型

- 代码文件（.py, .js, .java等）
- 文档（.pdf, .docx, .txt）
- 数据文件（.csv, .json, .xlsx）
- 图片（.png, .jpg）

#### AI处理

```typescript
{
  "ai_processed": true,
  "ai_analysis": {
    "file_type": "code",
    "language": "python",
    "summary": "这是一个数据处理脚本",
    "issues": ["缺少错误处理", "变量命名不规范"],
    "suggestions": ["添加try-catch", "使用更描述性的变量名"]
  }
}
```

---

### 7. 长期记忆系统

#### 记忆类型

```typescript
// 1. 用户偏好
{
  "memory_type": "user_preference",
  "key": "preferred_learning_pace",
  "value": { "pace": "slow", "needs_more_examples": true }
}

// 2. 学习风格
{
  "memory_type": "learning_style",
  "key": "visual_learner",
  "value": { "prefers_diagrams": true, "code_examples": true }
}

// 3. 技能水平
{
  "memory_type": "skill_level",
  "key": "python_proficiency",
  "value": { "level": "intermediate", "last_assessed": "2024-05-11" }
}

// 4. 项目模式
{
  "memory_type": "project_pattern",
  "key": "typical_project_duration",
  "value": { "average_days": 7, "completion_rate": 0.8 }
}

// 5. 突破时刻
{
  "memory_type": "breakthrough",
  "key": "understood_async_programming",
  "value": { "date": "2024-05-10", "context": "在做API项目时" }
}
```

#### 记忆重要性

- 1-3分：一般记忆
- 4-7分：重要记忆
- 8-10分：关键记忆

---

### 8. 反思日志系统

#### 反思类型

- `daily` - 每日反思
- `phase_end` - 阶段结束反思
- `project_end` - 项目结束反思
- `breakthrough` - 突破时刻反思
- `stuck` - 卡壳时反思

#### 反思问题框架

```
1. 学到了什么？（What Learned）
2. 什么有效？（What Worked）
3. 什么无效？（What Didn't Work）
4. 什么让你惊讶？（What Surprised）
5. 下一步计划？（Next Steps）
```

#### 情感状态追踪

```typescript
emotional_state: 
  "excited" | "frustrated" | "confused" | 
  "confident" | "overwhelmed" | "satisfied"
```

---

### 9. 项目成果管理

#### 成果类型

- `code` - 代码项目
- `document` - 文档
- `demo` - 演示
- `presentation` - 演示文稿
- `report` - 报告

#### 成果评估

```typescript
{
  "self_assessment": "用户自评",
  "agent_assessment": "Agent评估",
  "quality_score": 8,  // 1-10分
  "is_public": true,   // 是否公开展示
  "showcase_url": "https://..."
}
```

---

## 🔄 完整工作流程

### 示例：用AI自动总结会议纪要

```
第1步：项目初始化
─────────────────
用户: "我想用AI自动总结会议纪要"

Agent: 
"很好的想法！让我先了解一下：
1. 你的会议通常是什么形式？线上还是线下？
2. 会议时长一般多久？
3. 你希望纪要包含哪些内容？
4. 你之前有没有尝试过类似的工具？"

第2步：澄清需求
─────────────────
用户: "线上会议，30-60分钟，希望有关键决策和行动项"

Agent:
"明白了。那么：
1. 如果只能实现一个功能，你会选择自动识别决策点还是行动项？
2. 你觉得最大的挑战会是什么？"

第3步：任务拆解
─────────────────
Agent: "这个项目可以分成哪几个独立的部分？"

用户: "嗯...录音、转文字、提取关键信息？"

Agent: 
"很好的开始！
1. 这三个部分中，哪个是最核心的？
2. 如果要做一个最简单的版本，你会先做哪个？
3. 每个部分大概需要多长时间？"

第4步：MVP方案（用户卡壳）
─────────────────
用户: "不知道怎么把录音转成文字..."

Agent:
"这是个常见的问题。让我问你：
1. 你听说过语音识别API吗？
2. 如果有现成的工具能做这件事，你会用吗？

提示：OpenAI的Whisper API可以很容易地做到这一点，
只需要几行代码。你想试试看吗？"

用户: "想！怎么用？"

Agent: [提供MVP方案]
"这是一个最小可行方案，大概1小时能完成：
[代码片段]

试试看，然后告诉我：
1. 代码能运行吗？
2. 转录的准确度如何？
3. 你遇到了什么问题？"

第5步：代码执行
─────────────────
用户: [上传代码]

Agent: [执行代码，返回结果]
"代码执行成功！转录准确度看起来不错。
现在思考一下：
1. 下一步你想做什么？
2. 如何从转录文本中提取关键信息？"

第6步：迭代改进
─────────────────
[用户继续开发，Agent持续引导]

第7步：反思
─────────────────
Agent: "项目做到这里，让我们反思一下：
1. 你学到了什么新东西？
2. 什么方法特别有效？
3. 如果重新开始，你会怎么做？
4. 这个项目对你的工作有什么帮助？"

第8步：成果展示
─────────────────
Agent: "很棒！你已经完成了一个可用的会议纪要生成器。
现在：
1. 写一个简短的项目说明
2. 准备一个演示
3. 分享给同事试用

你打算怎么展示这个成果？"
```

---

## 🎯 与现有系统的集成

### 1. 学生端小程序

新增页面：
- `/pages/pbl-agent/` - PBL Agent主页
- `/pages/pbl-project/` - 项目详情
- `/pages/pbl-chat/` - 苏格拉底式对话
- `/pages/pbl-tasks/` - 任务拆解
- `/pages/pbl-reflection/` - 反思日志
- `/pages/pbl-showcase/` - 成果展示

### 2. 企业端小程序

企业可以：
- 查看学生的PBL项目成果
- 评估学生的实际能力
- 发布基于真实工作场景的项目

### 3. 平台管理后台

新增管理模块：
- PBL项目管理
- Agent对话质量监控
- 成果审核与推荐
- 学习数据分析

---

## 🚀 技术实现要点

### 1. AI模型选择

- **主模型**: Claude Sonnet 4 (20250514)
  - 强大的推理能力
  - 优秀的对话能力
  - 支持长上下文

### 2. 代码执行环境

推荐方案：
- **E2B** - 云端代码执行平台
- **Docker** - 本地容器化执行
- **AWS Lambda** - 无服务器执行

### 3. 文件存储

- **对象存储**: AWS S3 / 阿里云OSS
- **文件处理**: 
  - PDF: pdf-parse
  - Excel: xlsx
  - 图片: sharp

### 4. 实时通信

- **WebSocket** - 实时对话
- **Server-Sent Events** - 代码执行进度

---

## 📊 数据统计与分析

### 用户维度

- 项目完成率
- 平均项目时长
- 卡壳频率
- 突破时刻数量
- 反思质量

### 项目维度

- 项目类型分布
- 常见问题领域
- MVP采用率
- 代码执行成功率

### Agent维度

- 对话轮次
- 问题类型分布
- 引导成功率
- 用户满意度

---

## 🎓 教育价值

### 对比传统学习

| 维度 | 传统课程 | PBL Agent |
|-----|---------|-----------|
| 学习内容 | 预设课程 | 真实工作问题 |
| 学习节奏 | 固定进度 | 完全异步 |
| 学习方式 | 被动接受 | 主动探索 |
| 成果产出 | 作业/考试 | 可展示项目 |
| 技能培养 | 理论知识 | 实战能力 |
| 思维训练 | 记忆为主 | 批判性思维 |

### 培养的核心能力

1. **问题拆解能力** - 将复杂问题分解为可执行任务
2. **自主学习能力** - 在引导下自己找到答案
3. **批判性思维** - 质疑假设、评估方案
4. **实践能力** - 动手做出可用的东西
5. **反思能力** - 从经验中提炼知识

---

## 🔮 未来扩展

### 1. 多人协作PBL

- 团队项目
- 角色分工
- 协作引导

### 2. 行业专家Agent

- 不同领域的专家Agent
- 领域知识库
- 行业最佳实践

### 3. 项目市场

- 优秀项目展示
- 项目模板库
- 项目交易

### 4. 企业定制

- 企业内部PBL
- 定制化项目
- 人才评估

---

## ✅ 实现清单

### 已完成 ✅

- ✅ 数据库设计（11张表）
- ✅ 服务层实现（PBLAgentService）
- ✅ 控制器实现（PBLAgentController）
- ✅ 路由配置（pblAgentRoutes）
- ✅ 苏格拉底式问题模板库
- ✅ 长期记忆系统
- ✅ 反思日志系统

### 待实现 ⏳

- ⏳ 代码执行环境集成（E2B/Docker）
- ⏳ 文件上传与处理
- ⏳ 前端页面（学生端小程序）
- ⏳ 平台管理后台集成
- ⏳ WebSocket实时通信
- ⏳ 数据分析与可视化

---

## 🎉 总结

这个**苏格拉底式PBL导师Agent系统**是一个真正的AI Agent级别的导师，它：

✅ **不给答案，只给问题** - 通过苏格拉底式提问引导思考
✅ **真实项目驱动** - 基于用户的实际工作问题
✅ **自主任务拆解** - 引导用户自己拆解任务
✅ **最小可行方案** - 提供按需的MVP提示
✅ **代码执行能力** - 真正能执行代码
✅ **长期项目记忆** - 跟踪项目全过程
✅ **成果导向** - 输出可展示的成果
✅ **反思驱动** - 通过反思深化学习
✅ **完全异步** - 无需固定课程

**这才是真正的成人PBL学习系统！** 🎓🚀
