export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '模拟考试',
    })
  : { navigationBarTitleText: '模拟考试' }
