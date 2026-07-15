# 页面改造记录 - P1-9: 首页/Tabs页面

**改造时间**: 2026-06-09  
**页面**: `pages/index/index.tsx` + `custom-tab-bar/index.tsx`

---

## ✅ 改造完成

### 改造前 ❌

**首页视觉问题**:
- 页面背景：Morandi粉色渐变（#F5E6F0 → #FEFEFE）
- 用户头像：Morandi粉红渐变（#F9C6D9 → #EC4899）
- 等级文字：紫色（#8B5CF6）
- 通知图标：白色背景
- Hero装饰圆：Morandi绿黄粉蓝（#D4F291, #F9C6D9, #A8D8EA）
- 登录按钮：紫色渐变（#8B5CF6 → #A78BFA）
- 等级卡片：紫色渐变（#8B5CF6 → #A78BFA）
- OPC卡片：浅粉色（#FFF5F8）+ 粉色边框（#FF6B9D）
- 功能卡片：Morandi绿紫黄粉渐变

**TabBar视觉问题**:
- TabBar背景：Morandi粉色（#F5E6F0）
- 中央按钮：浅紫色（#E8D5E3）
- 图标颜色：深灰（#2D3436）
- 锁定图标：灰色（#999999）

**动画问题**:
- 用户头像静态
- Hero装饰圆简单浮动
- 中央Logo静态
- 功能卡片瞬间显示
- TabBar图标切换无动画
- 中央按钮静态
- 进度条简单过渡

### 改造后 ✅

**首页视觉升级**:
- ✅ 页面背景：`var(--theme-bg)` 果汁色
- ✅ 用户头像：果汁色渐变 + 白色文字 + 呼吸动画
- ✅ 等级文字：`var(--theme-primary)` 主题色
- ✅ 通知图标：`var(--theme-card)` + 柔和阴影
- ✅ Hero装饰圆：芒果黄、草莓粉、蓝莓蓝 + 浮动动画
- ✅ 中央Logo：呼吸动画（4s循环）
- ✅ 登录按钮：果汁色渐变 + 白色文字
- ✅ 等级卡片：果汁色渐变
- ✅ 等级进度条：从0绘制动画（1s）
- ✅ OPC卡片：果汁色半透明 + 草莓粉边框 + 边框脉冲动画
- ✅ OPC徽章：草莓粉→西瓜红渐变 + 心跳动画
- ✅ 功能卡片：果汁色半透明渐变 + 交错滑入
- ✅ 所有文字：主题变量颜色

**TabBar视觉升级**:
- ✅ TabBar背景：`var(--theme-card)` 奶油白 + 加深阴影
- ✅ 中央按钮：果汁色渐变 + 浮动动画
- ✅ 中央Logo：呼吸动画（3s循环）
- ✅ 图标颜色：主题色（激活）+ 中灰（未激活）
- ✅ 锁定图标：`var(--text-tertiary)`
- ✅ Tab切换：弹入动画（elastic缓动）

**动画升级**:
- ✅ 用户头像：呼吸动画（3s循环）
- ✅ Hero装饰圆：浮动动画（3-4s循环，交错延迟）
- ✅ 中央Logo：呼吸动画（4s循环）
- ✅ 等级进度条：从0绘制动画（1s）
- ✅ OPC卡片边框：脉冲动画（2s循环）
- ✅ OPC徽章：心跳动画（2s循环）
- ✅ 功能卡片：交错滑入（每项延迟0.1s）
- ✅ TabBar激活图标：弹入动画（elastic缓动）
- ✅ TabBar中央按钮：浮动动画（3s循环）
- ✅ TabBar中央Logo：呼吸动画（3s循环）
- ✅ 按钮点击：缩小反馈

---

## 🎯 改造对比

### 功能卡片入场动画

**改造前**: 瞬间显示所有功能卡片

**改造后**: 
```scss
.feature-card {
  opacity: 0;
  transform: translateY(20rpx);
  animation: fadeInUp 0.5s var(--ease-decelerate) forwards;
  
  @for $i from 1 through 4 {
    &:nth-child(#{$i}) {
      animation-delay: #{$i * 0.1}s;
    }
  }
}
```

### TabBar切换动画

**改造前**: 简单颜色变化

**改造后**:
```scss
&.active {
  .tab-icon-text {
    animation: bounce-in 0.4s var(--ease-elastic);
  }
}

@keyframes bounce-in {
  0% {
    transform: scale(0.8);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}
```

### OPC卡片动画

**改造前**: 静态边框

