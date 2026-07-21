export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '答题结果',
    })
  : { navigationBarTitleText: '答题结果' }
