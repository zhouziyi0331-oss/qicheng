# 小程序AI导师完整系统集成指南

## 🎯 概述

小程序端现已支持完整的AI导师系统，包括：
- ✅ **基础4阶段系统** - 需求理解、执行引导、质量预审、沟通桥梁
- ✅ **灵魂系统** - 情绪感知、成长追踪、记忆管理
- ✅ **人性化对话** - 像朋友一样说话、工具推荐
- ✅ **深度引导** - 识别深层模式、挑战信念、引导转变
- ✅ **主动跟进** - 导师主动关心学生

---

## 📱 小程序端新增API

### 1. 灵魂系统API

#### 获取成长仪表盘
```typescript
// 显示学生的完整成长数据
const dashboard = await mentorStageAPI.getGrowthDashboard(studentId);

// 返回数据：
{
  profile: {
    studentId: string,
    learningStyle: string,  // visual, auditory, kinesthetic
    preferredPace: string,  // fast, moderate, slow
    strengthAreas: string[],
    improvementAreas: string[],
    totalMilestones: number,
    totalMessages: number
  },
  recentEmotions: Array<{
    emotion: string,  // anxious, frustrated, confused, excited, confident, overwhelmed, proud
    intensity: number,  // 0-1
    detectedAt: string
  }>,
  recentMilestones: Array<{
    type: string,  // first_question, first_breakthrough, overcame_fear, etc.
    description: string,
    achievedAt: string,
    celebrated: boolean
  }>,
  importantMemories: Array<{
    content: string,
    importance: number,  // 0-1
    tags: string[],
    createdAt: string
  }>
}
```

#### 获取最近情绪
```typescript
// 查看学生最近的情绪变化
const emotions = await mentorStageAPI.getRecentEmotions(studentId, 10);

// 用于：
// - 显示情绪曲线图
// - 了解学生当前状态
// - 调整导师语气
```

#### 获取成长里程碑
```typescript
// 查看学生的成长历程
const milestones = await mentorStageAPI.getMilestones(studentId, 20);

// 用于：
// - 显示成长时间线
// - 庆祝成就
// - 激励学生
```

#### 获取导师记忆
```typescript
// 查看导师记住的重要事情
const memories = await mentorStageAPI.getMemories(studentId, 20);

// 用于：
// - 显示"导师记得的事"
// - 让学生感受到被关注
// - 建立信任关系
```

#### 获取情绪统计
```typescript
// 查看过去7天的情绪分布
const stats = await mentorStageAPI.getEmotionStats(studentId, 7);

// 返回数据：
{
  emotionDistribution: {
    anxious: 15,
    frustrated: 8,
    confused: 12,
    excited: 20,
    confident: 18,
    overwhelmed: 5,
    proud: 10
  },
  dominantEmotion: 'excited',
  emotionTrend: 'improving'  // improving, stable, declining
}
```

#### 获取未庆祝的里程碑
```typescript
// 查看还没庆祝的成就
const uncelebrated = await mentorStageAPI.getUncelebratedMilestones(studentId);

// 用于：
// - 提醒学生查看成就
// - 触发庆祝动画
// - 增强成就感
```

#### 庆祝里程碑
```typescript
// 学生点击"查看成就"后调用
await mentorStageAPI.celebrateMilestone(milestoneId);

// 触发：
// - 庆祝动画
// - 鼓励消息
// - 更新里程碑状态
```

---

### 2. 工具推荐API

#### 获取推荐工具
```typescript
// 根据任务推荐合适的工具
const tools = await mentorStageAPI.getRecommendedTools(taskId);

// 返回数据：
{
  recommendations: Array<{
    id: string,
    toolName: string,  // 即时设计, Cursor, 微信开发者工具, ChatGPT, Notion
    category: string,  // design, coding, project_management, ai_assistant
    reason: string,  // 为什么推荐这个工具
    detailedSteps: string,  // 具体使用步骤
    officialUrl: string,
    tutorialUrl: string,
    estimatedLearningTime: string,
    difficulty: string  // beginner, intermediate, advanced
  }>
}
```

#### 提交工具使用反馈
```typescript
// 学生使用工具后提交反馈
await mentorStageAPI.submitToolFeedback({
  recommendationId: 'xxx',
  used: true,
  helpful: true,
  feedback: '很好用，帮我快速完成了设计'
});

// 用于：
// - 改进推荐算法
// - 统计工具有效性
// - 优化推荐策略
```

