import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Network } from '@/network'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useUserStore } from '@/store/user'
import { LoginDialog } from '@/components/LoginDialog'
import { BookOpen, Clock } from 'lucide-react-taro'

interface Subject {
  id: string
  name: string
  questionCount: number
}

const ExamSelectPage = () => {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [questionCount, setQuestionCount] = useState(20)
  const [loading, setLoading] = useState(true)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const { isLoggedIn } = useUserStore()

  useEffect(() => {
    initPage()
  }, [])

  const initPage = async () => {
    if (!isLoggedIn) {
      setShowLoginDialog(true)
      return
    }
    loadSubjects()
  }

  const loadSubjects = async () => {
    try {
      setLoading(true)
      const res = await Network.request({ url: '/api/subjects' })
      console.log('subjects:', res.data)
      setSubjects(res.data?.data || [])
      if (res.data?.data?.length > 0) {
        setSelectedSubject(res.data.data[0].id)
      }
    } catch (e) {
      console.error('loadSubjects error:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleStartExam = () => {
    if (!selectedSubject) {
      Taro.showToast({ title: '请选择科目', icon: 'none' })
      return
    }
    Taro.navigateTo({
      url: `/pages/exam/index?subjectId=${selectedSubject}&count=${questionCount}`,
    })
  }

  if (showLoginDialog) {
    return (
      <View className="min-h-full bg-slate-100 flex items-center justify-center">
        <LoginDialog
          open={showLoginDialog}
          onOpenChange={setShowLoginDialog}
          title="请先登录"
          description="需要登录后才能进行模拟考试"
          allowSkip={false}
          onLoginSuccess={loadSubjects}
        />
      </View>
    )
  }

  return (
    <View className="min-h-full bg-slate-50 pb-24">
      <View className="bg-amber-600 px-4 pt-8 pb-6 rounded-b-3xl">
        <Text className="block text-white text-xl font-bold">模拟考试</Text>
        <Text className="block text-amber-100 text-xs mt-1">选择科目和题目数量开始考试</Text>
      </View>

      <View className="px-4 mt-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <View className="flex items-center gap-2 mb-3">
              <BookOpen size={16} color="#D97706" />
              <Text className="block text-sm font-semibold text-slate-800">选择科目</Text>
            </View>
            {loading ? (
              <View className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </View>
            ) : (
              <View className="grid grid-cols-2 gap-3">
                {subjects.map((subject) => (
                  <View
                    key={subject.id}
                    className={`p-3 rounded-xl border-2 transition-colors ${
                      selectedSubject === subject.id
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-slate-200 bg-white active:bg-slate-50'
                    }`}
                    onClick={() => setSelectedSubject(subject.id)}
                  >
                    <Text className="block text-sm font-medium text-slate-800">{subject.name}</Text>
                    <Text className="block text-xs text-slate-400 mt-1">{subject.questionCount}题</Text>
                  </View>
                ))}
              </View>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm mt-4">
          <CardContent className="p-4">
            <View className="flex items-center gap-2 mb-3">
              <Clock size={16} color="#D97706" />
              <Text className="block text-sm font-semibold text-slate-800">题目数量</Text>
            </View>
            <View className="flex gap-2">
              {[10, 20, 30, 50].map((count) => (
                <Button
                  key={count}
                  variant={questionCount === count ? 'default' : 'outline'}
                  className={`flex-1 h-10 rounded-lg text-sm ${
                    questionCount === count ? 'bg-amber-600 text-white' : 'bg-white text-slate-600'
                  }`}
                  onClick={() => setQuestionCount(count)}
                >
                  <Text>{count}题</Text>
                </Button>
              ))}
            </View>
          </CardContent>
        </Card>

        <View className="mt-6">
          <Button
            className="w-full bg-amber-600 text-white h-12 rounded-xl"
            onClick={handleStartExam}
            disabled={!selectedSubject}
          >
            <Text className="text-base font-medium">开始考试</Text>
          </Button>
        </View>
      </View>
    </View>
  )
}

export default ExamSelectPage