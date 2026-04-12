export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/tasks/index',
    'pages/publish/index',
    'pages/payments/index',
    'pages/profile/index',
    'pages/login/index',
    'pages/task-detail/index',
    'pages/payment/index',
    'pages/select-students/index',
    'pages/bind-phone/index',
    'pages/chat-list/index',
    'pages/chat-detail/index',
    'pages/pending-ratings/index',
    'pages/rate-task/index',
    'pages/add-requirement/index',
    'pages/amendment-history/index',
    'pages/company-verify/index',
    'pages/favorite-students/index',
    'pages/data-report/index',
    'pages/invoice-manage/index',
    'pages/dispute/index',
    'pages/student-profile/index',
    'pages/task-verification/index',
    'pages/task-progress/index'
  ],
  window: {
    backgroundTextStyle: 'dark',
    navigationBarBackgroundColor: '#0A0C10',
    navigationBarTitleText: '启程企业版',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#6B7280',
    selectedColor: '#8B5CF6',
    backgroundColor: '#1A1D24',
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
        pagePath: 'pages/publish/index',
        text: '发布'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的'
      }
    ]
  }
})
