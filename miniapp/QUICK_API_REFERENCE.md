# 小程序AI导师API快速参考

## 🚀 快速开始

### 导入API
```typescript
import { mentorStageAPI } from '@/services/api';
```

---

## 📋 基础对话API

### 1. 获取会话
```typescript
const session = await mentorStageAPI.getSession(taskId);
// 返回：{ id, taskId, studentId, currentStage, stageStatus, ... }
```

### 2. 获取消息历史
```typescript
const messages = await mentorStageAPI.getMessages(sessionId, 50, 0);
// 返回：{ messages: [...], total: 100 }
```

### 3. 发送消息
```typescript
const response = await mentorStageAPI.sendMessage(sessionId, '我遇到困难了');
// 返回：{ message: {...}, mentorReply: '...' }
```

### 4. 质量预审
```typescript
const result = await mentorStageAPI.requestQualityReview(taskId, '我的提交内容...');
// 返回：{ passed: true, score: 85, feedback: '...' }
```

---

## 💙 灵魂系统API

### 获取成长仪表盘（推荐首选）
```typescript
const dashboard = await mentorStageAPI.getGrowthDashboard(studentId);
// 一次性获取：profile + emotions + milestones + memories
```

### 获取最近情绪
```typescript
const emotions = await mentorStageAPI.getRecentEmotions(studentId, 10);
// 返回：[{ emotion: 'anxious', intensity: 0.8, detectedAt: '...' }, ...]
```

### 获取情绪统计
```typescript
const stats = await mentorStageAPI.getEmotionStats(studentId, 7);
// 返回：{ emotionDistribution: {...}, dominantEmotion: 'excited', ... }
```

### 获取成长里程碑
```typescript
const milestones = await mentorStageAPI.getMilestones(studentId, 20);
// 返回：[{ type: 'first_breakthrough', description: '...', achievedAt: '...' }, ...]
```

### 获取未庆祝的里程碑
```typescript
const uncelebrated = await mentorStageAPI.getUncelebratedMilestones(studentId);
// 用于：显示庆祝弹窗
```

### 庆祝里程碑
```typescript
await mentorStageAPI.celebrateMilestone(milestoneId);
// 标记里程碑已庆祝
```

### 获取导师记忆
```typescript
const memories = await mentorStageAPI.getMemories(studentId, 20);
// 返回：[{ content: '...', importance: 0.9, tags: [...] }, ...]
```

### 获取学习档案
```typescript
const profile = await mentorStageAPI.getLearningProfile(studentId);
// 返回：{ learningStyle, preferredPace, strengthAreas, ... }
```

---

## 🛠️ 工具推荐API

### 获取推荐工具
```typescript
const tools = await mentorStageAPI.getRecommendedTools(taskId);
// 返回：{ recommendations: [{ toolName, reason, detailedSteps, ... }] }
```

### 提交工具反馈
```typescript
await mentorStageAPI.submitToolFeedback({
  recommendationId: 'xxx',
  used: true,
  helpful: true,
  feedback: '很好用'
});
```

### 获取热门工具
```typescript
const popular = await mentorStageAPI.getPopularTools(10);
// 返回：[{ toolName, usageCount, successRate, ... }]
```

---

## 🧠 深度引导API

### 获取深层模式
```typescript
const patterns = await mentorStageAPI.getDeepPatterns(studentId);
// 返回：[{ patternKey: 'fear_of_unknown', patternName: '对未知的恐惧', ... }]
```

### 获取信念转变
```typescript
const shifts = await mentorStageAPI.getBeliefShifts(studentId, 10);
// 返回：[{ oldBelief: '...', newBelief: '...', shiftedAt: '...' }]
```

### 获取成长挑战
```typescript
const challenges = await mentorStageAPI.getGrowthChallenges(studentId, 'active');
// 返回：[{ description: '...', status: 'in_progress', ... }]
```

### 更新挑战进度
```typescript
await mentorStageAPI.updateChallengeProgress(challengeId, '今天尝试了...');
```

### 完成挑战
```typescript
await mentorStageAPI.completeChallenge(challengeId, '我的反思...');
```

---

## 💌 主动跟进API

### 获取跟进消息
```typescript
const messages = await mentorStageAPI.getFollowUpMessages(studentId, 10);
// 返回：[{ type: 'inactive', content: '好久没见...', read: false }]
```

### 标记消息已读
```typescript
await mentorStageAPI.markFollowUpRead(messageId);
```

---

## 🎯 常用场景示例

