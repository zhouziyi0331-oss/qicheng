# 页面改造记录 - P1-8: 故事墙页

**改造时间**: 2026-06-09  
**页面**: `pages/story/index.tsx`

---

## ✅ 改造完成

### 改造前 ❌

**视觉问题**:
- 页面背景：渐变背景（$gradient-bg）
- 卡片背景：白色（$card-white）
- 头部装饰圆：Morandi粉色（$accent-pink）、Morandi蓝色（$accent-blue）
- 发布按钮：渐变按钮（@include btn-gradient）
- 用户头像：Morandi绿、粉、蓝、黄色（$accent-green/pink/blue/yellow）
- OPC标签：Morandi渐变背景
- 点赞按钮：Morandi粉色半透明背景
- 评论提交按钮：紫粉渐变（#A855F7 → #EC4899）
- 空状态按钮：紫粉渐变（#A855F7 → #EC4899）
- 文字颜色：固定灰色（$text-primary/secondary/light）

**动画问题**:
- 故事卡片瞬间显示，无入场动画
- 头部装饰圆静态
- 点赞按钮无心跳动画
- 空状态图标静态

### 改造后 ✅

**视觉升级**:
- ✅ 页面背景：`var(--theme-bg)` 果汁色
- ✅ 卡片背景：`var(--theme-card)` 奶油白
- ✅ 卡片阴影：`var(--shadow-card)` 柔和阴影
- ✅ 头部装饰圆：草莓粉、蓝莓蓝（果汁色）+ 浮动动画
- ✅ 发布按钮：果汁色渐变 + 白色文字 + 柔和阴影
- ✅ 用户头像：4种果汁色渐变（主题色、芒果黄→葡萄柚橙、蓝莓蓝→主题色、草莓粉→西瓜红）
- ✅ OPC标签：果汁色半透明渐变 + 边框 + 主题色文字
- ✅ 点赞按钮：果汁色半透明背景 + 心跳动画（激活时）
- ✅ 评论提交按钮：果汁色渐变 + 白色文字 + 柔和阴影
- ✅ 空状态按钮：果汁色渐变 + 白色文字 + 柔和阴影
- ✅ 空状态图标：浮动动画
- ✅ 所有文字：主题变量颜色
- ✅ 所有圆角：主题变量

**动画升级**:
- ✅ 故事卡片：交错淡入滑入（每项延迟0.1s）
- ✅ 头部装饰圆：浮动动画（6s循环，交错延迟）
- ✅ 点赞按钮（激活）：心跳动画（1.5s循环）
- ✅ 空状态图标：上下浮动（3s循环）
- ✅ 卡片点击：缩小反馈
- ✅ 按钮点击：缩小反馈

---

## 🎯 改造对比

### 故事卡片入场动画

**改造前**: 瞬间显示所有故事卡片

**改造后**: 
```scss
.story-card {
  opacity: 0;
  transform: translateY(20rpx);
  animation: fadeInUp 0.5s var(--ease-decelerate) forwards;
  
  // 交错延迟：第1个0.1s，第2个0.2s...
  @for $i from 1 through 10 {
    &:nth-child(#{$i}) {
      animation-delay: #{$i * 0.1}s;
    }
  }
}
```

### 点赞心跳动画

**改造前**:
```scss
&.liked {
  background: linear-gradient(135deg, rgba(249, 198, 217, 0.3) 0%, rgba(249, 198, 217, 0.5) 100%);
}
```

**改造后**:
```scss
&.liked {
  background: linear-gradient(135deg, rgba(255, 107, 157, 0.2) 0%, rgba(255, 230, 109, 0.2) 100%);
  animation: heartbeat 1.5s ease-in-out infinite;
}

@keyframes heartbeat {
  0%, 100% {
    transform: scale(1);
  }
  14%, 28% {
    transform: scale(1.1);
  }
  21%, 35% {
    transform: scale(1);
  }
}
```

### 头部装饰圆动画

**改造前**: 静态圆形装饰

