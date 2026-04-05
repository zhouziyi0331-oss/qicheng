# 启程平台设计系统

## 🎨 设计理念

**扁平插画风格 + 渐变配色 + 年轻化视觉**

参考风格：
- 扁平化插画元素（类似 Duolingo、Headspace）
- 柔和的渐变色彩
- 圆润的边角和流动的形状
- 轻松、友好、有趣的视觉语言

---

## 🌈 配色系统

### 主色调（Primary Colors）

```css
/* 紫色系 - 主品牌色 */
--primary-50: #F5F3FF;
--primary-100: #EDE9FE;
--primary-200: #DDD6FE;
--primary-300: #C4B5FD;
--primary-400: #A78BFA;
--primary-500: #8B5CF6;  /* 主色 */
--primary-600: #7C3AED;
--primary-700: #6D28D9;

/* 渐变主色 */
--gradient-primary: linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%);
--gradient-primary-soft: linear-gradient(135deg, #DDD6FE 0%, #C4B5FD 100%);
```

### 辅助色（Secondary Colors）

```css
/* 青色系 - 科技感 */
--cyan-400: #22D3EE;
--cyan-500: #06B6D4;
--gradient-cyan: linear-gradient(135deg, #67E8F9 0%, #06B6D4 100%);

/* 粉色系 - 活力感 */
--pink-400: #F472B6;
--pink-500: #EC4899;
--gradient-pink: linear-gradient(135deg, #F9A8D4 0%, #EC4899 100%);

/* 黄色系 - 温暖感 */
--yellow-400: #FBBF24;
--yellow-500: #F59E0B;
--gradient-yellow: linear-gradient(135deg, #FDE68A 0%, #FBBF24 100%);

/* 绿色系 - 成长感 */
--green-400: #4ADE80;
--green-500: #22C55E;
--gradient-green: linear-gradient(135deg, #86EFAC 0%, #22C55E 100%);

/* 橙色系 - 热情感 */
--orange-400: #FB923C;
--orange-500: #F97316;
--gradient-orange: linear-gradient(135deg, #FDBA74 0%, #F97316 100%);
```

### 中性色（Neutral Colors）

```css
--gray-50: #F9FAFB;
--gray-100: #F3F4F6;
--gray-200: #E5E7EB;
--gray-300: #D1D5DB;
--gray-400: #9CA3AF;
--gray-500: #6B7280;
--gray-600: #4B5563;
--gray-700: #374151;
--gray-800: #1F2937;
--gray-900: #111827;
```

### 功能色（Functional Colors）

```css
/* 成功 */
--success: #22C55E;
--success-bg: #DCFCE7;
--gradient-success: linear-gradient(135deg, #86EFAC 0%, #22C55E 100%);

/* 警告 */
--warning: #F59E0B;
--warning-bg: #FEF3C7;
--gradient-warning: linear-gradient(135deg, #FDE68A 0%, #F59E0B 100%);

/* 错误 */
--error: #EF4444;
--error-bg: #FEE2E2;
--gradient-error: linear-gradient(135deg, #FCA5A5 0%, #EF4444 100%);

/* 信息 */
--info: #3B82F6;
--info-bg: #DBEAFE;
--gradient-info: linear-gradient(135deg, #93C5FD 0%, #3B82F6 100%);
```

### OPC标签专属色

```css
/* O - 创意先锋 */
--opc-o: linear-gradient(135deg, #F9A8D4 0%, #EC4899 100%);
--opc-o-light: #FCE7F3;

/* P - 执行专家 */
--opc-p: linear-gradient(135deg, #93C5FD 0%, #3B82F6 100%);
--opc-p-light: #DBEAFE;

/* C - 技术大师 */
--opc-c: linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%);
--opc-c-light: #EDE9FE;
```

---

## 📐 间距系统

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
```

---

## 🔤 字体系统

```css
/* 字体家族 */
--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", 
             "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