### 场景1：进入导师对话页面
```typescript
useEffect(() => {
  const init = async () => {
    const studentId = Taro.getStorageSync('userId');
    
    // 1. 获取会话
    const session = await mentorStageAPI.getSession(taskId);
    setSession(session);
    
    // 2. 获取消息历史
    const msgs = await mentorStageAPI.getMessages(session.id);
    setMessages(msgs.messages);
    
    // 3. 检查未庆祝的里程碑
    const uncelebrated = await mentorStageAPI.getUncelebratedMilestones(studentId);
    if (uncelebrated.length > 0) {
      showCelebrationModal(uncelebrated[0]);
    }
  };
  
  init();
}, [taskId]);
```

### 场景2：发送消息并显示情绪
```typescript
const sendMessage = async () => {
  // 1. 发送消息
  const response = await mentorStageAPI.sendMessage(sessionId, inputText);
  
  // 2. 更新消息列表
  setMessages([...messages, response.message]);
  
  // 3. 如果检测到情绪，显示指示器
  if (response.message.metadata?.emotion) {
    setCurrentEmotion(response.message.metadata.emotion);
  }
  
  // 4. 如果有工具推荐，显示卡片
  if (response.message.metadata?.toolRecommendation) {
    setShowToolCard(true);
    setRecommendedTool(response.message.metadata.toolRecommendation);
  }
};
```

### 场景3：显示"我的成长"页面
```typescript
const MyGrowth = () => {
  const [dashboard, setDashboard] = useState(null);
  
  useEffect(() => {
    const loadData = async () => {
      const studentId = Taro.getStorageSync('userId');
      
      // 一次性获取所有数据
      const data = await mentorStageAPI.getGrowthDashboard(studentId);
      setDashboard(data);
    };
    
    loadData();
  }, []);
  
  return (
    <View>
      {/* 情绪曲线 */}
      <EmotionChart data={dashboard?.recentEmotions} />
      
      {/* 里程碑时间线 */}
      <MilestoneTimeline milestones={dashboard?.recentMilestones} />
      
      {/* 导师记忆墙 */}
      <MemoryWall memories={dashboard?.importantMemories} />
    </View>
  );
};
```

### 场景4：显示工具推荐
```typescript
const ToolRecommendation = ({ taskId }) => {
  const [tools, setTools] = useState([]);
  
  useEffect(() => {
    const loadTools = async () => {
      const result = await mentorStageAPI.getRecommendedTools(taskId);
      setTools(result.recommendations);
    };
    
    loadTools();
  }, [taskId]);
  
  const handleUseTool = async (tool) => {
    // 打开工具链接
    Taro.navigateTo({ url: `/pages/webview/index?url=${tool.officialUrl}` });
    
    // 提交反馈
    await mentorStageAPI.submitToolFeedback({
      recommendationId: tool.id,
      used: true
    });
  };
  
  return (
    <View>
      {tools.map(tool => (
        <ToolCard key={tool.id} tool={tool} onUse={handleUseTool} />
      ))}
    </View>
  );
};
```

### 场景5：显示深层模式
```typescript
const DeepPatterns = ({ studentId }) => {
  const [patterns, setPatterns] = useState([]);
  
  useEffect(() => {
    const loadPatterns = async () => {
      const result = await mentorStageAPI.getDeepPatterns(studentId);
      setPatterns(result.patterns);
    };
    
    loadPatterns();
  }, [studentId]);
  
  return (
    <View>
      {patterns.map(pattern => (
        <View key={pattern.patternKey} className="pattern-card">
          <Text className="pattern-name">{pattern.patternName}</Text>
          <Progress percent={pattern.progressPercentage} />
          <Text className="pattern-stage">当前阶段：{pattern.currentStage}</Text>
        </View>
      ))}
    </View>
  );
};
```

---

## 🎨 UI组件建议

### 情绪指示器
```tsx
const EmotionIndicator = ({ emotion, intensity }) => {
  const emotionMap = {
    anxious: { name: '焦虑', icon: '😰', color: '#F59E0B' },
    frustrated: { name: '沮丧', icon: '😤', color: '#EF4444' },
    confused: { name: '困惑', icon: '😕', color: '#6B7280' },
    excited: { name: '兴奋', icon: '🤩', color: '#10B981' },
    confident: { name: '自信', icon: '😎', color: '#3B82F6' },
    overwhelmed: { name: '不堪重负', icon: '😵', color: '#DC2626' },
    proud: { name: '自豪', icon: '😊', color: '#8B5CF6' }
  };
  
  const info = emotionMap[emotion];
  
  return (
    <View className="emotion-indicator" style={{ borderColor: info.color }}>
      <Text className="emotion-icon">{info.icon}</Text>
      <Text className="emotion-name">导师感知到你现在{info.name}</Text>
      <View className="emotion-bar" style={{ width: `${intensity * 100}%`, backgroundColor: info.color }} />
    </View>
  );
};
```

