import { View, Text, Image } from '@tarojs/components'
import React from 'react'

/**
 * Markdown 内容块类型
 */
interface ContentBlock {
  type: 'text' | 'image'
  content: string
  alt?: string
  url?: string
}

/**
 * 检查内容是否包含 Markdown 图片
 */
export function hasMarkdownImage(content: string): boolean {
  if (!content) return false
  return /!\[[^\]]*\]\([^)]+\)/.test(content)
}

/**
 * 将 Markdown 内容解析为内容块数组
 * 支持的语法: ![alt](url)
 */
export function parseMarkdownContent(content: string): ContentBlock[] {
  if (!content) return []

  const blocks: ContentBlock[] = []
  const regex = /!\[([^\]]*)\]\(([^)]+)\)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(content)) !== null) {
    // 添加图片前的文本
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index)
      if (text.trim()) {
        blocks.push({ type: 'text', content: text })
      }
    }

    // 添加图片块
    blocks.push({
      type: 'image',
      content: match[0],
      alt: match[1] || '题目图片',
      url: match[2],
    })

    lastIndex = regex.lastIndex
  }

  // 添加最后的文本
  if (lastIndex < content.length) {
    const text = content.slice(lastIndex)
    if (text.trim()) {
      blocks.push({ type: 'text', content: text })
    }
  }

  // 如果没有图片，直接返回整个内容作为一个文本块
  if (blocks.length === 0) {
    blocks.push({ type: 'text', content })
  }

  return blocks
}

/**
 * Markdown 渲染器组件
 * 将包含 Markdown 图片语法的文本正确渲染为图片
 */
export const MarkdownRenderer: React.FC<{
  content: string
  className?: string
  imageMode?: 'widthFix' | 'aspectFit' | 'aspectFill' | 'scaleToFill'
}> = ({ content, className = '', imageMode = 'widthFix' }) => {
  const blocks = parseMarkdownContent(content)

  return (
    <View className={className}>
      {blocks.map((block, index) => {
        if (block.type === 'image' && block.url) {
          return (
            <View key={index} className='my-2'>
              <Image
                src={block.url}
                mode={imageMode}
                className='w-full rounded-lg'
              />
            </View>
          )
        } else {
          // 处理文本中的换行
          const lines = block.content.split('\n')
          return (
            <Text key={index} className='block'>
              {lines.map((line, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <Text className='block'>{'\n'}</Text>}
                  {line}
                </React.Fragment>
              ))}
            </Text>
          )
        }
      })}
    </View>
  )
}

export default MarkdownRenderer
