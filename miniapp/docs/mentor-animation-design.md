# 启程小猫界面动画设计

## 一、设计原则

### 动画目标
- **增强情感**: 让冷冰冰的界面变得温暖
- **引导注意**: 突出重要信息
- **提供反馈**: 让交互更有响应感
- **营造氛围**: 营造陪伴和成长的感觉

### 动画原则
- **微妙不夸张**: 动画要自然，不要太炫
- **有意义**: 每个动画都有目的，不为动而动
- **性能优先**: 使用transform和opacity，避免重排重绘
- **可访问性**: 尊重用户的减少动画偏好

---

## 二、核心组件动画

### 1. 工具卡片 (ToolCard)

#### 入场动画
```scss
.tool-card {
  animation: slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  
  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(30rpx);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}
```

#### 悬浮效果
```scss
.tool-card {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  
  &:active {
    transform: scale(0.98);
    box-shadow: 0 4rpx 16rpx rgba(102, 126, 234, 0.2);
  }
}
```

#### 图标动画
```scss
.tool-icon {
  animation: bounce 0.6s ease-in-out;
  animation-delay: 0.2s;
  
  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-8rpx);
    }
  }
}
```

#### 按钮脉冲
```scss
.tool-button {
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.5);
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
  }
  
  &:active::before {
    width: 300rpx;
    height: 300rpx;
  }
}
```

---

### 2. 记忆引用 (MemoryReference)

#### 入场动画（从左滑入）
```scss
.memory-reference {
  animation: slideInLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  
  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-30rpx);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
}
```

#### 标签闪烁（吸引注意）
```scss
.memory-label {
  animation: pulse 2s ease-in-out infinite;
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }
}
```

#### 记忆项依次出现
```scss
.memory-item {
  opacity: 0;
  animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  
  &:nth-child(1) { animation-delay: 0.1s; }
  &:nth-child(2) { animation-delay: 0.2s; }
  &:nth-child(3) { animation-delay: 0.3s; }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20rpx);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}
```

#### 悬停高亮
```scss
.memory-item {
  transition: all 0.3s ease;
  
  &:active {
    background: rgba(102, 126, 234, 0.1);
    transform: translateX(8rpx);
  }
}
```

---

### 3. 情绪标记 (EmotionIndicator)

#### 入场动画（缩放+旋转）
```scss
.emotion-indicator {
  animation: popIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  
  @keyframes popIn {
    0% {
      opacity: 0;
      transform: scale(0) rotate(-180deg);
    }
    100% {
      opacity: 1;
      transform: scale(1) rotate(0deg);
    }
  }
}
```

#### 图标呼吸效果
```scss
.emotion-icon {
  animation: breathe 2s ease-in-out infinite;
  
  @keyframes breathe {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }
}
```

#### 边框流光效果
```scss
.emotion-indicator {
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      45deg,
      transparent 30%,
      rgba(255, 255, 255, 0.3) 50%,
      transparent 70%
    );
    animation: shimmer 3s infinite;
  }
  
  @keyframes shimmer {
    0% {
      transform: translateX(-100%) translateY(-100%) rotate(45deg);
    }
    100% {
      transform: translateX(100%) translateY(100%) rotate(45deg);
    }
  }
}
```

---

### 4. 导师消息气泡

#### 打字效果（逐字显示）
```tsx
// 前端实现
const [displayedText, setDisplayedText] = useState('')
const fullText = message.content

useEffect(() => {
  let index = 0
  const timer = setInterval(() => {
    if (index < fullText.length) {
      setDisplayedText(fullText.slice(0, index + 1))
      index++
    } else {
      clearInterval(timer)
    }
  }, 30) // 每30ms显示一个字
  
  return () => clearInterval(timer)
}, [fullText])
```

#### 气泡入场
```scss
.mentor-message {
  animation: messageIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  
  @keyframes messageIn {
    from {
      opacity: 0;
      transform: translateY(20rpx) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
}
```

