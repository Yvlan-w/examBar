import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Trophy, Target, Clock, RotateCcw, Home, CheckCircle, XCircle } from 'lucide-react-taro'

const ResultPage = () => {
  const router = useRouter()
  const {
    total = '0',
    correct = '0',
    score = '0',
    mode = 'practice',
    timeUsed = '0',
  } = router.params

  const totalNum = parseInt(total) || 0
  const correctNum = parseInt(correct) || 0
  const scoreNum = parseInt(score) || 0
  const timeUsedNum = parseInt(timeUsed) || 0
  const accuracy = totalNum > 0 ? Math.round((correctNum / totalNum) * 100) : 0
  const isPassed = accuracy >= 60

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    if (m > 0) return m + '分' + s + '秒'
    return s + '秒'
  }

  const handleRetry = () => {
    Taro.navigateBack({ delta: 1 })
  }

  const handleGoHome = () => {
    Taro.switchTab({ url: '/pages/index/index' })
  }

  return (
    <View className="min-h-full bg-slate-50 flex flex-col items-center px-4 pt-8 pb-8">
      {/* 结果头部 */}
      <View className="flex flex-col items-center mb-6">
        <View className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
          isPassed ? 'bg-emerald-100' : 'bg-red-100'
        }`}>
          {isPassed ? (
            <Trophy size={36} color="#059669" />
          ) : (
            <Target size={36} color="#DC2626" />
          )}
        </View>
        <Text className="block text-xl font-bold text-slate-800 mb-1">
          {isPassed ? '恭喜通过' : '继续加油'}
        </Text>
        <Text className="block text-sm text-slate-500">
          {mode === 'exam' ? '模拟考试' : '专项练习'}完成
        </Text>
      </View>

      {/* 分数展示 */}
      {mode === 'exam' && (
        <Card className="w-full border-0 shadow-sm mb-4">
          <CardContent className="p-6 flex flex-col items-center">
            <Text className="block text-4xl font-bold text-blue-600 mb-1">{scoreNum}</Text>
            <Text className="block text-sm text-slate-400">总分100分</Text>
            <Progress value={scoreNum} className="h-2 mt-3 w-full" />
          </CardContent>
        </Card>
      )}

      {/* 统计数据 */}
      <View className="w-full grid grid-cols-3 gap-3 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 flex flex-col items-center">
            <Text className="block text-lg font-bold text-slate-800">{totalNum}</Text>
            <Text className="block text-xs text-slate-400 mt-1">总题数</Text>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 flex flex-col items-center">
            <View className="flex items-center gap-1">
              <Text className="text-lg font-bold text-emerald-600">{correctNum}</Text>
            </View>
            <Text className="block text-xs text-slate-400 mt-1">正确</Text>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 flex flex-col items-center">
            <Text className="block text-lg font-bold text-blue-600">{accuracy}%</Text>
            <Text className="block text-xs text-slate-400 mt-1">正确率</Text>
          </CardContent>
        </Card>
      </View>

      {/* 用时 */}
      {mode === 'exam' && timeUsedNum > 0 && (
        <Card className="w-full border-0 shadow-sm mb-6">
          <CardContent className="p-4 flex items-center gap-3">
            <View className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock size={18} color="#D97706" />
            </View>
            <View>
              <Text className="block text-sm font-medium text-slate-800">用时</Text>
              <Text className="block text-xs text-slate-400">{formatTime(timeUsedNum)}</Text>
            </View>
          </CardContent>
        </Card>
      )}

      {/* 答题详情 */}
      <Card className="w-full border-0 shadow-sm mb-6">
        <CardContent className="p-4">
          <Text className="block text-sm font-medium text-slate-800 mb-3">答题概况</Text>
          <View className="space-y-3">
            <View className="flex items-center justify-between">
              <View className="flex items-center gap-2">
                <CheckCircle size={14} color="#059669" />
                <Text className="text-sm text-slate-600">答对</Text>
              </View>
              <Text className="text-sm font-medium text-emerald-600">{correctNum}题</Text>
            </View>
            <View className="flex items-center justify-between">
              <View className="flex items-center gap-2">
                <XCircle size={14} color="#DC2626" />
                <Text className="text-sm text-slate-600">答错</Text>
              </View>
              <Text className="text-sm font-medium text-red-600">{totalNum - correctNum}题</Text>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <View className="w-full flex gap-3">
        <View className="flex-1">
          <Button
            className="w-full bg-slate-100 text-slate-600 h-11 rounded-xl"
            onClick={handleGoHome}
          >
            <Text className="text-sm">返回首页</Text>
          </Button>
        </View>
        <View className="flex-1">
          <Button
            className="w-full bg-blue-600 text-white h-11 rounded-xl"
            onClick={handleRetry}
          >
            <Text className="text-sm font-medium">再来一次</Text>
          </Button>
        </View>
      </View>
    </View>
  )
}

export default ResultPage
