import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { Network } from '@/network'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {Trophy,Target,Clock,
  CircleCheck,
  CircleX,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from 'lucide-react-taro'

interface QuestionDetail {
  id: string
  content: string
  type: string
  options?: { label: string; content: string }[]
  answer: string
  analysis: string
  userAnswer: string
  isCorrect: boolean
}

const TYPE_LABELS: Record<string, string> = {
  choice: '选择题',
  judge: '判断题',
  short: '简答题',
}

const ResultPage = () => {
  const router = useRouter()
  const {
    total = '0',
    correct = '0',
    score = '0',
    mode = 'practice',
    timeUsed = '0',
  } = router.params

  const [questionDetails, setQuestionDetails] = useState<QuestionDetail[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedIds, setExpandedIds] = useState<string[]>([])

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

  useEffect(() => {
    loadQuestionDetails()
  }, [])

  const loadQuestionDetails = async () => {
    try {
      setLoading(true)
      const res = await Network.request({ url: '/api/stats/detail' })
      const recentRecords = res.data?.data?.recentRecords || []
      const details: QuestionDetail[] = []
      for (const record of recentRecords.slice(-totalNum)) {
        const qRes = await Network.request({ url: '/api/questions/' + record.id })
        if (qRes.data?.data) {
          const question = qRes.data.data
          details.push({
            id: question.id,
            content: question.content,
            type: question.type,
            options: question.options,
            answer: question.answer,
            analysis: question.analysis,
            userAnswer: record.correct === 1 ? question.answer : '未知',
            isCorrect: record.correct === 1,
          })
        }
      }
      setQuestionDetails(details)
    } catch (e) {
      console.error('loadQuestionDetails error:', e)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleRetry = () => {
    Taro.navigateBack({ delta: 1 })
  }

  const handleGoHome = () => {
    Taro.switchTab({ url: '/pages/index/index' })
  }

  const handleViewWrong = () => {
    Taro.navigateTo({ url: '/pages/wrong/index' })
  }

  return (
    <View className="min-h-full bg-slate-50 flex flex-col px-4 pt-8 pb-24">
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
          {mode === 'exam' ? '模拟考试' : mode === 'history' ? '历年真题' : '专项练习'}完成
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
                <CircleCheck size={14} color="#059669" />
                <Text className="text-sm text-slate-600">答对</Text>
              </View>
              <Text className="text-sm font-medium text-emerald-600">{correctNum}题</Text>
            </View>
            <View className="flex items-center justify-between">
              <View className="flex items-center gap-2">
                <CircleX size={14} color="#DC2626" />
                <Text className="text-sm text-slate-600">答错</Text>
              </View>
              <Text className="text-sm font-medium text-red-600">{totalNum - correctNum}题</Text>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* 题目详情列表 */}
      <View className="w-full">
        <View className="flex items-center gap-2 mb-3">
          <BookOpen size={16} color="#2563EB" />
          <Text className="block text-base font-semibold text-slate-800">答题详情</Text>
        </View>
        {loading ? (
          <View className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </View>
        ) : questionDetails.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 flex flex-col items-center">
              <Text className="block text-sm text-slate-400">暂无答题详情</Text>
            </CardContent>
          </Card>
        ) : (
          <View className="space-y-3">
            {questionDetails.map((q, index) => (
              <Card key={q.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <View className="flex items-start gap-3">
                    <View
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                        q.isCorrect
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {index + 1}
                    </View>
                    <View className="flex-1">
                      <View className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {TYPE_LABELS[q.type] || q.type}
                        </Badge>
                        {q.isCorrect ? (
                          <CircleCheck size={14} color="#059669" />
                        ) : (
                          <CircleX size={14} color="#DC2626" />
                        )}
                      </View>
                      <Text className="block text-sm text-slate-700 leading-relaxed line-clamp-2">
                        {q.content}
                      </Text>
                      <View className="flex items-center justify-between mt-2">
                        <Text className="text-xs text-slate-400">
                          你的答案：
                          <Text className={q.isCorrect ? 'text-emerald-600' : 'text-red-600'}>
                            {q.userAnswer || '未作答'}
                          </Text>
                        </Text>
                        <Text className="text-xs text-slate-400">
                          正确答案：<Text className="text-emerald-600">{q.answer}</Text>
                        </Text>
                      </View>
                      <View
                        className="mt-3 pt-3 border-t border-slate-100 cursor-pointer active:bg-slate-50"
                        onClick={() => toggleExpand(q.id)}
                      >
                        <View className="flex items-center justify-between">
                          <Text className="text-xs text-blue-600">查看解析</Text>
                          {expandedIds.includes(q.id) ? (
                            <ChevronUp size={14} color="#94A3B8" />
                          ) : (
                            <ChevronDown size={14} color="#94A3B8" />
                          )}
                        </View>
                        {expandedIds.includes(q.id) && (
                          <Text className="block text-sm text-slate-600 mt-2 leading-relaxed">
                            {q.analysis}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        )}
      </View>

      {/* 操作按钮 */}
      <View
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'row',
          gap: '12px',
          padding: '12px 16px',
          backgroundColor: '#fff',
          borderTop: '1px solid #E2E8F0',
          zIndex: 100,
        }}
      >
        <View style={{ flex: 1 }}>
          <Button
            className="w-full bg-slate-100 text-slate-600 h-11 rounded-xl"
            onClick={handleGoHome}
          >
            <Text className="text-sm">返回首页</Text>
          </Button>
        </View>
        {totalNum - correctNum > 0 && (
          <View style={{ flex: 1 }}>
            <Button
              className="w-full bg-red-500 text-white h-11 rounded-xl"
              onClick={handleViewWrong}
            >
              <Text className="text-sm font-medium">查看错题</Text>
            </Button>
          </View>
        )}
        <View style={{ flex: 1 }}>
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
