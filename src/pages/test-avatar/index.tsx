import { useState, useEffect } from 'react'
// eslint-disable-next-line no-restricted-syntax
import { View, Text, Image, Button as TaroButton } from '@tarojs/components'
import Taro from '@tarojs/taro'

export default function TestAvatar() {
  const [avatarUrl, setAvatarUrl] = useState('')
  const [logText, setLogText] = useState('')

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString()
    setLogText((prev) => `[${time}] ${msg}\n${prev}`)
    console.log('[TestAvatar]', msg)
  }

  useEffect(() => {
    try {
      const info = Taro.getSystemInfoSync()
      addLog(`平台: ${info.platform}, SDK: ${info.SDKVersion}`)
    } catch (e) {
      addLog(`init error: ${e}`)
    }
  }, [])

  // 场景A：极简按钮（无任何额外props）
  const onChooseA = (e: any) => {
    addLog(`A chooseAvatar: ${JSON.stringify(e?.detail || {})}`)
    if (e.detail?.avatarUrl) setAvatarUrl(e.detail.avatarUrl)
  }

  // 场景B：带 bindtap 验证触摸事件
  const onTapB = () => {
    addLog('B tap事件触发 - 按钮收到了触摸')
  }
  const onChooseB = (e: any) => {
    addLog(`B chooseAvatar: ${JSON.stringify(e?.detail || {})}`)
    if (e.detail?.avatarUrl) setAvatarUrl(e.detail.avatarUrl)
  }

  // 场景C：用 onClick 替代，走 chooseMedia 降级方案
  const onChooseC = async () => {
    addLog('C chooseMedia 降级方案启动')
    try {
      const res = await Taro.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: ['compressed'],
      })
      if (res.tempFiles?.[0]?.tempFilePath) {
        const url = res.tempFiles[0].tempFilePath
        addLog(`C 选择图片: ${url}`)
        setAvatarUrl(url)
      }
    } catch (err: any) {
      addLog(`C chooseMedia 失败: ${JSON.stringify(err)}`)
    }
  }

  return (
    <View className="min-h-full bg-gray-50 p-4">
      <Text className="block text-lg font-bold text-gray-800 mb-4">头像选择诊断</Text>

      {/* 场景A：极简按钮 */}
      <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
        <Text className="block text-sm font-semibold text-gray-700 mb-2">A: 极简 chooseAvatar 按钮</Text>
        <Text className="block text-xs text-gray-500 mb-3">无任何额外props，点击应弹出微信头像选择</Text>
        <TaroButton openType="chooseAvatar" onChooseAvatar={onChooseA}>
          <Text>选择头像A</Text>
        </TaroButton>
      </View>

      {/* 场景B：验证 tap 事件 */}
      <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
        <Text className="block text-sm font-semibold text-gray-700 mb-2">B: 验证 tap + chooseAvatar</Text>
        <Text className="block text-xs text-gray-500 mb-3">如果tap触发但chooseAvatar没触发，说明open-type未生效</Text>
        <TaroButton
          openType="chooseAvatar"
          onChooseAvatar={onChooseB}
          onClick={onTapB}
        >
          <Text>选择头像B</Text>
        </TaroButton>
      </View>

      {/* 场景C：chooseMedia 降级 */}
      <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
        <Text className="block text-sm font-semibold text-gray-700 mb-2">C: chooseMedia 降级方案</Text>
        <Text className="block text-xs text-gray-500 mb-3">用 Taro.chooseMedia 选图（非微信头像弹窗）</Text>
        <View style={{ display: 'flex', flexDirection: 'row', gap: '8px' }}>
          <View style={{ flex: 1 }}>
            <TaroButton onClick={onChooseC}>
              <Text>从相册选择</Text>
            </TaroButton>
          </View>
        </View>
      </View>

      {/* 结果展示 */}
      {avatarUrl && (
        <View className="bg-green-50 rounded-xl p-4 mb-3 flex items-center gap-3">
          <Image src={avatarUrl} className="w-16 h-16 rounded-full" mode="aspectFill" />
          <View>
            <Text className="block text-sm text-green-700 font-semibold">✓ 头像已选择</Text>
            <Text className="block text-xs text-gray-500 break-all">{avatarUrl}</Text>
          </View>
        </View>
      )}

      {/* 日志区 */}
      <View className="bg-gray-900 rounded-xl p-4 mb-8">
        <Text className="block text-xs text-green-400 font-mono mb-2">--- 诊断日志 ---</Text>
        <Text className="block text-xs text-gray-300 font-mono whitespace-pre-wrap">{logText || "等待事件..."}</Text>
      </View>
    </View>
  )
}