**改造后**:
```scss
.opc-test-card {
  animation: pulse-border 2s ease-in-out infinite;
}

@keyframes pulse-border {
  0%, 100% {
    border-color: var(--strawberry-pink);
  }
  50% {
    border-color: var(--theme-primary);
  }
}

.test-card-badge {
  animation: heartbeat 2s ease-in-out infinite;
}
```

### 色彩替换 - 首页

| 元素 | 改造前 | 改造后 |
|------|--------|--------|
| 页面背景 | #F5E6F0 → #FEFEFE Morandi粉渐变 | `var(--theme-bg)` 果汁色 |
| 用户头像 | #F9C6D9 → #EC4899 Morandi粉红 | `var(--theme-primary)` → `var(--theme-accent)` |
| 头像文字 | #2D3436 深灰 | #FFFFFF 白色 |
| 等级文字 | #8B5CF6 紫色 | `var(--theme-primary)` |
| 等级名称 | #666666 灰色 | `var(--text-secondary)` |
| 通知图标背景 | #FFFFFF 白色 | `var(--theme-card)` |
| Hero装饰圆1 | #D4F291 Morandi绿 | `var(--mango-yellow)` 芒果黄 |
| Hero装饰圆2 | #F9C6D9 Morandi粉 | `var(--strawberry-pink)` 草莓粉 |
| Hero装饰圆3 | #A8D8EA Morandi蓝 | `var(--blueberry-blue)` 蓝莓蓝 |
| Hero标题 | #2D3436 深灰 | `var(--text-primary)` |
| 登录按钮 | #8B5CF6 → #A78BFA 紫色 | `var(--theme-primary)` → `var(--theme-accent)` |
| 等级卡片 | #8B5CF6 → #A78BFA 紫色 | `var(--theme-primary)` → `var(--theme-accent)` |
| OPC卡片背景 | #FFF5F8 → #FFFFFF Morandi粉 | rgba(255, 107, 157, 0.1) → card |
| OPC卡片边框 | #FF6B9D 粉色 | `var(--strawberry-pink)` |
| OPC卡片标题 | #1A1A1A 黑色 | `var(--text-primary)` |
| OPC卡片描述 | #666666 灰色 | `var(--text-secondary)` |
| OPC徽章 | #FF6B9D → #FF8FB3 粉色 | `var(--strawberry-pink)` → `var(--watermelon-red)` |
| OPC按钮 | #FF6B9D → #FF8FB3 粉色 | `var(--strawberry-pink)` → `var(--watermelon-red)` |
| 功能卡片绿色 | #D4F291 → #B8E986 Morandi绿 | 芒果黄半透明 |
| 功能卡片紫色 | #E8D5FF → #D4B5FF Morandi紫 | 草莓粉→芒果黄半透明 |
| 功能卡片黄色 | #FFF9C4 → #FFE082 Morandi黄 | 芒果黄半透明 |
| 功能卡片粉色 | #FFE8F0 → #FFD1E3 Morandi粉 | 草莓粉半透明 |

### 色彩替换 - TabBar

| 元素 | 改造前 | 改造后 |
|------|--------|--------|
| TabBar背景 | #F5E6F0 Morandi粉 | `var(--theme-card)` 奶油白 |
| 图标（未激活） | #2D3436 深灰 | `var(--text-secondary)` |
| 图标（激活） | #2D3436 深灰 | `var(--theme-primary)` |
| 文字（未激活） | #2D3436 深灰 | `var(--text-secondary)` |
| 文字（激活） | #2D3436 深灰 | `var(--theme-primary)` |
| 锁定图标 | #999999 灰色 | `var(--text-tertiary)` |
| 中央按钮 | #E8D5E3 浅紫 | `var(--theme-primary)` → `var(--theme-accent)` |
| 中央文字 | #2D3436 深灰 | `var(--text-primary)` |

### 动画时长和缓动

| 动画 | 改造前 | 改造后 |
|------|--------|--------|
| 用户头像呼吸 | - | breathe 3s ease-in-out infinite |
| Hero装饰圆浮动 | float 3s/4s/3.5s | float 3s/4s/3.5s (保持) |
| 中央Logo呼吸 | - | breathe 4s ease-in-out infinite |
| 等级进度条 | 0.3s ease | fillBar 1s decelerate |
| OPC边框脉冲 | - | pulse-border 2s ease-in-out infinite |
| OPC徽章心跳 | - | heartbeat 2s ease-in-out infinite |
| 功能卡片入场 | - | fadeInUp 0.5s decelerate |
| 功能卡片交错 | - | 每项延迟0.1s |
| TabBar图标切换 | - | bounce-in 0.4s elastic |
| TabBar中央浮动 | - | float 3s ease-in-out infinite |
| TabBar Logo呼吸 | - | breathe 3s ease-in-out infinite |
| 按钮点击 | - | scale(0.95) var(--duration-fast) |

