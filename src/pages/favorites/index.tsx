import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Network } from '@/network'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useUserStore } from '@/store/user'
import { LoginDialog } from '@/components/LoginDialog'
import { Star, ChevronRight } from 'lucide-react-taro'

interface Question {
  id: string
  content: string
  type: string
  subjectName: string
  difficulty: string
}

const FavoritesPage = () => {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const { isLoggedIn, user } = useUserStore()

  useEffect(() => {
    initPage()
  }, [])

  const initPage = async () => {
    if (!isLoggedIn) {
      setShowLoginDialog(true)
      return
    }
    loadFavorites()
  }

  const loadFavorites = async () => {
    try {
      setLoading(true)
      const res = await Network.request({ url: '/api/favorites', data: { userId: user?.id } })
      console.log('favorites:', res.data)
      setQuestions(res.data?.data || [])
    } catch (e) {
      console.error('loadFavorites error:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleQuestionClick = (questionId: string) => {
    Taro.navigateTo({
      url: `/pages/practice/index?mode=favorite&questionId=${questionId}`,
    })
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'choice':
        return '选择题'
      case 'judge':
        return '判断题'
      case 'short':
        return '简答题'
      default:
        return type
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-700'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700'
      case 'hard':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '简单'
      case 'medium':
        return '中等'
      case 'hard':
        return '困难'
      default:
        return difficulty
    }
  }

  if (showLoginDialog) {
    return (
      <View className="min-h-full bg-slate-100 flex items-center justify-center">
        <LoginDialog
          open={showLoginDialog}
          onOpenChange={setShowLoginDialog}
          title="请先登录"
          description="需要登录后才能查看收藏"
          allowSkip={false}
          onLoginSuccess={loadFavorites}
        />
      </View>
    )
  }

  return (
    <View className="min-h-full bg-slate-50 pb-20">
      <View className="bg-purple-600 px-4 pt-8 pb-6 rounded-b-3xl">
        <Text className="block text-white text-xl font-bold">我的收藏</Text>
        <Text className="block text-purple-100 text-xs mt-1">收藏的题目列表</Text>
      </View>

      <View className="px-4 mt-4">
        {loading ? (
          <View className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </View>
        ) : questions.length === 0 ? (
          <Card className="border-0 shadow-sm mt-8">
            <CardContent className="p-8 flex flex-col items-center">
              <Star size={48} color="#E5E7EB" />
              <Text className="block text-slate-400 mt-4">暂无收藏的题目</Text>
              <Text className="block text-slate-300 text-sm mt-1">刷题时点击收藏按钮添加</Text>
            </CardContent>
          </Card>
        ) : (
          <View className="space-y-3">
            {questions.map((question) => (
              <Card
                key={question.id}
                className="border-0 shadow-sm active:bg-slate-50"
                onClick={() => handleQuestionClick(question.id)}
              >
                <CardContent className="p-4">
                  <View className="flex items-start justify-between mb-2">
                    <View className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {getTypeLabel(question.type)}
                      </Badge>
                      <Badge className={`text-xs ${getDifficultyColor(question.difficulty)}`}>
                        {getDifficultyLabel(question.difficulty)}
                      </Badge>
                    </View>
                    <View className="flex items-center gap-1">
                      <Text className="text-xs text-slate-400">{question.subjectName}</Text>
                    </View>
                  </View>
                  <Text className="block text-sm text-slate-700 leading-relaxed line-clamp-2">
                    {question.content}
                  </Text>
                  <View className="flex items-center justify-end mt-3">
                    <Text className="text-xs text-purple-600">查看详情</Text>
                    <ChevronRight size={14} color="#7C3AED" />
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

export default FavoritesPage