**改造后**:
```scss
.decoration-circle {
  animation: float-slow 6s ease-in-out infinite;
}

@keyframes float-slow {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-12rpx) scale(1.05);
  }
}

.decoration-2 {
  animation-delay: 1s;  // 交错延迟
}
```

### 色彩替换

| 元素 | 改造前 | 改造后 |
|------|--------|--------|
| 页面背景 | $gradient-bg | `var(--theme-bg)` 果汁色 |
| 卡片背景 | $card-white 白色 | `var(--theme-card)` 奶油白 |
| 卡片阴影 | $shadow-md | `var(--shadow-card)` |
| 头部装饰圆1 | $accent-pink Morandi粉 | `var(--strawberry-pink)` 草莓粉 |
| 头部装饰圆2 | $accent-blue Morandi蓝 | `var(--blueberry-blue)` 蓝莓蓝 |
| 标题 | $text-primary 深灰 | `var(--text-primary)` |
| 副标题 | $text-secondary 中灰 | `var(--text-secondary)` |
| 发布按钮 | @include btn-gradient | `var(--theme-primary)` → `var(--theme-accent)` 渐变 |
| 发布按钮文字 | $text-primary 深灰 | #FFFFFF 白色 |
| 用户头像1 | $accent-green Morandi绿 | `var(--theme-primary)` → `var(--theme-accent)` |
| 用户头像2 | $accent-pink Morandi粉 | `var(--mango-yellow)` → `var(--grapefruit-orange)` |
| 用户头像3 | $accent-blue Morandi蓝 | `var(--blueberry-blue)` → `var(--theme-primary)` |
| 用户头像4 | $accent-yellow Morandi黄 | `var(--strawberry-pink)` → `var(--watermelon-red)` |
| 头像文字 | $text-primary 深灰 | #FFFFFF 白色 |
| 用户名称 | $text-primary 深灰 | `var(--text-primary)` |
| OPC标签背景 | Morandi渐变半透明 | 草莓粉→芒果黄半透明渐变 + 边框 |
| OPC标签文字 | $gradient-primary 渐变文字 | `var(--theme-primary)` |
| 故事时间 | $text-light 浅灰 | `var(--text-tertiary)` |
| 故事内容 | $text-primary 深灰 | `var(--text-primary)` |
| 互动按钮背景 | rgba(0, 0, 0, 0.02) | rgba(0, 0, 0, 0.02)（保持） |
| 点赞按钮（激活） | Morandi粉半透明 | 草莓粉→芒果黄半透明 + 心跳动画 |
| 互动文字 | $text-secondary 中灰 | `var(--text-secondary)` |
| 点赞文字（激活） | $text-primary 深灰 | `var(--theme-primary)` |
| 评论输入框 | rgba(0, 0, 0, 0.02) | rgba(0, 0, 0, 0.02)（保持） |
| 评论输入文字 | - | `var(--text-primary)` |
| 评论取消按钮 | rgba(0, 0, 0, 0.05) + $text-secondary | rgba(0, 0, 0, 0.05) + `var(--text-secondary)` |
| 评论提交按钮 | #A855F7 → #EC4899 紫粉 | `var(--theme-primary)` → `var(--theme-accent)` |
| 空状态图标 | - | opacity 0.6 + 浮动动画 |
| 空状态文字 | #999 灰色 | `var(--text-tertiary)` |
| 空状态按钮 | #A855F7 → #EC4899 紫粉 | `var(--theme-primary)` → `var(--theme-accent)` |
| 底部提示 | $text-light 浅灰 | `var(--text-tertiary)` |

### 动画时长和缓动

| 动画 | 改造前 | 改造后 |
|------|--------|--------|
| 故事卡片入场 | - | fadeInUp 0.5s decelerate |
| 故事卡片交错 | - | 每项延迟0.1s |
| 故事卡片点击 | 0.3s ease | var(--duration-normal) standard |
| 头部装饰圆 | - | float-slow 6s ease-in-out infinite |
| 点赞按钮心跳 | - | heartbeat 1.5s ease-in-out infinite |
| 空状态浮动 | - | float 3s ease-in-out infinite |
| 按钮点击 | - | var(--duration-fast) standard + scale(0.95) |