---

## 🚀 使用的主题变量

### 色彩变量
- `var(--theme-bg)` - 主题背景
- `var(--theme-card)` - 卡片背景
- `var(--theme-primary)` - 主题色
- `var(--theme-accent)` - 强调色
- `var(--text-primary/secondary/tertiary)` - 文字颜色
- `var(--strawberry-pink)` - 草莓粉（OPC、装饰）
- `var(--watermelon-red)` - 西瓜红（OPC徽章）
- `var(--mango-yellow)` - 芒果黄（装饰圆）
- `var(--blueberry-blue)` - 蓝莓蓝（装饰圆）

### 圆角变量
- `var(--radius-large)` - 24px（卡片）
- `var(--radius-round)` - 9999px（按钮）

### 阴影变量
- `var(--shadow-card)` - 卡片阴影
- `var(--shadow-soft)` - 柔和阴影（按钮）
- `var(--shadow-hover)` - 悬停阴影（TabBar）

### 缓动变量
- `var(--ease-decelerate)` - 减速缓动
- `var(--ease-standard)` - 标准缓动
- `var(--ease-elastic)` - 弹性缓动

### 时长变量
- `var(--duration-fast)` - 0.15s
- `var(--duration-normal)` - 0.3s

---

## 📝 代码行数

- `index/index.tsx`: ~312行（无改动）
- `index/index.scss`: ~477行（改造约80处样式 + 5个新动画）
- `custom-tab-bar/index.tsx`: ~120行（无改动）
- `custom-tab-bar/index.scss`: ~158行（改造约20处样式 + 3个新动画）

**总改动**: ~100处样式替换 + 8个新动画

---

## ✅ 改造检查清单

### 首页
- [x] 页面背景：Morandi粉渐变 → 果汁色主题
- [x] 用户头像：Morandi粉 → 果汁色渐变 + 呼吸动画
- [x] 等级文字：紫色 → 主题色
- [x] 通知图标：白色 → 奶油白 + 柔和阴影
- [x] Hero装饰圆：Morandi色 → 果汁色 + 浮动动画
- [x] 中央Logo：静态 → 呼吸动画
- [x] 登录按钮：紫色 → 果汁色渐变
- [x] 等级卡片：紫色 → 果汁色渐变
- [x] 等级进度条：简单过渡 → 从0绘制动画
- [x] OPC卡片：Morandi粉 → 果汁色半透明
- [x] OPC边框：静态 → 脉冲动画
- [x] OPC徽章：静态 → 心跳动画
- [x] 功能卡片：Morandi色 → 果汁色半透明
- [x] 功能卡片：瞬间显示 → 交错滑入
- [x] 所有文字：固定颜色 → 主题变量

### TabBar
- [x] TabBar背景：Morandi粉 → 奶油白
- [x] 图标颜色：深灰 → 主题色（激活）
- [x] 图标切换：简单变化 → 弹入动画
- [x] 中央按钮：浅紫 → 果汁色渐变 + 浮动动画
- [x] 中央Logo：静态 → 呼吸动画
- [x] 所有文字：固定颜色 → 主题变量

---

## 🎉 改造效果

**从"Morandi静态首页"到"果汁色动感主页"**

用户体验提升：
- ❌ 之前：Morandi背景+静态元素+简单卡片（平淡）
- ✅ 现在：果汁色背景+呼吸动画+交错滑入（生动）

**核心亮点**:
1. **有生命的头像**：用户头像持续呼吸动画，感觉在线
2. **有节奏的卡片**：功能卡片交错滑入，每项延迟0.1s
3. **有呼吸的Hero**：中央Logo呼吸动画，装饰圆浮动，营造温暖氛围
4. **有过程的进度**：等级进度条从0绘制，展示成长轨迹
5. **有脉搏的OPC**：边框脉冲 + 徽章心跳，吸引注意力
6. **有弹性的Tab**：TabBar图标弹入，中央按钮浮动，交互丰富
7. **有温度的主页**：从工具感到伙伴感的完整升级

**TabBar动画组合**:
- 中央按钮：浮动动画（3s循环）
- 中央Logo：呼吸动画（3s循环）
- 激活图标：弹入动画（elastic缓动）
- 点击反馈：缩小scale(0.9)

**下一个**: P1-10 邀请/分享页面 🚀