#### 获取热门工具
```typescript
// 查看其他学生常用的工具
const popular = await mentorStageAPI.getPopularTools(10);

// 用于：
// - 显示工具排行榜
// - 让学生发现新工具
// - 社区推荐
```

---

### 3. 深度引导API

#### 获取深层模式
```typescript
// 查看学生的深层心理模式
const patterns = await mentorStageAPI.getDeepPatterns(studentId);

// 返回数据：
{
  patterns: Array<{
    patternKey: string,  // fear_of_unknown, perfectionism_procrastination, etc.
    patternName: string,
    detectedCount: number,
    firstDetectedAt: string,
    lastDetectedAt: string,
    currentStage: string,  // identify, acknowledge, challenge, reframe, practice
    progressPercentage: number,
    surfaceManifestations: string[],
    underlyingBeliefs: string[],
    newPerspectives: string[]
  }>
}

// 8种深层模式：
// 1. fear_of_unknown - 对未知的恐惧
// 2. perfectionism_procrastination - 完美主义/拖延
// 3. need_for_external_validation - 需要外部认可
// 4. comparison_mindset - 比较心态
// 5. fear_of_failure - 对失败的恐惧
// 6. need_for_control - 需要控制
// 7. rigid_communication - 僵化沟通
// 8. isolation_cant_ask_for_help - 孤立/不敢求助
```

#### 获取信念转变记录
```typescript
// 查看学生的信念转变历程
const shifts = await mentorStageAPI.getBeliefShifts(studentId, 10);

// 返回数据：
{
  shifts: Array<{
    oldBelief: string,  // "我不会就是学不会"
    newBelief: string,  // "不会和学不会是两回事"
    patternKey: string,
    dialogueStage: string,
    shiftedAt: string,
    reinforcementCount: number
  }>
}

// 用于：
// - 显示成长轨迹
// - 让学生看到自己的改变
// - 强化新信念
```

#### 获取成长挑战
```typescript
// 查看导师给学生的成长挑战
const challenges = await mentorStageAPI.getGrowthChallenges(studentId, 'active');

// 返回数据：
{
  challenges: Array<{
    id: string,
    patternKey: string,
    challengeType: string,  // small_step, reframe_exercise, behavior_experiment
    description: string,  // 具体挑战内容
    expectedOutcome: string,
    difficulty: string,  // easy, medium, hard
    status: string,  // proposed, accepted, in_progress, completed, abandoned
    progress: string,
    proposedAt: string,
    completedAt: string
  }>
}
```

#### 更新挑战进度
```typescript
// 学生更新挑战进度
await mentorStageAPI.updateChallengeProgress(challengeId, '今天尝试了，感觉还不错');
```

#### 完成挑战
```typescript
// 学生完成挑战并反思
await mentorStageAPI.completeChallenge(challengeId, '我发现其实没那么难，关键是迈出第一步');
```

---

### 4. 主动跟进API

#### 获取跟进消息
```typescript
// 查看导师的主动关心消息
const messages = await mentorStageAPI.getFollowUpMessages(studentId, 10);

// 返回数据：
{
  messages: Array<{
    id: string,
    type: string,  // inactive, struggling, tool_feedback, celebrate
    content: string,
    sentAt: string,
    read: boolean
  }>
}

// 用于：
// - 显示"导师的关心"列表
// - 推送通知
// - 增强陪伴感
```

#### 标记消息已读
```typescript
// 学生查看消息后标记已读
await mentorStageAPI.markFollowUpRead(messageId);
```

---

## 🎨 小程序页面设计建议

### 1. 导师对话页面增强

#### 添加情绪指示器
```tsx
// 在消息输入框上方显示当前情绪
<View className="emotion-indicator">
  <Text>导师感知到你现在：{currentEmotion}</Text>
  <Image src={emotionIcon} />
</View>
```

#### 添加成长进度条
```tsx
// 在顶部显示成长进度
<View className="growth-progress">
  <Text>成长里程碑：{milestonesCount}</Text>
  <Progress percent={growthPercentage} />
</View>
```

#### 添加工具推荐卡片
```tsx
// 导师推荐工具时显示卡片
<View className="tool-card">
  <Text className="tool-name">{tool.toolName}</Text>
  <Text className="tool-reason">{tool.reason}</Text>
  <Button onClick={() => viewToolDetails(tool)}>查看详情</Button>
</View>
```

---

### 2. 新增"我的成长"页面

#### 页面结构
```
/pages/my-growth/index.tsx

- 情绪曲线图（过去7天）
- 成长里程碑时间线
- 导师记忆墙
- 深层模式识别
- 信念转变记录
- 成长挑战列表
```

