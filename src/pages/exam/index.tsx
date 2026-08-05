import { useState, useEffect, useRef, useCallback } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useRouter, useUnload } from '@tarojs/taro'
import { Network } from '@/network'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useUserStore } from '@/store/user'
import { loginWithProfile } from '@/utils/auth'
import { Clock, CircleAlert, User, CircleCheck } from 'lucide-react-taro'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'

interface Question {
  id: string
  content: string
  type: string
  options?: { label: string; content: string }[]
}

const ExamPage = () => {
  const router = useRouter()
  const { subjectId = '', count = '20', duration = '30', sessionId = '', continue: continueMode = '' } = router.params

  const initialDuration = parseInt(duration) * 60

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [multiAnswers, setMultiAnswers] = useState<Record<string, string[]>>({})
  const [shortAnswers, setShortAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState(initialDuration)
  const [loading, setLoading] = useState(true)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [isContinueMode, setIsContinueMode] = useState(false)
  const { isLoggedIn, user } = useUserStore()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const saveProgressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 保存考试进度（剩余时间）
  const saveExamProgress = useCallback(async () => {
    if (!currentSessionId || submitting) return
    try {
      await Network.request({
        url: `/api/sessions/${currentSessionId}/update`,
        method: 'POST',
        data: { remainingTime: timeLeft },
      })
      console.log('[Exam] 保存进度: remainingTime=', timeLeft)
    } catch (e) {
      console.warn('[Exam] 保存进度失败:', e)
    }
  }, [currentSessionId, timeLeft, submitting])

  useEffect(() => {
    initPage()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (saveProgressTimerRef.current) clearInterval(saveProgressTimerRef.current)
    }
  }, [])

  // 定时保存进度（每30秒）
  useEffect(() => {
    if (!loading && currentSessionId && questions.length > 0) {
      saveProgressTimerRef.current = setInterval(() => {
        saveExamProgress()
      }, 30000)
    }
    return () => {
      if (saveProgressTimerRef.current) clearInterval(saveProgressTimerRef.current)
    }
  }, [loading, currentSessionId, questions, saveExamProgress])

  // 页面卸载时保存进度
  useUnload(() => {
    if (currentSessionId && !submitting) {
      // 使用同步请求保存进度
      saveExamProgress()
    }
  })

  useEffect(() => {
    if (!loading && questions.length > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current)
            handleSubmitExam()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [loading, questions])

  const initPage = async () => {
    if (!isLoggedIn) {
      setShowLoginDialog(true)
    } else if (continueMode === '1' && sessionId) {
      // 继续作答模式
      setCurrentSessionId(sessionId)
      setIsContinueMode(true)
      loadSessionQuestions(sessionId)
    } else {
      loadExamQuestions()
    }
  }

  // 加载场次完整题目列表并恢复状态
  const loadSessionQuestions = async (sid: string) => {
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
          answered: q.answered,
          userAnswer: q.userAnswer,
        }))
        setQuestions(qList)
        
        // 恢复答案
        const savedAnswers: Record<string, string> = {}
        const savedShortAnswers: Record<string, string> = {}
        const savedMultiAnswers: Record<string, string[]> = {}
        data.questions.forEach((q: any) => {
          if (q.answered && q.userAnswer) {
            savedAnswers[q.id] = q.userAnswer
            if (q.type === 'short') {
              savedShortAnswers[q.id] = q.userAnswer
            } else if (q.type === 'multi') {
              savedMultiAnswers[q.id] = q.userAnswer.split(',').map((s: string) => s.trim())
            }
          }
        })
        setAnswers(savedAnswers)
        setShortAnswers(savedShortAnswers)
        setMultiAnswers(savedMultiAnswers)
        
        // 恢复进度
        const nextIdx = data.nextIndex || 0
        setCurrentIndex(nextIdx)
        
        // 恢复计时器：优先使用 remainingTime，否则使用 duration - elapsedTime
        const sessionRemainingTime = data.session?.remainingTime
        const sessionDuration = data.session?.duration || initialDuration
        const sessionElapsedTime = data.session?.elapsedTime || 0
        const remaining = sessionRemainingTime && sessionRemainingTime > 0 
          ? sessionRemainingTime 
          : Math.max(0, sessionDuration - sessionElapsedTime)
        setTimeLeft(remaining)
        
        console.log('[Exam] 恢复进度: 总题数', qList.length, '下一题:', nextIdx, '剩余时间:', remaining, '秒')
      } else {
        Taro.showToast({ title: '该场次无题目', icon: 'none' })
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      }
    } catch (e) {
      console.error('load session questions error:', e)
      Taro.showToast({ title: '加载失败', icon: 'none' })
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
        loadExamQuestions()
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

  const loadExamQuestions = async () => {
    try {
      setLoading(true)
      const res = await Network.request({
        url: '/api/exam/start',
        method: 'POST',
        data: {
          subjectId,
          duration: parseInt(duration) * 60,
          questionCount: parseInt(count),
          userId: user?.id,
        },
      })
      console.log('exam start:', res.data)
      const examData = res.data?.data
      if (examData?.questions) {
        setQuestions(examData.questions)
      }
      if (examData?.sessionId) {
        setCurrentSessionId(examData.sessionId)
        console.log('[Session] 模拟考试场次:', examData.sessionId)
      }
    } catch (e) {
      console.error('loadExamQuestions error:', e)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s)
  }

  const saveAnswerProgress = async (questionId: string, answer: string) => {
    if (!currentSessionId || !answer) return
    try {
      await Network.request({
        url: '/api/exam/save-answer',
        method: 'POST',
        data: {
          sessionId: currentSessionId,
          questionId,
          answer,
          userId: user?.id,
        },
      })
    } catch (e) {
      console.warn('[Exam] 保存答案失败:', e)
    }
  }

  const handleSelectAnswer = (questionId: string, label: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: label }))
    saveAnswerProgress(questionId, label)
  }

  const handleMultiSelectAnswer = (questionId: string, label: string) => {
    setMultiAnswers((prev) => {
      const current = prev[questionId] || []
      const index = current.indexOf(label)
      let newAnswers: string[]
      if (index > -1) {
        newAnswers = current.filter((l) => l !== label)
      } else {
        newAnswers = [...current, label]
      }
      const joined = newAnswers.join(',')
      setAnswers((prev2) => ({ ...prev2, [questionId]: joined }))
      if (joined) saveAnswerProgress(questionId, joined)
      return { ...prev, [questionId]: newAnswers }
    })
  }

  const handleShortAnswer = (questionId: string, value: string) => {
    setShortAnswers((prev) => ({ ...prev, [questionId]: value }))
    if (value.trim()) {
      setAnswers((prev) => ({ ...prev, [questionId]: value }))
      saveAnswerProgress(questionId, value)
    }
  }

  const handleSubmitExam = useCallback(async () => {
    if (!isLoggedIn) {
      setShowLoginDialog(true)
      return
    }
    if (submitting) return
    setSubmitting(true)
    if (timerRef.current) clearInterval(timerRef.current)

    try {
      const timeUsed = initialDuration - timeLeft
      
      // 更新场次的 elapsedTime
      if (currentSessionId) {
        try {
          await Network.request({
            url: `/api/sessions/${currentSessionId}/update`,
            method: 'POST',
            data: { addElapsedTime: timeUsed },
          })
          console.log('[Exam] 更新 elapsedTime:', timeUsed)
        } catch (e) {
          console.warn('[Exam] 更新 elapsedTime 失败:', e)
        }
      }

      const res = await Network.request({
        url: '/api/exam/submit',
        method: 'POST',
        data: {
          subjectId,
          answers: Object.entries(answers).map(([questionId, answer]) => ({
            questionId,
            answer,
          })),
          timeUsed,
          userId: user?.id,
          sessionId: currentSessionId || undefined,
        },
      })
      console.log('exam submit:', res.data)
      const result = res.data?.data
      Taro.redirectTo({
        url: '/pages/result/index?total=' + (result?.total || questions.length) +
          '&correct=' + (result?.correct || 0) +
          '&score=' + (result?.score || 0) +
          '&mode=exam' +
          '&timeUsed=' + (result?.timeUsed || timeUsed),
      })
    } catch (e) {
      console.error('submit exam error:', e)
      setSubmitting(false)
    }
  }, [answers, timeLeft, questions, subjectId, submitting, isLoggedIn])

  const currentQuestion = questions[currentIndex]
  const answeredCount = Object.keys(answers).length
  const progressValue = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0
  const isTimeWarning = timeLeft < 5 * 60

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
                  需要登录后才能进行模拟考试
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
        <Skeleton className="h-10 w-full mb-4 rounded-xl" />
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-6" />
        <Skeleton className="h-12 w-full mb-3" />
        <Skeleton className="h-12 w-full mb-3" />
      </View>
    )
  }

  return (
    <View className="min-h-full bg-slate-50 flex flex-col">
      {/* 继续作答提示 */}
      {isContinueMode && (
        <View className="bg-amber-50 px-4 py-2 flex items-center gap-2">
          <Clock size={14} color="#F59E0B" />
          <Text className="block text-xs text-amber-700">继续上次未完成的考试</Text>
        </View>
      )}
      {/* 顶部信息栏 */}
      <View className={`px-4 py-3 shadow-sm ${isTimeWarning ? 'bg-red-50' : 'bg-white'}`}>
        <View className="flex items-center justify-between mb-2">
          <View className={`flex items-center gap-1 ${isTimeWarning ? 'text-red-600' : 'text-slate-600'}`}>
            <Clock size={14} color={isTimeWarning ? '#DC2626' : '#64748B'} />
            <Text className="text-sm font-medium">{formatTime(timeLeft)}</Text>
          </View>
          <View className="flex items-center gap-2">
            <Text className="text-xs text-slate-400">已答{answeredCount}/{questions.length}</Text>
            <Badge variant="secondary" className="text-xs">模拟考试</Badge>
          </View>
        </View>
        <Progress value={progressValue} className="h-1" />
      </View>

      {/* 答题卡导航 */}
      <View className="bg-white px-4 py-2 border-b border-slate-100">
        <View className="flex gap-1.5 flex-wrap">
          {questions.map((q, index) => {
            const isAnswered = !!answers[q.id]
            const isCurrent = index === currentIndex
            let btnStyle = 'bg-slate-100 text-slate-500'
            if (isCurrent) btnStyle = 'bg-blue-600 text-white'
            else if (isAnswered) btnStyle = 'bg-blue-100 text-blue-600'

            return (
              <View
                key={q.id}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium ${btnStyle}`}
                onClick={() => setCurrentIndex(index)}
              >
                {index + 1}
              </View>
            )
          })}
        </View>
      </View>

      {/* 题目内容 */}
      <View className="flex-1 px-4 py-4 overflow-auto pb-24">
        {currentQuestion && (
          <>
            <View className="flex items-center gap-2 mb-3">
              <Text className="text-sm font-medium text-slate-400">
                第{currentIndex + 1}题
              </Text>
              <Badge variant="secondary" className="text-xs">
                {currentQuestion.type === 'choice' ? '单选题' : currentQuestion.type === 'multi' ? '多选题' : currentQuestion.type === 'judge' ? '判断题' : '简答题'}
              </Badge>
            </View>
            <Card className="border-0 shadow-sm mb-4">
              <CardContent className="p-4">
                <MarkdownRenderer
                  content={currentQuestion.content}
                  className="text-base text-slate-800 leading-relaxed"
                />
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
                      value={shortAnswers[currentQuestion.id] || ''}
                      onInput={(e) => handleShortAnswer(currentQuestion.id, e.detail.value)}
                      maxlength={500}
                    />
                  </View>
                </View>
              </View>
            ) : currentQuestion.type === 'multi' ? (
              <View className="mt-4 space-y-3">
                <Text className="block text-xs text-slate-400 mb-1">本题为多选题，请选择所有正确选项</Text>
                {currentQuestion.options?.map((option) => {
                  const selectedList = multiAnswers[currentQuestion.id] || []
                  const isSelected = selectedList.includes(option.label)
                  return (
                    <View
                      key={option.label}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-colors ${
                        isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-200'
                      }`}
                      onClick={() => handleMultiSelectAnswer(currentQuestion.id, option.label)}
                    >
                      <View className={`w-8 h-8 rounded flex items-center justify-center text-sm font-medium border-2 flex-shrink-0 ${
                        isSelected ? 'border-blue-500 text-blue-600 bg-blue-100' : 'border-slate-300 text-slate-500'
                      }`}
                      >
                        {isSelected ? <CircleCheck size={16} color="#2563EB" /> : option.label}
                      </View>
                      <View className="flex-1 text-sm text-slate-700 overflow-hidden">
                        <MarkdownRenderer content={option.content} />
                      </View>
                    </View>
                  )
                })}
              </View>
            ) : (
              <View className="space-y-3">
                {currentQuestion.options?.map((option) => {
                  const isSelected = answers[currentQuestion.id] === option.label
                  return (
                    <View
                      key={option.label}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-colors ${
                        isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-200'
                      }`}
                      onClick={() => handleSelectAnswer(currentQuestion.id, option.label)}
                    >
                      <View className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 flex-shrink-0 ${
                        isSelected ? 'border-blue-500 text-blue-600 bg-blue-100' : 'border-slate-300 text-slate-500'
                      }`}
                      >
                        {option.label}
                      </View>
                      <View className="flex-1 text-sm text-slate-700 overflow-hidden">
                        <MarkdownRenderer content={option.content} />
                      </View>
                    </View>
                  )
                })}
              </View>
            )}
          </>
        )}
      </View>

      {/* 底部操作栏 */}
      <View style={{
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
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
          >
            <Text className="text-sm">上一题</Text>
          </Button>
        </View>
        {currentIndex < questions.length - 1 ? (
          <View style={{ flex: 1 }}>
            <Button
              className="w-full bg-blue-600 text-white h-11 rounded-xl"
              onClick={() => setCurrentIndex(currentIndex + 1)}
            >
              <Text className="text-sm font-medium">下一题</Text>
            </Button>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <Button
              className="w-full bg-amber-600 text-white h-11 rounded-xl"
              onClick={() => setShowSubmitDialog(true)}
            >
              <Text className="text-sm font-medium">交卷</Text>
            </Button>
          </View>
        )}
      </View>

      {/* 交卷确认弹窗 */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <View className="flex items-center gap-2">
                <CircleAlert size={18} color="#D97706" />
                <Text className="text-base">确认交卷</Text>
              </View>
            </DialogTitle>
            <DialogDescription>
              <View className="mt-2 space-y-2">
                <Text className="block text-sm text-slate-600">
                  共{questions.length}题，已答{answeredCount}题
                </Text>
                {answeredCount < questions.length && (
                  <Text className="block text-sm text-amber-600">
                    还有{questions.length - answeredCount}题未作答，确认交卷吗？
                  </Text>
                )}
              </View>
            </DialogDescription>
          </DialogHeader>
          <View className="flex gap-3 mt-4">
            <View className="flex-1">
              <Button
                className="w-full bg-slate-100 text-slate-600 h-10 rounded-xl"
                onClick={() => setShowSubmitDialog(false)}
              >
                <Text className="text-sm">继续答题</Text>
              </Button>
            </View>
            <View className="flex-1">
              <Button
                className="w-full bg-blue-600 text-white h-10 rounded-xl"
                onClick={() => {
                  setShowSubmitDialog(false)
                  handleSubmitExam()
                }}
              >
                <Text className="text-sm font-medium">确认交卷</Text>
              </Button>
            </View>
          </View>
        </DialogContent>
      </Dialog>
    </View>
  )
}

export default ExamPage