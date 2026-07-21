export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '题库',
    })
  : { navigationBarTitleText: '题库' }