#### 思考中动画（三个点跳动）
```scss
.thinking-indicator {
  display: flex;
  gap: 8rpx;
  
  .dot {
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    background: #667eea;
    animation: dotBounce 1.4s infinite ease-in-out;
    
    &:nth-child(1) { animation-delay: 0s; }
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
  
  @keyframes dotBounce {
    0%, 80%, 100% {
      transform: scale(0);
      opacity: 0.5;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  }
}
```

---

### 5. 成长仪表盘动画

#### 数字滚动效果
```tsx
// 前端实现
const [count, setCount] = useState(0)
const targetValue = 85

useEffect(() => {
  const duration = 1000 // 1秒
  const steps = 60
  const increment = targetValue / steps
  let current = 0
  
  const timer = setInterval(() => {
    current += increment
    if (current >= targetValue) {
      setCount(targetValue)
      clearInterval(timer)
    } else {
      setCount(Math.floor(current))
    }
  }, duration / steps)
  
  return () => clearInterval(timer)
}, [targetValue])
```

#### 进度条填充动画
```scss
.progress-fill {
  width: 0;
  animation: fillProgress 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: 0.3s;
  
  @keyframes fillProgress {
    to {
      width: var(--target-width);
    }
  }
}
```

#### 能力条依次出现
```scss
.ability-item {
  opacity: 0;
  animation: slideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  
  &:nth-child(1) { animation-delay: 0.1s; }
  &:nth-child(2) { animation-delay: 0.2s; }
  &:nth-child(3) { animation-delay: 0.3s; }
  &:nth-child(4) { animation-delay: 0.4s; }
  &:nth-child(5) { animation-delay: 0.5s; }
  &:nth-child(6) { animation-delay: 0.6s; }
  
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(-30rpx);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
}
```

---

### 6. 成长时间线动画

#### 时间线连线绘制
```scss
.timeline-line {
  height: 0;
  animation: drawLine 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  
  @keyframes drawLine {
    to {
      height: 100%;
    }
  }
}
```

#### 圆点脉冲
```scss
.timeline-dot {
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: inherit;
    transform: translate(-50%, -50%);
    animation: ripple 2s infinite;
  }
  
  @keyframes ripple {
    0% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 0.5;
    }
    100% {
      transform: translate(-50%, -50%) scale(2);
      opacity: 0;
    }
  }
}
```

#### 事件卡片依次出现
```scss
.timeline-item {
  opacity: 0;
  animation: fadeInScale 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: calc(var(--index) * 0.1s);
  
  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
}
```

---

### 7. 导师报告动画

#### 报告卡片翻转效果
```scss
.report-card {
  transform-style: preserve-3d;
  transition: transform 0.6s;
  
  &:active {
    transform: rotateY(5deg);
  }
}
```

#### 指标数字跳动
```scss
.metric-value {
  animation: numberPop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  animation-delay: calc(var(--index) * 0.1s);
  
  @keyframes numberPop {
    0% {
      transform: scale(0);
    }
    50% {
      transform: scale(1.2);
    }
    100% {
      transform: scale(1);
    }
  }
}
```

#### 报告生成加载动画
```scss
.generating-report {
  .loading-bar {
    width: 100%;
    height: 4rpx;
    background: #E5E7EB;
    border-radius: 2rpx;
    overflow: hidden;
    
    &::after {
      content: '';
      display: block;
      width: 40%;
      height: 100%;
      background: linear-gradient(90deg, #667eea, #764ba2);
      animation: loading 1.5s infinite;
    }
  }
  
  @keyframes loading {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(250%);
    }
  }
}
```

---

## 三、交互动画

### 1. 页面切换动画

#### 路由转场
```scss
// 页面进入
.page-enter {
  animation: pageSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  
  @keyframes pageSlideIn {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
}

// 页面退出
.page-exit {
  animation: pageSlideOut 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  
  @keyframes pageSlideOut {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(-30%);
    }
  }
}
```

### 2. 弹窗动画

