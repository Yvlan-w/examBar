import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Network } from '@/network'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useUserStore } from '@/store/user'
import { LoginDialog } from '@/components/LoginDialog'
import { Plus, Eye, EyeOff, Trash2, Upload, BookOpen } from 'lucide-react-taro'

interface CustomSubject {
  id: string
  name: string
  isPublic: boolean
  color: string
  questionCount: number
  createdAt: string
}

const CreateSubjectPage = () => {
  const [subjects, setSubjects] = useState<CustomSubject[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [subjectName, setSubjectName] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<CustomSubject | null>(null)
  const [fileContent, setFileContent] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([])
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
    loadSubjects()
  }

  const loadSubjects = async () => {
    try {
      setLoading(true)
      const res = await Network.request({ url: '/api/custom-subjects', data: { userId: user?.id } })
      console.log('custom subjects:', res.data)
      setSubjects(res.data?.data || [])
    } catch (e) {
      console.error('loadSubjects error:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSubject = async () => {
    if (!subjectName.trim()) {
      Taro.showToast({ title: '请输入题库名称', icon: 'none' })
      return
    }

    try {
      const res = await Network.request({
        url: '/api/custom-subjects',
        method: 'POST',
        data: { userId: user?.id, name: subjectName.trim(), isPublic },
      })

      if (res.data?.code === 200) {
        Taro.showToast({ title: '创建成功', icon: 'success' })
        setShowCreateModal(false)
        setSubjectName('')
        setIsPublic(false)
        loadSubjects()
      }
    } catch (e) {
      console.error('createSubject error:', e)
      Taro.showToast({ title: '创建失败', icon: 'none' })
    }
  }

  const handleDeleteSubject = async (subjectId: string) => {
    Taro.showModal({
      title: '确认删除',
      content: '删除后题库中的所有题目将丢失，确定继续吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await Network.request({
              url: `/api/custom-subjects?userId=${user?.id}&subjectId=${subjectId}`,
              method: 'DELETE',
            })
            if (result.data?.code === 200) {
              Taro.showToast({ title: '删除成功', icon: 'success' })
              loadSubjects()
            }
          } catch (e) {
            console.error('deleteSubject error:', e)
            Taro.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      },
    })
  }

  const handleSelectSubject = (subject: CustomSubject) => {
    setSelectedSubject(subject)
    setShowImportModal(true)
    setFileContent('')
    setParsedQuestions([])
  }

  const handleParseFile = async () => {
    if (!fileContent.trim()) {
      Taro.showToast({ title: '请输入内容', icon: 'none' })
      return
    }
    if (!selectedSubject) {
      Taro.showToast({ title: '请选择题库', icon: 'none' })
      return
    }

    try {
      setParsing(true)
      const res = await Network.request({
        url: '/api/custom-subjects/parse',
        method: 'POST',
        data: {
          fileContent: fileContent.trim(),
          subjectId: selectedSubject.id,
          subjectName: selectedSubject.name,
        },
      })

      if (res.data?.code === 200) {
        setParsedQuestions(res.data?.data || [])
        Taro.showToast({ title: `解析出 ${res.data?.data?.length} 道题目`, icon: 'success' })
      }
    } catch (e) {
      console.error('parseFile error:', e)
      Taro.showToast({ title: '解析失败', icon: 'none' })
    } finally {
      setParsing(false)
    }
  }

  const handleImportQuestions = async () => {
    if (parsedQuestions.length === 0) {
      Taro.showToast({ title: '没有可导入的题目', icon: 'none' })
      return
    }
    if (!selectedSubject) {
      Taro.showToast({ title: '请选择题库', icon: 'none' })
      return
    }

    try {
      const res = await Network.request({
        url: '/api/custom-subjects/import',
        method: 'POST',
        data: { questions: parsedQuestions, subjectId: selectedSubject.id },
      })

      if (res.data?.code === 200) {
        Taro.showToast({ title: `成功导入 ${res.data?.data?.count} 道题目`, icon: 'success' })
        setShowImportModal(false)
        setFileContent('')
        setParsedQuestions([])
        setSelectedSubject(null)
        loadSubjects()
      }
    } catch (e) {
      console.error('importQuestions error:', e)
      Taro.showToast({ title: '导入失败', icon: 'none' })
    }
  }

  const handleStartPractice = (subjectId: string, name: string) => {
    Taro.navigateTo({
      url: `/pages/practice/index?mode=practice&subjectId=${subjectId}&subjectName=${encodeURIComponent(name)}`,
    })
  }

  if (showLoginDialog) {
    return (
      <View className="min-h-full bg-slate-100 flex items-center justify-center">
        <LoginDialog
          open={showLoginDialog}
          onOpenChange={setShowLoginDialog}
          title="请先登录"
          description="需要登录后才能创建题库"
          allowSkip={false}
          onLoginSuccess={loadSubjects}
        />
      </View>
    )
  }

  return (
    <View className="min-h-full bg-slate-50 pb-24">
      <View className="bg-rose-600 px-4 pt-8 pb-6 rounded-b-3xl">
        <Text className="block text-white text-xl font-bold">创建题库</Text>
        <Text className="block text-rose-100 text-xs mt-1">自定义题库并导入题目</Text>
      </View>

      <View className="px-4 mt-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <Button
              className="w-full bg-rose-600 text-white h-12 rounded-xl"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={20} color="#FFFFFF" className="mr-2" />
              <Text className="text-base font-medium">创建新题库</Text>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm mt-4">
          <CardContent className="p-4">
            <View className="flex items-center justify-between mb-3">
              <Text className="block text-sm font-semibold text-slate-800">我的题库</Text>
            </View>

            {loading ? (
              <View className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </View>
            ) : subjects.length === 0 ? (
              <View className="py-8 flex flex-col items-center">
                <Plus size={48} color="#E5E7EB" />
                <Text className="block text-slate-400 mt-4">暂无自定义题库</Text>
                <Text className="block text-slate-300 text-sm mt-1">点击上方按钮创建</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {subjects.map((subject) => (
                  <View
                    key={subject.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-200"
                  >
                    <View className="flex items-center gap-3">
                      <View
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: subject.color + '20' }}
                      >
                        <BookOpen size={20} color={subject.color} />
                      </View>
                      <View>
                        <Text className="block text-sm font-medium text-slate-800">{subject.name}</Text>
                        <View className="flex items-center gap-2 mt-1">
                          <Text className="text-xs text-slate-400">{subject.questionCount}题</Text>
                          <Badge
                            className={`text-xs ${subject.isPublic ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                          >
                            {subject.isPublic ? '公开' : '私密'}
                          </Badge>
                        </View>
                      </View>
                    </View>
                    <View className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        className="h-8 px-3 rounded-lg"
                        onClick={() => handleSelectSubject(subject)}
                      >
                        <Upload size={16} color="#64748B" className="mr-1" />
                        <Text className="text-xs">导入</Text>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-8 px-3 rounded-lg"
                        onClick={() => handleStartPractice(subject.id, subject.name)}
                      >
                        <Text className="text-xs">刷题</Text>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-8 w-8 rounded-lg"
                        onClick={() => handleDeleteSubject(subject.id)}
                      >
                        <Trash2 size={16} color="#64748B" />
                      </Button>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </CardContent>
        </Card>
      </View>

      {showCreateModal && (
        <View className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <Text className="block text-lg font-bold text-slate-800 mb-4">创建题库</Text>
              <View className="space-y-4">
                <View>
                  <Text className="block text-sm font-medium text-slate-600 mb-2">题库名称</Text>
                  <Input
                    className="w-full bg-gray-50 rounded-xl px-4 py-3"
                    placeholder="请输入题库名称"
                    value={subjectName}
                    onInput={(e) => setSubjectName(e.detail.value)}
                  />
                </View>
                <View className="flex items-center justify-between">
                  <View className="flex items-center gap-2">
                    {isPublic ? (
                      <Eye size={16} color="#10B981" />
                    ) : (
                      <EyeOff size={16} color="#6B7280" />
                    )}
                    <Text className="block text-sm font-medium text-slate-600">
                      {isPublic ? '公开（所有人可见）' : '私密（仅自己可见）'}
                    </Text>
                  </View>
                  <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                </View>
                <View className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    className="flex-1 h-10 rounded-xl"
                    onClick={() => setShowCreateModal(false)}
                  >
                    <Text>取消</Text>
                  </Button>
                  <Button
                    className="flex-1 h-10 rounded-xl bg-rose-600 text-white"
                    onClick={handleCreateSubject}
                  >
                    <Text>创建</Text>
                  </Button>
                </View>
              </View>
            </CardContent>
          </Card>
        </View>
      )}

      {showImportModal && (
        <View className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
          <View className="w-full bg-white rounded-t-3xl p-4 max-h-[80vh] overflow-y-auto">
            <View className="flex items-center justify-between mb-4">
              <Text className="block text-lg font-bold text-slate-800">导入题目</Text>
              <Button variant="ghost" onClick={() => {
                setShowImportModal(false)
                setFileContent('')
                setParsedQuestions([])
              }}
              >
                <Text className="text-sm text-slate-500">关闭</Text>
              </Button>
            </View>

            {selectedSubject && (
              <Badge className="mb-4 bg-rose-100 text-rose-700">
                目标题库：{selectedSubject.name}
              </Badge>
            )}

            <View className="mb-4">
              <Text className="block text-sm font-medium text-slate-600 mb-2">输入题目内容</Text>
              <Text className="block text-xs text-slate-400 mb-2">支持选择题、判断题、简答题，自动解析为题目</Text>
              <View className="bg-gray-50 rounded-xl p-4">
                <textarea
                  className="w-full min-h-[200px] bg-transparent outline-none text-sm"
                  placeholder="请粘贴题目内容，例如：

1. 什么是JavaScript？
A. 编程语言
B. 数据库
C. 操作系统
D. 硬件
答案：A

2. 1+1=2
答案：正确"
                  value={fileContent}
                  onChange={(e) => setFileContent((e.target as any).value)}
                />
              </View>
            </View>

            <Button
              className="w-full h-12 rounded-xl bg-rose-600 text-white mb-4"
              onClick={handleParseFile}
              disabled={parsing}
            >
              <Text className="text-base font-medium">{parsing ? '解析中...' : '解析题目'}</Text>
            </Button>

            {parsedQuestions.length > 0 && (
              <View className="space-y-3 mb-4">
                <Text className="block text-sm font-medium text-slate-600">
                  解析结果（{parsedQuestions.length}道题目）
                </Text>
                <View className="bg-gray-50 rounded-xl p-4 max-h-[200px] overflow-y-auto space-y-2">
                  {parsedQuestions.map((q, index) => (
                    <View key={index} className="p-3 bg-white rounded-lg">
                      <Text className="block text-xs text-slate-400 mb-1">
                        {index + 1}. {q.type === 'choice' ? '选择题' : q.type === 'judge' ? '判断题' : '简答题'}
                      </Text>
                      <Text className="block text-sm text-slate-700 line-clamp-2">{q.content}</Text>
                    </View>
                  ))}
                </View>
                <Button
                  className="w-full h-12 rounded-xl bg-green-600 text-white"
                  onClick={handleImportQuestions}
                >
                  <Text className="text-base font-medium">导入到题库</Text>
                </Button>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  )
}

export default CreateSubjectPage