# 页面改造记录 - P0-6: 任务详情页

**改造时间**: 2026-06-09  
**页面**: `pages/tasks/detail.tsx`

---

## ✅ 改造完成

### 改造前 ❌

**视觉问题**:
- 页面背景：莫兰迪粉色（#F5E6F0）
- 卡片背景：纯白（white）
- 标签背景：莫兰迪粉色（#F5E6F0）
- 发布者头像：浅蓝色（#A8D8EA）
- 接取按钮：莫兰迪绿蓝渐变（#D4F291 → #A8D8EA）
- 导师悬浮按钮：黄色渐变（#FFE082 → #FFD54F）
- 文字颜色：深灰（#2D3436, #636E72, #B2BEC3）

**动画问题**:
- 页面内容瞬间显示，无入场动画
- 按钮静态，无脉冲或心跳效果
- 导师按钮静态，无浮动效果
- 价格数字静态

### 改造后 ✅

**视觉升级**:
- ✅ 页面背景：`var(--theme-bg)` 果汁色
- ✅ 卡片背景：`var(--theme-card)` 奶油白
- ✅ 卡片阴影：`var(--shadow-card)` 柔和阴影
- ✅ 标签背景：果汁色半透明渐变 + 边框
- ✅ 发布者头像：果汁色渐变
- ✅ 接取按钮：果汁色渐变 + 胶囊型 + 心跳动画
- ✅ 导师悬浮按钮：芒果黄→西瓜红渐变 + 浮动动画
- ✅ 导师Logo：呼吸动画
- ✅ 价格数字：西瓜红 + 脉冲动画
- ✅ 所有文字：主题变量颜色
- ✅ 需求列表：添加彩色圆点装饰

**动画升级**:
- ✅ 页面头部：从上滑入（0.5s）
- ✅ 任务内容：从下滑入（0.6s，延迟0.2s）
- ✅ 底部操作栏：从下滑入（0.5s，延迟0.4s）
- ✅ Meta信息：交错淡入（每项延迟0.1s）
- ✅ 接取按钮：心跳动画（2s循环）
- ✅ 价格数字：脉冲动画（2s循环）
- ✅ 导师按钮：浮动弹跳（3s循环）
- ✅ 导师Logo：呼吸缩放（2s循环）
- ✅ 标签hover：缩放1.05 + 阴影

---

## 🎯 改造对比

### 页面入场动画

**改造前**: 内容瞬间显示

**改造后**: 3层入场动画
```scss
// 头部：从上滑入
.task-header {
  animation: slideInDown 0.5s var(--ease-decelerate);
}

// 内容：从下滑入，延迟0.2s
.task-content {
  animation: slideInUp 0.6s var(--ease-decelerate) 0.2s both;
}

// 底部：从下滑入，延迟0.4s
.task-footer {
  animation: slideInUp 0.5s var(--ease-decelerate) 0.4s both;
}

// Meta信息：交错淡入
.meta-item {
  @for $i from 1 through 5 {
    &:nth-child(#{$i}) {
      animation-delay: #{0.2 + $i * 0.1}s;
    }
  }
}
```

### 导师悬浮按钮动画

**改造前**: 静态按钮

**改造后**: 
```scss
// 按钮浮动弹跳（3s循环）
.mentor-float-btn {
  animation: float-bounce 3s ease-in-out infinite;
}

@keyframes float-bounce {
  0%, 100% {
    transform: translateY(0);
    box-shadow: var(--shadow-hover);
  }
  50% {
    transform: translateY(-12rpx);
    box-shadow: 0 12rpx 32rpx rgba(255, 107, 107, 0.5);
  }
}

// Logo呼吸缩放（2s循环）
.mentor-logo {
  animation: breathe 2s ease-in-out infinite;
}
```

### 色彩替换

| 元素 | 改造前 | 改造后 |
|------|--------|--------|
| 页面背景 | #F5E6F0 莫兰迪粉 | `var(--theme-bg)` 果汁色 |
| 卡片背景 | white 纯白 | `var(--theme-card)` 奶油白 |
| 卡片阴影 | - | `var(--shadow-card)` |
| 标题文字 | #2D3436 深灰 | `var(--text-primary)` |
| 描述文字 | #636E72 中灰 | `var(--text-secondary)` |
| 标签文字 | #B2BEC3 浅灰 | `var(--text-tertiary)` |
| 标签背景 | #F5E6F0 莫兰迪粉 | rgba(255, 107, 157, 0.1) → rgba(255, 230, 109, 0.1) 半透明渐变 |
| 标签边框 | - | `var(--theme-primary)` |
| 需求列表圆点 | - | `var(--theme-primary)` |
| 发布者头像 | #A8D8EA 浅蓝 | `var(--theme-primary)` → `var(--theme-accent)` 果汁色渐变 |
| 头像文字 | #2D3436 深灰 | #FFFFFF 白色 |
| 价格数字 | #2D3436 深灰 | `var(--watermelon-red)` 西瓜红 |
| 接取按钮 | #D4F291 → #A8D8EA 莫兰迪绿蓝 | `var(--theme-primary)` → `var(--theme-accent)` 果汁色 |
| 按钮文字 | #2D3436 深灰 | #FFFFFF 白色 |
| 按钮阴影 | - | `var(--shadow-soft)` |
| 导师按钮 | #FFE082 → #FFD54F 黄色 | `var(--mango-yellow)` → `var(--watermelon-red)` |
| 导师文字 | #2D3436 深灰 | #FFFFFF 白色 |
| 导师按钮阴影 | rgba(255, 224, 130, 0.4) | `var(--shadow-hover)` + 动态阴影 |