--font-display: "SF Pro Display", -apple-system, sans-serif;

/* 字体大小 */
--text-xs: 12px;    /* 辅助文字 */
--text-sm: 14px;    /* 正文小 */
--text-base: 16px;  /* 正文 */
--text-lg: 18px;    /* 正文大 */
--text-xl: 20px;    /* 小标题 */
--text-2xl: 24px;   /* 标题 */
--text-3xl: 30px;   /* 大标题 */
--text-4xl: 36px;   /* 超大标题 */
--text-5xl: 48px;   /* 展示标题 */

/* 字重 */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* 行高 */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

---

## 🎭 圆角系统

```css
--radius-sm: 8px;   /* 小元素 */
--radius-md: 12px;  /* 卡片 */
--radius-lg: 16px;  /* 大卡片 */
--radius-xl: 20px;  /* 模态框 */
--radius-2xl: 24px; /* 特大容器 */
--radius-full: 9999px; /* 圆形 */
```

---

## 🌟 阴影系统

```css
/* 轻阴影 */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

/* 常规阴影 */
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
             0 2px 4px -1px rgba(0, 0, 0, 0.06);

/* 强阴影 */
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
             0 4px 6px -2px rgba(0, 0, 0, 0.05);

/* 超强阴影 */
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
             0 10px 10px -5px rgba(0, 0, 0, 0.04);

/* 彩色阴影（用于按钮悬停） */
--shadow-primary: 0 10px 20px -5px rgba(139, 92, 246, 0.3);
--shadow-pink: 0 10px 20px -5px rgba(236, 72, 153, 0.3);
--shadow-cyan: 0 10px 20px -5px rgba(6, 182, 212, 0.3);
```

---

## 🎨 插画元素库

### 1. 装饰性形状（Blob Shapes）

```css
/* 柔和的有机形状 */
.blob-1 {
  background: linear-gradient(135deg, #DDD6FE 0%, #C4B5FD 100%);
  border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
  opacity: 0.6;
}

.blob-2 {
  background: linear-gradient(135deg, #FDBA74 0%, #F97316 100%);
  border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
  opacity: 0.5;
}

.blob-3 {
  background: linear-gradient(135deg, #86EFAC 0%, #22C55E 100%);
  border-radius: 40% 60% 60% 40% / 40% 60% 40% 60%;
  opacity: 0.4;
}
```

### 2. 图标风格

- 线条粗细：2px
- 圆角：圆润
- 风格：Duotone（双色调）
- 推荐库：Phosphor Icons, Heroicons

### 3. 插画角色

- 简化的人物形象（无五官或简单表情）
- 柔和的渐变填充
- 流动的姿态
- 温暖的配色

---

## 📱 组件样式

### 按钮（Button）

```tsx
// 主按钮
<button className="
  px-6 py-3 rounded-full
  bg-gradient-to-r from-purple-400 to-purple-600
  text-white font-semibold
  shadow-lg shadow-purple-500/30
  hover:shadow-xl hover:shadow-purple-500/40
  hover:scale-105
  transition-all duration-300
  active:scale-95
">
  开始测评
</button>

// 次要按钮
<button className="
  px-6 py-3 rounded-full
  bg-white border-2 border-purple-200
  text-purple-600 font-semibold
  hover:bg-purple-50 hover:border-purple-300
  transition-all duration-300
">
  了解更多
</button>

// 图标按钮
<button className="
  w-12 h-12 rounded-full
  bg-gradient-to-br from-pink-100 to-purple-100
  flex items-center justify-center
  hover:scale-110
  transition-transform duration-300
">
  <Icon className="text-purple-600" />
</button>
```

### 卡片（Card）