#### 示例代码
```tsx
import { mentorStageAPI } from '@/services/api';

const MyGrowth = () => {
  const [dashboard, setDashboard] = useState(null);
  const [emotions, setEmotions] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [patterns, setPatterns] = useState([]);

  useEffect(() => {
    loadGrowthData();
  }, []);

  const loadGrowthData = async () => {
    const studentId = Taro.getStorageSync('userId');
    
    // 加载仪表盘
    const dashboardData = await mentorStageAPI.getGrowthDashboard(studentId);
    setDashboard(dashboardData);
    
    // 加载情绪统计
    const emotionStats = await mentorStageAPI.getEmotionStats(studentId, 7);
    setEmotions(emotionStats);
    
    // 加载里程碑
    const milestonesData = await mentorStageAPI.getMilestones(studentId, 20);
    setMilestones(milestonesData);
    
    // 加载深层模式
    const patternsData = await mentorStageAPI.getDeepPatterns(studentId);
    setPatterns(patternsData);
  };

  return (
    <View className="my-growth">
      {/* 情绪曲线 */}
      <View className="emotion-chart">
        <Text className="section-title">我的情绪曲线</Text>
        <EmotionChart data={emotions} />
      </View>

      {/* 成长里程碑 */}
      <View className="milestones">
        <Text className="section-title">成长里程碑</Text>
        {milestones.map(m => (
          <MilestoneCard key={m.id} milestone={m} />
        ))}
      </View>

      {/* 深层模式 */}
      <View className="patterns">
        <Text className="section-title">我的成长模式</Text>
        {patterns.map(p => (
          <PatternCard key={p.patternKey} pattern={p} />
        ))}
      </View>
    </View>
  );
};
```

---

### 3. 新增"工具箱"页面

#### 页面结构
```
/pages/toolbox/index.tsx

- 推荐工具列表
- 热门工具排行
- 我使用过的工具
- 工具使用反馈
```

---

### 4. 新增"导师关心"页面

#### 页面结构
```
/pages/mentor-care/index.tsx

- 主动跟进消息列表
- 未读消息提醒
- 快速回复
```

---

## 🔔 推送通知建议

### 1. 里程碑庆祝通知
```typescript
// 当学生达成新里程碑时
{
  title: '🎉 恭喜你达成新成就！',
  content: '你完成了第一次突破，导师为你感到骄傲！',
  path: '/pages/my-growth/index'
}
```

### 2. 导师主动关心通知
```typescript
// 当导师主动发送关心消息时
{
  title: '💙 导师在关心你',
  content: '好久没见到你了，最近还好吗？',
  path: '/pages/mentor-chat/index?taskId=xxx'
}
```

### 3. 成长挑战提醒
```typescript
// 当有新的成长挑战时
{
  title: '🌱 导师给你一个小挑战',
  content: '试试这个，可能会有新发现哦',
  path: '/pages/my-growth/index?tab=challenges'
}
```

---

## 💡 使用场景示例

### 场景1：学生感到焦虑

**流程**：
1. 学生发送消息："我好紧张，不知道能不能做好"
2. 后端检测到焦虑情绪（anxious, intensity: 0.8）
3. 导师回复使用共情语气："嗯嗯，我能感觉到你有点紧张..."
4. 小程序显示情绪指示器：😰 焦虑
5. 导师提供具体帮助和鼓励

**小程序实现**：
```tsx
// 在消息列表上方显示情绪
{currentEmotion && (
  <View className="emotion-banner">
    <Text>导师感知到你现在有点{currentEmotion.name}</Text>
    <Text className="emotion-icon">{currentEmotion.icon}</Text>
  </View>
)}
```

---

### 场景2：学生完成第一次突破

**流程**：
1. 学生发送："我终于搞懂了！原来是这样！"
2. 后端检测到里程碑：first_breakthrough
3. 自动生成庆祝消息
4. 小程序显示庆祝动画
5. 推送通知提醒查看成就

**小程序实现**：
```tsx
// 监听里程碑事件
useEffect(() => {
  const checkMilestones = async () => {
    const uncelebrated = await mentorStageAPI.getUncelebratedMilestones(studentId);
    if (uncelebrated.length > 0) {
      showCelebrationModal(uncelebrated[0]);
    }
  };
  checkMilestones();
}, [messages]);

// 显示庆祝弹窗
const showCelebrationModal = (milestone) => {
  Taro.showModal({
    title: '🎉 恭喜你！',
    content: milestone.description,
    confirmText: '查看成就',
    success: async (res) => {
      if (res.confirm) {
        await mentorStageAPI.celebrateMilestone(milestone.id);
        Taro.navigateTo({ url: '/pages/my-growth/index' });
      }
    }
  });
};
```

