# 启程 OPC - 前端设计系统规范

> 基于原版设计，适配青少年审美的莫兰迪色系小程序

---

## 🎨 设计理念

### 核心原则
- **温柔友好**：莫兰迪色系，降低视觉压力
- **极简清晰**：去除复杂装饰，专注内容
- **情感连接**：卡通小猫吉祥物贯穿始终
- **成长感**：通过视觉反馈强化成就体验

### 目标用户
14-22岁青少年，追求温柔、治愈、简约的视觉风格

---

## 🌈 色彩系统

### 主色调 - 莫兰迪粉
```scss
// 背景渐变基础色
$bg-pink-light: #F5E6E8;      // 淡粉色（主背景）
$bg-green-light: #E8F3E8;     // 淡绿色（渐变点缀）
$bg-blue-light: #E6F1F5;      // 淡蓝色（渐变点缀）
$bg-yellow-light: #FFF8E1;    // 淡黄色（渐变点缀）

// 主要功能色
$primary-pink: #F4B6C2;        // 主要按钮、强调
$primary-purple: #C5A3D9;      // 次要强调
$primary-green: #B8D4B8;       // 成功、完成
$primary-yellow: #F5D291;      // 警告、待处理
$primary-blue: #A3C7D9;        // 信息、提示
```

### 功能色
```scss
// 状态色（降低饱和度的莫兰迪版本）
$success: #B8D4B8;             // 成功 - 淡绿
$warning: #F5D291;             // 警告 - 淡黄
$error: #E6A5A5;               // 错误 - 淡红
$info: #A3C7D9;                // 信息 - 淡蓝

// 文字色
$text-primary: #4A4A4A;        // 主要文字 - 深灰
$text-secondary: #8C8C8C;      // 次要文字 - 中灰
$text-tertiary: #C0C0C0;       // 辅助文字 - 浅灰
$text-white: #FFFFFF;          // 白色文字
```

### 渐变方案
```scss
// 页面背景渐变（多色柔和过渡）
$gradient-page: linear-gradient(
  135deg,
  $bg-pink-light 0%,
  mix($bg-pink-light, $bg-green-light, 70%) 25%,
  mix($bg-pink-light, $bg-blue-light, 60%) 50%,
  mix($bg-pink-light, $bg-yellow-light, 70%) 75%,
  $bg-pink-light 100%
);

// 卡片渐变（淡粉底）
$gradient-card-pink: linear-gradient(135deg, #FFF5F7 0%, #FFE8ED 100%);
$gradient-card-green: linear-gradient(135deg, #F5FFF5 0%, #E8F5E8 100%);
$gradient-card-blue: linear-gradient(135deg, #F5F9FF 0%, #E8F1FF 100%);
$gradient-card-yellow: linear-gradient(135deg, #FFFBF0 0%, #FFF5E1 100%);
```

---

## 🔤 字体系统

### 字体族
```scss
$font-family-base: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif;
```

### 字号规范
```scss
// 标题
$font-size-h1: 48px;    // 页面主标题
$font-size-h2: 40px;    // 区块标题
$font-size-h3: 36px;    // 卡片标题
$font-size-h4: 32px;    // 小标题

// 正文
$font-size-lg: 30px;    // 大号正文
$font-size-base: 28px;  // 标准正文
$font-size-sm: 26px;    // 小号正文
$font-size-xs: 24px;    // 辅助信息

// 数字/强调
$font-size-number-xl: 96px;   // 超大数字（置信度百分比）
$font-size-number-lg: 64px;   // 大数字（收入金额）
$font-size-number-md: 48px;   // 中等数字（统计数据）
```

### 字重
```scss
$font-weight-light: 300;
$font-weight-regular: 400;
$font-weight-medium: 500;
$font-weight-semibold: 600;
$font-weight-bold: 700;
```

---

## 📐 间距系统

### 基础间距单位
```scss
$spacing-unit: 8px;

$spacing-xxs: 8px;      // 0.5单位
$spacing-xs: 16px;      // 1单位
$spacing-sm: 24px;      // 1.5单位
$spacing-md: 32px;      // 2单位
$spacing-lg: 40px;      // 2.5单位
$spacing-xl: 48px;      // 3单位
$spacing-xxl: 64px;     // 4单位
$spacing-xxxl: 80px;    // 5单位
```

