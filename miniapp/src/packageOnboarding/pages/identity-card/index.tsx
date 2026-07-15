import { View, Text, Button } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { opcV2API } from '../../../services/api'
import IdentityCard from '../../../components/IdentityCard'
import './index.scss'

export default function IdentityCardPage() {
  const [cardData, setCardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [cardId, setCardId] = useState<string>('')

  useLoad(() => {
    const params = Taro.getCurrentInstance().router?.params
    if (params?.cardId) {
      setCardId(params.cardId)
      loadCardData(params.cardId)
    } else {
      Taro.showToast({
        title: '卡片ID不存在',
        icon: 'error'
      })
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    }
  })

  const loadCardData = async (id: string) => {
    try {
      setLoading(true)
      const response = await opcV2API.getIdentityCardById(id)

      if (response.success && response.data) {
        setCardData(response.data)
      } else {
        throw new Error('加载失败')
      }
    } catch (error: any) {
      Taro.showToast({
        title: error.message || '加载失败',
        icon: 'error'
      })
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } finally {
      setLoading(false)
    }
  }

  const handleShare = () => {
    // 微信分享
    Taro.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  }

  // 微信分享配置
  Taro.useShareAppMessage(() => {
    return {
      title: `我是${cardData?.personalityTypeLabel} - 启程AI`,
      path: `/packageOnboarding/pages/identity-card/index?cardId=${cardId}`,
      imageUrl: '' // TODO: 生成分享图片
    }
  })

  Taro.useShareTimeline(() => {
    return {
      title: `我是${cardData?.personalityTypeLabel} - 启程AI`,
      query: `cardId=${cardId}`,
      imageUrl: '' // TODO: 生成分享图片
    }
  })

  if (loading) {
    return (
      <View className="identity-card-page">
        <View className="loading-container">
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  if (!cardData) {
    return (
      <View className="identity-card-page">
        <View className="error-container">
          <Text>卡片不存在</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="identity-card-page">
      <IdentityCard
        cardData={cardData}
        showShareButton={true}
        onShare={handleShare}
      />

      {/* 浏览次数提示 */}
      {cardData.viewCount > 0 && (
        <View className="view-count-tip">
          <Text className="tip-text">已有 {cardData.viewCount} 人查看过这张卡片</Text>
        </View>
      )}

      {/* 底部操作区 */}
      <View className="bottom-actions">
        <Button
          className="action-btn primary"
          onClick={() => {
            Taro.switchTab({ url: '/pages/index/index' })
          }}
        >
          返回首页
        </Button>

        <Button
          className="action-btn secondary"
          onClick={() => {
            Taro.navigateTo({ url: '/pages/talent-profile/index' })
          }}
        >
          查看完整画像
        </Button>
      </View>
    </View>
  )
}
