# 前端动效改造 - 实施计划

**项目目标**: 从工具感升级为陪伴感，所有关键时刻加入庆祝动画，消灭白屏和死等

**开始时间**: 2026-06-09  
**预计工期**: P0 3天, P1 5天, P2 3天

---

## 一、实施优先级

### P0 - 上线前必须（3天）

**Day 1: 基础设施 + 色彩系统**
- [ ] 创建CSS变量系统（果汁色）
- [ ] 创建动画工具函数库
- [ ] 改造全局样式（卡片圆角、按钮胶囊化）
- [ ] 创建主题切换Hook

**Day 2: 核心庆祝动画**
- [ ] 首单完成撒花动画组件
- [ ] 等级提升弹跳动画组件
- [ ] AI分析等待页（替代白屏）

**Day 3: 流畅体验**
- [ ] 导师流式回复打字机效果
- [ ] 页面切换过渡动画
- [ ] 空状态插图和引导
- [ ] 测试和优化

### P1 - 上线后1个月（5天）

**Week 1-2:**
- [ ] 人格标签动态主题色
- [ ] 收到打款金币掉落动画
- [ ] 成长对比卡片弹出动画
- [ ] 骨架屏shimmer效果
- [ ] 全局微交互（点赞、通知气泡）

### P2 - 后续迭代（3天）

**Week 3-4:**
- [ ] Lottie动画集成
- [ ] 下拉刷新动画
- [ ] 音效系统
- [ ] 触觉反馈

---

## 二、技术架构

### 2.1 新增目录结构

```
miniapp/src/
├── animations/              # 动画组件
│   ├── FirstOrderCelebration.tsx    # 首单庆祝
│   ├── LevelUpAnimation.tsx         # 升级动画
│   ├── AIWaitingScreen.tsx          # AI等待页
│   ├── TypingEffect.tsx             # 打字机效果
│   └── ConfettiEffect.tsx           # 撒花特效
├── hooks/
│   ├── useTheme.ts          # 主题切换Hook
│   ├── useAnimation.ts      # 动画控制Hook
│   └── useTypingEffect.ts   # 打字机Hook
├── styles/
│   ├── theme.scss           # 主题变量（果汁色）
│   ├── animations.scss      # 全局动画定义
│   └── transitions.scss     # 页面过渡
└── utils/
    ├── animationHelpers.ts  # 动画工具函数
    └── confetti.ts          # 撒花工具

```

### 2.2 依赖库

```json
{
  "dependencies": {
    "canvas-confetti": "^1.6.0",     // 撒花特效
    "framer-motion": "^10.16.0",     // 动画框架
    "react-spring": "^9.7.0"         // 弹性动画
  }
}
```

---

## 三、核心组件设计

### 3.1 首单完成动画

**组件**: `FirstOrderCelebration.tsx`

**Props**:
```typescript
interface Props {
  amount: number;           // 金额
  onComplete: () => void;   // 动画结束回调
}
```

**状态机**:
```
idle → envelope-open (0.5s) 
     → confetti-burst (1s) 
     → amount-count (0.8s) 
     → button-show (0.3s) 
     → complete
```

**动画规格**:
- 信封裂开: scale 1→1.2, rotate 0→10deg
- 撒花: 8-12个彩色碎片, 随机方向飞出
- 数字翻滚: 0→实际金额, ease-out, 0.8s
- 按钮出现: translateY(20px)→0, opacity 0→1, 0.3s

---

### 3.2 等级提升动画

**组件**: `LevelUpAnimation.tsx`

**Props**:
```typescript
interface Props {
  oldLevel: number;
  newLevel: number;
  newLevelName: string;
  unlockedFeatures: string[];
  onClose: () => void;
}
```

**状态机**:
```
idle → old-badge-shrink (0.3s)
     → pause (0.2s)
     → new-badge-pop (0.6s, elastic)
     → star-particles (1.5s)
     → level-name-rise (0.8s)
     → features-slide-in (0.4s, staggered)
     → complete
```

**动画规格**:
- 旧徽章: scale 1→0, opacity 1→0
- 新徽章: scale 0→1.2→1, cubic-bezier(0.68, -0.55, 0.265, 1.55)
- 星光: 8颗星, rotate 720deg, opacity 1→0
- 特性列表: 每项延迟0.1s

---

### 3.3 AI分析等待页

**组件**: `AIWaitingScreen.tsx`

**Props**:
```typescript
interface Props {
  stage: 'analyzing' | 'matching' | 'complete';
  progress: number; // 0-100
}
```

**展示内容**:
```
1. 大标题: "正在分析你的能力特征……"
2. 三个呼吸点: ••• (依次亮起)
3. 副标题轮播:
   - "在看你的AI工具使用习惯……" (2s)
   - "在分析你的创作偏好……" (2s)
   - "在匹配适合你的赛道……" (2s)
   - "快好了，再等一下……" (循环)
4. 进度条: 0→100%, 颜色跟随主题
```

---

### 3.4 打字机效果

**Hook**: `useTypingEffect.ts`

```typescript
function useTypingEffect(
  text: string,
  speed: number = 50 // ms per char
): {
  displayText: string;
  isComplete: boolean;
}
```

**使用场景**:
- 导师流式回复
- 身份宣言揭晓
- 导师见证语

---

## 四、色彩系统实现

### 4.1 主题CSS变量

