# 启程小猫增强版 - 情感陪伴 + 项目实战融合系统

## 🎯 系统概述

**启程小猫增强版**是一个将情感陪伴和PBL项目式学习完全融合的AI导师系统。

### 核心理念

> **一个导师（启程小猫），两种能力（情感陪伴 + 项目实战）**

- ✅ 保留100%原有的情感陪伴能力
- ✅ 新增苏格拉底式项目指导能力
- ✅ 智能切换，无缝融合
- ✅ 始终保持温暖的启程小猫语气

---

## 🏗️ 系统架构

### 1. 数据库层（已完成）

#### PBL项目相关表（11张）
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

#### 融合系统表（5张）
```
mentor_modes                    # 导师模式配置
mentor_collaboration_logs       # 导师协同记录
emotional_project_links         # 情感-项目关联
unified_mentor_conversations    # 统一对话历史
mentor_switch_suggestions       # 模式切换建议
```

### 2. 服务层（已完成）

#### 核心服务
- **EnhancedMentorService** - 增强版导师服务（统一入口）
- **PBLAgentService** - PBL Agent核心功能
- **CodeExecutionService** - 代码执行沙箱
- **FileProcessingService** - 文件上传与处理

#### 服务架构
```typescript
EnhancedMentorService
├── chat() - 统一对话入口
│   ├── analyzeMessage() - 分析消息类型
│   ├── generateEmotionalResponse() - 情感响应
│   ├── generateProjectResponse() - 项目响应
│   └── generateCoordinatedResponse() - 协同响应
│
PBLAgentService
├── initializeProject() - 初始化项目
├── conductSocraticDialogue() - 苏格拉底式对话
├── guideTaskDecomposition() - 任务拆解引导
├── generateMVPSolution() - MVP方案生成
└── guideReflection() - 反思引导
```

### 3. API层（已完成）

#### 路由配置
```
POST   /api/v1/mentor/chat                          # 统一对话
POST   /api/v1/mentor/switch-mode                   # 切换模式
GET    /api/v1/mentor/stats                         # 使用统计

POST   /api/v1/mentor/projects/init                 # 初始化项目
GET    /api/v1/mentor/projects                      # 项目列表
GET    /api/v1/mentor/projects/:id                  # 项目详情

POST   /api/v1/mentor/projects/:id/decompose        # 任务拆解
POST   /api/v1/mentor/projects/:id/evaluate-decomposition  # 评估拆解

POST   /api/v1/mentor/projects/:id/execute-code     # 执行代码
GET    /api/v1/mentor/projects/:id/execution-history  # 执行历史

POST   /api/v1/mentor/projects/:id/upload           # 上传文件
GET    /api/v1/mentor/projects/:id/files            # 文件列表
DELETE /api/v1/mentor/files/:id                     # 删除文件

POST   /api/v1/mentor/projects/:id/reflect          # 引导反思
POST   /api/v1/mentor/projects/:id/reflection-log   # 保存反思
```

---

## 🎓 核心功能详解

### 1. 智能消息分析

系统会自动分析用户消息，判断应该使用哪种能力：

```typescript
// 情感关键词
['感觉', '情绪', '困惑', '迷茫', '开心', '难过', ...]

// 项目关键词
['项目', '做', '实现', '代码', '怎么', '如何', '学习', ...]

// 卡壳指示词
['不知道', '不清楚', '不确定', '卡住了', ...]
```

**分析结果**：
- `emotional` - 纯情感支持
- `project` - 纯项目指导
- `hybrid` - 协同模式（两者都需要）

### 2. 三种响应模式

#### 模式1：情感模式
```
用户: "我最近很迷茫，不知道该学什么"

启程小猫（情感模式）:
"嗯嗯，我能感觉到你的迷茫。

是什么让你觉得迷茫呢？是对未来方向不确定，
还是有太多选择不知道从哪开始？

对了，你对什么领域感兴趣？或者工作中遇到什么困难？"
```

#### 模式2：项目模式
```
用户: "我想用AI自动总结会议纪要"

启程小猫（项目模式）:
"哇，听起来是个很棒的想法！

我有点好奇，你想做这个项目，是因为工作需要，
还是单纯觉得有意思？

对了，如果只能实现一个功能，你会选哪个？
是自动识别决策点还是提取行动项？为什么是这个呢？"
```

