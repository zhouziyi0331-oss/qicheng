export default defineAppConfig({
  pages: [
    'pages/auth/login/index',      // ✅ 登录页面（首页）
    'pages/index/index',           // 首页
    'pages/role-select/index',     // 角色选择
    'pages/opc-test/index',        // OPC测评
    'pages/opc-test/result',       // OPC测评结果
    'pages/track-selection/index', // 赛道选择
    'pages/login/index',           // 登录
    'pages/register/index',        // 注册
    'pages/bind-phone/index',      // 绑定手机号
    'pages/onboarding/index',      // 引导页
    'pages/tasks/index',           // 任务大厅
    'pages/tasks/detail',          // 任务详情
    'pages/tasks/working',         // 任务执行
    'pages/tasks/submit',          // 任务提交
    'pages/tasks/recommended',     // 推荐任务（AI智能匹配）
    'pages/invitations/index',     // 任务邀请
    'pages/my-tasks/index',        // 我的任务
    'pages/mentor/index',          // AI导师（启程小猫）
    'pages/mentor-chat/index',     // AI导师聊天
    'pages/deep-patterns/index',   // 深度模式识别
    'pages/belief-shifts/index',   // 信念转变追踪
    'pages/growth-challenges/index', // 成长挑战
    'pages/growth-dashboard/index', // 成长仪表盘
    'pages/mentor-reports/index',  // 导师报告
    'pages/growth-timeline/index', // 成长时间线
    'pages/my-growth/index',       // 我的成长
    'pages/toolbox/index',         // 工具箱
    'pages/mentor-care/index',     // 导师关心
    'pages/ability/index',         // 六维能力图
    'pages/timeline/index',        // 成长时间线
    'pages/story/index',           // 故事墙
    'pages/story/post',            // 发布故事
    'pages/reports/index',         // OPC报告
    'pages/reports/detail',        // 报告详情
    'pages/profile/index',         // 个人中心
    'pages/wallet/index',          // 钱包
    'pages/wallet/withdraw/index', // 提现
    'pages/task-communication/index', // 任务沟通
    'pages/challenge/index',       // 跳级挑战
    'pages/graduation/index',      // 毕业系统
    'pages/agreement/index',       // 用户协议
    'pages/data-authorization/index', // 数据授权设置
    'pages/chat-list/index',       // 聊天列表
    'pages/chat-detail/index',     // 聊天详情
    'pages/pending-ratings/index', // 待评价任务
    'pages/rate-task/index',       // 评价任务
    'pages/life-question/index',   // 生命问题记录器
    'pages/flow-moments/index',    // 穿越感时刻记录
    'pages/partnerships/index',    // 合伙人关系
    'pages/exploration-reflection/index', // 探索反思
    'pages/exploration-patterns/index',   // 探索模式库
    'pages/opc-incubation/index',  // OPC孵化计划
    'pages/alliances/index',       // 团队协作
    'pages/notifications/index',   // 通知中心
    'pages/my-ratings/index',      // 我的评价
    'pages/my-wallet/index',       // 我的钱包（托管提现）
    'pages/create-rating/index',   // 创建评价
    'pages/level-rewards/index',   // 等级奖励
    'pages/community/index',       // 社区首页
    'pages/community/detail',      // 帖子详情
    'pages/community/create',      // 发帖页面
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#F5E6F0',
    navigationBarTitleText: '启程OPC孵化',
    navigationBarTextStyle: 'black',
    backgroundColor: '#F5E6F0'
  },
  tabBar: {
    custom: true,  // 启用自定义 TabBar
    color: '#8E8E93',
    selectedColor: '#1A1A1A',
    backgroundColor: '#F5F5F7',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页'
      },
      {
        pagePath: 'pages/tasks/index',
        text: '任务'
      },
      {
        pagePath: 'pages/community/index',
        text: '社区'
      },
      {
        pagePath: 'pages/story/index',
        text: '故事墙'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的'
      }
    ]
  }
})