### 动画时长和缓动

| 动画 | 改造前 | 改造后 |
|------|--------|--------|
| 页面头部入场 | - | slideInDown 0.5s decelerate |
| 页面内容入场 | - | slideInUp 0.6s decelerate (延迟0.2s) |
| 底部操作栏入场 | - | slideInUp 0.5s decelerate (延迟0.4s) |
| Meta信息交错 | - | fadeIn 0.5s decelerate (每项+0.1s) |
| 接取按钮心跳 | - | heartbeat 2s ease-in-out infinite |
| 价格脉冲 | - | pulse-number 2s ease-in-out infinite |
| 导师按钮浮动 | - | float-bounce 3s ease-in-out infinite |
| 导师Logo呼吸 | - | breathe 2s ease-in-out infinite |
| 标签hover | - | scale(1.05) var(--duration-fast) standard |
| 按钮点击 | - | scale(0.95) var(--duration-fast) standard |

---

## 🚀 使用的主题变量

### 色彩变量
- `var(--theme-bg)` - 主题背景
- `var(--theme-card)` - 卡片背景
- `var(--theme-primary)` - 主题色
- `var(--theme-accent)` - 强调色
- `var(--text-primary/secondary/tertiary)` - 文字颜色
- `var(--watermelon-red)` - 西瓜红（价格）
- `var(--mango-yellow)` - 芒果黄（导师按钮）

### 圆角变量
- `var(--radius-round)` - 9999px（按钮）

### 阴影变量
- `var(--shadow-card)` - 卡片阴影
- `var(--shadow-soft)` - 柔和阴影（按钮）
- `var(--shadow-hover)` - 悬停阴影（导师按钮）

### 缓动变量
- `var(--ease-decelerate)` - 减速缓动
- `var(--ease-standard)` - 标准缓动

### 时长变量
- `var(--duration-fast)` - 0.15s

---

## 📝 代码行数

- `detail.tsx`: ~500行（无改动）
- `detail.scss`: ~200行 → ~320行 (+120行)

**总改动**: ~50处样式替换 + 7个新动画

---

## ✅ 改造检查清单

- [x] 页面背景：莫兰迪粉 → 果汁色主题
- [x] 卡片背景：纯白 → 奶油白
- [x] 卡片阴影：无 → 柔和阴影
- [x] 页面头部：瞬间显示 → 从上滑入
- [x] 页面内容：瞬间显示 → 从下滑入（延迟）
- [x] Meta信息：瞬间显示 → 交错淡入
- [x] 标签：莫兰迪粉 → 果汁色半透明 + hover缩放
- [x] 需求列表：纯文字 → 添加彩色圆点
- [x] 发布者头像：浅蓝 → 果汁色渐变
- [x] 价格：深灰静态 → 西瓜红脉冲
- [x] 接取按钮：莫兰迪渐变 → 果汁色 + 心跳
- [x] 导师按钮：黄色静态 → 芒果黄→西瓜红 + 浮动
- [x] 导师Logo：静态 → 呼吸动画
- [x] 所有文字：固定颜色 → 主题变量

---

## 🎉 改造效果

**从"莫兰迪静态详情"到"果汁色动感展示"**

用户体验提升：
- ❌ 之前：莫兰迪粉背景+内容瞬间显示+静态按钮（平淡）
- ✅ 现在：果汁色背景+3层入场动画+心跳按钮+浮动导师（生动）

**核心亮点**:
1. **有层次的入场**：头部→内容→底部，3层入场动画，有仪式感
2. **有节奏的Meta**：Meta信息交错淡入，每项延迟0.1s
3. **有呼吸的价格**：价格数字脉冲动画，吸引注意力
4. **有心跳的按钮**：接取按钮心跳动画，鼓励接取
5. **有生命的导师**：导师按钮浮动弹跳，Logo呼吸，感觉导师在召唤
6. **有装饰的列表**：需求列表添加彩色圆点，视觉更丰富

**3层入场时序**:
- 0.0s: 头部从上滑入
- 0.2s: 内容从下滑入
- 0.2-0.7s: Meta信息交错淡入
- 0.4s: 底部操作栏从下滑入

**导师召唤动画**:
- 按钮上下浮动（3s循环）
- 阴影同步变化（增强立体感）
- Logo呼吸缩放（2s循环）
- 点击缩小反馈

**完成P0全部6个核心页面！** 🎉

**下一步**: 总结P0改造成果，生成完整清单