#### 模式3：协同模式
```
用户: "我想学AI，但感觉太难了"

启程小猫（协同模式）:
【情感部分】
"嗯嗯，我理解你的感受。AI确实是个大话题，
刚开始接触时很多人都会觉得有点overwhelmed。"

【过渡】
"不过啊，我有个想法。与其泛泛地学，
不如从一个小项目开始？"

【项目部分】
"你想用AI解决什么具体问题？
比如工作中有什么重复性的事情，可以让AI帮忙的？

我们可以一起做个小项目，边做边学。你觉得怎么样？"
```

### 3. 苏格拉底式提问系统

#### 五种提问技巧

**1. 澄清问题（Clarifying）**
```
"你想通过这个项目解决什么核心问题？"
"如果只能选择一个最重要的功能，你会选哪个？为什么？"
```

**2. 探究推理（Probing）**
```
"是什么让你这样认为的？"
"你有什么证据支持这个想法？"
"还有其他可能的方法吗？"
```

**3. 挑战假设（Assumption）**
```
"你的这个方案基于什么假设？"
"如果这个假设不成立会怎样？"
```

**4. 探讨影响（Implication）**
```
"如果这样做，会带来什么后果？"
"这个方案的代价是什么？"
```

**5. 转换视角（Viewpoint）**
```
"如果你是用户，你会怎么看这个方案？"
"一个有经验的工程师会如何处理这个问题？"
```

### 4. 任务拆解引导

```
用户: "我想做一个会议纪要生成器"

启程小猫:
"嗯嗯，我理解。大项目确实容易让人不知所措。

要不我们一起来拆解一下？

你觉得这个项目可以分成哪几个部分？
不用想得太复杂，就像吃大象一样，一口一口来。

比如说，第一步你会做什么？"

用户: "嗯...录音、转文字、提取关键信息？"

启程小猫:
"很好的开始！

1. 这三个部分中，哪个是最核心的？
2. 如果要做一个最简单的版本，你会先做哪个？
3. 每个部分大概需要多长时间？"
```

### 5. MVP方案生成

当用户卡壳时，系统会生成最小可行方案：

```json
{
  "title": "Whisper + GPT-4 会议纪要生成器",
  "description": "这是一个最小可行方案，大概1小时能完成",
  "solutionType": "code",
  "implementationSteps": [
    "1. 使用Whisper API转录音频",
    "2. 用GPT-4提示词提取关键点",
    "3. 生成结构化纪要"
  ],
  "codeSnippets": [
    {
      "language": "python",
      "code": "import openai\n\n# Whisper转录\naudio_file = open('meeting.mp3', 'rb')\ntranscript = openai.Audio.transcribe('whisper-1', audio_file)\n\n# GPT-4总结\nresponse = openai.ChatCompletion.create(\n  model='gpt-4',\n  messages=[{\n    'role': 'user',\n    'content': f'总结以下会议内容：\\n{transcript.text}'\n  }]\n)\n\nprint(response.choices[0].message.content)",
      "explanation": "这段代码先用Whisper转录音频，然后用GPT-4总结"
    }
  ],
  "toolsRequired": ["OpenAI API", "Python"],
  "estimatedTime": 60
}
```

### 6. 代码执行沙箱

支持的语言：
- Python
- JavaScript/Node.js
- SQL
- Bash/Shell

```typescript
// 执行代码
const result = await codeExecutionService.executeCode(
  projectId,
  'python',
  'print("Hello, World!")',
  { timeout: 30000 }
);

// 结果
{
  status: 'success',
  output: 'Hello, World!\n',
  executionTime: 125
}
```

### 7. 文件上传与AI分析

支持的文件类型：
- 代码文件（.py, .js, .ts, .java, etc.）
- 文档（.pdf, .docx, .txt, .md）
- 数据文件（.csv, .json, .xlsx）
- 图片（.png, .jpg）

