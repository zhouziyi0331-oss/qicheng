# 启程小程序 - 完整架构

## 📱 页面结构

### TabBar页面（4个）
1. **首页** (`pages/index/index`) ✅ 已创建
   - Hero区域 + 用户欢迎
   - 统计卡片（完成任务、总收入、等级）
   - 功能入口网格
   - AI导师横幅

2. **任务大厅** (`pages/tasks/index`)
   - 搜索和筛选
   - AI推荐任务
   - 任务列表（卡片式）
   - 任务状态标签

3. **故事墙** (`pages/story/index`)
   - 故事信息流
   - 点赞评论互动
   - 发布入口

4. **个人中心** (`pages/profile/index`)
   - 用户信息卡片
   - 余额和提现入口
   - 六维能力预览
   - 功能菜单

### 核心功能页面

#### 用户系统
- **登录** (`pages/login/index`) ✅ 已创建
- **注册** (`pages/register/index`) ✅ 已创建
- **引导页** (`pages/onboarding/index`)

#### OPC测评
- **测评问卷** (`pages/test/index`)
  - 25题测评
  - 进度条
  - 答题卡片
- **测评结果** (`pages/test/result`)
  - OPC标签揭晓动画
  - 六维雷达图
  - 分享功能

#### 任务系统
- **任务详情** (`pages/tasks/detail`)
  - 任务信息
  - 接单按钮
  - 任务步骤
  - AI导师入口（右下角悬浮）
- **我的任务** (`pages/my-tasks/index`)
  - 进行中/已完成/已打回
  - 任务进度
  - 提交入口

#### AI导师 🐱
- **聊天界面** (`pages/mentor/index`)
  - 对话历史
  - 输入框
  - 小猫头像
  - 五大触发场景

#### 成长系统
- **六维能力图** (`pages/ability/index`)
  - 雷达图可视化
  - 能力详细数据
  - 历史对比
- **成长时间线** (`pages/timeline/index`)
  - 时间轴展示
  - 里程碑节点
  - 等级变化

#### 其他功能
- **OPC报告** (`pages/reports/index`)
  - 报告列表
  - 购买入口
  - 报告预览
- **提现** (`pages/withdraw/index`)
  - 余额显示
  - 提现表单
  - 提现记录
- **故事发布** (`pages/story/post`)
  - 内容编辑
  - 图片上传

## 🎨 设计系统

### 颜色
- 主色：`#8B5CF6` (紫色)
- 渐变：紫 → 粉 → 青
- 成功：`#10B981`
- 警告：`#F59E0B`
- 错误：`#EF4444`

### 组件
- 卡片：圆角16px，阴影
- 按钮：圆角12px，渐变背景
- 输入框：圆角12px，浅灰背景

### 图标
- 使用emoji作为临时图标
- 后续替换为设计图标

## 🔌 API对接

所有API已在 `src/services/api.ts` 中定义：
- `authAPI` - 用户认证
- `testAPI` - OPC测评
- `taskAPI` - 任务系统
- `mentorAPI` - AI导师
- `abilityAPI` - 能力系统
- `storyAPI` - 故事墙
- `reportAPI` - OPC报告
- `withdrawAPI` - 提现

## 🐱 AI导师集成

### 出现场景
1. 任务详情页 - 右下角悬浮按钮
2. 我的任务页 - 每个任务卡片上的"问导师"按钮
3. 通知推送 - 主动引导和见证

### 视觉标识
- 头像：🐱 小猫emoji
- 颜色：`#FBBF24` (金黄色)
- 名称：启程小猫

## 📦 下一步

1. 创建剩余核心页面
2. 实现真实API对接
3. 添加加载状态和错误处理
4. 优化交互动画
5. 测试编译运行
