# 启程 OPC - 页面结构规划

> 基于莫兰迪色系设计规范，重构所有89个页面

---

## 📂 五大导航分类

### 🏠 首页（Home）
**底部导航**: 首页 Tab  
**核心功能**: 欢迎、快速入口、热门推荐

| 页面路径 | 页面名称 | 优先级 | 说明 |
|---------|---------|-------|------|
| `/pages/index` | 首页 | P0 | 欢迎区 + 数据卡 + 任务推荐 + 快捷入口 |
| `/pages/onboarding` | 新手引导 | P0 | 首次使用引导流程 |
| `/pages/opc-incubation` | OPC孵化页 | P1 | 类似当前首页的聚合页 |
| `/pages/recommended-tasks` | 推荐任务 | P1 | 智能推荐的任务列表 |
| `/pages/daily-tasks` | 每日任务 | P2 | 签到、日常挑战 |

---

### 📋 任务（Tasks）
**底部导航**: 任务 Tab  
**核心功能**: 任务列表、任务详情、接单流程

#### 任务浏览与接单
| 页面路径 | 页面名称 | 优先级 | 说明 |
|---------|---------|-------|------|
| `/pages/tasks` | 任务列表 | P0 | 当前可接任务（改为邀请制） |
| `/pages/invitations` | 邀请列表 | P0 | **新增**：定向邀约接收页面 |
| `/pages/invitations/detail` | 邀请详情 | P0 | **新增**：查看邀请理由和要求 |
| `/pages/capability-verify` | 能力核验 | P0 | AI二次核验能力匹配度 |
| `/pages/my-tasks` | 我的任务 | P0 | 进行中的任务 |
| `/pages/task-communication` | 任务沟通 | P1 | 与企业沟通页面 |

#### 任务执行与完成
| 页面路径 | 页面名称 | 优先级 | 说明 |
|---------|---------|-------|------|
| `/pages/project-complete` | 项目完成 | P0 | 提交作品、申请验收 |
| `/pages/rate-task` | 评价任务 | P0 | 双向评价 |
| `/pages/create-rating` | 创建评价 | P0 | 评价表单 |
| `/pages/my-ratings` | 我的评价 | P1 | 查看收到的评价 |
| `/pages/pending-ratings` | 待评价 | P1 | 待评价任务列表 |

#### 任务相关功能
| 页面路径 | 页面名称 | 优先级 | 说明 |
|---------|---------|-------|------|
| `/pages/my-projects` | 我的项目 | P1 | 项目作品集 |
| `/pages/history` | 历史记录 | P2 | 所有任务历史 |
| `/pages/challenge` | 挑战任务 | P2 | 高难度挑战 |
| `/pages/growth-challenges` | 成长挑战 | P2 | 阶段性成长任务 |

---

### 🐱 导师系统（Mentor）
**底部导航**: 导师 Tab（中间放大的小猫图标）  
**核心功能**: AI导师、人类引路人、测评系统

#### OPC测评系统
| 页面路径 | 页面名称 | 优先级 | 说明 |
|---------|---------|-------|------|
| `/pages/opc-test` | OPC测评 | P0 | 25题人格测评 |
| `/pages/test-simple` | 简化测评 | P1 | 快速版测评 |
| `/pages/ability-map` | 能力地图 | P0 | 6维雷达图展示 |
| `/pages/ability` | 能力详情 | P1 | 单项能力深度解析 |
| `/pages/ability-trend` | 能力趋势 | P1 | 能力变化趋势图 |

#### AI导师功能
| 页面路径 | 页面名称 | 优先级 | 说明 |
|---------|---------|-------|------|
| `/pages/mentor` | AI导师主页 | P0 | AI导师聊天入口 |
| `/pages/mentor-chat` | AI导师对话 | P0 | 实时对话页面 |
| `/pages/pbl-chat` | PBL对话 | P1 | 项目制学习对话 |
| `/pages/mentor-care` | 导师关怀 | P1 | 主动关怀消息 |
| `/pages/mentor-reports` | 导师报告 | P1 | AI生成的成长报告 |

#### 引路人机制
| 页面路径 | 页面名称 | 优先级 | 说明 |
|---------|---------|-------|------|
| `/pages/mentor-system` | 引路人系统 | P1 | **新增**：成为引路人入口 |
| `/pages/mentor-system/become-mentor` | 成为引路人 | P1 | **新增**：申请成为引路人 |
| `/pages/mentor-system/my-mentees` | 我的学员 | P1 | **新增**：查看带的学员 |
| `/pages/mentor-system/invite` | 邀请新人 | P1 | **新增**：生成邀请码 |

