# 启程小猫动画实施示例

## 示例1：工具卡片完整实现

### 组件代码 (ToolCard.tsx)

```tsx
import { View, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import './ToolCard.scss'

interface ToolCardProps {
  tool: {
    tool_id: string
    name: string
    icon: string
    reason: string
    how_to_use: string
    tool_url: string
  }
  onUse?: () => void
}

export function ToolCard({ tool, onUse }: ToolCardProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // 延迟显示，触发入场动画
    setTimeout(() => setIsVisible(true), 100)
  }, [])

  const handleUse = () => {
    if (onUse) onUse()
    Taro.navigateTo({ url: tool.tool_url })
  }

  return (
    <View className={`tool-card ${isVisible ? 'visible' : ''}`}>
      <View className='tool-header'>
        <Text className='tool-icon'>{tool.icon}</Text>
        <Text className='tool-name'>{tool.name}</Text>
      </View>
      
      <View className='tool-content'>
        <View className='tool-reason'>
          <Text className='reason-label'>💡 为什么推荐：</Text>
          <Text className='reason-text'>{tool.reason}</Text>
        </View>
        
        <View className='tool-guide'>
          <Text className='guide-label'>📝 怎么用：</Text>
          <Text className='guide-text'>{tool.how_to_use}</Text>
        </View>
      </View>
      
      <View className='tool-button' onClick={handleUse}>
        <Text className='button-text'>立即使用</Text>
      </View>
    </View>
  )
}
```

### 样式代码 (ToolCard.scss)

```scss
.tool-card {
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border: 2rpx solid #667eea30;
  border-radius: 24rpx;
  padding: 32rpx;
  margin: 24rpx 0;
  
  // 初始状态：隐藏
  opacity: 0;
  transform: translateY(30rpx);
  
  // 显示状态：触发动画
  &.visible {
    animation: slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  
  @keyframes slideInUp {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  // 点击反馈
  &:active {
    transform: scale(0.98);
    transition: transform 0.2s ease;
  }

  .tool-header {
    display: flex;
    align-items: center;
    margin-bottom: 24rpx;

    .tool-icon {
      font-size: 56rpx;
      margin-right: 16rpx;
      
      // 图标弹跳动画
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

    .tool-name {
      font-size: 32rpx;
      font-weight: bold;
      color: #667eea;
    }
  }

  .tool-content {
    margin-bottom: 24rpx;

    .tool-reason,
    .tool-guide {
      margin-bottom: 16rpx;
      
      // 内容依次淡入
      opacity: 0;
      animation: fadeIn 0.4s ease forwards;
      
      &.tool-reason {
        animation-delay: 0.3s;
      }
      
      &.tool-guide {
        animation-delay: 0.4s;
      }
      
      @keyframes fadeIn {
        to { opacity: 1; }
      }
    }

    .reason-label,
    .guide-label {
      font-size: 24rpx;
      color: #667eea;
      font-weight: bold;
      display: block;
      margin-bottom: 8rpx;
    }

    .reason-text,
    .guide-text {
      font-size: 26rpx;
      color: #4B5563;
      line-height: 1.6;
      display: block;
    }
  }

  .tool-button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16rpx;
    padding: 24rpx;
    text-align: center;
    position: relative;
    overflow: hidden;
    
    // 按钮淡入
    opacity: 0;
    animation: fadeIn 0.4s ease forwards;
    animation-delay: 0.5s;
    
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

    .button-text {
      font-size: 28rpx;
      color: #fff;
      font-weight: bold;
      position: relative;
      z-index: 1;
    }
  }
}
```

---

## 示例2：记忆引用完整实现

### 组件代码 (MemoryReference.tsx)