```tsx
// 基础卡片
<div className="
  bg-white rounded-2xl p-6
  shadow-lg hover:shadow-xl
  transition-shadow duration-300
  border border-gray-100
">
  {/* 内容 */}
</div>

// 渐变卡片
<div className="
  bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50
  rounded-2xl p-6
  border border-white
  shadow-lg
">
  {/* 内容 */}
</div>

// 悬浮卡片
<div className="
  bg-white rounded-2xl p-6
  shadow-md hover:shadow-2xl
  hover:-translate-y-2
  transition-all duration-300
  cursor-pointer
">
  {/* 内容 */}
</div>
```

### 标签（Tag）

```tsx
// OPC标签
<span className="
  inline-flex items-center gap-2
  px-4 py-2 rounded-full
  bg-gradient-to-r from-pink-400 to-pink-600
  text-white text-sm font-semibold
  shadow-md shadow-pink-500/30
">
  <span className="text-lg">🎨</span>
  O-创意先锋
</span>

// 等级标签
<span className="
  inline-flex items-center gap-1
  px-3 py-1 rounded-full
  bg-gradient-to-r from-yellow-100 to-yellow-200
  text-yellow-700 text-xs font-bold
  border border-yellow-300
">
  ⭐ Lv.2
</span>
```

### 输入框（Input）

```tsx
<div className="relative">
  <input className="
    w-full px-4 py-3 rounded-xl
    bg-gray-50 border-2 border-gray-200
    focus:bg-white focus:border-purple-400
    focus:ring-4 focus:ring-purple-100
    transition-all duration-300
    outline-none
  " />
  <div className="
    absolute right-3 top-1/2 -translate-y-1/2
    text-gray-400
  ">
    <Icon />
  </div>
</div>
```

### 进度条（Progress）

```tsx
// 渐变进度条
<div className="
  w-full h-3 rounded-full
  bg-gray-100 overflow-hidden
">
  <div 
    className="
      h-full rounded-full
      bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400
      transition-all duration-500
    "
    style={{ width: '65%' }}
  />
</div>

// 分段进度条
<div className="flex gap-2">
  {[1,2,3,4,5].map(i => (
    <div key={i} className={`
      flex-1 h-2 rounded-full
      ${i <= 3 
        ? 'bg-gradient-to-r from-purple-400 to-purple-600' 
        : 'bg-gray-200'
      }
    `} />
  ))}
</div>
```

---

## 📊 图表样式

### 六维能力雷达图

```tsx
// 配色方案
const radarColors = {
  fill: 'rgba(139, 92, 246, 0.2)',      // 紫色半透明填充
  stroke: 'rgba(139, 92, 246, 1)',      // 紫色边框
  grid: 'rgba(209, 213, 219, 0.5)',     // 灰色网格
  label: '#6B7280',                      // 灰色标签
};

// 样式
<div className="
  bg-gradient-to-br from-purple-50 to-pink-50
  rounded-2xl p-6
  shadow-lg
">
  <RadarChart data={sixDimData} colors={radarColors} />
</div>
```

### 收入趋势图

```tsx
// 配色方案
const lineColors = {
  gradient: ['#A78BFA', '#EC4899', '#22D3EE'],  // 紫-粉-青渐变
  area: 'rgba(167, 139, 250, 0.1)',             // 半透明填充
  grid: 'rgba(229, 231, 235, 1)',               // 网格线
};

// 样式
<div className="
  bg-white rounded-2xl p-6
  shadow-lg border border-gray-100
">
  <LineChart data={earningsData} colors={lineColors} />
</div>
```

### 任务完成统计

```tsx
// 环形图配色
const donutColors = [
  'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)',  // 紫色
  'linear-gradient(135deg, #F9A8D4 0%, #EC4899 100%)',  // 粉色
  'linear-gradient(135deg, #67E8F9 0%, #06B6D4 100%)',  // 青色
  'linear-gradient(135deg, #86EFAC 0%, #22C55E 100%)',  // 绿色
];

// 样式
<div className="
  bg-gradient-to-br from-gray-50 to-purple-50
  rounded-2xl p-6
  shadow-lg
">
  <DonutChart data={taskStats} colors={donutColors} />
</div>
```