### 应用规则
- **页面边距**：`$spacing-lg (40px)`
- **卡片间距**：`$spacing-lg (40px)`
- **卡片内边距**：`$spacing-xl (48px)`
- **元素间距**：`$spacing-md (32px)`
- **文字行间距**：`line-height: 1.6`

---

## 🎯 圆角系统

```scss
$radius-xs: 8px;     // 小元素（标签、徽章）
$radius-sm: 12px;    // 按钮
$radius-md: 16px;    // 卡片
$radius-lg: 24px;    // 大卡片、模态框
$radius-xl: 32px;    // 特殊容器
$radius-full: 50%;   // 圆形图标
```

---

## 🌟 图标系统

### 设计原则
- **非emoji**：使用几何图形图标，不使用emoji表情
- **淡粉底色**：所有图标背景为淡粉色圆形 `background: #FFE8ED`
- **极简风格**：线条粗细一致（2-3px），去除细节
- **尺寸统一**：图标容器固定尺寸，内部图形按比例缩放

### 图标尺寸
```scss
// 图标容器尺寸
$icon-size-xs: 48px;    // 小图标（列表项）
$icon-size-sm: 64px;    // 标准图标（卡片）
$icon-size-md: 80px;    // 中等图标（功能入口）
$icon-size-lg: 120px;   // 大图标（主页展示）
$icon-size-xl: 160px;   // 超大图标（欢迎页）

// 图标内部图形尺寸（容器的60%）
$icon-graphic-ratio: 0.6;
```

### 图标样式
```scss
.icon-container {
  width: $icon-size-md;
  height: $icon-size-md;
  background: linear-gradient(135deg, #FFE8ED 0%, #FFDDE5 100%);
  border-radius: $radius-full;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .icon-graphic {
    width: calc($icon-size-md * 0.6);
    height: calc($icon-size-md * 0.6);
    // SVG或几何图形
  }
}
```

### 功能图标映射
```scss
// 五大导航图标
首页 → 房子图形（简笔画）
任务 → 方形文件图形
导师 → 小猫图形（放大版）
故事墙 → 对话框图形
我的 → 圆形人像图形

// 功能图标
完成任务 → ✓ 对勾
收入 → ¥ 人民币符号
等级 → ★ 星星
测评 → ◆ 菱形
能力 → ⬟ 六边形
```

---

## 🎨 卡片系统

### 卡片类型

#### 1. 数据卡片（Data Card）
用于展示数字统计
```scss
.data-card {
  background: #FFFFFF;
  border-radius: $radius-lg;
  padding: $spacing-xl;
  box-shadow: 0 4px 16px rgba(244, 182, 194, 0.1);
  text-align: center;
  
  .icon {
    width: $icon-size-sm;
    height: $icon-size-sm;
    margin: 0 auto $spacing-md;
  }
  
  .value {
    font-size: $font-size-number-md;
    font-weight: $font-weight-bold;
    color: $primary-pink;
    line-height: 1;
    margin-bottom: $spacing-xs;
  }
  
  .label {
    font-size: $font-size-sm;
    color: $text-secondary;
  }
}
```

#### 2. 任务卡片（Task Card）
用于任务列表展示
```scss
.task-card {
  background: #FFFFFF;
  border-radius: $radius-md;
  padding: $spacing-lg;
  margin-bottom: $spacing-md;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  
  .task-header {
    display: flex;
    align-items: center;
    margin-bottom: $spacing-md;
    
    .tag {
      padding: 4px 12px;
      background: $primary-yellow;
      border-radius: $radius-xs;
      font-size: $font-size-xs;
      margin-right: $spacing-xs;
    }
  }
  
  .task-title {
    font-size: $font-size-lg;
    font-weight: $font-weight-medium;
    color: $text-primary;
    margin-bottom: $spacing-sm;
  }
  
  .task-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: $text-secondary;
    font-size: $font-size-sm;
  }
}
```

#### 3. 渐变卡片（Gradient Card）
用于特殊功能入口
```scss
.gradient-card {
  background: $gradient-card-pink;
  border-radius: $radius-lg;
  padding: $spacing-xl;
  box-shadow: 0 4px 16px rgba(244, 182, 194, 0.15);
  
  &.green { background: $gradient-card-green; }
  &.blue { background: $gradient-card-blue; }
  &.yellow { background: $gradient-card-yellow; }
}
```

---