```tsx
import { View, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'
import './MemoryReference.scss'

interface Memory {
  id: string
  content: string
  occurred_at: string
}

interface MemoryReferenceProps {
  memories: Memory[]
  onMemoryClick?: (memory: Memory) => void
}

export function MemoryReference({ memories, onMemoryClick }: MemoryReferenceProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100)
  }, [])

  if (memories.length === 0) return null

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  return (
    <View className={`memory-reference ${isVisible ? 'visible' : ''}`}>
      <View className='memory-header'>
        <Text className='memory-icon'>🐱</Text>
        <Text className='memory-label'>启程小猫记得：</Text>
      </View>
      
      <View className='memory-list'>
        {memories.map((memory, index) => (
          <View
            key={memory.id}
            className='memory-item'
            style={{ animationDelay: `${0.1 + index * 0.1}s` }}
            onClick={() => onMemoryClick?.(memory)}
          >
            <View className='memory-content'>
              <Text className='memory-text'>{memory.content}</Text>
              <Text className='memory-time'>{formatDate(memory.occurred_at)}</Text>
            </View>
            <View className='memory-arrow'>
              <Text>›</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}
```

### 样式代码 (MemoryReference.scss)

```scss
.memory-reference {
  background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
  border-left: 6rpx solid #F59E0B;
  border-radius: 16rpx;
  padding: 24rpx;
  margin: 24rpx 0;
  
  // 初始状态
  opacity: 0;
  transform: translateX(-30rpx);
  
  // 显示状态
  &.visible {
    animation: slideInLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  
  @keyframes slideInLeft {
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .memory-header {
    display: flex;
    align-items: center;
    margin-bottom: 16rpx;

    .memory-icon {
      font-size: 32rpx;
      margin-right: 8rpx;
      
      // 图标摇摆动画
      animation: wave 1s ease-in-out infinite;
      transform-origin: 70% 70%;
      
      @keyframes wave {
        0%, 100% {
          transform: rotate(0deg);
        }
        10%, 30% {
          transform: rotate(-10deg);
        }
        20%, 40% {
          transform: rotate(10deg);
        }
        50% {
          transform: rotate(0deg);
        }
      }
    }

    .memory-label {
      font-size: 26rpx;
      color: #92400E;
      font-weight: bold;
      
      // 标签脉冲
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
  }

  .memory-list {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
  }

  .memory-item {
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 12rpx;
    padding: 16rpx;
    
    // 初始状态
    opacity: 0;
    transform: translateY(20rpx);
    
    // 依次出现
    animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    
    @keyframes fadeInUp {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    // 悬停效果
    transition: all 0.3s ease;
    
    &:active {
      background: rgba(255, 255, 255, 0.9);
      transform: translateX(8rpx);
    }

    .memory-content {
      flex: 1;

      .memory-text {
        font-size: 26rpx;
        color: #78350F;
        line-height: 1.5;
        display: block;
        margin-bottom: 8rpx;
      }

      .memory-time {
        font-size: 22rpx;
        color: #92400E;
        opacity: 0.7;
        display: block;
      }
    }

    .memory-arrow {
      font-size: 40rpx;
      color: #F59E0B;
      opacity: 0.5;
      transition: all 0.3s ease;
    }
    
    &:active .memory-arrow {
      opacity: 1;
      transform: translateX(4rpx);
    }
  }
}
```

---

## 示例3：情绪标记完整实现

### 组件代码 (EmotionIndicator.tsx)

```tsx
import { View, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'
import './EmotionIndicator.scss'

interface EmotionIndicatorProps {
  emotion: {
    type: 'anxiety' | 'frustration' | 'excitement' | 'confusion'
    intensity: 'low' | 'medium' | 'high'
  }
}

const EMOTION_CONFIG = {
  anxiety: { label: '有点紧张', icon: '😰', color: '#F59E0B' },
  frustration: { label: '有点沮丧', icon: '😔', color: '#EF4444' },
  excitement: { label: '很兴奋', icon: '🎉', color: '#10B981' },
  confusion: { label: '有点困惑', icon: '🤔', color: '#6B7280' }
}

const INTENSITY_CONFIG = {
  low: { scale: 0.9, opacity: 0.7 },
  medium: { scale: 1, opacity: 0.85 },
  high: { scale: 1.1, opacity: 1 }
}

export function EmotionIndicator({ emotion }: EmotionIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false)
  const config = EMOTION_CONFIG[emotion.type]
  const intensity = INTENSITY_CONFIG[emotion.intensity]

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100)
  }, [])

  return (
    <View 
      className={`emotion-indicator ${isVisible ? 'visible' : ''}`}
      style={{ 
        borderColor: config.color,
        transform: `scale(${intensity.scale})`,
        opacity: intensity.opacity
      }}
    >
      <Text className='emotion-icon'>{config.icon}</Text>
      <Text className='emotion-label' style={{ color: config.color }}>
        {config.label}
      </Text>
    </View>
  )
}
```