### 里程碑卡片
```tsx
const MilestoneCard = ({ milestone, onCelebrate }) => {
  const milestoneIcons = {
    first_question: '❓',
    first_breakthrough: '💡',
    overcame_fear: '💪',
    independent_solution: '🎯',
    helped_others: '🤝',
    completed_challenge: '🏆',
    positive_feedback: '⭐',
    skill_mastery: '🎓',
    growth_reflection: '🌱'
  };
  
  return (
    <View className="milestone-card">
      <Text className="milestone-icon">{milestoneIcons[milestone.type]}</Text>
      <Text className="milestone-desc">{milestone.description}</Text>
      <Text className="milestone-date">{milestone.achievedAt}</Text>
      {!milestone.celebrated && (
        <Button onClick={() => onCelebrate(milestone.id)}>庆祝一下</Button>
      )}
    </View>
  );
};
```

### 工具推荐卡片
```tsx
const ToolCard = ({ tool, onUse }) => {
  return (
    <View className="tool-card">
      <Text className="tool-name">{tool.toolName}</Text>
      <Text className="tool-category">{tool.category}</Text>
      <Text className="tool-reason">{tool.reason}</Text>
      <View className="tool-steps">
        <Text className="steps-title">使用步骤：</Text>
        <Text className="steps-content">{tool.detailedSteps}</Text>
      </View>
      <View className="tool-actions">
        <Button onClick={() => onUse(tool)}>去使用</Button>
        <Button onClick={() => viewTutorial(tool.tutorialUrl)}>查看教程</Button>
      </View>
    </View>
  );
};
```

---

## ⚠️ 注意事项

### 1. 错误处理
```typescript
try {
  const result = await mentorStageAPI.getGrowthDashboard(studentId);
  setDashboard(result);
} catch (error) {
  Taro.showToast({
    title: error.message || '加载失败',
    icon: 'none'
  });
}
```

### 2. 加载状态
```typescript
const [loading, setLoading] = useState(false);

const loadData = async () => {
  setLoading(true);
  try {
    const data = await mentorStageAPI.getGrowthDashboard(studentId);
    setDashboard(data);
  } finally {
    setLoading(false);
  }
};
```

### 3. 数据缓存
```typescript
// 缓存成长数据（5分钟）
const CACHE_KEY = 'growth_dashboard';
const CACHE_TIME = 5 * 60 * 1000;

const getCachedDashboard = async (studentId) => {
  const cached = Taro.getStorageSync(CACHE_KEY);
  if (cached && Date.now() - cached.timestamp < CACHE_TIME) {
    return cached.data;
  }
  
  const data = await mentorStageAPI.getGrowthDashboard(studentId);
  Taro.setStorageSync(CACHE_KEY, {
    data,
    timestamp: Date.now()
  });
  
  return data;
};
```

---

## 📊 数据结构参考

### 情绪对象
```typescript
{
  emotion: 'anxious' | 'frustrated' | 'confused' | 'excited' | 'confident' | 'overwhelmed' | 'proud',
  intensity: number,  // 0-1
  detectedAt: string,
  context: string
}
```

### 里程碑对象
```typescript
{
  id: string,
  type: 'first_question' | 'first_breakthrough' | 'overcame_fear' | ...,
  description: string,
  achievedAt: string,
  celebrated: boolean,
  beforeState: string,
  afterState: string
}
```

### 工具推荐对象
```typescript
{
  id: string,
  toolName: string,
  category: 'design' | 'coding' | 'project_management' | 'ai_assistant',
  reason: string,
  detailedSteps: string,
  officialUrl: string,
  tutorialUrl: string,
  estimatedLearningTime: string,
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}
```

### 深层模式对象
```typescript
{
  patternKey: 'fear_of_unknown' | 'perfectionism_procrastination' | ...,
  patternName: string,
  detectedCount: number,
  currentStage: 'identify' | 'acknowledge' | 'challenge' | 'reframe' | 'practice',
  progressPercentage: number,
  surfaceManifestations: string[],
  underlyingBeliefs: string[],
  newPerspectives: string[]
}
```

---

**版本**: v4.0.0  
**最后更新**: 2026-05-10  
**适用于**: 小程序学生端
