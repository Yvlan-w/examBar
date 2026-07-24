import { useState, useEffect } from 'react'
import { View, Text, Image,Button as TaroButton} from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Network } from '@/network'
import { useUserStore } from '@/store/user'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { User } from 'lucide-react-taro'

interface LoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  allowSkip?: boolean
  onLoginSuccess?: () => void
}

export const LoginDialog = ({
  open,
  onOpenChange,
  title = '欢迎使用职考刷题',
  description = '请登录以保存您的学习进度',
  allowSkip = true,
  onLoginSuccess,
}: LoginDialogProps) => {
  const [nickName, setNickName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const { login } = useUserStore()

  useEffect(() => {
    if (open) {
      const storedUser = Taro.getStorageSync('examBar_user')
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser)
          if (userData.nickName) {
            setNickName(userData.nickName)
          }
          if (userData.avatarUrl && userData.avatarUrl.startsWith('http')) {
            setAvatarUrl(userData.avatarUrl)
          }
        } catch (e) {
          console.error('parse user data error:', e)
        }
      }
    }
  }, [open])

  const onChooseAvatar = async (e: any) => {
    const newAvatarUrl = e.detail?.avatarUrl || e.avatarUrl
    
    if (!newAvatarUrl) return
    
    if (newAvatarUrl.startsWith('wxfile://')) {
      Taro.showLoading({ title: '上传头像中...' })
      try {
        const uploadResult = await Network.uploadFile({
          url: '/api/auth/upload-avatar',
          filePath: newAvatarUrl,
          name: 'file',
        })
        
        if (uploadResult.statusCode === 200) {
          const data = typeof uploadResult.data === 'string' 
            ? JSON.parse(uploadResult.data) 
            : uploadResult.data
          if (data.success && data.data?.url) {
            setAvatarUrl(data.data.url)
          }
        }
      } catch (error) {
        console.error('Upload avatar error:', error)
        setAvatarUrl(newAvatarUrl)
      } finally {
        Taro.hideLoading()
      }
    } else {
      setAvatarUrl(newAvatarUrl)
    }
  }

  const onNickNameInput = (e: any) => {
    setNickName(e.detail.value)
  }

  const handleLogin = async () => {
    setLoginLoading(true)
    try {
      const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP
      console.log('login env:', isWeapp ? 'weapp' : 'h5')
      
      let loginCode = 'h5_login'
      
      if (isWeapp) {
        const loginRes = await Taro.login()
        console.log('Taro.login result:', loginRes)
        if (loginRes.code) {
          loginCode = loginRes.code
        }
      }
      
      const result = await Network.request({
        url: '/api/auth/login',
        method: 'POST',
        data: { code: loginCode, nickName: nickName || '', avatarUrl: avatarUrl || '' },
      })
      console.log('login result:', result.data)
      
      if (result.data?.success && result.data.data) {
        const user = result.data.data.user
        console.log('login success:', user)
        login(user)
        Taro.setStorageSync('examBar_user', JSON.stringify(user))
        onOpenChange(false)
        onLoginSuccess?.()
        Taro.showToast({ title: '登录成功', icon: 'success' })
      } else {
        Taro.showToast({
          title: result.data?.message || '登录失败',
          icon: 'none',
        })
      }
    } catch (error) {
      console.error('login error:', error)
      Taro.showToast({
        title: '登录失败，请重试',
        icon: 'none',
      })
    } finally {
      setLoginLoading(false)
    }
  }

  const handleSkipLogin = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <View className="flex flex-col items-center">
            <DialogTitle className="text-lg font-bold text-center">{title}</DialogTitle>
            <DialogDescription className="text-center mt-2">
              {description}
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
                  
                    <Image src={avatarUrl} className="w-full h-full rounded-full" mode="aspectFill" />
                  
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
          {allowSkip && (
            <Button variant="outline" className="w-full" onClick={handleSkipLogin}>
              <Text>暂不登录</Text>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
