import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Network } from '@/network'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, BookOpen, ChevronRight } from 'lucide-react-taro'

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
  year: number
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

const HistoryPage = () => {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [years, setYears] = useState<number[]>([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedYear, setSelectedYear] = useState('all')
  const [loading, setLoading] = useState(true)
  const [questionsLoading, setQuestionsLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedSubject) {
      loadQuestions()
    }
  }, [selectedSubject, selectedYear])

  const loadData = async () => {
    try {
      setLoading(true)
      const [subjectsRes, yearsRes] = await Promise.all([
        Network.request({ url: '/api/subjects' }),
        Network.request({ url: '/api/years' }),
      ])
      setSubjects(subjectsRes.data?.data || [])
      setYears(yearsRes.data?.data || [])
      if ((subjectsRes.data?.data || []).length > 0) {
        setSelectedSubject((subjectsRes.data?.data || [])[0].id)
      }
    } catch (e) {
      console.error('loadData error:', e)
    } finally {
      setLoading(false)
    }
  }

  const loadQuestions = async () => {
    try {
      setQuestionsLoading(true)
      const params: Record<string, string> = { subjectId: selectedSubject }
      if (selectedYear !== 'all') {
        params.year = selectedYear
      }
      const res = await Network.request({ url: '/api/questions/history', data: params })
      setQuestions(res.data?.data || [])
    } catch (e) {
      console.error('loadQuestions error:', e)
    } finally {
      setQuestionsLoading(false)
    }
  }

  const handleQuestionClick = (questionId: string) => {
    Taro.navigateTo({
      url: '/pages/practice/index?mode=history&questionId=' + questionId + '&subjectId=' + selectedSubject,
    })
  }

  const handleStartPractice = () => {
    if (!selectedSubject) return
    Taro.navigateTo({
      url: '/pages/practice/index?mode=history&subjectId=' + selectedSubject + (selectedYear !== 'all' ? '&year=' + selectedYear : ''),
    })
  }

  return (
    <View className="min-h-full bg-slate-50 pb-20">
      <View className="bg-blue-600 px-4 pt-6 pb-4">
        <View className="flex items-center gap-2">
          <Calendar size={20} color="#FFFFFF" />
          <Text className="block text-white text-lg font-bold">历年真题</Text>
        </View>
        <Text className="block text-blue-100 text-xs mt-1">精选历年考试真题，针对性训练</Text>
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
                    ? 'bg-blue-600 text-white'
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

      <View className="bg-white px-4 py-3 mt-2">
        <Tabs value={selectedYear} onValueChange={setSelectedYear}>
          <TabsList className="w-full bg-slate-100 h-10 rounded-lg p-1">
            <TabsTrigger value="all" className="flex-1 text-xs">全部年份</TabsTrigger>
            {years.map((year) => (
              <TabsTrigger key={year} value={year.toString()} className="flex-1 text-xs">{year}年</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </View>

      <View className="px-4 mt-3">
        <Button
          className="w-full bg-blue-600 text-white h-10 rounded-xl"
          onClick={handleStartPractice}
        >
          <Text className="text-sm font-medium">开始练习</Text>
        </Button>
      </View>

      <View className="px-4 mt-4">
        <View className="flex items-center justify-between mb-3">
          <View className="flex items-center gap-2">
            <BookOpen size={16} color="#2563EB" />
            <Text className="block text-base font-semibold text-slate-800">真题列表</Text>
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
            <BookOpen size={40} color="#CBD5E1" />
            <Text className="block text-sm text-slate-400 mt-3">暂无真题</Text>
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
                    <Badge className="text-xs bg-amber-50 text-amber-700">
                      {q.year}年
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

export default HistoryPage
