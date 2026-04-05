Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: '/pages/index/index',
        text: '首页',
        iconType: 'home'
      },
      {
        pagePath: '/pages/tasks/index',
        text: '任务',
        iconType: 'tasks'
      },
      {
        // 中央大按钮
        pagePath: '/pages/story/post',
        text: '',
        iconType: 'add',
        isCenter: true
      },
      {
        pagePath: '/pages/story/index',
        text: '故事墙',
        iconType: 'story'
      },
      {
        pagePath: '/pages/profile/index',
        text: '我的',
        iconType: 'profile'
      }
    ]
  },

  methods: {
    switchTab(e) {
      const { index, path } = e.currentTarget.dataset
      const { isCenter } = this.data.list[index]

      if (isCenter) {
        // 中央按钮：跳转到发布页面（非 tab 页面）
        wx.navigateTo({ url: path })
      } else {
        // 普通 tab：切换页面
        this.setData({ selected: index })
        wx.switchTab({ url: path })
      }
    }
  }
})
