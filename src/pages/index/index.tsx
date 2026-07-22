import { useState, useEffect } from 'react'
import { View, Text, Button as TaroButton, Input, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Network } from '@/network'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useUserStore } from '@/store/user'
import { requireLogin, loginWithProfile } from '@/utils/auth'
import {
  BookOpen,
  PenTool,
  FileText,
  Trophy,
  Clock,
  Target,
  ChevronRight,
  Flame,
  User,
} from 'lucide-react-taro'

interface Subject {
  id: string
  name: string
  icon: string
  questionCount: number
  color: string
}

interface DailyQuestion {
  id: string
  subjectName: string
  content: string
  type: string
}

interface StudyStats {
  todayCount: number
  totalDays: number
  streak: number
}

const MODE_ICONS = [
  { key: 'practice', label: '专项练习', desc: '按题型逐个击破', icon: PenTool, color: 'bg-blue-50', iconColor: '#2563EB' },
  { key: 'exam', label: '模拟考试', desc: '全真模拟限时测试', icon: Clock, color: 'bg-amber-50', iconColor: '#D97706' },
  { key: 'history', label: '历年真题', desc: '历年考题精选', icon: FileText, color: 'bg-emerald-50', iconColor: '#059669' },
]

const SUBJECT_COLORS = [
  'bg-blue-50 text-blue-700',
  'bg-emerald-50 text-emerald-700',
  'bg-amber-50 text-amber-700',
  'bg-purple-50 text-purple-700',
  'bg-rose-50 text-rose-700',
  'bg-cyan-50 text-cyan-700',
]

