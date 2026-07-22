import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Network } from '@/network'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useUserStore } from '@/store/user'
import { requireLogin } from '@/utils/auth'
import { CircleAlert, BookOpen, ChevronRight, User } from 'lucide-react-taro'

interface Subject {
  id: string
  name: string
  questionCount: number
}

interface Question {
  id: string
  content: string
  type: string
  subjectId: string
  subjectName: string
  difficulty: string
}

const TYPE_LABELS: Record<string, string> = {
  choice: '选择题',
  judge: '判断题',
  short: '简答题',
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-emerald-50 text-emerald-700',
  medium: 'bg-amber-50 text-amber-700',
  hard: 'bg-red-50 text-red-700',
}

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
}

const WrongPage = () => {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [loading, setLoading] = useState(true)
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const { isLoggedIn } = useUserStore()

  useEffect(() => {
    initPage()
  }, [])

  useEffect(() => {
    if (selectedSubject) {
      loadWrongQuestions()
    }
  }, [selectedSubject])

  const initPage = async () => {
    if (!isLoggedIn) {
      setShowLoginDialog(true)
    } else {
      loadSubjects()
    }
  }

  const handleLogin = async () => {
    setLoginLoading(true)
    try {
      const success = await requireLogin()
      if (success) {
        setShowLoginDialog(false)
        loadSubjects()
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

  const loadSubjects = async () => {
    try {
      setLoading(true)
      const res = await Network.request({ url: '/api/subjects' })
      setSubjects(res.data?.data || [])
      if ((res.data?.data || []).length > 0) {
        setSelectedSubject((res.data?.data || [])[0].id)
      }
    } catch (e) {
      console.error('loadSubjects error:', e)
    } finally {
      setLoading(false)
    }
  }

  const loadWrongQuestions = async () => {
    try {
      setQuestionsLoading(true)
      const params: Record<string, string> = { subjectId: selectedSubject }
      const res = await Network.request({ url: '/api/stats/wrong-questions', data: params })
      setQuestions(res.data?.data || [])
    } catch (e) {
      console.error('loadWrongQuestions error:', e)
    } finally {
      setQuestionsLoading(false)
    }
  }

  const handleQuestionClick = (questionId: string) => {
    Taro.navigateTo({
      url: '/pages/practice/index?mode=wrong&questionId=' + questionId + '&subjectId=' + selectedSubject,
    })
  }

  const handleStartPractice = () => {
    if (!selectedSubject) return
    Taro.navigateTo({
      url: '/pages/practice/index?mode=wrong&subjectId=' + selectedSubject,
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
                  需要登录后才能查看错题本
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

  return (
    <View className="min-h-full bg-slate-50 pb-20">
      <View className="bg-red-600 px-4 pt-6 pb-4">
        <View className="flex items-center gap-2">
          <CircleAlert size={20} color="#FFFFFF" />
          <Text className="block text-white text-lg font-bold">错题本</Text>
        </View>
        <Text className="block text-red-100 text-xs mt-1">记录错题，针对性复习，巩固薄弱知识</Text>
      </View>

      <View className="bg-white px-4 pt-4 pb-2">
        <Text className="block text-base font-semibold text-slate-800 mb-3">选择科目</Text>
        {loading ? (
          <View className="flex gap-2 flex-wrap">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-full" />
            ))}
          </View>
        ) : (
          <View className="flex gap-2 flex-wrap">
            {subjects.map((subject) => (
              <View
                key={subject.id}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedSubject === subject.id
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-100 text-slate-600 active:bg-slate-200'
                }`}
                onClick={() => setSelectedSubject(subject.id)}
              >
                {subject.name}
              </View>
            ))}
          </View>
        )}
      </View>

      <View className="px-4 mt-3">
        <Button
          className="w-full bg-red-600 text-white h-10 rounded-xl"
          onClick={handleStartPractice}
          disabled={questions.length === 0}
        >
          <Text className="text-sm font-medium">重新练习错题</Text>
        </Button>
      </View>

      <View className="px-4 mt-4">
        <View className="flex items-center justify-between mb-3">
          <View className="flex items-center gap-2">
            <BookOpen size={16} color="#DC2626" />
            <Text className="block text-base font-semibold text-slate-800">错题列表</Text>
          </View>
          <Text className="text-xs text-slate-400">共{questions.length}题</Text>
        </View>
        {questionsLoading ? (
          <View className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </View>
        ) : questions.length === 0 ? (
          <View className="flex flex-col items-center py-12">
            <CircleAlert size={40} color="#CBD5E1" />
            <Text className="block text-sm text-slate-400 mt-3">暂无错题</Text>
            <Text className="block text-xs text-slate-300 mt-1">继续刷题，错题会自动记录到这里</Text>
          </View>
        ) : (
          <View className="space-y-3">
            {questions.map((q, index) => (
              <Card
                key={q.id}
                className="border-0 shadow-sm active:bg-slate-50"
                onClick={() => handleQuestionClick(q.id)}
              >
                <CardContent className="p-4">
                  <View className="flex items-center gap-2 mb-2">
                    <Text className="text-xs font-medium text-slate-400">#{index + 1}</Text>
                    <Badge variant="secondary" className="text-xs">
                      {TYPE_LABELS[q.type] || q.type}
                    </Badge>
                    <Badge className={`text-xs ${DIFFICULTY_COLORS[q.difficulty] || 'bg-slate-100 text-slate-600'}`}>
                      {DIFFICULTY_LABELS[q.difficulty] || q.difficulty}
                    </Badge>
                  </View>
                  <Text className="block text-sm text-slate-700 leading-relaxed line-clamp-2">{q.content}</Text>
                  <View className="flex items-center justify-end mt-2">
                    <ChevronRight size={14} color="#94A3B8" />
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        )}
      </View>
    </View>
  )
}

export default WrongPage