---

## 🚀 使用的主题变量

### 色彩变量
- `var(--theme-bg)` - 主题背景
- `var(--theme-card)` - 卡片背景
- `var(--theme-primary)` - 主题色
- `var(--theme-accent)` - 强调色
- `var(--text-primary/secondary/tertiary)` - 文字颜色
- `var(--strawberry-pink)` - 草莓粉（装饰圆、头像）
- `var(--blueberry-blue)` - 蓝莓蓝（装饰圆、头像）
- `var(--mango-yellow)` - 芒果黄（头像）
- `var(--grapefruit-orange)` - 葡萄柚橙（头像）
- `var(--watermelon-red)` - 西瓜红（头像）

### 圆角变量
- `var(--radius-medium)` - 16px（评论输入、图片）
- `var(--radius-large)` - 24px（卡片、头部）
- `var(--radius-round)` - 9999px（按钮）

### 阴影变量
- `var(--shadow-card)` - 卡片阴影
- `var(--shadow-soft)` - 柔和阴影（按钮）

### 缓动变量
- `var(--ease-decelerate)` - 减速缓动
- `var(--ease-standard)` - 标准缓动

### 时长变量
- `var(--duration-fast)` - 0.15s
- `var(--duration-normal)` - 0.3s

---

## 📝 代码行数

- `index.tsx`: ~312行（无改动）
- `index.scss`: ~345行（改造约60处样式 + 4个新动画）

**总改动**: ~60处样式替换 + 4个新动画

---

## ✅ 改造检查清单

- [x] 页面背景：渐变背景 → 果汁色主题
- [x] 卡片背景：白色 → 奶油白 + 柔和阴影
- [x] 头部装饰圆：Morandi色 → 果汁色 + 浮动动画
- [x] 发布按钮：Morandi渐变 → 果汁色渐变 + 白色文字
- [x] 故事卡片：瞬间显示 → 交错淡入滑入
- [x] 用户头像：Morandi色 → 4种果汁色渐变 + 白色文字
- [x] OPC标签：Morandi渐变 → 果汁色半透明 + 边框
- [x] 点赞按钮：Morandi粉 → 果汁色 + 心跳动画（激活时）
- [x] 评论按钮：灰色 → 主题色文字
- [x] 评论提交：紫粉 → 果汁色渐变
- [x] 空状态：静态 → 浮动图标
- [x] 空状态按钮：紫粉 → 果汁色渐变
- [x] 所有文字：固定颜色 → 主题变量
- [x] 所有圆角：固定值 → 主题变量

---

## 🎉 改造效果

**从"Morandi故事列表"到"果汁色成长社区"**

用户体验提升：
- ❌ 之前：Morandi背景+故事瞬间显示+静态点赞（平淡）
- ✅ 现在：果汁色背景+故事交错滑入+心跳点赞（生动）

**核心亮点**:
1. **有节奏的故事展示**：故事卡片交错滑入，每项延迟0.1s，像翻书一样
2. **有生命的点赞**：点赞后心跳动画（1.5s循环），表达情感共鸣
3. **有呼吸的装饰**：头部装饰圆浮动动画，营造温暖氛围
4. **有个性的头像**：4种果汁色渐变头像，每个人都独特
5. **有温度的社区**：果汁色主题 + 柔和阴影，从工具到伙伴
6. **有呼吸的空状态**：空状态图标浮动，鼓励发布第一个故事

**故事展示时序**:
- 0.1s: 第1个故事从下滑入
- 0.2s: 第2个故事从下滑入
- 0.3s: 第3个故事从下滑入
- ...（每项延迟0.1s）

**点赞心跳节奏**:
- 0.0s: scale(1)
- 0.21s: scale(1.1) - 第1次心跳
- 0.315s: scale(1)
- 0.42s: scale(1.1) - 第2次心跳
- 0.525s: scale(1)
- 1.5s: 循环

**下一个**: P1-9 首页/Tabs页面 🚀
