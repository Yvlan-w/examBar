import { useState } from 'react'
// eslint-disable-next-line no-restricted-syntax
import { View, Text, Image, Button as TaroButton } from '@tarojs/components'
import { User } from 'lucide-react-taro'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export default function TestAvatar() {
  const [avatarUrl1, setAvatarUrl1] = useState('')
  const [avatarUrl2, setAvatarUrl2] = useState('')
  const [avatarUrl3, setAvatarUrl3] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [logText, setLogText] = useState('点击按钮开始测试...')

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString()
    setLogText((prev) => `[${time}] ${msg}\n${prev}`)
    console.log('[TestAvatar]', msg)
  }

  // 场景1：最简按钮（无样式、无子元素）
  const onChooseAvatar1 = (e: any) => {
    addLog(`场景1 triggered! e.detail=${JSON.stringify(e?.detail || {})}`)
    const url = e.detail?.avatarUrl
    if (url) {
      setAvatarUrl1(url)
      addLog(`场景1 头像URL: ${url}`)
    }
  }

  // 场景2：带样式和子元素（pointer-events:none 包装）
  const onChooseAvatar2 = (e: any) => {
    addLog(`场景2 triggered! e.detail=${JSON.stringify(e?.detail || {})}`)
    const url = e.detail?.avatarUrl
    if (url) {
      setAvatarUrl2(url)
      addLog(`场景2 头像URL: ${url}`)
    }
  }

  // 场景3：在 Dialog 内
  const onChooseAvatar3 = (e: any) => {
    addLog(`场景3(Dialog内) triggered! e.detail=${JSON.stringify(e?.detail || {})}`)
    const url = e.detail?.avatarUrl
    if (url) {
      setAvatarUrl3(url)
      addLog(`场景3 头像URL: ${url}`)
    }
  }

  return (
    <View className="min-h-full bg-gray-50 p-4">
      <Text className="block text-lg font-bold text-gray-800 mb-4">头像选择测试页</Text>

      {/* 场景1：最简按钮 */}
      <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        <Text className="block text-sm font-semibold text-gray-700 mb-2">
          场景1：最简按钮（无样式无子元素）
        </Text>
        <Text className="block text-xs text-gray-500 mb-3">
          点击下方文字按钮，应弹出微信头像选择
        </Text>
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
            <Text className="text-xs text-green-600">✓ 选择成功</Text>
          </View>
        )}
      </View>

      {/* 场景2：带样式和图标子元素 */}
      <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        <Text className="block text-sm font-semibold text-gray-700 mb-2">
          场景2：带样式+图标（pointer-events:none 包装）
        </Text>
        <Text className="block text-xs text-gray-500 mb-3">
          点击圆形区域，应弹出微信头像选择
        </Text>
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
        {avatarUrl2 && (
          <Text className="block text-xs text-green-600 mt-2">✓ 选择成功</Text>
        )}
      </View>

      {/* 场景3：在 Dialog 内 */}
      <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        <Text className="block text-sm font-semibold text-gray-700 mb-2">
          场景3：在 Dialog 内（与 LoginDialog 相同结构）
        </Text>
        <Text className="block text-xs text-gray-500 mb-3">
          点击下方按钮打开 Dialog，然后点击 Dialog 内的头像区域
        </Text>
        <Button onClick={() => setDialogOpen(true)}>
          <Text>打开 Dialog 测试</Text>
        </Button>
      </View>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Dialog 内头像测试</DialogTitle>
            <DialogDescription className="text-center">点击下方圆形区域选择头像</DialogDescription>
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

      {/* 日志输出区 */}
      <View className="bg-gray-900 rounded-xl p-4 mb-8">
        <Text className="block text-xs text-green-400 font-mono mb-2">--- 测试日志 ---</Text>
        <Text className="block text-xs text-gray-300 font-mono whitespace-pre-wrap">{logText}</Text>
      </View>
    </View>
  )
}
