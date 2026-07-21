export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '刷题练习',
    })
  : { navigationBarTitleText: '刷题练习' }
