import { useState, useEffect } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { Network } from '@/network'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { useUserStore } from '@/store/user'
import { LoginDialog } from '@/components/LoginDialog'
import {
  CircleCheck,
  Target,
  Clock,
  BookOpen,
  Flame,
  ChartBar,
  CircleAlert,
  ChevronRight,
  User,
} from 'lucide-react-taro'

interface StatsData {
  totalQuestions: number
  totalCorrect: number
  accuracy: number
  todayCount: number
  streak: number
  totalDays: number
  subjectStats: {
    subjectId: string
    subjectName: string
    total: number
    correct: number
    accuracy: number
  }[]
  recentRecords: {
    id: string
    subjectName: string
    mode: string
    total: number
    correct: number
    accuracy: number
    createdAt: string
    completed?: boolean
  }[]
}

const MODE_COLORS: Record<string, string> = {
  practice: 'bg-blue-50 text-blue-700',
  exam: 'bg-purple-50 text-purple-700',
  history: 'bg-emerald-50 text-emerald-700',
  daily: 'bg-amber-50 text-amber-700',
}

const MODE_LABELS: Record<string, string> = {
  practice: '专项练习',
  exam: '模拟考试',
  history: '历年真题',
  daily: '每日推荐',
}

const ProfilePage = () => {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const { user, isLoggedIn } = useUserStore()

  useEffect(() => {
    initPage()
  }, [])

  useDidShow(() => {
    if (isLoggedIn) {
      loadStats()
    }
  })

  const initPage = async () => {
    if (!isLoggedIn) {
      setShowLoginDialog(true)
    } else {
      loadStats()
    }
  }

  

  const loadStats = async () => {
    try {
      setLoading(true)
      const res = await Network.request({ url: '/api/stats/detail', data: { userId: user?.id } })
      console.log('stats detail:', res.data)
      setStats(res.data?.data || null)
    } catch (e) {
      console.error('loadStats error:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    if (!user) return
    
    Taro.showToast({
      title: '请在登录时更新资料',
      icon: 'none',
    })
  }

  if (showLoginDialog) {
    return (
      <View className="min-h-full bg-slate-100 flex items-center justify-center">
        <LoginDialog
          open={showLoginDialog}
          onOpenChange={setShowLoginDialog}
          onLoginSuccess={loadStats}
        />
      </View>
    )
  }

  if (loading) {
    return (
      <View className="min-h-full bg-slate-50 p-4">
        <Skeleton className="h-24 w-full rounded-2xl mb-4" />
        <View className="grid grid-cols-2 gap-3 mb-4">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </View>
        <Skeleton className="h-40 w-full rounded-xl" />
      </View>
    )
  }

  const accuracy = stats?.accuracy || 0
  const accuracyColor = accuracy >= 80 ? 'text-emerald-600' : accuracy >= 60 ? 'text-amber-600' : 'text-red-600'

  return (
    <View className="min-h-full bg-slate-50 pb-20">
      <View className="bg-blue-600 px-4 pt-8 pb-8 rounded-b-3xl">
        <View className="flex items-center gap-4 mb-4">
          <View
            className="w-14 h-14 rounded-full bg-white bg-opacity-20 flex items-center justify-center overflow-hidden"
            onClick={handleUpdateProfile}
          >
            {user?.avatarUrl && user.avatarUrl.startsWith('http') ? (
              <Image src={user.avatarUrl} mode="aspectFill" className="w-full h-full" />
            ) : (
              <User size={24} color="#FFFFFF" />
            )}
          </View>
          <View>
            <Text className="block text-white text-lg font-bold">{user?.nickName || '考生'}</Text>
            <Text className="block text-blue-100 text-xs mt-1">
              已坚持学习 {stats?.totalDays || 0} 天
            </Text>
          </View>
        </View>
        <View className="flex items-center justify-around bg-white bg-opacity-10 rounded-2xl p-4">
          <View className="flex flex-col items-center">
            <Text className="block text-slate-800 text-xl font-bold">{stats?.totalQuestions || 0}</Text>
            <Text className="block text-blue-600 text-xs mt-1">总刷题量</Text>
          </View>
          <View className="w-px h-8 bg-white bg-opacity-20" />
          <View className="flex flex-col items-center">
            <Text className={`block text-xl font-bold ${accuracyColor}`}>
              {accuracy}%
            </Text>
            <Text className="block text-blue-600 text-xs mt-1">正确率</Text>
          </View>
          <View className="w-px h-8 bg-white bg-opacity-20" />
          <View className="flex flex-col items-center">
            <View className="flex items-center gap-1">
              <Flame size={16} color="#FCD34D" />
              <Text className="block text-slate-800 text-xl font-bold">{stats?.streak || 0}</Text>
            </View>
            <Text className="block text-blue-600 text-xs mt-1">连续天数</Text>
          </View>
        </View>
      </View>

      <View className="px-4 -mt-4">
        <View className="grid grid-cols-2 gap-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CircleCheck size={18} color="#059669" />
              </View>
              <View>
                <Text className="block text-lg font-bold text-slate-800">{stats?.totalCorrect || 0}</Text>
                <Text className="block text-xs text-slate-400">答对题数</Text>
              </View>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Target size={18} color="#2563EB" />
              </View>
              <View>
                <Text className="block text-lg font-bold text-slate-800">{stats?.todayCount || 0}</Text>
                <Text className="block text-xs text-slate-400">今日刷题</Text>
              </View>
            </CardContent>
          </Card>
        </View>
      </View>

      <View className="px-4 mt-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <View
              className="flex items-center justify-between p-4 active:bg-slate-50"
              onClick={() => Taro.navigateTo({ url: '/pages/wrong/index' })}
            >
              <View className="flex items-center gap-3">
                <View className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <CircleAlert size={18} color="#DC2626" />
                </View>
                <Text className="text-sm font-medium text-slate-800">错题本</Text>
              </View>
              <ChevronRight size={16} color="#94A3B8" />
            </View>
            <Separator />
            <View
              className="flex items-center justify-between p-4 active:bg-slate-50"
              onClick={() => Taro.navigateTo({ url: '/pages/history/index' })}
            >
              <View className="flex items-center gap-3">
                <View className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Clock size={18} color="#D97706" />
                </View>
                <Text className="text-sm font-medium text-slate-800">历年真题</Text>
              </View>
              <ChevronRight size={16} color="#94A3B8" />
            </View>
            
          </CardContent>
        </Card>
      </View>

      <View className="px-4 mt-4">
        <View className="flex items-center gap-2 mb-3">
          <ChartBar size={16} color="#2563EB" />
          <Text className="block text-base font-semibold text-slate-800">科目统计</Text>
        </View>
        {stats?.subjectStats && stats.subjectStats.length > 0 ? (
          <View className="space-y-3">
            {stats.subjectStats.map((subject) => (
              <Card key={subject.subjectId} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <View className="flex items-center justify-between mb-2">
                    <Text className="text-sm font-medium text-slate-800">{subject.subjectName}</Text>
                    <Text className="text-xs text-slate-400">{subject.correct}/{subject.total}</Text>
                  </View>
                  <Progress value={subject.accuracy} className="h-2 mb-1" />
                  <Text className="text-xs text-slate-400">正确率 {subject.accuracy}%</Text>
                </CardContent>
              </Card>
            ))}
          </View>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 flex flex-col items-center">
              <Text className="block text-sm text-slate-400">暂无刷题记录</Text>
              <Text className="block text-xs text-slate-300 mt-1">开始刷题后将显示科目统计</Text>
            </CardContent>
          </Card>
        )}
      </View>

      <View className="px-4 mt-4">
        <View className="flex items-center gap-2 mb-3">
          <Clock size={16} color="#2563EB" />
          <Text className="block text-base font-semibold text-slate-800">最近场次</Text>
          <Text className="text-xs text-slate-400 ml-auto">按练习/考试记录</Text>
        </View>
        {stats?.recentRecords && stats.recentRecords.length > 0 ? (
          <View className="space-y-2">
            {stats.recentRecords.map((record) => (
              <Card key={record.id} className="border-0 shadow-sm">
                <CardContent className="p-3">
                  <View className="flex items-center justify-between">
                    <View className="flex items-center gap-2">
                      <Badge className={`text-xs ${MODE_COLORS[record.mode] || 'bg-slate-100 text-slate-700'}`}>
                        {MODE_LABELS[record.mode] || record.mode}
                      </Badge>
                      <Text className="text-sm font-medium text-slate-700">{record.subjectName}</Text>
                      {record.completed ? (
                        <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200">已完成</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">进行中</Badge>
                      )}
                    </View>
                  </View>
                  <View className="flex items-center justify-between mt-2">
                    <View className="flex items-center gap-3">
                      <Text className={`text-lg font-bold ${record.accuracy >= 60 ? 'text-emerald-600' : record.accuracy > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                        {record.accuracy}%
                      </Text>
                      <Text className="text-xs text-slate-500">
                        {record.correct}/{record.total}题
                      </Text>
                    </View>
                    <Text className="text-xs text-slate-400">{record.createdAt}</Text>
                  </View>
                  {record.total > 0 && (
                    <View className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                      <View 
                        className={`h-full rounded-full ${record.accuracy >= 60 ? 'bg-emerald-500' : record.accuracy > 0 ? 'bg-amber-500' : 'bg-slate-300'}`}
                        style={{ width: `${record.accuracy}%` }}
                      />
                    </View>
                  )}
                </CardContent>
              </Card>
            ))}
          </View>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 flex flex-col items-center">
              <Text className="block text-sm text-slate-400">暂无记录，去刷题吧！</Text>
            </CardContent>
          </Card>
        )}
      </View>
    </View>
  )
}

export default ProfilePage