AI会自动分析文件内容：
```json
{
  "fileType": "code",
  "language": "Python",
  "summary": "这是一个数据处理脚本，用于清洗CSV文件",
  "issues": [
    "缺少错误处理",
    "变量命名不规范"
  ],
  "suggestions": [
    "添加try-catch块",
    "使用更描述性的变量名"
  ]
}
```

### 8. 反思引导系统

#### 反思类型
- `daily` - 每日反思
- `phase_end` - 阶段结束反思
- `project_end` - 项目结束反思
- `breakthrough` - 突破时刻反思
- `stuck` - 卡壳时反思

#### 反思框架
```
1. 学到了什么？（What Learned）
2. 什么有效？（What Worked）
3. 什么无效？（What Didn't Work）
4. 什么让你惊讶？（What Surprised）
5. 下一步计划？（Next Steps）
```

---

## 🔄 完整工作流程示例

### 场景：从困惑到项目

```
Day 1 - 情感导师
─────────────────
用户: "我最近很迷茫，不知道该学什么"

启程小猫:
"嗯嗯，我能感觉到你的迷茫。
是什么让你觉得迷茫呢？"

用户: "感觉自己技能跟不上，但不知道从哪开始"

启程小猫:
"我理解。你对什么领域感兴趣？
或者工作中遇到什么困难？"

用户: "我想学AI，但感觉太难了"

启程小猫（自然过渡）:
"AI确实是个大话题。

不过啊，我有个想法。与其泛泛地学，
不如从一个小项目开始？

你想用AI解决什么具体问题？"

Day 2 - 项目导师
─────────────────
用户: "我想让AI帮我整理邮件"

启程小猫:
"很好的想法！

如果只能实现一个功能，你会选什么？
是自动分类、提取重点，还是生成回复？"

用户: "自动分类吧"

启程小猫:
"嗯嗯，那我们来拆解一下：

1. 你觉得这个任务可以分成哪几个部分？
2. 哪个部分是最核心的？
3. 如果要做一个最简单的版本，你会先做哪个？"

Day 3 - 代码实现
─────────────────
用户: "不知道怎么开始..."

启程小猫:
"哎，我感觉到你有点卡住了。

其实啊，这个问题可以用OpenAI的API很容易解决。

要不我给你一个最小可行方案？大概1小时就能完成：

[提供MVP方案和代码片段]

试试看，有问题随时跟我说。我就在这儿陪着你。"

用户: [上传代码]

启程小猫:
"好，我帮你运行一下。

[执行代码...]

哇，成功了！分类准确度看起来不错。

你现在感觉怎么样？是不是没想象中那么难？

下一步你想做什么？"

Day 7 - 反思
─────────────────
启程小猫:
"哎，恭喜你完成了第一个AI项目！

我看到你从"不知道怎么开始"到现在做出了
一个能用的工具，这个变化真的很大。

要不要聊聊：
1. 这个过程中，你学到了什么新东西？
2. 什么方法特别有效？
3. 如果重新开始，你会怎么做？

对了，这个项目对你的工作有什么帮助？"
```

---

## 📱 前端集成（待实现）

### 学生端小程序页面

#### 1. 导师对话页面（保持原有界面）
```
pages/mentor-chat/index.tsx
- 保持启程小猫的粉色温暖风格
- 新增项目相关功能入口
- 显示当前模式指示器（可选）
```

#### 2. 我的项目页面（新增）
```
pages/my-projects/index.tsx
- 项目列表
- 项目状态（进行中/已完成）
- 项目进度
```

#### 3. 项目详情页面（新增）
```
pages/project-detail/index.tsx
- 项目信息
- 任务拆解列表
- 代码执行历史
- 文件列表
- 反思日志
```

#### 4. 代码执行页面（新增）
```
pages/code-execution/index.tsx
- 代码编辑器
- 语言选择
- 执行按钮
- 结果显示
```

#### 5. 文件上传页面（新增）
```
pages/file-upload/index.tsx
- 文件选择
- AI分析结果展示
```

---

## 🎨 设计风格

### 保持启程小猫的温暖风格

```scss
// 主色调（不变）
$bg-primary: #F5E6F0;           // 淡粉紫背景
$accent-green: #D4F291;         // 嫩草绿（主按钮）
$accent-pink: #F9C6D9;          // 樱花粉
$accent-purple: #B8A4E8;        // 薰衣草紫

// 新增项目相关颜色
$project-blue: #A8D8EA;         // 天空蓝（项目标识）
$code-bg: #2D2D2D;              // 代码背景
```