const IndexPage = () => {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [dailyQuestion, setDailyQuestion] = useState<DailyQuestion | null>(null)
  const [stats, setStats] = useState<StudyStats>({ todayCount: 0, totalDays: 0, streak: 0 })
  const [loading, setLoading] = useState(true)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [nickName, setNickName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const { isLoggedIn, login } = useUserStore()

  useEffect(() => {
    initApp()
  }, [])

  const initApp = async () => {
    const storedUser = Taro.getStorageSync('examBar_user')
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        login(userData)
      } catch (e) {
        console.error('parse user data error:', e)
      }
    }

    if (!isLoggedIn) {
      setShowLoginDialog(true)
    }

    loadData()
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const [subjectsRes, dailyRes, statsRes] = await Promise.all([
        Network.request({ url: '/api/subjects' }),
        Network.request({ url: '/api/questions/daily' }),
        Network.request({ url: '/api/stats/overview' }),
      ])
      console.log('subjects:', subjectsRes.data)
      console.log('daily:', dailyRes.data)
      console.log('stats:', statsRes.data)
      setSubjects(subjectsRes.data?.data || [])
      setDailyQuestion(dailyRes.data?.data || null)
      setStats(statsRes.data?.data || { todayCount: 0, totalDays: 0, streak: 0 })
    } catch (e) {
      console.error('loadData error:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    setLoginLoading(true)
    try {
      const result = await Network.request({
        url: '/api/auth/login',
        method: 'POST',
        data: { code: 'h5_login' },
      })
      console.log('login result:', result.data)
      
      if (result.data?.success && result.data.data) {
        const user = result.data.data.user
        console.log('login success:', user)
        
        if (nickName || avatarUrl) {
          await Network.request({
            url: '/api/users/profile',
            method: 'PUT',
            data: {
              id: user.id,
              nickName: nickName || '',
              avatarUrl: avatarUrl || '',
            },
          })
          user.nickName = nickName
          user.avatarUrl = avatarUrl
        }
        
        Taro.setStorageSync('examBar_user', JSON.stringify(user))
        login(user)
        
        setShowLoginDialog(false)
        loadData()
        Taro.showToast({
          title: '登录成功',
          icon: 'success',
        })
      } else {
        Taro.showToast({
          title: result.data?.message || '登录失败',
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

  const onChooseAvatar = (e: any) => {
    console.log('choose avatar:', e)
    const { avatarUrl } = e.detail
    setAvatarUrl(avatarUrl)
  }

  const onNickNameInput = (e: any) => {
    console.log('nickname input:', e)
    setNickName(e.detail.value)
  }

  const handleModeClick = async (mode: string) => {
    if (!isLoggedIn) {
      setShowLoginDialog(true)
      return
    }
    if (subjects.length === 0) return
    if (mode === 'exam') {
      Taro.navigateTo({ url: '/pages/exam/index?subjectId=' + subjects[0].id })
    } else if (mode === 'history') {
      Taro.navigateTo({ url: '/pages/history/index' })
    } else {
      Taro.navigateTo({ url: '/pages/practice/index?mode=' + mode + '&subjectId=' + subjects[0].id })
    }
  }

  const handleSubjectClick = async (subjectId: string) => {
    if (!isLoggedIn) {
      setShowLoginDialog(true)
      return
    }
    Taro.switchTab({ url: '/pages/questions/index' })
    Taro.setStorageSync('selectedSubjectId', subjectId)
  }

  const handleDailyQuestion = async () => {
    if (!isLoggedIn) {
      setShowLoginDialog(true)
      return
    }
    if (!dailyQuestion) return
    Taro.navigateTo({
      url: '/pages/practice/index?mode=daily&questionId=' + dailyQuestion.id,
    })
  }

  const handleSkipLogin = () => {
    setShowLoginDialog(false)
  }

  return (
    <View className="min-h-full bg-slate-50 pb-20">
      {/* 顶部统计区 */}
      <View className="bg-blue-600 px-4 pt-8 pb-12 rounded-b-3xl">
        <View className="flex items-center justify-between mb-4">
          <View>
            <Text className="block text-white text-xl font-bold">职考刷题</Text>
            <Text className="block text-blue-100 text-xs mt-1">每天进步一点点</Text>
          </View>
          {stats.streak > 0 && (
            <View className="flex items-center gap-1 rounded-full px-3 py-1" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <Flame size={14} color="#FCD34D" />
              <Text className="text-white text-xs font-medium">连续{stats.streak}天</Text>
            </View>
          )}
        </View>
        <View className="flex items-center justify-around rounded-2xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
          <View className="flex flex-col items-center">
            <Text className="block text-white text-2xl font-bold">{stats.todayCount}</Text>
            <Text className="block text-blue-100 text-xs mt-1">今日刷题</Text>
          </View>
          <View className="w-px h-8" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <View className="flex flex-col items-center">
            <Text className="block text-white text-2xl font-bold">{stats.totalDays}</Text>
            <Text className="block text-blue-100 text-xs mt-1">学习天数</Text>
          </View>
          <View className="w-px h-8" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <View className="flex flex-col items-center">
            <Trophy size={24} color="#FCD34D" />
            <Text className="block text-blue-100 text-xs mt-1">坚持打卡</Text>
          </View>
        </View>
      </View>

      {/* 刷题模式入口 */}
      <View className="px-4 -mt-6">
        <Card className="shadow-sm border-0">
          <CardContent className="p-4">
            <Text className="block text-base font-semibold text-slate-800 mb-3">刷题模式</Text>
            <View className="flex gap-3">
              {MODE_ICONS.map((mode) => (
                <View
                  key={mode.key}
                  className="flex-1 flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 active:bg-slate-100"
                  onClick={() => handleModeClick(mode.key)}
                >
                  <View className={`w-10 h-10 rounded-xl ${mode.color} flex items-center justify-center`}>
                    <mode.icon size={20} color={mode.iconColor} />
                  </View>
                  <Text className="block text-xs font-medium text-slate-800 text-center">{mode.label}</Text>
                  <Text className="block text-xs text-slate-400 text-center leading-tight">{mode.desc}</Text>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 每日推荐 */}
      <View className="px-4 mt-4">
        <View className="flex items-center justify-between mb-3">
          <View className="flex items-center gap-2">
            <Target size={16} color="#D97706" />
            <Text className="block text-base font-semibold text-slate-800">每日推荐</Text>
          </View>
          {dailyQuestion && (
            <View className="flex items-center gap-1" onClick={handleDailyQuestion}>
              <Text className="text-xs text-blue-600">去刷题</Text>
              <ChevronRight size={14} color="#2563EB" />
            </View>
          )}
        </View>
        {loading ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ) : dailyQuestion ? (
          <Card className="border-0 shadow-sm active:bg-slate-50" onClick={handleDailyQuestion}>
            <CardContent className="p-4">
              <View className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">
                  {dailyQuestion.type === 'choice' ? '选择题' : dailyQuestion.type === 'judge' ? '判断题' : '简答题'}
                </Badge>
                <Text className="text-xs text-slate-400">{dailyQuestion.subjectName}</Text>
              </View>
              <Text className="block text-sm text-slate-700 leading-relaxed">{dailyQuestion.content}</Text>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 flex flex-col items-center">
              <Text className="block text-sm text-slate-400">暂无推荐题目</Text>
            </CardContent>
          </Card>
        )}
      </View>

      {/* 我的科目 */}
      <View className="px-4 mt-4">
        <View className="flex items-center justify-between mb-3">
          <View className="flex items-center gap-2">
            <BookOpen size={16} color="#2563EB" />
            <Text className="block text-base font-semibold text-slate-800">考试科目</Text>
          </View>
        </View>
        {loading ? (
          <View className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <Skeleton className="h-8 w-8 rounded-lg mb-2" />
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </CardContent>
              </Card>
            ))}
          </View>
        ) : (
          <View className="grid grid-cols-2 gap-3">
            {subjects.map((subject, index) => (
              <Card
                key={subject.id}
                className="border-0 shadow-sm active:bg-slate-50"
                onClick={() => handleSubjectClick(subject.id)}
              >
                <CardContent className="p-4">
                  <View className={`w-8 h-8 rounded-lg ${SUBJECT_COLORS[index % SUBJECT_COLORS.length]} flex items-center justify-center mb-2`}>
                    <BookOpen size={16} color="#2563EB" />
                  </View>
                  <Text className="block text-sm font-medium text-slate-800 mb-1">{subject.name}</Text>
                  <View className="flex items-center gap-1">
                    <Text className="text-xs text-slate-400">{subject.questionCount}题</Text>
                  </View>
                  <Progress value={Math.min(100, Math.round((subject.questionCount > 0 ? 35 : 0)))} className="mt-2 h-1" />
                </CardContent>
              </Card>
            ))}
          </View>
        )}
      </View>

      {/* 登录弹窗 */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <View className="flex flex-col items-center">
              <DialogTitle className="text-lg font-bold text-center">欢迎使用职考刷题</DialogTitle>
              <DialogDescription className="text-center mt-2">
                请登录以保存您的学习进度
              </DialogDescription>
            </View>
          </DialogHeader>
          <View className="p-4">
            <View className="flex flex-col items-center gap-4">
              <TaroButton
                openType="chooseAvatar"
                onChooseAvatar={onChooseAvatar}
                className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50"
              >
                {avatarUrl ? (
                  <Text>
                    <Image src={avatarUrl} className="w-full h-full rounded-full" mode="aspectFill" />
                  </Text>
                ) : (
                  <User size={32} color="#94A3B8" />
                )}
              </TaroButton>
              <Text className="text-sm text-gray-500">点击选择头像</Text>
              <Input
                type="nickname"
                className="w-full bg-gray-50 rounded-xl px-4 py-3"
                placeholder="请输入昵称"
                value={nickName}
                onInput={onNickNameInput}
              />
            </View>
          </View>
          <DialogFooter className="flex flex-col gap-3">
            <Button className="w-full bg-blue-600" onClick={handleLogin} disabled={loginLoading}>
              <Text>{loginLoading ? '登录中...' : '登录'}</Text>
            </Button>
            <Button variant="outline" className="w-full" onClick={handleSkipLogin}>
              <Text>暂不登录</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </View>
  )
}

export default IndexPage