## 🔘 按钮系统

### 按钮类型

#### 主要按钮（Primary Button）
```scss
.btn-primary {
  width: 100%;
  height: 88px;
  background: $primary-pink;
  color: $text-white;
  border: none;
  border-radius: $radius-sm;
  font-size: $font-size-h4;
  font-weight: $font-weight-medium;
  box-shadow: 0 4px 12px rgba(244, 182, 194, 0.3);
  
  &:active {
    opacity: 0.8;
    transform: scale(0.98);
  }
}
```

#### 次要按钮（Secondary Button）
```scss
.btn-secondary {
  width: 100%;
  height: 88px;
  background: #FFFFFF;
  color: $primary-pink;
  border: 2px solid $primary-pink;
  border-radius: $radius-sm;
  font-size: $font-size-h4;
  font-weight: $font-weight-medium;
}
```

#### 文字按钮（Text Button）
```scss
.btn-text {
  background: transparent;
  color: $text-secondary;
  border: none;
  font-size: $font-size-base;
  padding: $spacing-md;
}
```

---

## 🧭 导航栏系统

### 底部导航栏（TabBar）

#### 布局规范
- **位置**：固定在页面底部
- **高度**：120px
- **背景**：半透明白色 `rgba(255, 255, 255, 0.95)` + 毛玻璃效果
- **阴影**：`0 -2px 12px rgba(0, 0, 0, 0.05)`

#### 导航项规范
```scss
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 120px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 $spacing-md;
  
  .tab-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    
    &.center {
      // 中间的小猫图标
      .tab-icon {
        width: 96px;
        height: 96px;
        margin-top: -40px; // 向上突出
      }
    }
    
    .tab-icon {
      width: 64px;
      height: 64px;
      margin-bottom: 8px;
    }
    
    .tab-label {
      font-size: $font-size-xs;
      color: $text-secondary;
    }
    
    &.active {
      .tab-label {
        color: $primary-pink;
        font-weight: $font-weight-medium;
      }
    }
  }
}
```

#### 五大导航项
1. **首页**（home）- 图标：房子
2. **任务**（tasks）- 图标：文件
3. **导师**（mentor）- 图标：小猫（放大，向上突出）
4. **故事墙**（story）- 图标：对话框
5. **我的**（profile）- 图标：人像

---

## 🎭 小猫吉祥物规范

### 视觉设计
- **风格**：简笔画卡通，线条流畅
- **颜色**：灰色身体 `#B8B8B8`，黑色轮廓 `#4A4A4A`
- **特征**：圆圆的大眼睛，头顶书本（象征学习）
- **表情**：永远温和友好，不夸张

### 使用场景
1. **欢迎页**：大尺寸小猫（160px），头顶书本
2. **底部导航**：中间图标（96px），固定展示
3. **空状态**：小尺寸小猫（120px），不同姿态
4. **加载状态**：小猫图标旋转动画

### 不同状态的小猫
```
默认：头顶书本，正面站立
开心：头顶书本，举起一只爪子
思考：头顶书本，歪头
鼓励：头顶书本+小旗子
```

---

## 📱 页面布局规范

### 通用页面结构
```scss
.page-container {
  min-height: 100vh;
  background: $gradient-page;
  padding: $spacing-lg;
  padding-bottom: 160px; // 预留底部导航空间
  
  .page-header {
    margin-bottom: $spacing-xl;
    
    .page-title {
      font-size: $font-size-h1;
      font-weight: $font-weight-semibold;
      color: $text-primary;
    }
  }
  
  .page-content {
    // 主要内容区域
  }
}
```

### 首页布局
```
┌────────────────────────┐
│  启程 OPC 孵化         │ ← 页面标题
│                        │
│  卡通小猫 + 欢迎语     │ ← 欢迎区（可滚动隐藏）
│                        │
│ ┌────┐ ┌────┐ ┌────┐ │ ← 三栏数据卡片
│ │完成│ │收入│ │等级│ │
│ └────┘ └────┘ └────┘ │
│                        │
│ 热门任务 →             │ ← 区块标题 + 查看更多
│ ┌──────────────────┐ │
│ │ 任务卡片          │ │
│ └──────────────────┘ │
│ ┌──────────────────┐ │
│ │ 任务卡片          │ │
│ └──────────────────┘ │
│                        │
│ 探索更多               │ ← 功能区块
│ ┌──────────────────┐ │
│ │ AI导师馆子        │ │
│ └──────────────────┘ │
│ ┌──────────────────┐ │
│ │ OPC测评           │ │
│ └──────────────────┘ │
│                        │
│ ┌────────────────┐   │
│ │   从这里开始    │   │ ← 新手引导区
│ │ ┌────┐ ┌────┐ │   │
│ │ │遇见│ │看见│ │   │
│ │ └────┘ └────┘ │   │
│ └────────────────┘   │
│                        │
└────────────────────────┘
    [首页][任务][🐱][故事][我] ← 固定底栏
```

