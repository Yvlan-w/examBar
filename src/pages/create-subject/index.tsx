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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useUserStore } from '@/store/user'
import { LoginDialog } from '@/components/LoginDialog'
import { Plus, Eye, EyeOff, Trash, Upload, BookOpen, Image as ImageIcon, FileText, FileUp } from 'lucide-react-taro'

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
  const [loadingText, setLoadingText] = useState('')
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([])
  const [questionsToUpdate, setQuestionsToUpdate] = useState<any[]>([])
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [importTab, setImportTab] = useState('text')
  const [tempFileKeys, setTempFileKeys] = useState<string[]>([])
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
        data: { userId: user?.id, name: subjectName.trim(), isPublic, nickname: user?.nickName },
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

  const handleToggleVisibility = async (subjectId: string) => {
    try {
      const res = await Network.request({
        url: '/api/custom-subjects/toggle-visibility',
        method: 'POST',
        data: { userId: user?.id, subjectId },
      })

      if (res.data?.code === 200 && res.data?.data?.success) {
        setSubjects((prev) =>
          prev.map((s) =>
            s.id === subjectId
              ? { ...s, isPublic: res.data.data.isPublic, name: res.data.data.name }
              : s
          )
        )
        Taro.showToast({
          title: res.data.data.isPublic ? '已设为公开' : '已设为私密',
          icon: 'success',
        })
      }
    } catch (e) {
      console.error('toggleVisibility error:', e)
      Taro.showToast({ title: '操作失败', icon: 'none' })
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
    setQuestionsToUpdate([])
    setImportTab('text')
    setTempFileKeys([])
  }

  const handleUploadImage = () => {
    Taro.chooseImage({
      count: 9,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFilePaths = res.tempFilePaths
        
        try {
          setParsing(true)
          setLoadingText(`上传 ${tempFilePaths.length} 张图片中...`)
          
          const uploadedResults: { url: string; key: string }[] = []
          
          for (const filePath of tempFilePaths) {
            const uploadRes = await Network.uploadFile({
              url: '/api/storage/upload-temp',
              filePath,
              name: 'file',
            })
            console.log('image upload result:', uploadRes)
            const uploadData = JSON.parse(uploadRes.data)
            
            if (uploadData.code === 200) {
              uploadedResults.push({ url: uploadData.data.url, key: uploadData.data.key })
            }
          }
          
          if (uploadedResults.length === 0) {
            setParsing(false)
            Taro.showToast({ title: '上传失败', icon: 'none' })
            return
          }

          setLoadingText('AI 智能解析中，请稍候...')
          const urls = uploadedResults.map(r => r.url)
          const keys = uploadedResults.map(r => r.key)
          
          const parseRes = await Network.request({
            url: '/api/custom-subjects/parse-url',
            method: 'POST',
            data: {
              urls,
              subjectId: selectedSubject?.id || '',
              subjectName: selectedSubject?.name || '',
              tempFileKeys: keys,
              nickname: user?.nickName || 'user',
            },
          })
          
          setParsing(false)
          
          if (parseRes.data?.code === 200) {
            const newCount = parseRes.data?.data?.length || 0
            const updateCount = parseRes.data?.questionsToUpdate?.length || 0
            setParsedQuestions(parseRes.data?.data || [])
            setQuestionsToUpdate(parseRes.data?.questionsToUpdate || [])
            setTempFileKeys(parseRes.data?.tempFileKeys || [])
            const msg = updateCount > 0 
              ? `解析出 ${newCount} 题，更新 ${updateCount} 题` 
              : `解析出 ${newCount} 道题目`
            Taro.showToast({ title: msg, icon: 'success' })
          } else {
            Taro.showToast({ title: '解析失败', icon: 'none' })
          }
        } catch (e) {
          setParsing(false)
          console.error('uploadImage error:', e)
          Taro.showToast({ title: '上传失败', icon: 'none' })
        }
      },
    })
  }

  const handleUploadFile = () => {
    Taro.chooseMessageFile({
      count: 1,
      type: 'file',
      success: async (res) => {
        const fileName = res.tempFiles[0].name.toLowerCase()
        
        try {
          setParsing(true)
          setLoadingText('读取文件中...')
          
          if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
            let content: string
            
            if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP) {
              const fs = Taro.getFileSystemManager()
              const fileRes: any = await new Promise((resolve, reject) => {
                fs.readFile({
                  filePath: res.tempFiles[0].path,
                  encoding: 'utf-8',
                  success: (fileReadRes) => resolve(fileReadRes),
                  fail: (err) => reject(err),
                })
              })
              content = fileRes.data
            } else {
              // H5 端：使用 FileReader 读取文件
              const file: any = res.tempFiles[0]
              content = await new Promise((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = (e: any) => resolve(e.target?.result || '')
                reader.onerror = (err) => reject(err)
                reader.readAsText(file, 'utf-8')
              })
            }
            
            if (!content) {
              throw new Error('文件内容为空')
            }
            
            console.log('📄 文件内容长度:', content.length)
            console.log('📄 文件内容前100字:', content.substring(0, 100))
            
            setLoadingText('AI 智能解析中，请稍候...')
            const parseRes = await Network.request({
              url: '/api/custom-subjects/parse',
              method: 'POST',
              data: {
                fileContent: content,
                subjectId: selectedSubject?.id || '',
                subjectName: selectedSubject?.name || '',
                nickname: user?.nickName || 'user',
              },
            })
            
            setParsing(false)
            
            if (parseRes.data?.code === 200) {
              const newCount = parseRes.data?.data?.length || 0
              const updateCount = parseRes.data?.questionsToUpdate?.length || 0
              setParsedQuestions(parseRes.data?.data || [])
              setQuestionsToUpdate(parseRes.data?.questionsToUpdate || [])
              const msg = updateCount > 0 
                ? `解析出 ${newCount} 题，更新 ${updateCount} 题` 
                : `解析出 ${newCount} 道题目`
              Taro.showToast({ title: msg, icon: 'success' })
            } else {
              Taro.showToast({ title: '解析失败', icon: 'none' })
            }
          } else if (fileName.endsWith('.pdf')) {
            setLoadingText('上传 PDF 文件中...')
            const uploadRes = await Network.uploadFile({
              url: '/api/storage/upload-temp',
              filePath: res.tempFiles[0].path,
              name: 'file',
            })
            console.log('pdf upload result:', uploadRes)
            const uploadData = JSON.parse(uploadRes.data)
            
            if (uploadData.code === 200) {
              setLoadingText('AI 智能解析中，请稍候...')
              const parseRes = await Network.request({
                url: '/api/custom-subjects/parse-url',
                method: 'POST',
                data: {
                  url: uploadData.data.url,
                  subjectId: selectedSubject?.id || '',
                  subjectName: selectedSubject?.name || '',
                  tempFileKeys: [uploadData.data.key],
                  nickname: user?.nickName || 'user',
                },
              })
              
              setParsing(false)
              
              if (parseRes.data?.code === 200) {
                const newCount = parseRes.data?.data?.length || 0
                const updateCount = parseRes.data?.questionsToUpdate?.length || 0
                setParsedQuestions(parseRes.data?.data || [])
                setQuestionsToUpdate(parseRes.data?.questionsToUpdate || [])
                setTempFileKeys(parseRes.data?.tempFileKeys || [])
                const msg = updateCount > 0 
                  ? `解析出 ${newCount} 题，更新 ${updateCount} 题` 
                  : `解析出 ${newCount} 道题目`
                Taro.showToast({ title: msg, icon: 'success' })
              } else {
                Taro.showToast({ title: '解析失败', icon: 'none' })
              }
            } else {
              Taro.showToast({ title: '上传失败', icon: 'none' })
            }
          } else {
            Taro.showToast({ title: '不支持的文件格式', icon: 'none' })
          }
        } catch (e: any) {
          setParsing(false)
          console.error('❌ uploadFile error:', e)
          console.error('❌ error message:', e?.message || e)
          Taro.showToast({ title: e?.message || '处理失败', icon: 'none' })
        }
      },
    })
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
      setLoadingText('AI 智能解析中，请稍候...')
      const res = await Network.request({
        url: '/api/custom-subjects/parse',
        method: 'POST',
        data: {
          fileContent: fileContent.trim(),
          subjectId: selectedSubject.id,
          subjectName: selectedSubject.name,
          nickname: user?.nickName || 'user',
        },
      })

      setParsing(false)
      
      if (res.data?.code === 200) {
        const newCount = res.data?.data?.length || 0
        const updateCount = res.data?.questionsToUpdate?.length || 0
        setParsedQuestions(res.data?.data || [])
        setQuestionsToUpdate(res.data?.questionsToUpdate || [])
        const msg = updateCount > 0 
          ? `解析出 ${newCount} 题，更新 ${updateCount} 题` 
          : `解析出 ${newCount} 道题目`
        Taro.showToast({ title: msg, icon: 'success' })
      }
    } catch (e) {
      console.error('parseFile error:', e)
      Taro.showToast({ title: '解析失败', icon: 'none' })
    } finally {
      setParsing(false)
    }
  }

  const handleImportQuestions = async () => {
    console.log(parsedQuestions)
    if (parsedQuestions.length === 0 && questionsToUpdate.length === 0) {
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
        data: { 
          questions: parsedQuestions, 
          questionsToUpdate,
          subjectId: selectedSubject.id 
        },
      })

      if (res.data?.code === 200) {
        const { insertedCount = 0, updatedCount = 0 } = res.data?.data || {}
        const msg = updatedCount > 0 
          ? `成功导入 ${insertedCount} 题，更新 ${updatedCount} 题` 
          : `成功导入 ${insertedCount} 道题目`
        Taro.showToast({ title: msg, icon: 'success' })
        
        if (tempFileKeys.length > 0) {
          await Network.request({
            url: '/api/custom-subjects/cleanup',
            method: 'POST',
            data: { tempFileKeys },
          })
          setTempFileKeys([])
        }
        
        setShowImportModal(false)
        setFileContent('')
        setParsedQuestions([])
        setQuestionsToUpdate([])
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
      <View className="bg-blue-500 px-4 pt-8 pb-6 rounded-b-3xl">
        <Text className="block text-white text-xl font-bold">创建题库</Text>
        <Text className="block text-blue-100 text-xs mt-1">自定义题库并导入题目</Text>
      </View>

      <View className="px-4 mt-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <Button
              className="w-full bg-blue-500 text-white h-12 rounded-xl"
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
                  <Skeleton key={i} className="h-28 w-full rounded-xl" />
                ))}
              </View>
            ) : subjects.length === 0 ? (
              <View className="py-8 flex flex-col items-center">
                <Plus size={48} color="#E5E7EB" />
                <Text className="block text-slate-400 mt-4">暂无自定义题库</Text>
                <Text className="block text-slate-300 text-sm mt-1">点击上方按钮创建</Text>
              </View>
            ) : (
              <View className="space-y-3 overflow-x-auto pb-2">
                {subjects.map((subject) => (
                  <View
                    key={subject.id}
                    className="flex-shrink-0 w-full p-4 rounded-xl bg-white border border-slate-200"
                  >
                    <View className="flex items-center gap-3 mb-3">
                      <View
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: subject.color + '20' }}
                      >
                        <BookOpen size={20} color={subject.color} />
                      </View>
                      <Text className="block text-sm font-medium text-slate-800 flex-1 truncate">
                        {subject.name}
                      </Text>
                    </View>

                    <View className="flex items-center justify-between mb-3">
                      <View className="flex items-center gap-2">
                        <Text className="text-xs text-slate-400">{subject.questionCount}题</Text>
                        <Badge
                          className={`text-xs ${subject.isPublic ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                        >
                          {subject.isPublic ? '公开' : '私密'}
                        </Badge>
                      </View>
                      <View className="flex items-center gap-2">
                        {subject.isPublic ? (
                          <Eye size={14} color="#10B981" />
                        ) : (
                          <EyeOff size={14} color="#6B7280" />
                        )}
                        <Switch
                          checked={subject.isPublic}
                          onCheckedChange={() => handleToggleVisibility(subject.id)}
                        />
                      </View>
                    </View>

                    <View className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 h-9 rounded-lg text-xs"
                        onClick={() => handleSelectSubject(subject)}
                      >
                        <Upload size={14} color="#64748B" className="mr-1" />
                        <Text>导入</Text>
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 h-9 rounded-lg text-xs"
                        onClick={() => handleStartPractice(subject.id, subject.name)}
                      >
                        <Text>刷题</Text>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-9 w-9 bg-red-500 text-white rounded-lg p-0 flex items-center justify-center"
                        onClick={() => handleDeleteSubject(subject.id)}
                      >
                        <Trash size={18} color="#FFFFFF" />
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
                    className="flex-1 h-10 rounded-xl bg-blue-500 text-white"
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
              <Button
                variant="ghost"
                onClick={() => {
                  setShowImportModal(false)
                  setFileContent('')
                  setParsedQuestions([])
                }}
              >
                <Text className="text-sm text-slate-500">关闭</Text>
              </Button>
            </View>

            {selectedSubject && (
              <Badge className="mb-4 bg-blue-100 text-blue-700">
                目标题库：{selectedSubject.name}
              </Badge>
            )}

            <Tabs value={importTab} onValueChange={setImportTab}>
              <TabsList className="w-full mb-4">
                <TabsTrigger value="text" className="flex-1">
                  <Text className="text-sm">直接输入</Text>
                </TabsTrigger>
                <TabsTrigger value="image" className="flex-1">
                  <ImageIcon size={14} className="mr-1" color="#64748B" />
                  <Text className="text-sm">图片上传</Text>
                </TabsTrigger>
                <TabsTrigger value="file" className="flex-1">
                  <FileText size={14} className="mr-1" color="#64748B" />
                  <Text className="text-sm">文件上传</Text>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="mt-0">
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
                  className="w-full h-12 rounded-xl bg-blue-500 text-white mb-4"
                  onClick={handleParseFile}
                  disabled={parsing}
                >
                  <Text className="text-base font-medium">{parsing ? '解析中...' : '解析题目'}</Text>
                </Button>
              </TabsContent>

              <TabsContent value="image" className="mt-0">
                <View className="flex flex-col items-center justify-center py-12">
                  <View className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <ImageIcon size={40} color="#94A3B8" />
                  </View>
                  <Text className="block text-sm font-medium text-slate-600 mb-2">上传题目图片</Text>
                  <Text className="block text-xs text-slate-400 mb-4">支持拍照或从相册选择</Text>
                  <Button
                    className="w-full max-w-xs h-12 rounded-xl bg-blue-500 text-white"
                    onClick={handleUploadImage}
                  >
                    <ImageIcon size={18} className="mr-2" color="#FFFFFF" />
                    <Text className="text-base font-medium">选择图片</Text>
                  </Button>
                </View>
              </TabsContent>

              <TabsContent value="file" className="mt-0">
                <View className="flex flex-col items-center justify-center py-12">
                  <View className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <FileUp size={40} color="#94A3B8" />
                  </View>
                  <Text className="block text-sm font-medium text-slate-600 mb-2">上传题目文件</Text>
                  <Text className="block text-xs text-slate-400 mb-4">支持 txt、md 等文本格式</Text>
                  <Button
                    className="w-full max-w-xs h-12 rounded-xl bg-blue-500 text-white"
                    onClick={handleUploadFile}
                  >
                    <FileText size={18} className="mr-2" color="#FFFFFF" />
                    <Text className="text-base font-medium">选择文件</Text>
                  </Button>
                </View>
              </TabsContent>
            </Tabs>

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

      {parsing && (
        <View 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 9999,
          }}
        >
          <View 
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'white',
              borderRadius: '20px',
              padding: '40px 32px',
              minWidth: '200px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            }}
          >
            <View 
              style={{
                width: '50px',
                height: '50px',
                border: '4px solid #E0E7FF',
                borderTopColor: '#3B82F6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '20px',
              }}
            />
            <Text 
              style={{ 
                fontSize: '15px', 
                color: '#334155', 
                fontWeight: 500,
                textAlign: 'center',
                lineHeight: '22px',
              }}
            >
              {loadingText || '处理中...'}
            </Text>
            <Text 
              style={{ 
                fontSize: '12px', 
                color: '#94A3B8', 
                marginTop: '8px',
                textAlign: 'center',
              }}
            >
              请耐心等待，请勿关闭页面
            </Text>
          </View>
        </View>
      )}
    </View>
  )
}

export default CreateSubjectPage