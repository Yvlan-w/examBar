export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '职考刷题',
    })
  : { navigationBarTitleText: '职考刷题' }
