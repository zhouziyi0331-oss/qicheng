import { View, Text, ScrollView, Button } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import './index.scss'

interface SavedQuote {
  text: string
  sub: string
  savedAt: number
}

export default function CatQuotes() {
  const router = useRouter()
  const [quotes, setQuotes] = useState<SavedQuote[]>([])

  useEffect(() => {
    loadSavedQuotes()
  }, [])

  const loadSavedQuotes = () => {
    try {
      const savedQuotes = Taro.getStorageSync('savedQuotes') || []
      setQuotes(savedQuotes)
    } catch (error) {
      console.error('加载收藏失败:', error)
    }
  }

  const handleBack = () => {
    Taro.navigateBack()
  }

  const handleShare = (index: number) => {
    Taro.showToast({
      title: '分享功能开发中',
      icon: 'none'
    })
  }

  const handleDelete = (index: number) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这条收藏吗？',
      success: (res) => {
        if (res.confirm) {
          try {
            const newQuotes = [...quotes]
            newQuotes.splice(index, 1)
            Taro.setStorageSync('savedQuotes', newQuotes)
            setQuotes(newQuotes)
            Taro.showToast({
              title: '已删除',
              icon: 'success'
            })
          } catch (error) {
            console.error('删除失败:', error)
          }
        }
      }
    })
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${year}年${month}月${day}日`
  }

  return (
    <View className="cat-quotes-page">
      {/* 顶部栏 */}
      <View className="top-bar">
        <View className="back-btn" onClick={handleBack}>
          <Text className="back-icon">‹</Text>
        </View>
        <Text className="top-title">我的收藏</Text>
        <View className="top-actions">
          <View className="icon-btn">
            <Text className="icon">○</Text>
          </View>
        </View>
      </View>

      {/* Hero */}
      <View className="qc-hero">
        <Text className="qc-count">{quotes.length}</Text>
        <View className="qc-count-label">
          <Text>句话被你收藏了</Text>
          <Text className="sparkle">◆</Text>
        </View>
      </View>

      <ScrollView className="scroll-area" scrollY>
        <View className="qc-body">
          {quotes.length === 0 ? (
            <View className="empty-state">
              <Text className="empty-icon">○</Text>
              <Text className="empty-text">还没有收藏任何语录</Text>
              <Text className="empty-hint">在秘密空间收藏喜欢的句子吧</Text>
            </View>
          ) : (
            quotes.map((quote, index) => (
              <View key={index} className="quote-saved-card">
                <Text className="qs-text">{quote.text}</Text>
                <Text className="qs-sub">{quote.sub}</Text>
                <View className="qs-footer">
                  <Text className="qs-date">{formatDate(quote.savedAt)}</Text>
                  <View className="qs-actions">
                    <Button className="qs-btn share" onClick={() => handleShare(index)}>
                      分享
                    </Button>
                    <Button className="qs-btn del" onClick={() => handleDelete(index)}>
                      删除
                    </Button>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  )
}
