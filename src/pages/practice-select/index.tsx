import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Network } from '@/network'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useUserStore } from '@/store/user'
import { LoginDialog } from '@/components/LoginDialog'
import { BookOpen } from 'lucide-react-taro'

interface Subject {
  id: string
  name: string
  questionCount: number
}

const TYPE_OPTIONS = [
  { key: 'all', label: '全部题型' },
  { key: 'choice', label: '选择题' },
  { key: 'judge', label: '判断题' },
  { key: 'short', label: '简答题' },
]

const DIFFICULTY_OPTIONS = [
  { key: 'all', label: '全部难度' },
  { key: 'easy', label: '简单' },
  { key: 'medium', label: '中等' },
  { key: 'hard', label: '困难' },
]



const PracticeSelectPage = () => {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
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

  const handleStartPractice = () => {
    if (!selectedSubject) {
      Taro.showToast({ title: '请选择科目', icon: 'none' })
      return
    }
    let url = `/pages/practice/index?mode=practice&subjectId=${selectedSubject}`
    if (selectedType !== 'all') {
      url += `&type=${selectedType}`
    }
    if (selectedDifficulty !== 'all') {
      url += `&difficulty=${selectedDifficulty}`
    }
    Taro.navigateTo({ url })
  }

  if (showLoginDialog) {
    return (
      <View className="min-h-full bg-slate-100 flex items-center justify-center">
        <LoginDialog
          open={showLoginDialog}
          onOpenChange={setShowLoginDialog}
          title="请先登录"
          description="需要登录后才能进行专项练习"
          allowSkip={false}
          onLoginSuccess={loadSubjects}
        />
      </View>
    )
  }

  return (
    <View className="min-h-full bg-slate-50 pb-24">
      <View className="bg-blue-600 px-4 pt-8 pb-6 rounded-b-3xl">
        <Text className="block text-white text-xl font-bold">专项练习</Text>
        <Text className="block text-blue-100 text-xs mt-1">选择科目和题型开始练习</Text>
      </View>

      <View className="px-4 mt-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <View className="flex items-center gap-2 mb-3">
              <BookOpen size={16} color="#2563EB" />
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
                        ? 'border-blue-500 bg-blue-50'
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
            <Text className="block text-sm font-semibold text-slate-800 mb-3">选择题型</Text>
            <View className="flex flex-wrap gap-2">
              {TYPE_OPTIONS.map((type) => (
                <Button
                  key={type.key}
                  variant={selectedType === type.key ? 'default' : 'outline'}
                  className={`h-9 px-4 rounded-lg text-xs ${
                    selectedType === type.key ? 'bg-blue-600 text-white' : 'bg-white text-slate-600'
                  }`}
                  onClick={() => setSelectedType(type.key)}
                >
                  <Text>{type.label}</Text>
                </Button>
              ))}
            </View>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm mt-4">
          <CardContent className="p-4">
            <Text className="block text-sm font-semibold text-slate-800 mb-3">难度筛选（可选）</Text>
            <View className="flex flex-wrap gap-2">
              {DIFFICULTY_OPTIONS.map((diff) => (
                <Button
                  key={diff.key}
                  variant={selectedDifficulty === diff.key ? 'default' : 'outline'}
                  className={`h-9 px-4 rounded-lg text-xs ${
                    selectedDifficulty === diff.key ? 'bg-blue-600 text-white' : 'bg-white text-slate-600'
                  }`}
                  onClick={() => setSelectedDifficulty(diff.key)}
                >
                  <Text>{diff.label}</Text>
                </Button>
              ))}
            </View>
          </CardContent>
        </Card>

        <View className="mt-6">
          <Button
            className="w-full bg-blue-600 text-white h-12 rounded-xl"
            onClick={handleStartPractice}
            disabled={!selectedSubject}
          >
            <Text className="text-base font-medium">开始练习</Text>
          </Button>
        </View>
      </View>
    </View>
  )
}

export default PracticeSelectPage