---

### 场景3：导师推荐工具

**流程**：
1. 学生说："我不知道用什么工具做设计"
2. 后端分析任务类型：UI设计
3. 推荐工具：即时设计
4. 小程序显示工具卡片
5. 学生点击查看详细步骤

**小程序实现**：
```tsx
// 在消息中嵌入工具卡片
{message.metadata?.toolRecommendation && (
  <View className="tool-recommendation">
    <Text className="tool-name">{message.metadata.toolRecommendation.toolName}</Text>
    <Text className="tool-reason">{message.metadata.toolRecommendation.reason}</Text>
    <View className="tool-steps">
      <Text className="steps-title">具体步骤：</Text>
      <Text>{message.metadata.toolRecommendation.detailedSteps}</Text>
    </View>
    <Button onClick={() => openToolUrl(message.metadata.toolRecommendation.officialUrl)}>
      去使用
    </Button>
  </View>
)}
```

---

### 场景4：识别深层模式

**流程**：
1. 学生多次说："我不会"、"太难了"
2. 后端识别模式：fear_of_unknown（对未知的恐惧）
3. 导师开始深度引导对话
4. 小程序显示模式识别提示
5. 引导学生看到"不会"≠"学不会"

**小程序实现**：
```tsx
// 显示模式识别提示
{message.metadata?.patternDetected && (
  <View className="pattern-detected">
    <Text className="pattern-title">💡 导师发现了一个模式</Text>
    <Text className="pattern-name">{message.metadata.patternDetected.name}</Text>
    <Text className="pattern-desc">让我们一起来看看这个模式...</Text>
  </View>
)}
```

---

## 📊 数据统计建议

### 在"我的"页面添加统计卡片

```tsx
<View className="stats-cards">
  <View className="stat-card">
    <Text className="stat-number">{dashboard.profile.totalMilestones}</Text>
    <Text className="stat-label">成长里程碑</Text>
  </View>
  
  <View className="stat-card">
    <Text className="stat-number">{dashboard.profile.totalMessages}</Text>
    <Text className="stat-label">与导师对话</Text>
  </View>
  
  <View className="stat-card">
    <Text className="stat-number">{patterns.length}</Text>
    <Text className="stat-label">识别的模式</Text>
  </View>
  
  <View className="stat-card">
    <Text className="stat-number">{beliefShifts.length}</Text>
    <Text className="stat-label">信念转变</Text>
  </View>
</View>
```

---

## 🎯 实施优先级

### 第一阶段（1周）- 基础集成
- [x] 更新API服务（已完成）
- [ ] 在导师对话页面显示情绪指示器
- [ ] 在导师对话页面显示工具推荐卡片
- [ ] 添加里程碑庆祝弹窗

### 第二阶段（2周）- 新增页面
- [ ] 创建"我的成长"页面
- [ ] 创建"工具箱"页面
- [ ] 创建"导师关心"页面
- [ ] 添加推送通知

### 第三阶段（3周）- 深度功能
- [ ] 实现深层模式可视化
- [ ] 实现信念转变时间线
- [ ] 实现成长挑战系统
- [ ] 添加数据统计和图表

---

## 🚀 快速开始

### 1. 更新依赖
```bash
cd miniapp
npm install
```

### 2. 测试新API
```bash
# 在小程序开发者工具中测试
npm run dev:weapp
```

### 3. 测试流程
1. 登录学生账号
2. 进入任务详情
3. 打开导师对话
4. 发送消息测试情绪检测
5. 查看成长仪表盘
6. 测试工具推荐

---

## 📝 注意事项

1. **API地址配置**
   - 开发环境：`http://localhost:3000/api/v1`
   - 生产环境：需要配置正式域名

2. **Token管理**
   - 所有API都需要认证
   - Token存储在本地storage
   - Token过期自动跳转登录

3. **性能优化**
   - 成长数据可以缓存
   - 情绪统计可以本地计算
   - 图表数据按需加载

4. **用户体验**
   - 加载状态要明确
   - 错误提示要友好
   - 动画要流畅自然

---

**文档版本**: v4.0.0  
**最后更新**: 2026-05-10  
**状态**: API已更新，等待前端集成
