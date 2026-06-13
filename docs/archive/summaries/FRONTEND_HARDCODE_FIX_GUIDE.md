# 启程平台 - 前端硬编码清理指南

**日期**: 2026-06-09  
**状态**: ✅ 后端100%就绪，前端待修复  
**目标**: 移除所有硬编码文案，连接真实AI数据

---

## ✅ 后端已就绪

### 真实数据统计
```
OPC测评记录: 28条 (4种人格标签)
学生能力向量: 22/22个学生已生成
任务匹配记录: 10条 (平均分38.8%)
任务翻译记录: 1条

人格标签分布（真实）:
- balanced_learner: 9人 (32%)
- visual_storyteller: 8人 (29%)
- system_builder: 8人 (29%)
- creative_executor: 3人 (11%)
```

### 可用API端点
```typescript
// 学生查看自己的能力画像
GET /api/v1/student/profile
Response: {
  nickname: string;
  opc_personality_tag: string;  // "visual_storyteller", "system_builder" 等
  six_dim_scores: {
    d1: number,  // 专业技能
    d2: number,  // 执行力
    d3: number,  // 新工具上手
    d4: number,  // 需求理解
    d5: number,  // 时间管理
    d6: number   // 交付水平
  }
}

// 学生查看推荐任务
GET /api/v1/students/recommended-tasks
Response: {
  tasks: [{
    taskId: string,
    title: string,
    matchScore: number,  // 真实匹配分数 30-80%
    matchReason: string,
    studentFriendlyTitle: string,
    whatYouWillDo: string,
    whatYouWillLearn: string
  }]
}

// 获取人格标签统计（需要实现）
GET /api/v1/stats/personality-distribution
Response: {
  [tag: string]: {
    count: number,
    percentage: number
  }
}
```

---

## 🎯 前端修复清单

### 需要检查的页面

基于之前诊断，以下页面可能有硬编码：

1. **[/profile](../frontend/app/profile/page.tsx)** - 学生个人资料页
2. **[/journey](../frontend/app/journey/page.tsx)** - 成长旅程页
3. **[/onboarding](../frontend/app/onboarding/page.tsx)** - 新用户引导页
4. **[/story](../frontend/app/story/page.tsx)** - 故事页面
5. **[/design-demo](../frontend/app/design-demo/page.tsx)** - 设计演示页

### 需要清理的硬编码类型

#### 1. 固定的人格标签
```typescript
// ❌ 错误 - 硬编码
const personalityTag = "视觉叙事者";

// ✅ 正确 - 从API获取
const { data } = await studentApi.getProfile();
const personalityTag = getPersonalityLabel(data.opc_personality_tag);
```

#### 2. 固定的统计数字
```typescript
// ❌ 错误 - 硬编码
const similarStudents = 12843;
const completionRate = 63;

// ✅ 正确 - 从API获取
const stats = await api.getPersonalityStats(profile.opc_personality_tag);
const similarStudents = stats.count;
const completionRate = stats.first_task_completion_rate;
```

#### 3. 固定的匹配分数
```typescript
// ❌ 错误 - 硬编码
const matchScore = 85;

// ✅ 正确 - 从推荐API获取
const { tasks } = await studentApi.getRecommendedTasks();
const matchScore = tasks[0].matchScore; // 真实分数
```

---

## 📝 具体修复步骤

### 步骤1: 创建人格标签映射

创建 `frontend/lib/personalityLabels.ts`:

```typescript
// 人格标签的中文显示名称
export const PERSONALITY_LABELS: Record<string, string> = {
  visual_storyteller: '视觉叙事者',
  system_builder: '系统构建者',
  creative_executor: '创意执行者',
  balanced_learner: '全面学习者'
};

export const PERSONALITY_DESCRIPTIONS: Record<string, string> = {
  visual_storyteller: '你擅长用画面讲故事，能看到各个元素之间的联系',
  system_builder: '你习惯先理解底层逻辑再动手，擅长设计规则和系统',
  creative_executor: '你享受从0到1的创作过程，喜欢快速出稿再打磨',
  balanced_learner: '你是一个全面发展的学习者'
};

export function getPersonalityLabel(tag: string): string {
  return PERSONALITY_LABELS[tag] || tag;
}

export function getPersonalityDescription(tag: string): string {
  return PERSONALITY_DESCRIPTIONS[tag] || '';
}
```