### 样式代码 (EmotionIndicator.scss)

```scss
.emotion-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 20rpx;
  border: 2rpx solid;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.9);
  margin: 16rpx 0;
  position: relative;
  overflow: hidden;
  
  // 初始状态
  opacity: 0;
  transform: scale(0) rotate(-180deg);
  
  // 显示状态
  &.visible {
    animation: popIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
  }
  
  @keyframes popIn {
    to {
      opacity: 1;
      transform: scale(1) rotate(0deg);
    }
  }
  
  // 流光效果
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

  .emotion-icon {
    font-size: 32rpx;
    position: relative;
    z-index: 1;
    
    // 呼吸效果
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

  .emotion-label {
    font-size: 24rpx;
    font-weight: bold;
    position: relative;
    z-index: 1;
  }
}
```

---

## 示例4：导师消息打字效果

### 组件代码 (MentorMessage.tsx)

```tsx
import { View, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'
import './MentorMessage.scss'

interface MentorMessageProps {
  content: string
  enableTyping?: boolean
  typingSpeed?: number
}

export function MentorMessage({ 
  content, 
  enableTyping = true,
  typingSpeed = 30 
}: MentorMessageProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(enableTyping)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100)
  }, [])

  useEffect(() => {
    if (!enableTyping) {
      setDisplayedText(content)
      return
    }

    let index = 0
    setIsTyping(true)
    
    const timer = setInterval(() => {
      if (index < content.length) {
        setDisplayedText(content.slice(0, index + 1))
        index++
      } else {
        setIsTyping(false)
        clearInterval(timer)
      }
    }, typingSpeed)

    return () => clearInterval(timer)
  }, [content, enableTyping, typingSpeed])

  return (
    <View className={`mentor-message ${isVisible ? 'visible' : ''}`}>
      <View className='message-avatar'>
        <Text className='avatar-icon'>🐱</Text>
      </View>
      
      <View className='message-bubble'>
        <Text className='message-text'>{displayedText}</Text>
        {isTyping && (
          <View className='typing-cursor'>
            <Text>|</Text>
          </View>
        )}
      </View>
    </View>
  )
}
```

### 样式代码 (MentorMessage.scss)

```scss
.mentor-message {
  display: flex;
  gap: 16rpx;
  margin: 24rpx 0;
  
  // 初始状态
  opacity: 0;
  transform: translateY(20rpx) scale(0.95);
  
  // 显示状态
  &.visible {
    animation: messageIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  
  @keyframes messageIn {
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .message-avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    
    // 头像弹跳
    animation: avatarBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    animation-delay: 0.2s;
    
    @keyframes avatarBounce {
      0% {
        transform: scale(0);
      }
      50% {
        transform: scale(1.1);
      }
      100% {
        transform: scale(1);
      }
    }

    .avatar-icon {
      font-size: 40rpx;
    }
  }

  .message-bubble {
    flex: 1;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 24rpx;
    padding: 24rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
    position: relative;
    
    // 气泡尾巴
    &::before {
      content: '';
      position: absolute;
      left: -12rpx;
      top: 20rpx;
      width: 0;
      height: 0;
      border-style: solid;
      border-width: 0 12rpx 12rpx 0;
      border-color: transparent rgba(255, 255, 255, 0.95) transparent transparent;
    }

    .message-text {
      font-size: 28rpx;
      color: #1F2937;
      line-height: 1.6;
      display: block;
    }

    .typing-cursor {
      display: inline-block;
      animation: blink 1s infinite;
      
      @keyframes blink {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0;
        }
      }
      
      Text {
        font-size: 28rpx;
        color: #667eea;
        font-weight: bold;
      }
    }
  }
}
```

