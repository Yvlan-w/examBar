import { useState, useEffect } from 'react'
// eslint-disable-next-line no-restricted-syntax
import { View, Text, Image, Button as TaroButton } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { User } from 'lucide-react-taro'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export default function TestAvatar() {
  const [avatarUrl, setAvatarUrl] = useState('')
  const [logText, setLogText] = useState('')
  const [privacyAgreed, setPrivacyAgreed] = useState(false)
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false)
  const [sysInfo, setSysInfo] = useState({ platform: '', SDKVersion: '' })

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString()
    setLogText((prev) => `[${time}] ${msg}\n${prev}`)
    console.log('[TestAvatar]', msg)
  }

  useEffect(() => {
    try {
      const info = Taro.getSystemInfoSync()
      setSysInfo({ platform: info.platform || '', SDKVersion: info.SDKVersion || '' })
      addLog(`平台: ${info.platform}, SDK: ${info.SDKVersion}`)
      checkPrivacy()
    } catch (e) {
      addLog(`init error: ${e}`)
    }
  }, [])

  const checkPrivacy = () => {
    if (Taro.getEnv() !== Taro.ENV_TYPE.WEAPP) return
    // @ts-ignore
    if (typeof wx === 'undefined' || !wx.getPrivacySetting) {
      addLog('wx.getPrivacySetting 不可用，可能基础库版本过低')
      return
    }
    // @ts-ignore
    wx.getPrivacySetting({
      success(res: any) {
        addLog(`隐私协议 needAuthorization: ${res.needAuthorization}`)
        if (res.needAuthorization) {
          addLog('⚠️ 需要用户同意隐私协议，chooseAvatar 才能生效')
          setShowPrivacyDialog(true)
        } else {
          addLog('✓ 隐私协议已同意，chooseAvatar 可用')
          setPrivacyAgreed(true)
        }
      },
      fail(err: any) {
        addLog(`隐私协议检查失败: ${JSON.stringify(err)}`)
      },
    })
  }

  const onAgreePrivacy = () => {
    addLog('用户同意了隐私协议')
    setPrivacyAgreed(true)
    setShowPrivacyDialog(false)
  }

  const onChooseAvatar = (e: any) => {
    addLog(`chooseAvatar triggered! detail=${JSON.stringify(e?.detail || {})}`)
    const url = e.detail?.avatarUrl
    if (url) {
      setAvatarUrl(url)
      addLog(`头像URL: ${url}`)
    } else {
      addLog('⚠️ avatarUrl 为空')
    }
  }

  return (
    <View className="min-h-full bg-gray-50 p-4">
      <Text className="block text-lg font-bold text-gray-800 mb-2">头像选择测试</Text>

      {/* 诊断信息 */}
      <View className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
        <Text className="block text-xs font-semibold text-blue-800 mb-1">环境诊断</Text>
        <Text className="block text-xs text-blue-700">平台: {sysInfo.platform || '...'}</Text>
        <Text className="block text-xs text-blue-700">SDK: {sysInfo.SDKVersion || '...'}</Text>
        <Text className="block text-xs text-blue-700">隐私协议: {privacyAgreed ? '✓ 已同意' : '✗ 未同意'}</Text>
      </View>

      {/* 隐私同意弹窗 */}
      <Dialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">隐私协议</DialogTitle>
            <DialogDescription className="text-center">
              使用头像选择功能需要您同意隐私协议
            </DialogDescription>
          </DialogHeader>
          <View className="flex flex-col gap-3 p-4">
            <TaroButton
              openType="agreePrivacyAuthorization"
              onAgreePrivacyAuthorization={onAgreePrivacy}
              plain
              hoverClass="none"
              className="w-full bg-blue-600 text-white rounded-lg py-3"
              style={{ padding: 0, margin: 0, lineHeight: 'normal' }}
            >
              <Text className="text-white">同意并继续</Text>
            </TaroButton>
          </View>
        </DialogContent>
      </Dialog>

      {/* 头像选择按钮（隐私同意后才能生效） */}
      <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        <Text className="block text-sm font-semibold text-gray-700 mb-2">
          点击选择头像 {privacyAgreed ? '' : '（需先同意隐私协议）'}
        </Text>
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
        {avatarUrl && <Text className="block text-xs text-green-600 mt-2">✓ 选择成功</Text>}
      </View>

      {/* 重新检查隐私协议 */}
      <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        <Button onClick={checkPrivacy} variant="outline" className="w-full">
          <Text>重新检查隐私协议状态</Text>
        </Button>
      </View>

      {/* 日志区 */}
      <View className="bg-gray-900 rounded-xl p-4 mb-8">
        <Text className="block text-xs text-green-400 font-mono mb-2">--- 日志 ---</Text>
        <Text className="block text-xs text-gray-300 font-mono whitespace-pre-wrap">{logText || '等待...'}</Text>
      </View>
    </View>
  )
}
