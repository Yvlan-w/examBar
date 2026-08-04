export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/questions/index',
    'pages/profile/index',
    'pages/practice/index',
    'pages/practice-select/index',
    'pages/exam/index',
    'pages/exam-select/index',
    'pages/result/index',
    'pages/history/index',
    'pages/wrong/index',
    'pages/favorites/index',
    'pages/create-subject/index',
    'pages/session-detail/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'examBar智能刷题助手',
    navigationBarTextStyle: 'black',
  },
  tabBar: {
    color: '#94A3B8',
    selectedColor: '#2563EB',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: './assets/tabbar/book-open.png',
        selectedIconPath: './assets/tabbar/book-open-active.png',
      },
      {
        pagePath: 'pages/questions/index',
        text: '题库',
        iconPath: './assets/tabbar/library.png',
        selectedIconPath: './assets/tabbar/library-active.png',
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: './assets/tabbar/user.png',
        selectedIconPath: './assets/tabbar/user-active.png',
      },
    ],
  },
  // 微信小程序隐私协议配置
  // https://developers.weixin.qq.com/doc/oplatform/Third-party_Platforms/2.0/product/privacy_setting.html
  __usePrivacyCheck__: true,
})