---

## 示例5：思考中动画

### 组件代码 (ThinkingIndicator.tsx)

```tsx
import { View, Text } from '@tarojs/components'
import './ThinkingIndicator.scss'

export function ThinkingIndicator() {
  return (
    <View className='thinking-indicator'>
      <View className='thinking-avatar'>
        <Text className='avatar-icon'>🐱</Text>
      </View>
      
      <View className='thinking-bubble'>
        <View className='thinking-dots'>
          <View className='dot' />
          <View className='dot' />
          <View className='dot' />
        </View>
        <Text className='thinking-text'>启程小猫正在思考...</Text>
      </View>
    </View>
  )
}
```

### 样式代码 (ThinkingIndicator.scss)

```scss
.thinking-indicator {
  display: flex;
  gap: 16rpx;
  margin: 24rpx 0;
  animation: fadeIn 0.3s ease;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .thinking-avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    
    // 头像呼吸
    animation: breathe 2s ease-in-out infinite;
    
    @keyframes breathe {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.05);
      }
    }

    .avatar-icon {
      font-size: 40rpx;
    }
  }

  .thinking-bubble {
    flex: 1;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 24rpx;
    padding: 24rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      left: -12rpx;
      top: 20rpx;
      width: 0;
      height: 0;
      border-style: solid;
      border-width: 0 12rpx 12rpx 0;
      border-color: transparent rgba(255, 255, 255, 0.95) transparent transparent;
    }

    .thinking-dots {
      display: flex;
      gap: 8rpx;
      margin-bottom: 12rpx;

      .dot {
        width: 12rpx;
        height: 12rpx;
        border-radius: 50%;
        background: #667eea;
        animation: dotBounce 1.4s infinite ease-in-out;

        &:nth-child(1) { animation-delay: 0s; }
        &:nth-child(2) { animation-delay: 0.2s; }
        &:nth-child(3) { animation-delay: 0.4s; }

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
    }

    .thinking-text {
      font-size: 24rpx;
      color: #6B7280;
      font-style: italic;
    }
  }
}
```

---

## 使用示例

### 在对话界面中集成

```tsx
// MentorChat.tsx
import { ToolCard } from './ToolCard'
import { MemoryReference } from './MemoryReference'
import { EmotionIndicator } from './EmotionIndicator'
import { MentorMessage } from './MentorMessage'
import { ThinkingIndicator } from './ThinkingIndicator'

export function MentorChat() {
  const [messages, setMessages] = useState([])
  const [isThinking, setIsThinking] = useState(false)

  return (
    <ScrollView className='chat-container'>
      {messages.map(message => (
        <View key={message.id}>
          {/* 情绪标记 */}
          {message.emotion_detected && (
            <EmotionIndicator emotion={message.emotion_detected} />
          )}
          
          {/* 记忆引用 */}
          {message.recalled_memories && message.recalled_memories.length > 0 && (
            <MemoryReference memories={message.recalled_memories} />
          )}
          
          {/* 导师消息 */}
          <MentorMessage 
            content={message.content}
            enableTyping={true}
            typingSpeed={30}
          />
          
          {/* 工具推荐 */}
          {message.tool_recommendation && (
            <ToolCard tool={message.tool_recommendation} />
          )}
        </View>
      ))}
      
      {/* 思考中 */}
      {isThinking && <ThinkingIndicator />}
    </ScrollView>
  )
}
```

---

**文档版本**: v1.0  
**创建日期**: 2026-05-10  
**用途**: 提供完整的动画实施代码示例
