# 前端固定文案清理清单（方向A）

**目标**: 消除所有硬编码，连接真实数据API  
**预计时间**: 1天（分6个小时，每个文件1小时）

---

## 📋 需要检查和修改的文件清单

### ✅ 已检查的文件（没有硬编码问题）

1. **app/profile/page.tsx** ✅
   - 使用 `profile.opc_label` (真实数据)
   - 使用 `profile.six_dim_scores` (真实数据)
   - 使用 `profile.balance`, `task_count` (真实数据)
   - **结论**: 没有固定文案，已经使用真实API

2. **app/journey/page.tsx** ✅
   - 使用 `onboardingApi.getStatus()` (真实数据)
   - 显示步骤进度，没有固定数字
   - **结论**: 没有固定文案，已经使用真实API

3. **app/story/page.tsx** ✅
   - 使用 `storyApi.feed()` (真实数据)
   - 显示真实的故事列表
   - 空状态显示："故事墙还没有故事" (正确处理)
   - **结论**: 没有固定文案，已经使用真实API

---

## ⚠️ 需要修改的文件（待排查）

### 1. app/onboarding/page.tsx（待检查）
**优先级**: P0  
**预计时间**: 1小时

**需要检查**:
- [ ] 是否有固定的"12,843个和你一样"等文案
- [ ] 是否有硬编码的人格标签描述
- [ ] 是否有固定的统计数字

**如果发现硬编码，改为**:
```typescript
// 添加统计数据获取
const [stats, setStats] = useState<any>(null);

useEffect(() => {
  if (profile?.opc_personality_tag) {
    fetch(`/api/v1/stats/personality/${profile.opc_personality_tag}`)
      .then(res => res.json())
      .then(data => setStats(data));
  }
}, [profile]);

// 显示真实数据
{stats && (
  <p>全国有 {stats.total_count} 个和你一样的{getLabel(profile.opc_personality_tag)}</p>
)}
```

---

### 2. app/design-demo/page.tsx（待检查）
**优先级**: P1  
**预计时间**: 30分钟

**需要检查**:
- [ ] 这是demo页面，可能有mock数据
- [ ] 检查是否用在生产环境

**处理方案**:
- 如果是纯demo页面，可以保留mock数据，但加上标注"示例数据"
- 如果在生产使用，必须连接真实API

---

### 3. app/auth/complete-profile/page.tsx（待检查）
**优先级**: P0  
**预计时间**: 1小时

**需要检查**:
- [ ] 表单提交后是否调用真实API
- [ ] 人格标签显示是否来自AI返回值

---

### 4. 组件级别检查（待排查）

**需要检查的组件目录**:
- `components/profile/` - 个人资料相关组件
- `components/onboarding/` - 引导流程组件
- `components/ability/` - 能力相关组件

**检查命令**:
```bash
cd components
grep -rn "const.*=.*[0-9]{3,}" . --include="*.tsx" | grep -v "px\|width\|height"
grep -rn "视觉叙事者\|系统构建者\|创意执行者" . --include="*.tsx"
```

---

## 🔧 需要创建的前端工具文件

### 1. lib/personalityLabels.ts（需要创建）
**优先级**: P0  
**预计时间**: 15分钟

```typescript
// 人格标签的中文显示名称映射
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

**注意**: 这个文件是允许的映射，因为它只是UI显示的翻译，不是数据本身。

---

### 2. 在lib/api.ts中添加统计API方法（需要添加）
**优先级**: P0  
**预计时间**: 15分钟

```typescript
// 添加到现有的 api.ts 文件

