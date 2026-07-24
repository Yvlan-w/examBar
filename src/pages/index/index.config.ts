export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: 'examBar智能刷题助手',
    })
  : { navigationBarTitleText: 'examBar智能刷题助手' }
