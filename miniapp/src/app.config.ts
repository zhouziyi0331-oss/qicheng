export default defineAppConfig({
  lazyCodeLoading: 'requiredComponents',
  pages: [
    'pages/index/index',
    'pages/tasks/index',
    'pages/mentor/index',
    'pages/story/index',
    'pages/profile/index',
    'pages/cat-secret/index',
    'pages/cat-quotes/index',
    'pages/cat-achievements/index',
    'pages/company-add-tag/index',
    'pages/story-detail/index',
    'pages/mentor-apply/index',
    'pages/level-up-validation/index',
    'pages/level-up-done/index',
    'pages/level-up-test/index',
  ],
  subPackages: [
    {
      root: 'packageAuth',
      pages: [
        'pages/auth/login/index',
        'pages/login/index',
        'pages/register/index',
        'pages/bind-phone/index',
      ]
    },
    {
      root: 'packageOnboarding',
      pages: [
        'pages/onboarding/index',
        'pages/role-select/index',
        'pages/opc-test/index',
        'pages/opc-test/pre-questions',
        'pages/opc-test/choice-questions',
        'pages/opc-test/result',
        'pages/opc-test/quiz',
        'pages/opc-test/open-question1',
        'pages/opc-test/open-question2',
        'pages/self-exploration/index',
        'pages/identity-intro/index',
        'pages/my-radar/index',
        'pages/growth-dashboard/index',
        'pages/deep-mode/index',
      ]
    },
    {
      root: 'packageMisc',
      pages: [
        'pages/payment-status/index',
        'pages/alliances/index',
        'pages/opc-incubation/index',
        'pages/graduation/index',
      ]
    },
    {
      root: 'packagePBL',
      pages: [
        'pages/pbl-create-project/index',
        'pages/pbl-project-detail/index',
        'pages/pbl-project-showcase/index',
      ]
    },
    {
      root: 'packageTask',
      pages: [
        'pages/tasks/detail',
        'pages/tasks/working',
        'pages/tasks/submit',
        'pages/tasks/recommended',
        'pages/tasks/accept',
        'pages/tasks/plan',
        'pages/tasks/progress',
        'pages/tasks/messages',
        'pages/tasks/completed',
        'pages/my-tasks/index',
        'pages/pending-ratings/index',
        'pages/rate-task/index',
        'pages/daily-tasks/index',
      ]
    },
    {
      root: 'packageMentor',
      pages: [
        'pages/mentor-system/my-mentees',
        'pages/mentor-reports/index',
        'pages/mentor-reports/detail',
        'pages/mentor-care/index',
        'pages/chat-list/index',
        'pages/chat-detail/index',
      ]
    },
    {
      root: 'packageGrowth',
      pages: [
        'pages/ability/index',
        'pages/ability-map/index',
        'pages/challenge/index',
        'pages/growth-challenges/index',
        'pages/growth-comparison/index',
        'pages/journey/index',
        'pages/skip-level-intro/index',
        'pages/skip-level-apply/index',
        'pages/skip-level-task/index',
        'pages/skip-level-progress/index',
        'pages/skip-level-score/index',
        'pages/skip-level-success/index',
        'pages/skip-level-fail/index',
        'pages/skip-level-improve/index',
      ]
    },
    {
      root: 'packageCommunity',
      pages: [
        'pages/thinking-points/index',
      ]
    },
    {
      root: 'packageOther',
      pages: [
        'pages/wallet/index',
        'pages/wallet/withdraw-history/index',
        'pages/my-wallet/index',
        'pages/reports/index',
        'pages/reports/detail',
        'pages/settings/index',
        'pages/notification-center/index',
        'pages/notification-settings/index',
        'pages/edit-profile/index',
        'pages/privacy-settings/index',
        'pages/about/index',
        'pages/contact-exchange/index',
      ]
    },
    {
      root: 'packageIncubation',
      pages: [
        'pages/master-orders/index',
      ]
    },
    {
      root: 'packagePractice',
      pages: [
        'pages/practice-list/index',
        'pages/practice-report/index',
      ]
    },
    {
      root: 'packageProject',
      pages: [
        'pages/teams/index',
        'pages/my-projects/index',
        'pages/portfolio/index',
        'pages/sessions/index',
      ]
    },
    {
      root: 'packageCourse',
      pages: [
        'pages/sector-hall/index',
        'pages/track-content-path/index',
        'pages/track-dev-path/index',
      ]
    },
    {
      root: 'packageAdvanced',
      pages: [
        'pages/level-up/skip-test',
        'pages/level-up/test-questions',
        'pages/level-up/test-result',
        'pages/level-growth/index',
        'pages/capability-verify/index',
        'pages/project-complete/index',
        'pages/recommended-tasks/index',
        'pages/team/create/index',
        'pages/level-detail/index',
        'pages/level-up-ceremony/index',
      ]
    }
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#F5E6F0',
    navigationBarTitleText: '启程OPC孵化',
    navigationBarTextStyle: 'black',
    backgroundColor: '#F5E6F0'
  },
  tabBar: {
    custom: true,  // 启用自定义 TabBar（中间显示导师小猫）
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
        pagePath: 'pages/mentor/index',
        text: '导师'
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
