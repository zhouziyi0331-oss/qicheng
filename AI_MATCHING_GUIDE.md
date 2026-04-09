# 启程项目 - AI智能匹配流程说明

## 📋 核心业务逻辑

**不是学生抢单模式！** 而是 **AI智能匹配推送模式**

### 完整流程

```
企业发布任务 
  ↓
AI分析任务需求，匹配5个最合适的学生
  ↓
推送任务邀请给这5个学生
  ↓
学生可以接受或拒绝邀请
  ↓
企业从接受的学生中选择1个
  ↓
任务开始执行
```

---

## 🎯 三端页面结构

### 1. 学生端 - 任务邀请页面
**路径**: `/tasks` (http://localhost:3002/tasks)

**功能**:
- 显示AI为当前学生推荐的任务（不是所有任务！）
- 显示AI匹配度（如95%）和推荐理由
- 学生可以：
  - ✅ **接受邀请** - 表示愿意接这个任务
  - ❌ **拒绝邀请** - 不感兴趣或时间不合适

**数据字段**:
```typescript
interface Task {
  matchScore?: number;        // AI匹配度 0-100
  matchReason?: string;       // AI推荐理由
  invitationStatus?: string;  // 邀请状态
}
```

**API调用**:
- `GET /api/v1/tasks/market` - 获取AI推荐的任务列表
- `POST /api/v1/tasks/:id/accept` - 接受任务邀请
- `POST /api/v1/tasks/:id/reject` - 拒绝任务邀请

---

### 2. 企业端 - 任务管理页面
**路径**: `/company/tasks` (http://localhost:3002/company/tasks)

**功能**:
- 查看自己发布的所有任务
- 任务状态包括：
  - 🤖 **AI匹配中** - AI正在分析和匹配学生
  - ⏳ **等待学生确认** - 已匹配5个学生，等待他们响应
  - ✅ **等待企业选择** - 有学生接受了，企业需要选择一个
  - 🎯 **进行中** - 已选定学生，任务执行中
  - ✅ **已完成** - 任务完成

**等待企业选择时显示**:
- 所有接受任务的学生列表
- 每个学生的：
  - 等级、评分、能力标签
  - AI匹配度和推荐理由
  - **学生的接单理由**（为什么适合这个任务）
- 企业可以点击"选择TA"按钮确定合作学生

**数据字段**:
```typescript
interface CompanyTask {
  matchedStudents?: Array<{
    id: string;
    name: string;
    level: number;
    rating: number;
    matchScore: number;        // AI匹配度
    matchReason: string;       // AI推荐理由
    responseStatus: string;    // pending/accepted/rejected
    acceptReason?: string;     // 学生接单理由
  }>;
}
```

**API调用**:
- `GET /api/v1/tasks/company` - 获取企业的任务列表
- `POST /api/v1/tasks/:id/select-student` - 选择学生

---

### 3. 企业端 - 发布任务页面
**路径**: `/company/post` (http://localhost:3002/company/post)

**功能**:
- 企业填写任务详情（标题、描述、预算、技能要求等）
- 提交后，后端自动触发AI匹配
- AI根据任务需求，从学生库中匹配最合适的5个学生

---

## 🤖 AI匹配算法（后端实现）

**匹配因素**:
1. **技能匹配** - 学生的技能是否符合任务要求
2. **兴趣匹配** - 学生的兴趣领域是否与任务相关
3. **经验匹配** - 学生完成过的任务数量和质量
4. **评分匹配** - 学生的历史评分
5. **时间匹配** - 学生当前是否有时间接新任务

**匹配结果**:
- 返回5个最合适的学生
- 每个学生有匹配度（0-100分）
- 每个学生有AI生成的推荐理由

---

## 📊 数据流转

### 企业发布任务后
```javascript
// 1. 创建任务
POST /api/v1/tasks/company/post
{
  title: "开发企业官网",
  description: "...",
  skills: ["编程", "UI设计"],
  budget: 5000
}

// 2. 后端自动触发AI匹配
// 返回任务ID和状态
{
  id: 1,
  status: "matching" // AI匹配中
}

// 3. AI匹配完成后，状态变为 "waiting_response"
// matchedStudents 字段包含5个学生
```

### 学生收到邀请
```javascript
// 学生访问 /tasks 页面
GET /api/v1/tasks/market?studentId=123

// 返回AI推荐的任务
[
  {
    id: 1,
    title: "开发企业官网",
    matchScore: 95,
    matchReason: "精通React开发，有3个企业官网项目经验",
    invitationStatus: "pending"
  }
]
```

### 学生接受邀请
```javascript
// 学生点击"接受邀请"
POST /api/v1/tasks/1/accept
{
  acceptReason: "我有3年React经验，完成过5个企业官网项目..."
}

// 后端更新任务状态
// 如果所有学生都响应了，状态变为 "waiting_selection"
```

### 企业选择学生
```javascript
// 企业查看接受的学生列表
GET /api/v1/tasks/company

// 企业选择一个学生
POST /api/v1/tasks/1/select-student
{
  studentId: 123
}

// 任务状态变为 "in_progress"
// assignedStudent 字段记录被选中的学生
```

---

## 🔧 前端集成说明

### 学生端 `/tasks/page.tsx`
已集成功能：
- ✅ 显示AI匹配度标签
- ✅ 显示AI推荐理由卡片
- ✅ 接受/拒绝邀请按钮
- ✅ 页面标题改为"AI为你推荐的任务"

### 企业端 `/company/tasks/page.tsx`
已集成功能：
- ✅ 显示任务状态（匹配中、等待确认、等待选择）
- ✅ 显示匹配学生数量和响应状态
- ✅ 显示接受任务的学生详情
- ✅ 学生选择功能

---

## 🚀 启动项目

```bash
# 1. 启动后端服务
cd backend
npm run dev
# 运行在 http://localhost:3000

# 2. 启动前端服务
cd frontend
npm run dev
# 运行在 http://localhost:3002

# 3. 访问页面
# 学生端: http://localhost:3002/tasks
# 企业端: http://localhost:3002/company/tasks
# 企业发布: http://localhost:3002/company/post
```

---

## 📝 待实现的后端API

目前前端已经准备好，需要后端实现以下API：

1. **GET /api/v1/tasks/market?studentId={id}**
   - 返回AI为该学生推荐的任务列表
   - 包含matchScore和matchReason字段

2. **POST /api/v1/tasks/:id/accept**
   - 学生接受任务邀请
   - Body: { acceptReason: string }

3. **POST /api/v1/tasks/:id/reject**
   - 学生拒绝任务邀请

4. **GET /api/v1/tasks/company**
   - 返回企业的任务列表
   - 包含matchedStudents数组

5. **POST /api/v1/tasks/:id/select-student**
   - 企业选择学生
   - Body: { studentId: string }

6. **POST /api/v1/tasks/company/post**
   - 企业发布任务
   - 自动触发AI匹配

---

## 💡 核心特点

✨ **不是抢单模式** - 学生不需要主动抢，AI会推送合适的任务

🤖 **AI智能匹配** - 基于技能、兴趣、经验、评分进行精准匹配

🎯 **双向选择**:
- 学生有拒绝权（可能不感兴趣或时间不合适）
- 企业有选择权（从接受的学生中选最合适的）

📊 **透明化**:
- 学生能看到匹配度和AI推荐理由
- 企业能看到学生的接单理由和详细资料

🔒 **公平性**:
- 每个任务只匹配5个学生，避免学生收到过多邀请
- 学生可以拒绝不合适的任务，不影响评分
- 企业可以看到所有接受的学生，自主选择

---

## 🎨 UI设计要点

### 学生端
- 突出显示AI匹配度（用颜色区分：90%+绿色，70-90%黄色，<70%粉色）
- AI推荐理由用蓝色卡片展示，带💡图标
- 接受按钮用绿色渐变，拒绝按钮用灰色边框

### 企业端
- 任务状态用不同颜色的Badge展示
- 等待选择时，学生卡片展示完整信息
- 学生的接单理由用引号样式展示，突出显示

---

## 📚 相关文件

- `/frontend/app/tasks/page.tsx` - 学生端任务邀请页面
- `/frontend/app/company/tasks/page.tsx` - 企业端任务管理页面
- `/frontend/app/company/post/page.tsx` - 企业端发布任务页面
- `/frontend/lib/mockData.ts` - 模拟数据和AI匹配算法
- `/backend/src/routes/tasks/` - 后端任务相关API（待实现）

---

## ⚠️ 注意事项

1. **不要使用preview页面** - `/admin-preview`、`/company-preview`、`/student-preview` 这些是临时测试页面，应该使用正式的 `/tasks`、`/company/tasks` 等页面

2. **数据结构** - 前端已经准备好接收AI匹配相关字段，后端API需要返回对应的数据结构

3. **状态管理** - 任务状态流转：匹配中 → 等待学生确认 → 等待企业选择 → 进行中 → 已完成

4. **权限控制** - 学生只能看到AI推荐给自己的任务，企业只能看到自己发布的任务

---

最后更新：2024-06-20