**文件**: `src/styles/theme.scss`

```scss
:root {
  /* 果汁色调色板 */
  --strawberry-pink: #FFF0F3;
  --peach-yellow: #FFF6EB;
  --grape-green: #F0F7F2;
  --grapefruit-orange: #FF6B6B;
  --blueberry-blue: #4ECDC4;
  --mango-yellow: #FFE66D;
  --cream-white: #FFFEF9;
  --cocoa-dark: #2D1B0E;
  --cocoa-gray: #8B7355;
  
  /* 动态主题色（根据用户标签切换） */
  --theme-primary: var(--grapefruit-orange);
  --theme-bg: var(--strawberry-pink);
  --theme-card: var(--cream-white);
  --theme-accent: var(--mango-yellow);
  
  /* 文字 */
  --text-primary: var(--cocoa-dark);
  --text-secondary: var(--cocoa-gray);
  
  /* 等级色 */
  --level-1: #6b7280;
  --level-2: #7c3aed;
  --level-3: #d97706;
  --level-4: #dc2626;
  --level-5: #1a1a1a;
  
  /* 阴影 */
  --shadow-soft: 0 4px 20px rgba(255, 107, 107, 0.15);
  --shadow-card: 0 2px 12px rgba(45, 27, 14, 0.08);
}

/* 不同人格标签的主题 */
body[data-persona="visual-storyteller"] {
  --theme-primary: var(--strawberry-pink);
  --theme-bg: #FFF0F3;
}

body[data-persona="system-builder"] {
  --theme-primary: var(--blueberry-blue);
  --theme-bg: #E8F7F5;
}

body[data-persona="creative-executor"] {
  --theme-primary: var(--grapefruit-orange);
  --theme-bg: #FFEBE8;
}
```

### 4.2 主题切换Hook

**文件**: `src/hooks/useTheme.ts`

```typescript
export function useTheme() {
  const userProfile = useSelector(state => state.user.profile);
  
  useEffect(() => {
    if (userProfile?.persona_tag) {
      document.body.setAttribute('data-persona', userProfile.persona_tag);
    }
  }, [userProfile]);
  
  return {
    primaryColor: getComputedStyle(document.documentElement)
      .getPropertyValue('--theme-primary'),
  };
}
```

---

## 五、全局样式改造

### 5.1 卡片圆角

```scss
// 旧: border-radius: 8px;
// 新:
.card {
  border-radius: 16px;
  box-shadow: var(--shadow-card);
  background: var(--theme-card);
}
```

### 5.2 按钮胶囊化

```scss
// 旧: border-radius: 6px;
// 新:
.button {
  border-radius: 24px; // 胶囊型
  padding: 12px 24px;
  background: var(--theme-primary);
  color: white;
  transition: all 0.15s ease;
  
  &:active {
    transform: scale(0.95); // 按压反馈
  }
}
```

### 5.3 页面过渡

```scss
// 文件: src/styles/transitions.scss

.page-enter {
  transform: translateX(100%);
  opacity: 0;
}

.page-enter-active {
  transform: translateX(0);
  opacity: 1;
  transition: all 0.3s ease-out;
}

.page-exit {
  transform: translateX(0);
  opacity: 1;
}

.page-exit-active {
  transform: translateX(-20%);
  opacity: 0;
  transition: all 0.2s ease-in;
}
```

---

## 六、测试清单

### 6.1 动画性能

- [ ] 首单动画在低端机上FPS > 30
- [ ] 等级提升动画流畅不卡顿
- [ ] 页面切换过渡时间 < 300ms
- [ ] 打字机效果不阻塞UI

### 6.2 兼容性

- [ ] iOS微信小程序
- [ ] Android微信小程序
- [ ] 深色模式适配
- [ ] 不同屏幕尺寸

### 6.3 降级方案

- [ ] 关闭动画开关（设置页）
- [ ] 低性能设备自动降级
- [ ] 网络慢时跳过等待动画

---

## 七、开发规范

### 7.1 动画命名

```
组件名-动作-状态
例如: badge-pop-enter, confetti-burst-active
```

### 7.2 时长标准

| 动画类型 | 时长 | 缓动函数 |
|---------|------|---------|
| 微交互 | 0.1-0.15s | ease |
| 卡片展开 | 0.3s | ease-out |
| 庆祝动画 | 2-3s | ease-out |
| 页面切换 | 0.3s | cubic-bezier(0.4,0,0.2,1) |
| 弹性动画 | 0.6s | cubic-bezier(0.68,-0.55,0.265,1.55) |

### 7.3 代码组织

```typescript
// 每个动画组件必须有:
1. Props接口定义（TypeScript）
2. 状态机图（注释）
3. 动画规格说明（注释）
4. onComplete回调
5. cleanup逻辑（useEffect return）
```

---

## 八、交付标准

### P0交付物

1. ✅ 色彩系统CSS变量文件
2. ✅ 3个核心动画组件（首单、升级、AI等待）
3. ✅ 打字机Hook
4. ✅ 页面过渡配置
5. ✅ 改造后的全局样式
6. ✅ 使用文档

### 验收标准

- 所有动画在真机上流畅运行
- 关键时刻有情感节奏
- 消灭白屏和死等
- 用户测试反馈：体验从3分→8分

---

**开始执行！按Day 1→Day 2→Day 3顺序推进** 🚀
