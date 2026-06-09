# 动画组件使用文档

## 概述

本文档说明如何使用启程平台的动画组件，实现从"工具感"到"陪伴感"的升级。

---

## 一、快速开始

### 1. 引入主题样式

在 `app.tsx` 中引入主题系统：

```typescript
import './styles/theme.scss';
import './styles/transitions.scss';
```

### 2. 设置主题

根据用户的人格标签设置主题：

```typescript
import { useTheme } from './hooks/useAnimation';

function App() {
  const { switchTheme } = useTheme();
  
  useEffect(() => {
    // 根据用户人格标签切换主题
    const personaTag = userProfile?.persona_tag;
    if (personaTag) {
      switchTheme(personaTag);
    }
  }, [userProfile]);
}
```

---

## 二、核心动画组件

### 1. 首单完成庆祝动画

**使用场景**: 学生完成首单，收到首笔收入时触发

**示例代码**:

```typescript
import FirstOrderCelebration from '@/animations/FirstOrderCelebration';

function OrderCompletePage() {
  const [showCelebration, setShowCelebration] = useState(false);
  
  useEffect(() => {
    // 监听首单完成事件
    if (orderCompleted && isFirstOrder) {
      setShowCelebration(true);
    }
  }, [orderCompleted]);
  
  return (
    <>
      {/* 你的页面内容 */}
      
      <FirstOrderCelebration
        amount={orderAmount}
        visible={showCelebration}
        onComplete={() => {
          setShowCelebration(false);
          // 跳转到成长报告页
          Taro.navigateTo({ url: '/pages/growth-report/index' });
        }}
      />
    </>
  );
}
```

**效果**: 
- 信封裂开 → 撒花 → 金额翻滚 → 按钮出现
- 总时长约2.6秒
- 有金色粒子飘落效果

---

### 2. 等级提升动画

**使用场景**: 学生从Lv.X升级到Lv.X+1时触发

**示例代码**:

```typescript
import LevelUpAnimation from '@/animations/LevelUpAnimation';

function ProfilePage() {
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpData, setLevelUpData] = useState(null);
  
  useEffect(() => {
    // 监听WebSocket的level_up事件
    const handleLevelUp = (data) => {
      setLevelUpData(data);
      setShowLevelUp(true);
    };
    
    // 注册监听器
    eventBus.on('level_up', handleLevelUp);
    
    return () => eventBus.off('level_up', handleLevelUp);
  }, []);
  
  return (
    <>
      {/* 你的页面内容 */}
      
      <LevelUpAnimation
        oldLevel={levelUpData?.oldLevel || 1}
        newLevel={levelUpData?.newLevel || 2}
        newLevelName={levelUpData?.newLevelName || '实践者'}
        unlockedFeatures={levelUpData?.unlockedFeatures || [
          '解锁高级项目',
          '可以接外包单',
          '成长报告更详细'
        ]}
        mentorMessage="恭喜你！从新手成长为实践者，这是你努力的结果。"
        visible={showLevelUp}
        onClose={() => setShowLevelUp(false)}
      />
    </>
  );
}
```

**效果**:
- 旧徽章碎裂 → 新徽章弹出 → 星光旋转 → 特性列表滑入
- 总时长约4-5秒
- 有弹性回弹效果

---

### 3. AI分析等待页

**使用场景**: 提交问卷后，等待AI-01分析能力画像

**示例代码**:

```typescript
import AIWaitingScreen from '@/animations/AIWaitingScreen';

function QuestionnaireResultPage() {
  const [analyzing, setAnalyzing] = useState(true);
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    // 提交问卷
    submitQuestionnaire().then(() => {
      // 轮询分析结果
      const interval = setInterval(async () => {
        const result = await checkAnalysisStatus();
        setProgress(result.progress);
        
        if (result.complete) {
          clearInterval(interval);
          setAnalyzing(false);
          // 跳转到画像揭晓页
          Taro.redirectTo({ url: '/pages/persona-reveal/index' });
        }
      }, 1000);
    });
  }, []);
  
  return (
    <AIWaitingScreen
      stage="analyzing"
      progress={progress}
      visible={analyzing}
    />
  );
}
```

**效果**:
- 几何体旋转变形
- 三个呼吸点依次亮起
- 副标题每2秒轮播
- 进度条动画
- **消灭白屏等待**

---

## 三、工具函数和Hooks

### 1. 打字机效果Hook

```typescript
import { useTypingEffect } from '@/hooks/useAnimation';

function MentorChatPage() {
  const [aiReply, setAiReply] = useState('');
  const { displayText, isComplete } = useTypingEffect(aiReply, 50);
  
  return (
    <View className="mentor-message">
      {displayText}
      {!isComplete && <View className="cursor">|</View>}
    </View>
  );
}
```

### 2. 数字翻滚Hook

```typescript
import { useNumberAnimation } from '@/hooks/useAnimation';

function IncomeCard() {
  const [targetAmount, setTargetAmount] = useState(0);
  const { current } = useNumberAnimation(targetAmount, 800);
  
  return (
    <View className="amount">
      ¥{current.toFixed(2)}
    </View>
  );
}
```

### 3. 主题切换Hook

```typescript
import { useTheme } from '@/hooks/useAnimation';

function SettingsPage() {
  const { theme, switchTheme, getThemeColor } = useTheme();
  
  return (
    <View>
      <Text>当前主题: {theme}</Text>
      <Button onClick={() => switchTheme('visual-storyteller')}>
        切换为视觉叙事者主题
      </Button>
    </View>
  );
}
```

---

