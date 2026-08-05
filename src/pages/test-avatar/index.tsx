import { useState, useEffect } from 'react'
// eslint-disable-next-line no-restricted-syntax
import { View, Text, Image, Button as TaroButton } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { User } from 'lucide-react-taro'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export default function TestAvatar() {
  const [avatarUrl1, setAvatarUrl1] = useState('')
  const [avatarUrl2, setAvatarUrl2] = useState('')
  const [avatarUrl3, setAvatarUrl3] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [logText, setLogText] = useState('')
  const [sysInfo, setSysInfo] = useState<{
    platform: string
    SDKVersion: string
    env: string
  }>({ platform: '', SDKVersion: '', env: '' })

  useEffect(() => {
    try {
      const info = Taro.getSystemInfoSync()
      const env = Taro.getEnv()
      setSysInfo({
        platform: info.platform || 'unknown',
        SDKVersion: info.SDKVersion || 'unknown',
        env: env === Taro.ENV_TYPE.WEAPP ? 'weapp' : env === Taro.ENV_TYPE.WEB ? 'h5' : String(env),
      })
      addLog(`平台: ${info.platform}, SDK: ${info.SDKVersion}`)

      // 检查隐私协议状态
      if (env === Taro.ENV_TYPE.WEAPP) {
        // @ts-ignore
        if (typeof wx !== 'undefined' && wx.getPrivacySetting) {
          // @ts-ignore
          wx.getPrivacySetting({
            success(res: any) {
              addLog(`隐私协议 needAuthorization: ${res.needAuthorization}`)
              if (res.needAuthorization) {
                addLog('⚠️ 隐私协议未授权，chooseAvatar 可能静默失败')
              }
            },
            fail(err: any) {
              addLog(`隐私协议检查失败: ${JSON.stringify(err)}`)
            },
          })
        }
      }
    } catch (e) {
      addLog(`getSystemInfo error: ${e}`)
    }
  }, [])

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString()
    setLogText((prev) => `[${time}] ${msg}\n${prev}`)
    console.log('[TestAvatar]', msg)
  }

  // 场景1：最简按钮
  const onChooseAvatar1 = (e: any) => {
    addLog(`场景1 triggered! detail=${JSON.stringify(e?.detail || {})}`)
    const url = e.detail?.avatarUrl
    if (url) setAvatarUrl1(url)
  }

  // 场景2：带样式+图标
  const onChooseAvatar2 = (e: any) => {
    addLog(`场景2 triggered! detail=${JSON.stringify(e?.detail || {})}`)
    const url = e.detail?.avatarUrl
    if (url) setAvatarUrl2(url)
  }

  // 场景3：Dialog 内
  const onChooseAvatar3 = (e: any) => {
    addLog(`场景3(Dialog) triggered! detail=${JSON.stringify(e?.detail || {})}`)
    const url = e.detail?.avatarUrl
    if (url) setAvatarUrl3(url)
  }

  const isDevtools = sysInfo.platform === 'devtools'

  return (
    <View className="min-h-full bg-gray-50 p-4">
      <Text className="block text-lg font-bold text-gray-800 mb-2">头像选择测试</Text>

      {/* 诊断信息 */}
      <View className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
        <Text className="block text-xs font-semibold text-blue-800 mb-1">环境诊断</Text>
        <Text className="block text-xs text-blue-700">平台: {sysInfo.platform || '...'}</Text>
        <Text className="block text-xs text-blue-700">SDK版本: {sysInfo.SDKVersion || '...'}</Text>
        <Text className="block text-xs text-blue-700">环境: {sysInfo.env || '...'}</Text>
        {isDevtools && (
          <Text className="block text-xs text-red-600 font-bold mt-1">
            ⚠️ 开发者工具不支持 chooseAvatar，必须真机调试！
          </Text>
        )}
        {sysInfo.SDKVersion && sysInfo.SDKVersion < '2.21.2' && (
          <Text className="block text-xs text-red-600 font-bold mt-1">
            ⚠️ 基础库版本过低，需 ≥ 2.21.2（推荐 2.32.3+）
          </Text>
        )}
      </View>

      {/* 场景1：最简按钮 */}
      <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        <Text className="block text-sm font-semibold text-gray-700 mb-2">场景1：最简按钮</Text>
        <TaroButton
          openType="chooseAvatar"
          onChooseAvatar={onChooseAvatar1}
          plain
          hoverClass="none"
        >
          <Text>选择头像</Text>
        </TaroButton>
        {avatarUrl1 && (
          <View className="mt-3 flex items-center gap-2">
            <Image src={avatarUrl1} className="w-12 h-12 rounded-full" mode="aspectFill" />
            <Text className="text-xs text-green-600">✓ 成功</Text>
          </View>
        )}
      </View>

      {/* 场景2：带样式+图标 */}
      <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        <Text className="block text-sm font-semibold text-gray-700 mb-2">场景2：带样式+图标</Text>
        <TaroButton
          openType="chooseAvatar"
          onChooseAvatar={onChooseAvatar2}
          plain
          hoverClass="none"
          className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50"
          style={{ padding: 0, margin: 0, lineHeight: 'normal', overflow: 'hidden' }}
        >
          <View style={{ pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
            {avatarUrl2 ? (
              <Image src={avatarUrl2} className="w-full h-full rounded-full" mode="aspectFill" />
            ) : (
              <User size={32} color="#94A3B8" />
            )}
          </View>
        </TaroButton>
        {avatarUrl2 && <Text className="block text-xs text-green-600 mt-2">✓ 成功</Text>}
      </View>

      {/* 场景3：Dialog 内 */}
      <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        <Text className="block text-sm font-semibold text-gray-700 mb-2">场景3：Dialog 内</Text>
        <Button onClick={() => setDialogOpen(true)}>
          <Text>打开 Dialog 测试</Text>
        </Button>
      </View>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Dialog 头像测试</DialogTitle>
            <DialogDescription className="text-center">点击下方圆形区域</DialogDescription>
          </DialogHeader>
          <View className="p-4">
            <View className="flex flex-col items-center gap-4">
              <TaroButton
                openType="chooseAvatar"
                onChooseAvatar={onChooseAvatar3}
                plain
                hoverClass="none"
                className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50"
                style={{ padding: 0, margin: 0, lineHeight: 'normal', overflow: 'hidden' }}
              >
                <View style={{ pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                  {avatarUrl3 ? (
                    <Image src={avatarUrl3} className="w-full h-full rounded-full" mode="aspectFill" />
                  ) : (
                    <User size={32} color="#94A3B8" />
                  )}
                </View>
              </TaroButton>
              <Text className="text-sm text-gray-500">点击选择头像</Text>
            </View>
          </View>
        </DialogContent>
      </Dialog>

      {/* 日志区 */}
      <View className="bg-gray-900 rounded-xl p-4 mb-8">
        <Text className="block text-xs text-green-400 font-mono mb-2">--- 日志 ---</Text>
        <Text className="block text-xs text-gray-300 font-mono whitespace-pre-wrap">{logText || '等待事件...'}</Text>
      </View>
    </View>
  )
}