#### 反思与成长
| 页面路径 | 页面名称 | 优先级 | 说明 |
|---------|---------|-------|------|
| `/pages/exploration-reflection` | 探索反思 | P2 | 深度反思记录 |
| `/pages/pbl-reflection-log` | PBL反思日志 | P2 | 项目反思记录 |
| `/pages/thinking-points` | 思考节点 | P2 | 关键思考时刻 |
| `/pages/deep-patterns` | 深层模式 | P2 | 行为模式分析 |
| `/pages/exploration-patterns` | 探索模式 | P2 | 探索风格分析 |

---

### 📖 故事墙（Story）
**底部导航**: 故事墙 Tab  
**核心功能**: 成长故事、社区互动、榜样展示

#### 成长故事
| 页面路径 | 页面名称 | 优先级 | 说明 |
|---------|---------|-------|------|
| `/pages/story` | 故事墙主页 | P0 | 故事feed流 |
| `/pages/journey` | 成长旅程 | P1 | 个人成长故事 |
| `/pages/growth-timeline` | 成长时间线 | P1 | 7类里程碑事件 |
| `/pages/timeline` | 时间线 | P1 | 通用时间线组件 |
| `/pages/milestones` | 里程碑 | P1 | 重要成就展示 |

#### 成长报告与对比
| 页面路径 | 页面名称 | 优先级 | 说明 |
|---------|---------|-------|------|
| `/pages/reports` | 成长报告 | P1 | 阶段性成长报告 |
| `/pages/growth-summaries` | 成长总结 | P1 | 自动生成的总结 |
| `/pages/growth-dashboard` | 成长仪表盘 | P1 | 可视化成长数据 |
| `/pages/asset-dashboard` | 资产仪表盘 | P1 | 能力资产估值 |
| `/pages/growth-comparison` | 成长对比 | P1 | **新增**：首单vs当前对比 |

#### 社区与互动
| 页面路径 | 页面名称 | 优先级 | 说明 |
|---------|---------|-------|------|
| `/pages/community` | 社区 | P1 | 社区互动广场 |
| `/pages/alliances` | 联盟 | P2 | 小组联盟 |
| `/pages/teams` | 团队 | P2 | 团队协作 |
| `/pages/team` | 团队详情 | P2 | 单个团队页面 |
| `/pages/partnerships` | 伙伴关系 | P2 | 合作伙伴 |

#### 灵感与火花
| 页面路径 | 页面名称 | 优先级 | 说明 |
|---------|---------|-------|------|
| `/pages/passion-sparks` | 热情火花 | P2 | 激发兴趣的时刻 |
| `/pages/flow-moments` | 心流时刻 | P2 | 沉浸体验记录 |
| `/pages/belief-shifts` | 信念转变 | P2 | 认知突破时刻 |
| `/pages/life-question` | 人生问题 | P2 | 深度思考问题 |

---

### 👤 我的（Profile）
**底部导航**: 我的 Tab  
**核心功能**: 个人资料、等级成长、收入管理

#### 个人信息
| 页面路径 | 页面名称 | 优先级 | 说明 |
|---------|---------|-------|------|
| `/pages/profile` | 个人中心 | P0 | 主页：头像、等级、数据 |
| `/pages/talent-profile` | 人才档案 | P1 | 完整档案展示 |
| `/pages/portfolio` | 作品集 | P1 | 公开作品展示 |
| `/pages/identity-card` | 身份卡片 | P1 | **新增**：生成分享卡片 |
| `/pages/settings` | 设置 | P1 | 账号设置 |

#### 等级与成长
| 页面路径 | 页面名称 | 优先级 | 说明 |
|---------|---------|-------|------|
| `/pages/level-up` | 升级 | P0 | 等级升级页面 |
| `/pages/level-growth` | 等级成长 | P1 | 等级详情说明 |
| `/pages/level-rewards` | 等级奖励 | P1 | 各等级权益 |
| `/pages/jump-level` | 跳级测试 | P1 | **新增**：零门槛跳级 |
| `/pages/jump-level/test-questions` | 跳级题目 | P1 | **新增**：测试题目页 |
| `/pages/jump-level/test-result` | 跳级结果 | P1 | **新增**：测试结果页 |

#### 收入与钱包
| 页面路径 | 页面名称 | 优先级 | 说明 |
|---------|---------|-------|------|
| `/pages/wallet` | 钱包 | P0 | 收入总览 |
| `/pages/my-wallet` | 我的钱包 | P0 | 详细收支记录 |
| `/pages/withdraw` | 提现 | P0 | 提现申请 |
| `/pages/payment-status` | 资金状态 | P0 | **新增**：分阶段资金展示 |

