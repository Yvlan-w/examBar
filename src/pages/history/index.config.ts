export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '历年真题',
    })
  : { navigationBarTitleText: '历年真题' }