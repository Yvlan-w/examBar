import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { Network } from '@/network'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, CircleCheck, CircleX, Clock, BookOpen, Target, ChartBarIncreasing } from 'lucide-react-taro'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'

interface QuestionReview {
  orderIndex: number
  questionId: string
  answered: boolean
  question: {
    id: string
    content: string
    type: string
    options?: { label: string; content: string }[]
    answer: string
    analysis: string
    difficulty: string
  } | null
  userAnswer: string | null
  isCorrect: boolean
  answeredAt: string | null
}

interface SessionDetail {
  session: {
    id: string
    mode: string
    subjectName: string
    totalQuestions: number
    correctCount: number
    completed: boolean
    createdAt: string
    completedAt: string | null
    duration: number
  }
  questionReviews: QuestionReview[]
  typeStats: Record<string, { total: number; correct: number }>
}

const MODE_LABELS: Record<string, string> = {
  practice: '专项练习',
  exam: '模拟考试',
  history: '历年真题',
  daily: '每日推荐',
}

const TYPE_LABELS: Record<string, string> = {
  choice: '单选题',
  multi: '多选题',
  judge: '判断题',
  short: '简答题',
}

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
}

const SessionDetailPage = () => {
  const router = useRouter()
  const { sessionId = '' } = router.params

  const [detail, setDetail] = useState<SessionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  useEffect(() => {
    loadDetail()
  }, [sessionId])

  const loadDetail = async () => {
    try {
      setLoading(true)
      const res = await Network.request({
        url: `/api/sessions/${sessionId}/detail`,
      })
      setDetail(res.data?.data || null)
    } catch (e) {
      console.error('load detail error:', e)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}分${s}秒`
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    // 后端已返回东八区格式化字符串，直接使用
    return dateStr
  }

  const calculateRate = (correct: number, total: number) => {
    if (total === 0) return 0
    return Math.round((correct / total) * 100)
  }

  if (loading) {
    return (
      <View className="min-h-full bg-slate-50 p-4">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-40 w-full mb-4" />
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-6 w-full" />
      </View>
    )
  }

  if (!detail) {
    return (
      <View className="min-h-full bg-slate-50 flex flex-col items-center justify-center p-4">
        <Text className="block text-slate-400">场次不存在</Text>
        <Button className="mt-4" onClick={() => Taro.navigateBack()}>
          <Text>返回</Text>
        </Button>
      </View>
    )
  }

  const { session, questionReviews, typeStats } = detail
  const accuracy = calculateRate(session.correctCount, session.totalQuestions)

  return (
    <View className="min-h-full bg-slate-50 flex flex-col">
      {/* 顶部导航 */}
      <View className="bg-white px-4 py-3 shadow-sm flex items-center">
        <View className="flex-shrink-0 active:opacity-70" onClick={() => Taro.navigateBack()}>
          <ChevronLeft size={24} color="#334155" />
        </View>
        <Text className="text-base font-semibold text-slate-800 ml-2">场次详情</Text>
      </View>

      <ScrollView className="flex-1" scrollY>
        {/* 总结卡片 */}
        <View className="px-4 py-4">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-500 to-blue-600">
            <CardContent className="p-4 text-white">
              <View className="flex items-center justify-between mb-3">
                <View className="flex items-center gap-2">
                  <Badge className="text-white text-xs" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                    {MODE_LABELS[session.mode] || session.mode}
                  </Badge>
                  <Text className="text-sm">{session.subjectName}</Text>
                </View>
                {session.completed ? (
                  <Badge className="bg-white text-emerald-600 text-xs">已完成</Badge>
                ) : (
                  <Badge className="bg-white text-amber-600 text-xs">进行中</Badge>
                )}
              </View>
              
              <View className="flex items-center justify-center my-4">
                <View className="text-center">
                  <Text className="block text-5xl font-bold">{accuracy}%</Text>
                  <Text className="block text-sm opacity-80 mt-1">正确率</Text>
                </View>
              </View>
              
              <View className="grid grid-cols-3 gap-2 text-center">
                <View className="rounded-lg p-2" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <Text className="block text-lg font-semibold">{session.correctCount}/{session.totalQuestions}</Text>
                  <Text className="block text-xs opacity-80">正确/总数</Text>
                </View>
                <View className="rounded-lg p-2" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <Text className="block text-lg font-semibold">{formatDuration(session.duration)}</Text>
                  <Text className="block text-xs opacity-80">用时</Text>
                </View>
                <View className="rounded-lg p-2" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <Text className="block text-lg font-semibold">{session.completedAt ? '已完成' : '进行中'}</Text>
                  <Text className="block text-xs opacity-80">状态</Text>
                </View>
              </View>
              
              <View className="mt-3 flex items-center justify-between text-xs opacity-80">
                <Text>开始: {formatDate(session.createdAt)}</Text>
                {session.completedAt && <Text>完成: {formatDate(session.completedAt)}</Text>}
              </View>
            </CardContent>
          </Card>
        </View>

        {/* 按题型统计 */}
        {Object.keys(typeStats).length > 0 && (
          <View className="px-4 mb-4">
            <View className="flex items-center gap-2 mb-2">
              <ChartBarIncreasing size={16} color="#2563EB" />
              <Text className="text-sm font-semibold text-slate-800">按题型统计</Text>
            </View>
            <View className="grid grid-cols-2 gap-2">
              {Object.entries(typeStats).map(([type, stats]) => {
                const rate = calculateRate(stats.correct, stats.total)
                return (
                  <Card key={type} className="border-0 shadow-sm">
                    <CardContent className="p-3">
                      <Text className="block text-xs text-slate-500">{TYPE_LABELS[type] || type}</Text>
                      <View className="flex items-center justify-between mt-1">
                        <Text className="text-lg font-bold text-slate-800">{rate}%</Text>
                        <Text className="text-xs text-slate-400">{stats.correct}/{stats.total}</Text>
                      </View>
                      <View className="w-full bg-slate-100 h-1 rounded-full mt-2 overflow-hidden">
                        <View 
                          className={`h-full rounded-full ${rate >= 60 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${rate}%` }}
                        />
                      </View>
                    </CardContent>
                  </Card>
                )
              })}
            </View>
          </View>
        )}

        {/* 逐题回顾 */}
        <View className="px-4 pb-4">
          <View className="flex items-center gap-2 mb-3">
            <BookOpen size={16} color="#2563EB" />
            <Text className="text-sm font-semibold text-slate-800">逐题回顾</Text>
          </View>
          
          <View className="space-y-3">
            {questionReviews.map((review) => (
              <Card 
                key={review.orderIndex} 
                className="border-0 shadow-sm"
                onClick={() => setExpandedIndex(expandedIndex === review.orderIndex ? null : review.orderIndex)}
              >
                <CardContent className="p-3">
                  {/* 题目头部 */}
                  <View className="flex items-center justify-between mb-2">
                    <View className="flex items-center gap-2">
                      <Text className="text-xs text-slate-400">#{review.orderIndex + 1}</Text>
                      {review.question && (
                        <>
                          <Badge variant="secondary" className="text-xs">
                            {TYPE_LABELS[review.question.type] || review.question.type}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${review.question.difficulty === 'easy' ? 'text-emerald-600' : review.question.difficulty === 'medium' ? 'text-amber-600' : 'text-red-600'}`}
                          >
                            {DIFFICULTY_LABELS[review.question.difficulty] || review.question.difficulty}
                          </Badge>
                        </>
                      )}
                    </View>
                    {review.answered ? (
                      review.isCorrect ? (
                        <CircleCheck size={20} color="#10B981" />
                      ) : (
                        <CircleX size={20} color="#EF4444" />
                      )
                    ) : (
                      <Clock size={20} color="#CBD5E1" />
                    )}
                  </View>
                  
                  {/* 题目内容 */}
                  {review.question && (
                    <View className="flex-1 text-sm text-slate-800 leading-relaxed overflow-hidden">
                      <MarkdownRenderer content={review.question.content} />
                    </View>
                  )}
                  
                  {/* 展开详情 */}
                  {expandedIndex === review.orderIndex && review.question && (
                    <View className="mt-3 pt-3 border-t border-slate-100">
                      {/* 选项 */}
                      {review.question.options && (review.question.type === 'choice' || review.question.type === 'multi') && (
                        <View className="space-y-1 mb-3">
                          {(() => {
                            const correctLabels = review.question!.type === 'multi' 
                              ? review.question!.answer.split(',').map((a: string) => a.trim().toUpperCase())
                              : [review.question!.answer]
                            const userLabels = review.userAnswer 
                              ? review.question!.type === 'multi'
                                ? review.userAnswer.split(',').map((a: string) => a.trim().toUpperCase())
                                : [review.userAnswer]
                              : []
                            return review.question!.options!.map((opt) => {
                              const isCorrectOpt = correctLabels.includes(opt.label.toUpperCase())
                              const isUserOpt = userLabels.includes(opt.label.toUpperCase())
                              let bgClass = 'bg-slate-50 text-slate-600'
                              if (isCorrectOpt) bgClass = 'bg-emerald-50 text-emerald-700'
                              else if (isUserOpt && !review.isCorrect) bgClass = 'bg-red-50 text-red-700'
                              return (
                                <View 
                                  key={opt.label}
                                  className={`p-2 rounded text-sm ${bgClass}`}
                                >
                                  <Text className="block font-medium">{opt.label}.</Text>
                                  <MarkdownRenderer content={opt.content} />
                                </View>
                              )
                            })
                          })()}
                        </View>
                      )}
                      
                      {/* 答案对比 */}
                      <View className="space-y-1 text-sm mb-3">
                        <View className="flex items-center gap-2">
                          <Text className="text-slate-500">你的答案:</Text>
                          <Text className={review.isCorrect ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
                            {review.userAnswer ? (review.question!.type === 'multi' ? review.userAnswer.split(',').join('、') : review.userAnswer) : '未作答'}
                          </Text>
                        </View>
                        <View className="flex items-center gap-2">
                          <Text className="text-slate-500">正确答案:</Text>
                          <Text className="text-emerald-600 font-medium">
                            {review.question!.type === 'multi' ? review.question!.answer.split(',').join('、') : review.question!.answer}
                          </Text>
                        </View>
                      </View>
                      
                      {/* 解析 */}
                      {review.question.analysis && (
                        <View className="bg-blue-50 p-2 rounded">
                          <Text className="block text-xs text-blue-600 font-medium mb-1">
                            <Target size={12} color="#2563EB" className="inline mr-1" />
                            解析
                          </Text>
                          <View className="text-sm text-slate-700 leading-relaxed overflow-hidden">
                            <MarkdownRenderer content={review.question.analysis} />
                          </View>
                        </View>
                      )}
                      
                      {/* 完成时间 */}
                      {review.answeredAt && (
                        <Text className="block text-xs text-slate-400 mt-2">
                          完成时间: {formatDate(review.answeredAt)}
                        </Text>
                      )}
                    </View>
                  )}
                  
                  {/* 未答状态 */}
                  {!review.answered && (
                    <Text className="block text-xs text-slate-400 mt-1">未作答</Text>
                  )}
                </CardContent>
              </Card>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default SessionDetailPage
