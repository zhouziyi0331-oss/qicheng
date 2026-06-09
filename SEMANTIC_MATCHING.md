# 启程平台语义匹配系统

## 🎯 核心价值

理解双方的"言外之意"：
- 学生说"喜欢把乱的东西理清楚" 
- 企业说"内部流程太乱想找人梳理"
- **这两句话在字面上没有任何共同标签，但在语义空间里高度接近**

这才是启程要做的语义匹配。

---

## 🚀 快速开始

### 环境变量配置

```bash
# .env文件
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/qicheng
ANTHROPIC_API_KEY=sk-ant-...  # 用于生成能力画像摘要和需求翻译
EMBEDDING_API_URL=https://api.siliconflow.cn/v1/embeddings  # BGE Embedding API
EMBEDDING_API_KEY=your_key_here  # 或使用ANTHROPIC_API_KEY
```

### 一键部署

```bash
cd backend
./deploy-semantic-matching.sh
npm run dev
```

---

## 📊 技术方案

### 1. 能力画像摘要（不是标签）

**学生完成38道测试 + 项目数据** → AI生成200字自然语言描述：

> "这个学生擅长从混乱的信息中提炼结构，习惯先搭框架再填细节。在视觉表达上偏好简洁克制的风格，对文字排版有强迫症级别的在意。上次给一家咖啡店做的菜单设计，客户说'这就是我想要但说不出来的感觉'。"

**包含信息**：工作风格、审美倾向、被客户认可的具体场景

### 2. 向量化（真正的语义理解）

使用 **BAAI/bge-large-zh-v1.5** 模型：
- 1024维中文语义向量
- 理解"言外之意"，不只是字面匹配
- 通过硅基流动或阿里云PAI调用

### 3. 语义检索

```sql
SELECT student_id, profile_summary,
       1 - (profile_vector <=> $task_vector) AS similarity
FROM student_capabilities
WHERE profile_vector IS NOT NULL
ORDER BY profile_vector <=> $task_vector
LIMIT 5;
```

### 4. 启程老师翻译

**需求翻译**：
- 企业说："我们要一个酷炫的H5"
- 翻译后："手机端可交互的产品展示页面，3天内交付，用于投资人演示"

**能力翻译**：
- 观察学生行为："每次都会主动做三版给客户选"
- 补充到画像："对交付质量有执念"

---

## 🔧 核心服务

### vectorGenerationService.ts

- `generateStudentProfileSummary()` - 生成能力画像摘要（200字自然语言）
- `generateEmbedding()` - 调用BGE模型生成1024维向量
- Fallback到TF-IDF（当API不可用时）

### semanticMatchingEngine.ts

- 使用pgvector余弦相似度检索
- 业务规则过滤（赛道、等级、预算）
- 返回Top 5最匹配学生

### qichengTeacherService.ts

- `translateRequirement()` - 需求翻译（挖掘言外之意）
- `analyzeAndTranslateTask()` - 任务拆解和学生友好描述

---

## 📈 性能指标

| 指标 | 数值 |
|------|------|
| 向量维度 | 1024 |
| 单条向量存储 | ~4KB |
| 10万级检索延迟 | <50ms |
| Embedding API调用 | <200ms |

---

## ⚠️ 重要说明

### 与旧系统的关系

- **旧系统**：`matchingService.ts`、`hybridMatchingService.ts`（基于标签规则）
- **新系统**：`semanticMatchingEngine.ts`（基于语义向量）
- **关系**：独立共存，互不冲突

### Embedding API

**首选**：BGE-large-zh-v1.5（真正的语义理解）  
**Fallback**：TF-IDF（当API不可用时，只能字面匹配）

---

## 🐛 常见问题

**Q: 为什么不用标签？**  
A: 标签是死的。"视频剪辑"和"短视频制作"无法匹配，"用AI把复杂信息变成画面"无法用标签概括。

**Q: BGE模型在哪里运行？**  
A: 通过API调用（硅基流动/阿里云PAI），不需要本地部署。成本极低。

**Q: 如果API失败怎么办？**  
A: 自动Fallback到TF-IDF方法，系统仍可运行（但语义理解能力下降）。

---

## 📁 文件结构

```
backend/
├── migrations/072_semantic_matching_system.sql
├── src/services/
│   ├── vectorGenerationService.ts      # BGE向量生成 + 能力画像摘要
│   ├── semanticMatchingEngine.ts       # 语义检索
│   ├── qichengTeacherService.ts        # 需求翻译 + 能力翻译
│   └── studentCapabilityService.ts     # 能力更新
└── routes/tasks/matchingController.ts  # API端点
```

---

**状态**: ✅ 使用真正的语义理解（BGE模型）  
**核心**: 理解"言外之意"，不只是字面匹配  
**角色**: 启程老师做语义转化的最后一公里