---

## 🎭 动画效果

### 悬停动画

```css
/* 卡片悬停 */
.card-hover {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.card-hover:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

/* 按钮悬停 */
.button-hover {
  transition: all 0.3s ease;
}
.button-hover:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 20px -5px rgba(139, 92, 246, 0.4);
}

/* 图标悬停 */
.icon-hover {
  transition: transform 0.3s ease;
}
.icon-hover:hover {
  transform: rotate(10deg) scale(1.1);
}
```

### 加载动画

```tsx
// 脉冲加载
<div className="
  w-16 h-16 rounded-full
  bg-gradient-to-r from-purple-400 to-pink-400
  animate-pulse
" />

// 旋转加载
<div className="
  w-16 h-16 rounded-full
  border-4 border-gray-200
  border-t-purple-500
  animate-spin
" />

// 波浪加载
<div className="flex gap-2">
  {[0, 1, 2].map(i => (
    <div 
      key={i}
      className="
        w-3 h-3 rounded-full
        bg-gradient-to-r from-purple-400 to-pink-400
        animate-bounce
      "
      style={{ animationDelay: `${i * 0.1}s` }}
    />
  ))}
</div>
```

### 页面过渡

```tsx
// 淡入
<div className="
  animate-fade-in
  opacity-0
">
  {/* 内容 */}
</div>

// 从下滑入
<div className="
  animate-slide-up
  translate-y-8 opacity-0
">
  {/* 内容 */}
</div>

// 缩放进入
<div className="
  animate-scale-in
  scale-95 opacity-0
">
  {/* 内容 */}
</div>
```

---

## 🖼️ 页面布局示例

### 首页 Hero Section

```tsx
<section className="
  relative overflow-hidden
  bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50
  min-h-screen flex items-center
">
  {/* 装饰性 Blob */}
  <div className="absolute top-20 left-10 w-64 h-64 blob-1 animate-float" />
  <div className="absolute bottom-20 right-10 w-48 h-48 blob-2 animate-float-delayed" />
  
  <div className="container mx-auto px-6 z-10">
    <div className="max-w-2xl">
      <h1 className="
        text-5xl font-bold mb-6
        bg-gradient-to-r from-purple-600 to-pink-600
        bg-clip-text text-transparent
      ">
        开启你的职业启程
      </h1>
      <p className="text-xl text-gray-600 mb-8">
        AI驱动的个性化成长平台，帮助你发现潜力、积累经验、实现价值
      </p>
      <button className="
        px-8 py-4 rounded-full
        bg-gradient-to-r from-purple-500 to-pink-500
        text-white text-lg font-semibold
        shadow-xl shadow-purple-500/30
        hover:shadow-2xl hover:shadow-purple-500/40
        hover:scale-105
        transition-all duration-300
      ">
        开始测评 →
      </button>
    </div>
  </div>
  
  {/* 插画 */}
  <div className="absolute right-0 top-1/2 -translate-y-1/2">
    <img src="/illustrations/hero.svg" alt="" className="w-[600px]" />
  </div>
</section>
```

### 任务卡片

```tsx
<div className="
  group
  bg-white rounded-2xl p-6
  border border-gray-100
  shadow-md hover:shadow-2xl
  hover:-translate-y-2
  transition-all duration-300
  cursor-pointer
">
  {/* 标签 */}
  <div className="flex gap-2 mb-4">
    <span className="
      px-3 py-1 rounded-full
      bg-gradient-to-r from-purple-100 to-purple-200
      text-purple-700 text-xs font-semibold
    ">
      内容创作
    </span>
    <span className="
      px-3 py-1 rounded-full
      bg-gradient-to-r from-yellow-100 to-yellow-200
      text-yellow-700 text-xs font-bold
    ">
      ⭐ Lv.1
    </span>
  </div>
  
  {/* 标题 */}
  <h3 className="
    text-xl font-bold text-gray-900 mb-2
    group-hover:text-purple-600
    transition-colors
  ">
    AI工具测评视频制作
  </h3>
  
  {/* 描述 */}
  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
    需要制作一个3分钟的AI工具测评视频，包括功能演示、使用体验分享...
  </p>
  
  {/* 底部信息 */}
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <div className="
        w-8 h-8 rounded-full
        bg-gradient-to-br from-pink-400 to-purple-400
        flex items-center justify-center
        text-white text-xs font-bold
      ">
        AI
      </div>
      <span className="text-sm text-gray-500">AI科技公司</span>
    </div>
    <div className="
      text-2xl font-bold
      bg-gradient-to-r from-purple-600 to-pink-600
      bg-clip-text text-transparent
    ">
      ¥350
    </div>
  </div>
</div>
```

