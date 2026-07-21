import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Network } from '@/network'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Trophy,
  Target,
  Clock,
  TrendingUp,
  BookOpen,
  CheckCircle,
  XCircle,
  Flame,
  BarChart3,
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
  }[]
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

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const res = await Network.request({ url: '/api/stats/detail' })
      console.log('stats detail:', res.data)
      setStats(res.data?.data || null)
    } catch (e) {
      console.error('loadStats error:', e)
    } finally {
      setLoading(false)
    }
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
      {/* 用户信息头部 */}
      <View className="bg-blue-600 px-4 pt-8 pb-8 rounded-b-3xl">
        <View className="flex items-center gap-4 mb-4">
          <View className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
            <BookOpen size={24} color="#FFFFFF" />
          </View>
          <View>
            <Text className="block text-white text-lg font-bold">考生</Text>
            <Text className="block text-blue-100 text-xs mt-1">
              已坚持学习 {stats?.totalDays || 0} 天
            </Text>
          </View>
        </View>
        <View className="flex items-center justify-around bg-white/10 rounded-2xl p-4">
          <View className="flex flex-col items-center">
            <Text className="block text-white text-xl font-bold">{stats?.totalQuestions || 0}</Text>
            <Text className="block text-blue-100 text-xs mt-1">总刷题量</Text>
          </View>
          <View className="w-px h-8 bg-white/20" />
          <View className="flex flex-col items-center">
            <Text className={`block text-xl font-bold ${accuracyColor === 'text-emerald-600' ? 'text-white' : accuracyColor}`}>
              {accuracy}%
            </Text>
            <Text className="block text-blue-100 text-xs mt-1">正确率</Text>
          </View>
          <View className="w-px h-8 bg-white/20" />
          <View className="flex flex-col items-center">
            <View className="flex items-center gap-1">
              <Flame size={16} color="#FCD34D" />
              <Text className="block text-white text-xl font-bold">{stats?.streak || 0}</Text>
            </View>
            <Text className="block text-blue-100 text-xs mt-1">连续天数</Text>
          </View>
        </View>
      </View>

      {/* 学习数据卡片 */}
      <View className="px-4 -mt-4">
        <View className="grid grid-cols-2 gap-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle size={18} color="#059669" />
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

      {/* 科目统计 */}
      <View className="px-4 mt-4">
        <View className="flex items-center gap-2 mb-3">
          <BarChart3 size={16} color="#2563EB" />
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
                  <Progress value={subject.accuracy} className="h-1.5 mb-1" />
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

      {/* 最近记录 */}
      <View className="px-4 mt-4">
        <View className="flex items-center gap-2 mb-3">
          <Clock size={16} color="#2563EB" />
          <Text className="block text-base font-semibold text-slate-800">最近记录</Text>
        </View>
        {stats?.recentRecords && stats.recentRecords.length > 0 ? (
          <View className="space-y-2">
            {stats.recentRecords.map((record) => (
              <Card key={record.id} className="border-0 shadow-sm">
                <CardContent className="p-3">
                  <View className="flex items-center justify-between">
                    <View className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {MODE_LABELS[record.mode] || record.mode}
                      </Badge>
                      <Text className="text-sm text-slate-700">{record.subjectName}</Text>
                    </View>
                    <View className="flex items-center gap-1">
                      <Text className={`text-sm font-medium ${record.accuracy >= 60 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {record.accuracy}%
                      </Text>
                    </View>
                  </View>
                  <View className="flex items-center justify-between mt-1">
                    <Text className="text-xs text-slate-400">
                      {record.correct}/{record.total}题
                    </Text>
                    <Text className="text-xs text-slate-300">{record.createdAt}</Text>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 flex flex-col items-center">
              <Text className="block text-sm text-slate-400">暂无记录</Text>
            </CardContent>
          </Card>
        )}
      </View>
    </View>
  )
}

export default ProfilePage
