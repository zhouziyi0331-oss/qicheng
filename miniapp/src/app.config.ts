export default defineAppConfig({
  pages: [
    'pages/index/index',           // 首页
    'pages/role-select/index',     // 角色选择
    'pages/opc-test/index',        // OPC测评
    'pages/opc-test/result',       // OPC测评结果
    'pages/login/index',           // 登录
    'pages/register/index',        // 注册
    'pages/bind-phone/index',      // 绑定手机号
    'pages/onboarding/index',      // 引导页
    'pages/test/index',            // OPC测评（旧）
    'pages/test/result',           // 测评结果
    'pages/tasks/index',           // 任务大厅
    'pages/tasks/detail',          // 任务详情
    'pages/tasks/working',         // 任务执行
    'pages/tasks/submit',          // 任务提交
    'pages/invitations/index',     // 任务邀请
    'pages/my-tasks/index',        // 我的任务
    'pages/mentor/index',          // AI导师聊天（旧）
    'pages/mentor-chat/index',     // AI导师聊天（使命是河版本）
    'pages/ability/index',         // 六维能力图
    'pages/timeline/index',        // 成长时间线
    'pages/story/index',           // 故事墙
    'pages/story/post',            // 发布故事
    'pages/reports/index',         // OPC报告
    'pages/profile/index',         // 个人中心
    'pages/withdraw/index',        // 提现
    'pages/chat-list/index',       // 聊天列表
    'pages/chat-detail/index',     // 聊天详情
    'pages/pending-ratings/index', // 待评价任务
    'pages/rate-task/index',       // 评价任务
    'pages/life-question/index',   // 生命问题记录器
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