---

## 🎬 动画与交互

### 过渡动画
```scss
// 统一过渡时长
$transition-fast: 0.15s;
$transition-base: 0.3s;
$transition-slow: 0.5s;

// 缓动函数
$ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
$ease-out: cubic-bezier(0, 0, 0.2, 1);
$ease-in: cubic-bezier(0.4, 0, 1, 1);
```

### 点击反馈
```scss
.clickable {
  transition: all $transition-fast $ease-out;
  
  &:active {
    transform: scale(0.98);
    opacity: 0.8;
  }
}
```

### 卡片滑入动画
```scss
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-enter {
  animation: slideInUp $transition-base $ease-out;
}
```

### 页面切换
- **前进**：从右向左滑入
- **返回**：从左向右滑出
- **Tab切换**：淡入淡出（fade）

---

## 📋 组件清单

### 基础组件
- [x] Button（主要、次要、文字）
- [x] Card（数据卡、任务卡、渐变卡）
- [x] Icon（图标容器 + 内部图形）
- [x] TabBar（底部导航栏）
- [x] Badge（徽章、标签）
- [x] Avatar（头像 - 小猫或用户）
- [x] Loading（加载动画 - 旋转小猫）
- [x] Empty（空状态 - 小猫姿态）

### 业务组件
- [ ] TaskCard（任务卡片）
- [ ] DataCard（数据展示卡）
- [ ] ProgressBar（进度条）
- [ ] Timeline（时间线）
- [ ] StatItem（统计项）
- [ ] SkillTag（技能标签）
- [ ] LevelBadge（等级徽章）
- [ ] CatMascot（小猫吉祥物）

---

## 🚀 实施计划

### Phase 1: 设计系统基础（1-2天）
1. 创建全局SCSS变量文件
2. 创建基础组件库（Button, Card, Icon）
3. 创建TabBar导航组件
4. 准备小猫SVG资源

### Phase 2: 核心页面重构（3-5天）
1. 首页（index）
2. 任务列表（tasks）
3. 个人中心（profile）
4. 任务详情（tasks/detail）

### Phase 3: 功能页面重构（5-10天）
根据功能优先级，逐步重构89个页面

### Phase 4: 细节优化（2-3天）
1. 动画效果调优
2. 交互细节打磨
3. 响应式适配
4. 性能优化

---

## 📝 注意事项

### 设计一致性
- 所有页面必须使用统一的颜色变量
- 圆角、间距必须使用规范中的值
- 图标必须是几何图形，不使用emoji
- 小猫吉祥物风格统一

### 性能考虑
- 渐变背景使用CSS渐变，不使用图片
- 图标优先使用SVG
- 避免过度动画影响性能
- 图片资源使用OSS CDN

### 可访问性
- 确保文字与背景对比度 ≥ 4.5:1
- 按钮点击区域 ≥ 44px × 44px
- 支持字体缩放
- 重要操作提供确认机制

---

## 📦 资源文件

### 需要准备的资源
```
/assets/
├── icons/
│   ├── home.svg          # 首页图标
│   ├── tasks.svg         # 任务图标
│   ├── mentor.svg        # 导师图标
│   ├── story.svg         # 故事图标
│   ├── profile.svg       # 我的图标
│   ├── checkmark.svg     # 对勾
│   ├── star.svg          # 星星
│   └── ...               # 其他功能图标
├── mascots/
│   ├── cat-default.svg   # 默认小猫
│   ├── cat-happy.svg     # 开心小猫
│   ├── cat-thinking.svg  # 思考小猫
│   └── cat-encourage.svg # 鼓励小猫
└── images/
    └── (预留其他图片资源)
```

---

**文档版本**: v1.0  
**更新日期**: 2026-06-30  
**维护者**: 启程设计团队