#### 勋章与游戏化
| 页面路径 | 页面名称 | 优先级 | 说明 |
|---------|---------|-------|------|
| `/pages/gamification-badges` | 勋章系统 | P2 | 成就勋章展示 |
| `/pages/gamification-fragments` | 勋章碎片 | P2 | 收集碎片兑换 |
| `/pages/graduation` | 毕业 | P2 | 毕业仪式 |
| `/pages/graduation-report` | 毕业报告 | P2 | 毕业成长报告 |

#### 领域与赛道
| 页面路径 | 页面名称 | 优先级 | 说明 |
|---------|---------|-------|------|
| `/pages/sectors` | 领域选择 | P1 | 选择擅长领域 |
| `/pages/sector-hall` | 领域大厅 | P1 | 各领域详情 |
| `/pages/track-selection` | 赛道选择 | P1 | 职业赛道 |
| `/pages/cross-sector-recommend` | 跨领域推荐 | P2 | AI跨界推荐 |

#### 通知与消息
| 页面路径 | 页面名称 | 优先级 | 说明 |
|---------|---------|-------|------|
| `/pages/notifications` | 通知中心 | P1 | 消息列表 |
| `/pages/notification-center` | 通知中心 | P1 | （同上，待合并） |
| `/pages/notification-settings` | 通知设置 | P2 | 推送设置 |

---

### 🛠️ 工具与辅助页面

#### PBL项目制学习
| 页面路径 | 页面名称 | 优先级 | 说明 |
|---------|---------|-------|------|
| `/pages/pbl-create-project` | 创建PBL项目 | P2 | 学生自主创建项目 |
| `/pages/pbl-project-detail` | PBL项目详情 | P2 | 项目详情页 |
| `/pages/pbl-project-showcase` | PBL作品展示 | P2 | 项目成果展示 |
| `/pages/pbl-file-upload` | PBL文件上传 | P2 | 上传项目文件 |
| `/pages/pbl-code-execution` | PBL代码运行 | P2 | 在线运行代码 |

#### 课程与学习
| 页面路径 | 页面名称 | 优先级 | 说明 |
|---------|---------|-------|------|
| `/pages/courses` | 课程 | P2 | 学习课程列表 |
| `/pages/sessions` | 学习会话 | P2 | 课程学习记录 |
| `/pages/toolbox` | 工具箱 | P2 | 学习工具集合 |

#### 聊天与沟通
| 页面路径 | 页面名称 | 优先级 | 说明 |
|---------|---------|-------|------|
| `/pages/chat-list` | 聊天列表 | P1 | 所有对话列表 |
| `/pages/chat-detail` | 聊天详情 | P1 | 单个对话页面 |

#### 认证与授权
| 页面路径 | 页面名称 | 优先级 | 说明 |
|---------|---------|-------|------|
| `/pages/login` | 登录 | P0 | 登录页面 |
| `/pages/register` | 注册 | P0 | 注册页面 |
| `/pages/auth` | 授权 | P0 | 第三方授权 |
| `/pages/role-select` | 角色选择 | P0 | 学生/企业选择 |
| `/pages/bind-phone` | 绑定手机 | P1 | 绑定手机号 |
| `/pages/data-authorization` | 数据授权 | P1 | 隐私授权 |
| `/pages/agreement` | 用户协议 | P1 | 协议页面 |

---

## 🎨 页面重构优先级

### Phase 1: 核心流程（P0，必须立即完成）
**目标**: 保证基本功能可用

1. **认证流程**（2天）
   - [x] login - 登录页
   - [x] register - 注册页
   - [x] role-select - 角色选择
   - [x] onboarding - 新手引导

2. **首页与导航**（3天）
   - [ ] index - 重构首页（莫兰迪渐变 + 小猫 + 数据卡）
   - [ ] TabBar组件 - 底部导航（5个导航项，中间小猫放大）

3. **任务核心流程**（5天）
   - [ ] tasks - 任务列表（改为邀请制）
   - [ ] invitations - **新增**邀请列表页
   - [ ] invitations/detail - **新增**邀请详情页
   - [ ] capability-verify - 能力核验（已有，需调整UI）
   - [ ] my-tasks - 我的任务
   - [ ] project-complete - 项目完成
   - [ ] rate-task - 评价任务

4. **个人中心**（2天）
   - [ ] profile - 个人中心（等级、数据卡、同类统计）
   - [ ] wallet - 钱包

5. **OPC测评**（2天）
   - [ ] opc-test - OPC测评
   - [ ] ability-map - 6维雷达图

**Phase 1 小计**: 14天

---

### Phase 2: 重要功能（P1，增强体验）
**目标**: 完善核心功能，提升用户体验

