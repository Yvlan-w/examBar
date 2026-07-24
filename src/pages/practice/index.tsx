import { useState, useEffect, useRef } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { Network } from '@/network'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useUserStore } from '@/store/user'
import { requireLogin, loginWithProfile } from '@/utils/auth'
import { CircleCheck, CircleX, Star, User } from 'lucide-react-taro'

interface Question {
  id: string
  content: string
  type: string
  options?: { label: string; content: string }[]
  answer: string
  analysis: string
  difficulty: string
  subjectName: string
}

const PracticePage = () => {
  const router = useRouter()
  const { mode = 'practice', subjectId = '', questionId = '', type = '' } = router.params

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [shortAnswer, setShortAnswer] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [answeredCount, setAnsweredCount] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const { isLoggedIn, user } = useUserStore()
  const submittedRef = useRef(false)

  useEffect(() => {
    initPage()
  }, [])

  useEffect(() => {
    if (currentQuestion && !isFavorite) {
      checkFavorite(currentQuestion.id)
    }
  }, [currentIndex, questions.length])

  const initPage = async () => {
    if (!isLoggedIn) {
      setShowLoginDialog(true)
    } else {
      loadQuestions()
    }
  }

  const loadQuestions = async () => {
    try {
      setLoading(true)
      if (questionId) {
        const res = await Network.request({ url: '/api/questions/' + questionId })
        console.log('single question:', res.data)
        if (res.data?.data) {
          setQuestions([res.data.data])
        }
      } else {
        let url = '/api/questions'
        const params: Record<string, string> = {}
        if (mode === 'history') {
          url = '/api/questions/history'
          if (subjectId) params.subjectId = subjectId
        } else if (mode === 'wrong') {
          url = '/api/stats/wrong-questions'
          if (subjectId) params.subjectId = subjectId
        } else {
          if (subjectId) params.subjectId = subjectId
          if (type) params.type = type
        }
        const res = await Network.request({ url, data: params })
        console.log('questions list:', res.data)
        setQuestions(res.data?.data || [])
      }
    } catch (e) {
      console.error('loadQuestions error:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    setLoginLoading(true)
    try {
      const result = await loginWithProfile()
      if (result.success) {
        setShowLoginDialog(false)
        loadQuestions()
      } else {
        Taro.showToast({
          title: result.message || '登录失败',
          icon: 'none',
        })
      }
    } catch (e) {
      console.error('login error:', e)
      Taro.showToast({
        title: '登录失败，请重试',
        icon: 'none',
      })
    } finally {
      setLoginLoading(false)
    }
  }

  const checkFavorite = async (qId: string) => {
    if (!user?.id) return
    try {
      const res = await Network.request({ url: '/api/questions/' + qId + '/favorite?userId=' + user.id })
      setIsFavorite(res.data?.data?.isFavorite || false)
    } catch (e) {
      console.error('checkFavorite error:', e)
    }
  }

  const toggleFavorite = async () => {
    if (!isLoggedIn) {
      setShowLoginDialog(true)
      return
    }
    try {
      const res = await Network.request({
        url: '/api/questions/' + currentQuestion.id + '/favorite',
        method: 'POST',
        data: { userId: user?.id },
      })
      setIsFavorite(res.data?.data?.isFavorite || false)
    } catch (e) {
      console.error('toggleFavorite error:', e)
    }
  }

  const currentQuestion = questions[currentIndex]

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      setShowLoginDialog(true)
      return
    }
    if (!currentQuestion || submitting) return

    const userAnswer = currentQuestion.type === 'short' ? shortAnswer : selectedAnswer
    if (!userAnswer) return

    setSubmitting(true)
    submittedRef.current = true

    try {
      const res = await Network.request({
        url: '/api/answers',
        method: 'POST',
        data: {
          questionId: currentQuestion.id,
          answer: userAnswer,
          mode,
          userId: user?.id,
        },
      })
      console.log('submit answer:', res.data)
      const result = res.data?.data
      const correct = result?.isCorrect || false
      setIsCorrect(correct)
      setShowResult(true)
      setAnsweredCount((prev) => prev + 1)
      if (correct) setCorrectCount((prev) => prev + 1)
    } catch (e) {
      console.error('submit error:', e)
    } finally {
      setSubmitting(false)
    }
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setSelectedAnswer('')
      setShortAnswer('')
      setShowResult(false)
      setIsFavorite(false)
      submittedRef.current = false
      setTimeout(() => {
        if (questions[currentIndex + 1]) {
          checkFavorite(questions[currentIndex + 1].id)
        }
      }, 100)
    } else {
      // 完成所有题目，跳转结果页
      Taro.redirectTo({
        url: '/pages/result/index?total=' + questions.length +
          '&correct=' + correctCount +
          '&mode=' + mode,
      })
    }
  }

  const handleOptionSelect = (label: string) => {
    if (showResult || submittedRef.current) return
    setSelectedAnswer(label)
  }

  const handleFinish = () => {
    Taro.redirectTo({
      url: '/pages/result/index?total=' + answeredCount +
        '&correct=' + correctCount +
        '&mode=' + mode,
    })
  }

  if (showLoginDialog) {
    return (
      <View className="min-h-full bg-slate-100 flex items-center justify-center">
        <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <View className="flex flex-col items-center">
                <View className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <User size={32} color="#2563EB" />
                </View>
                <DialogTitle className="text-lg font-bold text-center">请先登录</DialogTitle>
                <DialogDescription className="text-center mt-2">
                  需要登录后才能进行刷题
                </DialogDescription>
              </View>
            </DialogHeader>
            <DialogFooter className="flex flex-col gap-3">
              <Button className="w-full bg-blue-600" onClick={handleLogin} disabled={loginLoading}>
                <Text>{loginLoading ? '登录中...' : '微信登录'}</Text>
              </Button>
              <Button variant="outline" className="w-full" onClick={() => Taro.navigateBack()}>
                <Text>返回</Text>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </View>
    )
  }

  if (loading) {
    return (
      <View className="min-h-full bg-slate-50 p-4">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-6" />
        <Skeleton className="h-12 w-full mb-3" />
        <Skeleton className="h-12 w-full mb-3" />
        <Skeleton className="h-12 w-full" />
      </View>
    )
  }

  if (!currentQuestion) {
    return (
      <View className="min-h-full bg-slate-50 flex flex-col items-center justify-center p-4">
        <Text className="block text-slate-400 text-sm">暂无题目</Text>
        <Button className="mt-4 bg-blue-600 text-white" onClick={() => Taro.navigateBack()}>
          <Text>返回</Text>
        </Button>
      </View>
    )
  }

  const progressValue = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0

  return (
    <View className="min-h-full bg-slate-50 flex flex-col">
      {/* 顶部进度 */}
      <View className="bg-white px-4 py-3 shadow-sm">
        <View className="flex items-center justify-between mb-2">
          <Text className="text-xs text-slate-500">
            {currentIndex + 1} / {questions.length}
          </Text>
          <Badge variant="secondary" className="text-xs">
            {currentQuestion.type === 'choice' ? '选择题' : currentQuestion.type === 'judge' ? '判断题' : '简答题'}
          </Badge>
        </View>
        <Progress value={progressValue} className="h-2" />
      </View>

      {/* 题目内容 */}
      <View className="flex-1 px-4 py-4 overflow-auto">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <View className="flex items-start justify-between gap-3">
              <Text className="flex-1 text-base text-slate-800 leading-relaxed font-medium">
                {currentQuestion.content}
              </Text>
              <View
                className="flex-shrink-0 mt-1 active:opacity-70"
                onClick={toggleFavorite}
              >
                <Star size={20} color={isFavorite ? '#FBBF24' : '#CBD5E1'} />
              </View>
            </View>
          </CardContent>
        </Card>

        {/* 选项区域 */}
        {currentQuestion.type === 'short' ? (
          <View className="mt-4">
            <View className="bg-white rounded-xl p-4">
              <Text className="block text-xs text-slate-400 mb-2">请输入你的答案：</Text>
              <View className="bg-slate-50 rounded-xl p-3">
                <Textarea
                  style={{ width: '100%', minHeight: '120px', backgroundColor: 'transparent' }}
                  placeholder="在此输入你的答案..."
                  value={shortAnswer}
                  onInput={(e) => setShortAnswer(e.detail.value)}
                  disabled={showResult}
                  maxlength={500}
                />
              </View>
            </View>
          </View>
        ) : (
          <View className="mt-4 space-y-3">
            {currentQuestion.options?.map((option) => {
              const isSelected = selectedAnswer === option.label
              const isAnswer = showResult && currentQuestion.answer === option.label
              const isWrong = showResult && isSelected && !isCorrect

              let optionStyle = 'bg-white border-slate-200'
              if (isSelected && !showResult) optionStyle = 'bg-blue-50 border-blue-300'
              if (isAnswer) optionStyle = 'bg-emerald-50 border-emerald-300'
              if (isWrong) optionStyle = 'bg-red-50 border-red-300'

              return (
                <View
                  key={option.label}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${optionStyle}`}
                  onClick={() => handleOptionSelect(option.label)}
                >
                  <View
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
                      isSelected && !showResult
                        ? 'border-blue-500 text-blue-600 bg-blue-100'
                        : isAnswer
                          ? 'border-emerald-500 text-emerald-600 bg-emerald-100'
                          : isWrong
                            ? 'border-red-500 text-red-600 bg-red-100'
                            : 'border-slate-300 text-slate-500'
                    }`}
                  >
                    {option.label}
                  </View>
                  <Text className="flex-1 text-sm text-slate-700">{option.content}</Text>
                  {isAnswer && <CircleCheck size={18} color="#059669" />}
                  {isWrong && <CircleX size={18} color="#DC2626" />}
                </View>
              )
            })}
          </View>
        )}

        {/* 解析区域 */}
        {showResult && (
          <View className="mt-4">
            <Card className={`border-0 ${isCorrect ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <CardContent className="p-4">
                <View className="flex items-center gap-2 mb-2">
                  {isCorrect ? (
                    <CircleCheck size={18} color="#059669" />
                  ) : (
                    <CircleX size={18} color="#DC2626" />
                  )}
                  <Text className={`block text-sm font-semibold ${isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
                    {isCorrect ? '回答正确' : '回答错误'}
                  </Text>
                </View>
                <Text className="block text-xs text-slate-500 mb-1">
                  正确答案：{currentQuestion.answer}
                </Text>
                <Text className="block text-sm text-slate-600 leading-relaxed mt-2">
                  {currentQuestion.analysis}
                </Text>
              </CardContent>
            </Card>
          </View>
        )}
      </View>

      {/* 底部操作栏 */}
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
        {!showResult ? (
          <>
            <View style={{ flex: 1 }}>
              <Button
                className="w-full bg-slate-100 text-slate-600 h-11 rounded-xl"
                onClick={handleFinish}
              >
                <Text className="text-sm">交卷</Text>
              </Button>
            </View>
            <View style={{ flex: 2 }}>
              <Button
                className="w-full bg-blue-600 text-white h-11 rounded-xl"
                onClick={handleSubmit}
                disabled={!selectedAnswer && !shortAnswer}
              >
                <Text className="text-sm font-medium">提交答案</Text>
              </Button>
            </View>
          </>
        ) : (
          <View style={{ flex: 1 }}>
            <Button
              className="w-full bg-blue-600 text-white h-11 rounded-xl"
              onClick={handleNext}
            >
              <Text className="text-sm font-medium">
                {currentIndex < questions.length - 1 ? '下一题' : '查看结果'}
              </Text>
            </Button>
          </View>
        )}
      </View>
    </View>
  )
}

export default PracticePage