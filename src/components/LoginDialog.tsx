import { useState, useEffect } from 'react'
// eslint-disable-next-line no-restricted-syntax
import { View, Text, Image, Button as TaroButton } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Network } from '@/network'
import { useUserStore } from '@/store/user'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { User } from 'lucide-react-taro'
import { getPrivacySetting } from '@/utils/privacy'

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
  const [needPrivacyAuth, setNeedPrivacyAuth] = useState(false)
  const { login } = useUserStore()

  const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP

  useEffect(() => {
    if (!open) return

    // 恢复已存储的用户信息
    const storedUser = Taro.getStorageSync('examBar_user')
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        if (userData.nickName) setNickName(userData.nickName)
        if (userData.avatarUrl?.startsWith('http')) setAvatarUrl(userData.avatarUrl)
      } catch (e) {
        console.error('parse user data error:', e)
      }
    }

    // 检查隐私授权状态
    if (isWeapp) {
      getPrivacySetting().then(({ needAuthorization }) => {
        setNeedPrivacyAuth(needAuthorization)
      })
    }
  }, [open])

  // 用户点击「同意并继续」按钮
  const onAgreePrivacy = () => {
    console.log('[Privacy] 用户同意了隐私协议')
    setNeedPrivacyAuth(false)
  }

  // 打开隐私协议页面查看
  const handleViewPrivacy = () => {
    // @ts-ignore
    if (typeof wx !== 'undefined' && wx.openPrivacyContract) {
      // @ts-ignore
      wx.openPrivacyContract({
        success() {
          console.log('[Privacy] openPrivacyContract success')
        },
        fail(err: any) {
          console.warn('[Privacy] openPrivacyContract fail:', err)
        },
      })
    }
  }

  const onChooseAvatar = async (e: any) => {
    console.log('[Avatar] chooseAvatar triggered', e)
    const newAvatarUrl = e.detail?.avatarUrl || e.avatarUrl
    if (!newAvatarUrl) {
      console.warn('[Avatar] chooseAvatar 未获取到头像路径')
      Taro.showToast({ title: '选择头像失败，请重试', icon: 'none' })
      return
    }

    console.log('[Avatar] 选中头像:', newAvatarUrl)

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
          } else {
            throw new Error(data?.message || '上传返回数据异常')
          }
        } else {
          throw new Error('上传失败，状态码: ' + uploadResult.statusCode)
        }
      } catch (error) {
        console.error('[Avatar] Upload error:', error)
        Taro.showToast({ title: '头像上传失败，请重试', icon: 'none' })
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
      let loginCode = 'h5_login'

      if (isWeapp) {
        const loginRes = await Taro.login()
        if (loginRes.code) {
          loginCode = loginRes.code
        }
      }

      const result = await Network.request({
        url: '/api/auth/login',
        method: 'POST',
        data: { code: loginCode, nickName: nickName || '', avatarUrl: avatarUrl || '' },
      })

      if (result.data?.success && result.data.data) {
        const user = result.data.data.user
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
      Taro.showToast({ title: '登录失败，请重试', icon: 'none' })
    } finally {
      setLoginLoading(false)
    }
  }

  const handleSkipLogin = () => {
    onOpenChange(false)
    Taro.setStorageSync('examBar_skip_login', Date.now().toString())
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={!allowSkip}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <View className="flex flex-col items-center">
            <DialogTitle className="text-lg font-bold text-center">{title}</DialogTitle>
            <DialogDescription className="text-center mt-2">
              {description}
            </DialogDescription>
          </View>
        </DialogHeader>

        {/* 隐私授权步骤：未同意时显示 */}
        {needPrivacyAuth && (
          <View className="p-4">
            <View className="flex flex-col items-center gap-4">
              <Text className="block text-sm text-gray-600 text-center">
                使用本小程序需要您同意隐私保护指引
              </Text>
              <Text
                className="block text-xs text-blue-500 underline"
                onClick={handleViewPrivacy}
              >
                查看隐私保护指引
              </Text>
              {/* 关键：用原生按钮 open-type="agreePrivacyAuthorization" 完成授权 */}
              <TaroButton
                openType="agreePrivacyAuthorization"
                onAgreePrivacyAuthorization={onAgreePrivacy}
                className="w-full bg-blue-600 rounded-lg"
                style={{ padding: 0, margin: 0, lineHeight: 'normal' }}
              >
                <Text className="text-white">同意并继续</Text>
              </TaroButton>
            </View>
          </View>
        )}

        {/* 登录表单：隐私已同意后显示 */}
        {!needPrivacyAuth && (
          <>
            <View className="p-4">
              <View className="flex flex-col items-center gap-4">
                <TaroButton
                  openType="chooseAvatar"
                  onChooseAvatar={onChooseAvatar}
                  plain
                  hoverClass="none"
                  className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50"
                  style={{ padding: 0, margin: 0, lineHeight: 'normal', overflow: 'hidden' }}
                >
                  <View style={{ pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                    {avatarUrl ? (
                      <Image src={avatarUrl} className="w-full h-full rounded-full" mode="aspectFill" />
                    ) : (
                      <User size={32} color="#94A3B8" />
                    )}
                  </View>
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
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