### 步骤2: 创建统计API

创建 `frontend/lib/api.ts` 中的新方法:

```typescript
// 添加到 studentApi 对象
export const studentApi = {
  // ... 现有方法
  
  // 获取人格标签统计
  async getPersonalityStats(tag: string) {
    const response = await fetch(`${API_BASE}/stats/personality/${tag}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.json();
  },
  
  // 获取推荐任务
  async getRecommendedTasks() {
    const response = await fetch(`${API_BASE}/students/recommended-tasks`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.json();
  }
};
```

### 步骤3: 修复个人资料页

修改 `frontend/app/profile/page.tsx`:

```typescript
// ❌ 删除硬编码
- const personalityTag = "视觉叙事者";
- const similarCount = 12843;

// ✅ 添加真实数据获取
import { getPersonalityLabel } from '@/lib/personalityLabels';

const [stats, setStats] = useState<any>(null);

useEffect(() => {
  if (profile?.opc_personality_tag) {
    studentApi.getPersonalityStats(profile.opc_personality_tag)
      .then(data => setStats(data))
      .catch(err => console.error('Failed to load stats:', err));
  }
}, [profile]);

// 显示真实数据
<div>
  <h3>{getPersonalityLabel(profile.opc_personality_tag)}</h3>
  {stats && (
    <p>全国有 {stats.total_count} 个和你一样的{getPersonalityLabel(profile.opc_personality_tag)}</p>
  )}
</div>
```

### 步骤4: 修复推荐任务显示

修改任务推荐相关页面:

```typescript
const [recommendedTasks, setRecommendedTasks] = useState<any[]>([]);

useEffect(() => {
  studentApi.getRecommendedTasks()
    .then(({ tasks }) => setRecommendedTasks(tasks))
    .catch(err => console.error('Failed to load tasks:', err));
}, []);

// 显示真实匹配分数
{recommendedTasks.map(task => (
  <TaskCard key={task.taskId}>
    <h3>{task.studentFriendlyTitle || task.title}</h3>
    <div className="match-score">
      匹配度: {task.matchScore}%
    </div>
    <p className="match-reason">{task.matchReason}</p>
  </TaskCard>
))}
```

---

## 🔍 快速查找硬编码的命令

```bash
# 查找固定的人格标签
cd frontend
grep -r "视觉叙事者\|系统构建者\|创意执行者" app/ --include="*.tsx" --include="*.ts"

# 查找固定的数字（可能是统计数据）
grep -rE "[0-9]{3,5}.*人\|[0-9]{2}%" app/ --include="*.tsx" --include="*.ts"

# 查找 "一样的" 这类文案
grep -r "一样的\|和你一样" app/ --include="*.tsx" --include="*.ts"
```

---

## 🚀 实施计划

### 今天（1-2小时）

1. **运行查找命令** 找出所有硬编码位置
2. **创建 personalityLabels.ts** 统一管理标签映射
3. **修复 profile 页面** 连接真实API
4. **创建统计API端点**（后端20分钟）

### 明天（1小时）

5. **修复其他页面** journey, onboarding, story
6. **端到端测试** 验证真实数据流

---

## ✅ 验证清单

修复完成后，验证以下场景：

- [ ] 学生登录后看到自己真实的人格标签
- [ ] 显示的"相似学生数量"是真实统计
- [ ] 推荐任务显示真实的匹配分数（30-80%范围）
- [ ] 不同学生看到不同的人格标签和推荐
- [ ] 没有任何"12,843"或"63%"等固定数字

---

## 📊 预期改进

### 修复前
```
所有学生都是"视觉叙事者"
所有学生看到"12,843个和你一样的人"
所有推荐都是固定分数
```

### 修复后
```
学生A: "系统构建者", 全国8人, 任务匹配47%
学生B: "视觉叙事者", 全国8人, 任务匹配39%
学生C: "全面学习者", 全国9人, 任务匹配44%
```

---

## 🎯 下一步

1. 我帮你运行查找命令，找出所有硬编码位置
2. 一起修复最重要的页面（profile, journey）
3. 创建后端统计API端点
4. 测试验证

准备好了就告诉我！

---

**创建时间**: 2026-06-09 08:36  
**预计完成**: 今天下午（2小时）