#### 遮罩淡入
```scss
.modal-overlay {
  animation: fadeIn 0.3s ease;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
}
```

#### 内容弹出
```scss
.modal-content {
  animation: modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  
  @keyframes modalSlideUp {
    from {
      opacity: 0;
      transform: translateY(100rpx) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
}
```

### 3. 下拉刷新动画

```scss
.refresh-indicator {
  .refresh-icon {
    animation: rotate 1s linear infinite;
  }
  
  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
}
```

---

## 四、微交互动画

### 1. 按钮点击反馈

```scss
.button {
  position: relative;
  overflow: hidden;
  
  // 水波纹效果
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.5);
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
  }
  
  &:active::after {
    width: 600rpx;
    height: 600rpx;
  }
  
  // 缩放反馈
  &:active {
    transform: scale(0.95);
  }
}
```

### 2. 输入框聚焦

```scss
.input-field {
  border: 2rpx solid #E5E7EB;
  transition: all 0.3s ease;
  
  &:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 6rpx rgba(102, 126, 234, 0.1);
    transform: translateY(-2rpx);
  }
}
```

### 3. 复选框勾选

```scss
.checkbox {
  .checkmark {
    stroke-dasharray: 100;
    stroke-dashoffset: 100;
    transition: stroke-dashoffset 0.3s ease;
  }
  
  &.checked .checkmark {
    stroke-dashoffset: 0;
  }
}
```

---

## 五、加载状态动画

### 1. 骨架屏

```scss
.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  
  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
}
```

### 2. 加载指示器

```scss
.loading-spinner {
  width: 80rpx;
  height: 80rpx;
  border: 6rpx solid #E5E7EB;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
}
```

---

## 六、实现建议

### 1. 性能优化

```scss
// 使用will-change提示浏览器
.animated-element {
  will-change: transform, opacity;
}

// 动画结束后移除will-change
.animated-element.animation-done {
  will-change: auto;
}
```

### 2. 减少动画偏好

```scss
// 尊重用户的减少动画设置
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 3. 使用CSS变量

```scss
:root {
  --animation-duration: 0.4s;
  --animation-easing: cubic-bezier(0.16, 1, 0.3, 1);
}

.element {
  animation: slideIn var(--animation-duration) var(--animation-easing);
}
```

---

## 七、动画时序表

| 组件 | 入场延迟 | 动画时长 | 缓动函数 |
|------|----------|----------|----------|
| 工具卡片 | 0s | 0.4s | cubic-bezier(0.16, 1, 0.3, 1) |
| 记忆引用 | 0s | 0.5s | cubic-bezier(0.16, 1, 0.3, 1) |
| 情绪标记 | 0s | 0.5s | cubic-bezier(0.68, -0.55, 0.265, 1.55) |
| 导师消息 | 0s | 0.4s | cubic-bezier(0.16, 1, 0.3, 1) |
| 进度条 | 0.3s | 1.5s | cubic-bezier(0.16, 1, 0.3, 1) |
| 能力条 | 0.1s-0.6s | 0.5s | cubic-bezier(0.16, 1, 0.3, 1) |
| 时间线 | 0s | 0.8s | cubic-bezier(0.16, 1, 0.3, 1) |

---

## 八、测试清单

### 功能测试
- [ ] 所有动画在不同设备上流畅运行
- [ ] 动画不影响交互响应速度
- [ ] 动画在快速操作时不会卡顿
- [ ] 减少动画偏好设置生效

### 视觉测试
- [ ] 动画时序协调，不会同时触发太多
- [ ] 动画幅度适中，不夸张
- [ ] 动画方向符合用户预期
- [ ] 颜色过渡自然

### 性能测试
- [ ] 动画不导致页面重排
- [ ] 动画不导致内存泄漏
- [ ] 长时间运行不会降低性能
- [ ] 低端设备上也能流畅运行

---

**文档版本**: v1.0  
**创建日期**: 2026-05-10  
**状态**: 设计完成，待实施