## 四、全局样式应用

### 1. 卡片样式

使用新的圆角和阴影：

```tsx
<View className="card">
  {/* 卡片内容 */}
</View>
```

```scss
.card {
  // 自动应用 theme.scss 中的样式
  // border-radius: 16px
  // box-shadow: var(--shadow-card)
}
```

### 2. 按钮样式

使用胶囊型按钮：

```tsx
<View className="button" onClick={handleClick}>
  提交
</View>
```

```scss
.button {
  // 自动应用 theme.scss 中的样式
  // border-radius: 9999px (胶囊型)
  // background: var(--theme-primary)
  // 点击时自动scale(0.95)
}
```

### 3. 页面过渡

配置路由过渡动画（Taro 3.x）：

```typescript
// app.config.ts
export default {
  animation: {
    duration: 300,
    timingFunc: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};
```

---

## 五、动画工具函数

### 1. 数字翻滚

```typescript
import { animateNumber } from '@/utils/animationHelpers';

const element = document.querySelector('.amount');
animateNumber(element, 1580.50, 800, () => {
  console.log('动画完成');
});
```

### 2. 打字机效果

```typescript
import { typewriterEffect } from '@/utils/animationHelpers';

const cancel = typewriterEffect(
  '恭喜你完成首单！',
  50,
  (char, index) => {
    // 每个字符的回调
    element.textContent += char;
  },
  () => {
    console.log('打字完成');
  }
);

// 如果需要取消
// cancel();
```

### 3. 交错动画延迟

```typescript
import { staggerDelay } from '@/utils/animationHelpers';

listItems.forEach((item, index) => {
  item.style.transitionDelay = `${staggerDelay(index, 0, 100)}ms`;
});
```

---

## 六、完整示例：首单完成流程

```typescript
import { useState, useEffect } from 'react';
import { View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import FirstOrderCelebration from '@/animations/FirstOrderCelebration';
import { useVibrate, useSound } from '@/hooks/useAnimation';

function OrderDetailPage() {
  const [order, setOrder] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const vibrate = useVibrate();
  const { play } = useSound();

  useEffect(() => {
    // 监听订单状态变化
    const unsubscribe = orderStore.subscribe((newOrder) => {
      if (newOrder.status === 'completed' && 
          newOrder.isFirstOrder &&
          !showCelebration) {
        
        // 震动反馈
        vibrate('medium');
        
        // 播放音效
        play('/assets/sounds/coin.mp3');
        
        // 显示庆祝动画
        setShowCelebration(true);
      }
      
      setOrder(newOrder);
    });

    return () => unsubscribe();
  }, [showCelebration]);

  return (
    <View className="order-detail-page">
      {/* 订单详情 */}
      <View className="card">
        <Text>订单状态: {order?.status}</Text>
        <Text>金额: ¥{order?.amount}</Text>
      </View>

      {/* 首单庆祝动画 */}
      <FirstOrderCelebration
        amount={order?.amount || 0}
        visible={showCelebration}
        onComplete={() => {
          setShowCelebration(false);
          
          // 跳转到成长报告
          Taro.navigateTo({
            url: `/pages/growth-report/index?orderId=${order.id}`
          });
        }}
      />
    </View>
  );
}
```

---

## 七、性能优化建议

### 1. 懒加载动画组件

```typescript
import { lazy } from 'react';

const FirstOrderCelebration = lazy(() => 
  import('@/animations/FirstOrderCelebration')
);
```

### 2. 降级方案

检测用户是否偏好减少动画：

```typescript
import { prefersReducedMotion } from '@/utils/animationHelpers';

if (prefersReducedMotion()) {
  // 跳过动画，直接显示结果
  setShowCelebration(false);
  navigateToResult();
} else {
  // 显示完整动画
  setShowCelebration(true);
}
```

### 3. 动画开关

在设置页提供动画开关：

```typescript
function SettingsPage() {
  const [enableAnimations, setEnableAnimations] = useStorage('enableAnimations', true);
  
  return (
    <Switch
      checked={enableAnimations}
      onChange={setEnableAnimations}
    />
  );
}
```

---

## 八、常见问题

### Q: 动画在低端机上卡顿怎么办？

A: 使用 CSS `will-change` 属性优化性能：

```scss
.animation-element {
  will-change: transform, opacity;
}
```

### Q: 如何调整动画时长？

A: 所有时长定义在 `theme.scss` 的CSS变量中：

```scss
:root {
  --duration-fast: 0.15s;
  --duration-normal: 0.3s;
  --duration-slow: 0.5s;
}
```

### Q: 如何自定义主题颜色？

A: 在组件中覆盖CSS变量：

```tsx
<View style={{ '--theme-primary': '#FF6B6B' }}>
  {/* 内容 */}
</View>
```

---

## 九、路线图

### P0 (已完成)
- ✅ 色彩系统
- ✅ 首单庆祝动画
- ✅ 等级提升动画
- ✅ AI等待页
- ✅ 动画工具和Hooks

### P1 (计划中)
- ⬜ 导师流式回复打字机
- ⬜ 成长对比卡片动画
- ⬜ 骨架屏shimmer效果
- ⬜ 全局微交互

### P2 (未来)
- ⬜ Lottie动画集成
- ⬜ 音效系统
- ⬜ 触觉反馈

---

## 十、反馈和支持

遇到问题或有改进建议？

- 提Issue: [GitHub Issues](https://github.com/...)
- 查看示例: `/examples/animations`
- 查看源码: `/src/animations`

---

**让每个关键时刻都被看见！** 🎉
