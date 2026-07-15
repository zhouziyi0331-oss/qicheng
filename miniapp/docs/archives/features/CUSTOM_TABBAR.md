# 自定义 TabBar 更新说明

## 设计特点

已实现参考 MindMate 风格的自定义底部导航栏：

### 布局结构
```
[首页]  [任务]  [荧光绿胶囊按钮]  [故事墙]  [我的]
 灰色    灰色      黄绿渐变        灰色     灰色
```

### 核心特性

1. **荧光绿胶囊形中央按钮** ⭐
   - 尺寸：72px × 48px
   - 形状：超大圆角胶囊形（border-radius: 24px）
   - 背景：荧光绿渐变（#CCFF00 → #B8FF2C → #E8FF8C）
   - 图标：黑色加号（+），字体大小 32px
   - 效果：发光阴影 `0 4px 20px rgba(204, 255, 0, 0.4)`
   - 功能：点击跳转到发布故事页面

2. **普通导航项**
   - 图标：黑色线条 SVG（使用 data URI 内联）
   - 默认颜色：灰色 #8E8E93（opacity: 0.5）
   - 选中颜色：黑色 #1A1A1A（opacity: 1）
   - 文字：11px，灰色/黑色
   - 图标类型：
     - 首页：房子图标（选中时填充）
     - 任务：勾选框图标
     - 故事墙：对话气泡图标
     - 我的：用户图标

3. **整体样式**
   - 背景色：#F5F5F7（浅灰）
   - 顶部圆角：32px
   - 阴影：`0 -4px 20px rgba(0, 0, 0, 0.06)`
   - 内边距：12px 20px 24px

## 技术实现

### 文件结构
```
src/custom-tab-bar/
├── index.js       # 组件逻辑（原生小程序语法）
├── index.json     # 组件配置
├── index.wxml     # 组件模板
└── index.wxss     # 组件样式
```

### 关键代码

**index.js - 数据和方法**
```javascript
Component({
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/index/index', text: '首页', iconType: 'home' },
      { pagePath: '/pages/tasks/index', text: '任务', iconType: 'tasks' },
      { pagePath: '/pages/story/post', text: '', iconType: 'add', isCenter: true },
      { pagePath: '/pages/story/index', text: '故事墙', iconType: 'story' },
      { pagePath: '/pages/profile/index', text: '我的', iconType: 'profile' }
    ]
  },
  methods: {
    switchTab(e) {
      const { index, path } = e.currentTarget.dataset
      const { isCenter } = this.data.list[index]
      
      if (isCenter) {
        wx.navigateTo({ url: path })  // 中央按钮：跳转到发布页
      } else {
        this.setData({ selected: index })
        wx.switchTab({ url: path })  // 普通 tab：切换页面
      }
    }
  }
})
```

**index.wxss - 荧光绿按钮样式**
```css
.center-btn {
  width: 72px;
  height: 48px;
  border-radius: 24px;
  background: linear-gradient(135deg, #CCFF00 0%, #B8FF2C 50%, #E8FF8C 100%);
  box-shadow: 0 4px 20px rgba(204, 255, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab-icon-add {
  font-size: 32px;
  font-weight: 300;
  color: #1A1A1A;
}
```

**SVG 图标使用 data URI**
```css
.tab-icon-home {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238E8E93' stroke-width='2'%3E...");
}
```

### 页面集成

每个 tab 页面需要在 `useEffect` 中更新选中状态：

```tsx
useEffect(() => {
  const page = Taro.getCurrentInstance().page
  if (page && typeof page.getTabBar === 'function') {
    const tabBar = page.getTabBar()
    if (tabBar && typeof tabBar.setData === 'function') {
      tabBar.setData({ selected: 0 })  // 0=首页, 1=任务, 3=故事墙, 4=我的
    }
  }
}, [])
```

## 配置文件

**src/app.config.ts**
```typescript
tabBar: {
  custom: true,  // 启用自定义 TabBar
  list: [
    { pagePath: 'pages/index/index', text: '首页' },
    { pagePath: 'pages/tasks/index', text: '任务' },
    { pagePath: 'pages/story/index', text: '故事墙' },
    { pagePath: 'pages/profile/index', text: '我的' }
  ]
}
```

## 视觉效果

✅ 中央荧光绿胶囊形大按钮，视觉焦点
✅ 黑色线条 SVG 图标，现代简洁
✅ 选中状态清晰（黑色 vs 灰色）
✅ 发光阴影效果，增强层次感
✅ 按压反馈动画（scale: 0.95）

## 编译状态

✅ 编译成功
✅ 可在微信开发者工具中预览
✅ 自定义 TabBar 已生效