export const statsApi = {
  // 获取人格标签统计
  async getPersonalityStats(tag: string) {
    const response = await fetch(`${API_BASE}/stats/personality/${tag}`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  // 获取赛道统计
  async getTrackStats(track: string) {
    const response = await fetch(`${API_BASE}/stats/track/${track}`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  // 获取学生能力估值
  async getStudentValuation() {
    const response = await fetch(`${API_BASE}/stats/student-valuation`, {
      headers: getAuthHeaders()
    });
    return response.json();
  }
};
```

---

## 📝 逐个文件修改计划

### 第1步: 创建基础工具（30分钟）

**任务**:
1. 创建 `lib/personalityLabels.ts`
2. 在 `lib/api.ts` 添加 `statsApi`
3. 测试API连接是否正常

**验证**:
```bash
# 启动后端
cd backend && npm run dev

# 测试API
curl http://localhost:3000/api/v1/stats/personality/visual_storyteller
# 应该返回真实统计数据
```

---

### 第2步: 检查 app/onboarding/page.tsx（1小时）

**步骤**:
1. 阅读完整代码
2. 查找所有硬编码数字和文案
3. 如果有固定文案，连接statsApi
4. 测试修改后的效果

**修改模板**:
```typescript
// 之前（如果有硬编码）
const similarCount = 12843;

// 之后
const [stats, setStats] = useState<any>(null);
useEffect(() => {
  if (profile?.opc_personality_tag) {
    statsApi.getPersonalityStats(profile.opc_personality_tag)
      .then(setStats)
      .catch(console.error);
  }
}, [profile]);

// 显示
{stats && `全国有${stats.total_count}个和你一样的...`}
```

---

### 第3步: 检查 app/auth/complete-profile/page.tsx（1小时）

**步骤**:
1. 阅读完整代码
2. 确认表单提交调用真实API
3. 确认人格标签来自API返回值

---

### 第4步: 检查组件目录（2小时）

**步骤**:
```bash
# 1. 查找components下所有硬编码数字
grep -rn "const.*=.*[0-9]{3,}" components/ --include="*.tsx" | grep -v "px\|width\|height\|opacity\|z-index"

# 2. 查找人格标签硬编码
grep -rn "视觉叙事者\|系统构建者" components/ --include="*.tsx"

# 3. 逐个修复
```

---

### 第5步: 全局搜索可疑模式（1小时）

**搜索命令**:
```bash
cd frontend

# 1. 查找"12,843"或"12843"
grep -rn "12,?843\|12843" app/ components/ --include="*.tsx"

# 2. 查找"63%"等可疑固定百分比
grep -rn "63%" app/ components/ --include="*.tsx"

# 3. 查找"和你一样"
grep -rn "和你一样\|一样的" app/ components/ --include="*.tsx"

# 4. 查找"月薪估值"
grep -rn "月薪\|估值.*[0-9]" app/ components/ --include="*.tsx"
```

**处理原则**:
- 找到一个，修复一个
- 改为API调用
- 测试验证

---

### 第6步: 端到端测试（1小时）

**测试场景**:
1. 学生A登录 → 看到自己的人格标签和统计
2. 学生B登录 → 看到不同的人格标签和统计
3. 刷新数据库 → 前端数字随之变化

**验证清单**:
- [ ] 不同学生看到不同的统计数字
- [ ] 人格标签描述来自API
- [ ] 没有任何"12,843"等固定数字
- [ ] 能力估值基于真实订单计算
- [ ] 清除浏览器缓存后，数据仍然正确

---

## 🚫 禁止模式总结

### 禁止模式1: 硬编码数字
```typescript
// ❌ 错误
const similarCount = 12843;
const completionRate = 63;

// ✅ 正确
const [stats, setStats] = useState<any>(null);
useEffect(() => {
  statsApi.getPersonalityStats(tag).then(setStats);
}, [tag]);
const similarCount = stats?.total_count || 0;
```

### 禁止模式2: 前端模板填空
```typescript
// ❌ 错误
const label = {
  visual_storyteller: '你擅长用画面讲故事...',
}[tag];

// ✅ 正确（使用工具函数）
import { getPersonalityDescription } from '@/lib/personalityLabels';
const label = getPersonalityDescription(tag);

// ✅ 更好（直接用API返回的）
const label = profile.profile_summary; // AI生成的描述
```

### 禁止模式3: Mock数据
```typescript
// ❌ 错误
const stories = [
  { id: 1, content: "第1单我做了5天..." },
  { id: 2, content: "..." }
];

// ✅ 正确
const [stories, setStories] = useState([]);
useEffect(() => {
  storyApi.feed(1).then(({ data }) => setStories(data.data || []));
}, []);

// 空状态正确处理
{stories.length === 0 && (
  <p>故事墙还没有故事，完成第一单后可以分享</p>
)}
```

---

## ✅ 验证标准

修改完成后，必须满足：

1. **数字动态**: 任何展示给用户的数字，都来自API
2. **描述动态**: 任何描述用户特征的文字，都来自API或工具函数
3. **无假数据**: 搜索"12,843""12843""63%"全部找不到
4. **空状态正确**: 没有数据时，显示"还没有XX"，不显示假数据
5. **不同用户不同数据**: 两个学生登录，看到的统计数字不同

---

## 📊 当前进度

**已检查**: 3个文件 ✅
- app/profile/page.tsx - 无硬编码
- app/journey/page.tsx - 无硬编码
- app/story/page.tsx - 无硬编码

**待检查**: 3个文件 + 组件目录
- app/onboarding/page.tsx
- app/design-demo/page.tsx
- app/auth/complete-profile/page.tsx
- components/ 目录

**预计完成时间**: 6小时（1个工作日）

---

## 🎯 下一步

**现在立即执行**:
1. 我创建 `lib/personalityLabels.ts`
2. 我在 `lib/api.ts` 添加 `statsApi`
3. 我读取并检查 `app/onboarding/page.tsx`
4. 如果发现硬编码，立即修复
5. 逐个继续其他文件

**准备好了，开始执行第1步！**

告诉我"开始"，我立即创建基础工具文件。
