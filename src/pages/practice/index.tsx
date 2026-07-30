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
import { useUserStore } from '@/store/user'
import { LoginDialog } from '@/components/LoginDialog'
import { CircleCheck, CircleX, Star, Clock } from 'lucide-react-taro'

interface Question {
  id: string
  content: string
  type: string
  options?: { label: string; content: string }[]
  answer: string
  analysis: string
  difficulty: string
  subjectName: string
  answered?: boolean
  userAnswer?: string | null
  isCorrect?: boolean
}

const PracticePage = () => {
  const router = useRouter()
  const { mode = 'practice', subjectId = '', questionId = '', type = '', difficulty = '', sessionId = '', continue: continueMode = '' } = router.params

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
  const [aiAnalysis, setAiAnalysis] = useState('')
  const [score, setScore] = useState(0)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [isContinueMode, setIsContinueMode] = useState(false)
  const { isLoggedIn, user } = useUserStore()
  const submittedRef = useRef(false)

  useEffect(() => {
    initPage()
  }, [])

  useEffect(() => {
    if (currentQuestion && !isFavorite) {
      checkFavorite(currentQuestion.id)
    }
    // 如果是继续作答模式且当前题目已答，自动显示答案
    if (currentQuestion?.answered && !showResult) {
      setSelectedAnswer(currentQuestion.userAnswer || '')
      setIsCorrect(currentQuestion.isCorrect || false)
      setShowResult(true)
      submittedRef.current = true
    }
  }, [currentIndex, questions.length])

  const initPage = async () => {
    console.log("isloggedin:",isLoggedIn)
    if (!isLoggedIn) {
      setShowLoginDialog(true)
    } else if (continueMode === '1' && sessionId) {
      // 继续作答模式
      setCurrentSessionId(sessionId)
      setIsContinueMode(true)
      loadRemainingQuestions(sessionId)
    } else {
      loadQuestions()
    }
  }

  // 加载场次完整题目列表（含答题状态）
  const loadRemainingQuestions = async (sid: string) => {
    try {
      setLoading(true)
      const res = await Network.request({
        url: `/api/sessions/${sid}/questions`,
      })
      const data = res.data?.data
      if (data?.questions && data.questions.length > 0) {
        // 保存完整题目列表
        const qList = data.questions.map((q: any) => ({
          id: q.id,
          content: q.content,
          type: q.type,
          options: q.options,
          answer: q.answer,
          analysis: q.analysis,
          difficulty: q.difficulty,
          subjectName: q.subjectName,
          answered: q.answered,
          userAnswer: q.userAnswer,
          isCorrect: q.isCorrect,
        }))
        setQuestions(qList)
        
        // 恢复进度：设置到第一个未答题目的位置
        const nextIdx = data.nextIndex || 0
        setCurrentIndex(nextIdx)
        
        // 恢复已答题数和正确数
        const newAnsweredCount = qList.filter((q: Question) => q.answered).length
        const newCorrectCount = qList.filter((q: Question) => q.isCorrect).length
        setAnsweredCount(newAnsweredCount)
        setCorrectCount(newCorrectCount)
        
        console.log('[Session] 恢复进度: 总题数', qList.length, '下一题索引:', nextIdx, '已答:', newAnsweredCount, '正确:', newCorrectCount)
      } else {
        // 没有题目
        Taro.showToast({ title: '该场次无题目', icon: 'none' })
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      }
    } catch (e) {
      console.error('load remaining error:', e)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  // 创建考试场次
  const createSession = async (questionList: Question[]) => {
    if (!isLoggedIn || !user?.id) return
    try {
      const res = await Network.request({
        url: '/api/sessions/start',
        method: 'POST',
        data: {
          userId: user.id,
          mode,
          subjectId: subjectId || undefined,
          subjectName: questionList[0]?.subjectName || undefined,
          totalQuestions: questionList.length,
          questionIds: questionList.map(q => q.id),
        },
      })
      const newSessionId = res.data?.data?.id
      if (newSessionId) {
        setCurrentSessionId(newSessionId)
        console.log('[Session] 创建场次:', newSessionId, '题目数:', questionList.length)
      }
    } catch (e) {
      console.warn('[Session] 创建场次失败（不影响答题）:', e)
    }
  }

  // 完成考试场次
  const completeSession = async () => {
    if (!currentSessionId) return
    try {
      await Network.request({
        url: `/api/sessions/${currentSessionId}/complete`,
        method: 'POST',
      })
      console.log('[Session] 完成场次:', currentSessionId)
    } catch (e) {
      console.warn('[Session] 完成场次失败:', e)
    }
  }

  const loadQuestions = async () => {
    try {
      setLoading(true)
      let loadedQuestions: Question[] = []
      
      if (questionId) {
        const res = await Network.request({ url: '/api/questions/' + questionId })
        console.log('single question:', res.data)
        if (res.data?.data) {
          loadedQuestions = [res.data.data]
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
          if (difficulty) params.difficulty = difficulty
        }
        const res = await Network.request({ url, data: params })
        console.log('questions list:', res.data)
        loadedQuestions = res.data?.data || []
      }
      
      setQuestions(loadedQuestions)
      
      // 题目加载完成后，创建考试场次
      if (loadedQuestions.length > 0) {
        await createSession(loadedQuestions)
      }
    } catch (e) {
      console.error('loadQuestions error:', e)
    } finally {
      setLoading(false)
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
          sessionId: currentSessionId || undefined,
        },
      })
      console.log('submit answer:', res.data)
      const result = res.data?.data
      const correct = result?.isCorrect || false
      setIsCorrect(correct)
      setShowResult(true)
      setAnsweredCount((prev) => prev + 1)
      if (correct) setCorrectCount((prev) => prev + 1)
      setAiAnalysis(result?.aiAnalysis || '')
      setScore(result?.score || 0)
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
      setAiAnalysis('')
      setScore(0)
      submittedRef.current = false
      setTimeout(() => {
        if (questions[currentIndex + 1]) {
          checkFavorite(questions[currentIndex + 1].id)
        }
      }, 100)
    } else {
      // 完成所有题目，先标记场次完成再跳转
      completeSession()
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
    // 提前结束时也标记场次完成
    completeSession()
    Taro.redirectTo({
      url: '/pages/result/index?total=' + answeredCount +
        '&correct=' + correctCount +
        '&mode=' + mode,
    })
  }

  if (showLoginDialog) {
    return (
      <View className="min-h-full bg-slate-100 flex items-center justify-center">
        <LoginDialog
          open={showLoginDialog}
          onOpenChange={setShowLoginDialog}
          title="请先登录"
          description="需要登录后才能进行刷题"
          allowSkip={false}
          onLoginSuccess={loadQuestions}
        />
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
      {isContinueMode && (
        <View className="bg-amber-50 px-4 py-2 flex items-center gap-2">
          <Clock size={14} color="#F59E0B" />
          <Text className="block text-xs text-amber-700">继续上次未完成的练习</Text>
        </View>
      )}
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
          <View className="mt-4 space-y-4 pb-24">
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
                  {score > 0 && (
                    <Badge className="ml-auto bg-blue-500 text-white">
                      {score}分
                    </Badge>
                  )}
                </View>
                <Text className="block text-xs text-slate-500 mb-1">
                  正确答案：{currentQuestion.answer}
                </Text>
                {currentQuestion.analysis && (
                  <Text className="block text-sm text-slate-600 leading-relaxed mt-2">
                    {currentQuestion.analysis}
                  </Text>
                )}
              </CardContent>
            </Card>

            {aiAnalysis && (
              <Card className="border-0 bg-blue-50">
                <CardContent className="p-4">
                  <Text className="block text-xs font-semibold text-blue-700 mb-2">AI解析</Text>
                  <Text className="block text-sm text-slate-600 leading-relaxed">
                    {aiAnalysis}
                  </Text>
                </CardContent>
              </Card>
            )}
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