### 个人主页卡片

```tsx
<div className="
  bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500
  rounded-3xl p-8
  shadow-2xl
  text-white
  relative overflow-hidden
">
  {/* 装饰性元素 */}
  <div className="absolute top-0 right-0 w-32 h-32 blob-1 opacity-20" />
  
  {/* 头像 */}
  <div className="
    w-24 h-24 rounded-full
    bg-white
    flex items-center justify-center
    text-4xl
    shadow-xl
    mb-4
  ">
    🎓
  </div>
  
  {/* 昵称和标签 */}
  <h2 className="text-3xl font-bold mb-2">小明</h2>
  <div className="
    inline-flex items-center gap-2
    px-4 py-2 rounded-full
    bg-white/20 backdrop-blur-sm
    text-sm font-semibold
    mb-6
  ">
    <span className="text-xl">🎨</span>
    O-创意先锋
  </div>
  
  {/* 统计数据 */}
  <div className="grid grid-cols-3 gap-4">
    <div className="text-center">
      <div className="text-3xl font-bold">12</div>
      <div className="text-sm opacity-80">完成任务</div>
    </div>
    <div className="text-center">
      <div className="text-3xl font-bold">¥2.8K</div>
      <div className="text-sm opacity-80">总收入</div>
    </div>
    <div className="text-center">
      <div className="text-3xl font-bold">Lv.2</div>
      <div className="text-sm opacity-80">当前等级</div>
    </div>
  </div>
</div>
```

---

## 🎯 设计原则

### 1. 年轻化

- 使用明亮、活泼的配色
- 添加有趣的插画和图标
- 轻松、友好的文案语气
- 流畅的动画和交互

### 2. 扁平化

- 避免过度的阴影和立体效果
- 使用简洁的图形和图标
- 清晰的层次结构
- 大量留白

### 3. 渐变美学

- 柔和的渐变过渡
- 多色渐变增加视觉趣味
- 渐变用于强调和引导
- 避免过度使用

### 4. 情感化设计

- 使用插画传达情绪
- 微交互增加趣味性
- 鼓励性的反馈
- 温暖的视觉语言

---

## 📚 推荐资源

### 插画资源
- [unDraw](https://undraw.co/) - 免费可定制插画
- [Blush](https://blush.design/) - 插画库
- [Humaaans](https://www.humaaans.com/) - 人物插画
- [Open Peeps](https://www.openpeeps.com/) - 手绘风格人物

### 图标资源
- [Phosphor Icons](https://phosphoricons.com/) - 灵活的图标库
- [Heroicons](https://heroicons.com/) - Tailwind官方图标
- [Lucide](https://lucide.dev/) - 美观的图标集

### 配色工具
- [Coolors](https://coolors.co/) - 配色生成器
- [Gradient Hunt](https://gradienthunt.com/) - 渐变色库
- [UI Gradients](https://uigradients.com/) - 渐变色集合

### 设计参考
- [Dribbble](https://dribbble.com/) - 设计灵感
- [Behance](https://www.behance.net/) - 作品集
- [Mobbin](https://mobbin.com/) - 移动端设计参考