### 对话气泡样式

**情感模式**（粉色温暖）:
```
┌─────────────────────┐
│ 🐱 启程小猫          │
│                     │
│ 嗯嗯，我感觉到你    │
│ 有点紧张...         │
│                     │
│ [粉色渐变背景]      │
└─────────────────────┘
```

**项目模式**（保持温暖，但更专业）:
```
┌─────────────────────┐
│ 🐱 启程小猫 💼       │
│                     │
│ 哇，这个想法很棒！  │
│                     │
│ 要不我们一起拆解    │
│ 一下？              │
│                     │
│ [代码片段卡片]      │
│                     │
│ [粉紫渐变背景]      │
└─────────────────────┘
```

---

## 🚀 部署与使用

### 1. 数据库迁移

```bash
# 运行PBL系统迁移
psql -U postgres -d qicheng -f migrations/068_pbl_agent_system.sql

# 运行融合系统迁移
psql -U postgres -d qicheng -f migrations/069_dual_mentor_system.sql
```

### 2. 环境变量

```env
# Anthropic API
ANTHROPIC_API_KEY=your_api_key_here

# 文件上传
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIR=./uploads/pbl-projects

# 代码执行
CODE_EXECUTION_TIMEOUT=30000  # 30秒
CODE_EXECUTION_MAX_TIMEOUT=120000  # 2分钟
```

### 3. 启动服务

```bash
# 安装依赖
npm install

# 启动后端
npm run dev

# 启动前端（小程序）
cd miniapp
npm run dev:weapp
```

### 4. API调用示例

```typescript
// 1. 统一对话
const response = await fetch('/api/v1/mentor/chat', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: '我想做一个AI项目',
    sessionId: 'xxx'
  })
});

// 2. 初始化项目
const project = await fetch('/api/v1/mentor/projects/init', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    initialProblem: '我想用AI自动总结会议纪要',
    title: '会议纪要生成器',
    domain: 'AI'
  })
});

// 3. 执行代码
const execution = await fetch(`/api/v1/mentor/projects/${projectId}/execute-code`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    language: 'python',
    code: 'print("Hello, World!")'
  })
});
```

---

## ✅ 已完成功能清单

### 后端（100%完成）

- ✅ 数据库设计（16张表）
- ✅ EnhancedMentorService（增强版导师服务）
- ✅ PBLAgentService（PBL Agent核心功能）
- ✅ CodeExecutionService（代码执行沙箱）
- ✅ FileProcessingService（文件上传与处理）
- ✅ EnhancedMentorController（统一控制器）
- ✅ API路由配置

### 核心能力（100%完成）

- ✅ 智能消息分析
- ✅ 三种响应模式（情感/项目/协同）
- ✅ 苏格拉底式提问系统
- ✅ 任务拆解引导
- ✅ MVP方案生成
- ✅ 代码执行能力
- ✅ 文件上传与AI分析
- ✅ 反思引导系统
- ✅ 长期记忆管理

---

## 📋 待完成功能

### 前端（待实现）

- ⏳ 学生端小程序页面更新
  - 保持原有导师对话界面
  - 新增项目管理页面
  - 新增代码执行页面
  - 新增文件上传页面
  - 新增反思日志页面

### 优化功能（待实现）

- ⏳ 代码执行沙箱优化（Docker容器化）
- ⏳ 文件处理优化（图片OCR、PDF解析）
- ⏳ 实时通信（WebSocket）
- ⏳ 数据分析与可视化

---

## 🎉 总结

**启程小猫增强版**成功将情感陪伴和PBL项目式学习完全融合：

✅ **一个导师** - 始终是温暖的启程小猫  
✅ **两种能力** - 情感陪伴 + 项目实战  
✅ **智能切换** - 根据需求自动或手动切换  
✅ **无缝融合** - 从情感到项目的自然过渡  
✅ **完整闭环** - 情感支持 → 项目实践 → 成长反思  

**这才是真正的成人PBL学习系统！** 🐱✨💼