6. **跳级测试系统**（3天）
   - [ ] jump-level - 跳级测试主页
   - [ ] jump-level/test-questions - 测试题目
   - [ ] jump-level/test-result - 测试结果

7. **成长对比与仪表盘**（4天）
   - [ ] growth-comparison - 成长对比弹窗
   - [ ] asset-dashboard - 资产仪表盘（已有后端）
   - [ ] growth-dashboard - 成长仪表盘
   - [ ] growth-timeline - 成长时间线（已有后端）

8. **引路人机制**（4天）
   - [ ] mentor-system - 引路人系统主页
   - [ ] mentor-system/become-mentor - 成为引路人
   - [ ] mentor-system/my-mentees - 我的学员
   - [ ] mentor-system/invite - 邀请新人

9. **身份卡片**（2天）
   - [ ] identity-card - 身份卡片生成（已有后端）
   - [ ] identity-card/preview - 预览
   - [ ] identity-card/share - 分享

10. **分阶段资金**（2天）
    - [ ] payment-status - 资金到账时间线

11. **故事墙与社区**（3天）
    - [ ] story - 故事墙主页
    - [ ] journey - 成长旅程
    - [ ] community - 社区

12. **AI导师**（3天）
    - [ ] mentor - AI导师主页
    - [ ] mentor-chat - AI对话
    - [ ] mentor-reports - 导师报告

**Phase 2 小计**: 21天

---

### Phase 3: 补充功能（P2，可延后）
**目标**: 完善所有功能，达到100%完成度

13. **游戏化系统**（2天）
    - [ ] gamification-badges - 勋章
    - [ ] gamification-fragments - 碎片
    - [ ] level-rewards - 等级奖励

14. **PBL项目制学习**（3天）
    - [ ] pbl-create-project
    - [ ] pbl-project-detail
    - [ ] pbl-project-showcase

15. **反思与深度功能**（2天）
    - [ ] exploration-reflection
    - [ ] deep-patterns
    - [ ] thinking-points

16. **其他辅助页面**（3天）
    - [ ] courses - 课程
    - [ ] toolbox - 工具箱
    - [ ] sectors - 领域选择
    - [ ] notifications - 通知

**Phase 3 小计**: 10天

---

## 📊 工作量总结

| 阶段 | 页面数 | 预估工时 | 说明 |
|-----|--------|---------|------|
| Phase 1 (P0) | 约20页 | 14天 | 核心流程，必须完成 |
| Phase 2 (P1) | 约30页 | 21天 | 重要功能，增强体验 |
| Phase 3 (P2) | 约39页 | 10天 | 补充功能，可延后 |
| **总计** | **89页** | **45天** | 全部重构完成 |

---

## 🎯 重构原则

### 设计一致性
1. **所有页面背景**: 使用莫兰迪渐变 `$gradient-page`
2. **所有卡片**: 白色圆角卡片 + 淡粉阴影
3. **所有图标**: 淡粉底色圆形容器 + 几何图形（非emoji）
4. **所有数字**: 使用规范字号（48px/64px/96px）+ 品牌色

### 布局规范
1. **页面边距**: 统一40px
2. **卡片间距**: 统一40px
3. **卡片内边距**: 统一48px
4. **底部预留**: 160px（导航栏高度）

### 小猫吉祥物
1. **欢迎页**: 大尺寸小猫（160px）
2. **底部导航**: 中间小猫（96px，向上突出40px）
3. **空状态**: 小尺寸小猫（120px）
4. **加载状态**: 旋转小猫

### 数据展示
1. **三栏数据卡**: 完成任务、总收入、当前等级
2. **统一图标**: 使用淡粉圆形容器
3. **数字突出**: 大号字体 + 品牌色
4. **标签说明**: 小号灰色文字

---

## 📝 下一步行动

### 立即开始
1. ✅ 创建设计系统文档 `DESIGN_SYSTEM.md`
2. ✅ 创建页面结构规划 `PAGE_STRUCTURE_PLAN.md`
3. [ ] 创建全局SCSS变量文件 `styles/variables.scss`
4. [ ] 创建基础组件库
   - [ ] Button
   - [ ] Card
   - [ ] Icon
   - [ ] TabBar
   - [ ] CatMascot
5. [ ] 准备小猫SVG资源
6. [ ] 开始Phase 1重构

### 资源准备
- [ ] 小猫吉祥物SVG（5种状态）
- [ ] 功能图标SVG（20+个）
- [ ] 检查现有组件库，复用可用组件

---

**文档版本**: v1.0  
**更新日期**: 2026-06-30  
**预计完工**: 2026-08-15（45个工作日）
