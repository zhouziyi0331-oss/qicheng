import { View, Text, Button, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import './index.scss'

interface IdentityCardProps {
  cardData: {
    cardId: string
    personalityType: string
    personalityTypeLabel: string
    declaration: string
    strengths: string[]
    level: number
    completedTasksCount: number
    daysOnPlatform: number
    avgScore: number
    visualTheme: string
    shareUrl: string
  }
  showShareButton?: boolean
  onShare?: () => void
}

const IdentityCard: React.FC<IdentityCardProps> = ({
  cardData,
  showShareButton = true,
  onShare
}) => {
  const [imageLoaded, setImageLoaded] = useState(false)

  // 根据主题选择背景色
  const getThemeColors = (theme: string) => {
    const themes = {
      default: {
        primary: '#6366F1',
        secondary: '#818CF8',
        accent: '#C7D2FE'
      },
      minimal: {
        primary: '#64748B',
        secondary: '#94A3B8',
        accent: '#E2E8F0'
      },
      vibrant: {
        primary: '#EC4899',
        secondary: '#F472B6',
        accent: '#FBCFE8'
      },
      elegant: {
        primary: '#8B5CF6',
        secondary: '#A78BFA',
        accent: '#DDD6FE'
      }
    }
    return themes[theme] || themes.default
  }

  const themeColors = getThemeColors(cardData.visualTheme)

  const handleShare = () => {
    if (onShare) {
      onShare()
    } else {
      // 默认分享逻辑
      Taro.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      })
    }
  }

  const handleSaveImage = async () => {
    try {
      Taro.showLoading({ title: '生成中...' })

      // TODO: 调用后端生成海报图片
      // const res = await Taro.request({
      //   url: `${API_BASE_URL}/api/v1/opc/identity-cards/${cardData.cardId}/poster`,
      //   method: 'GET'
      // })

      // 临时：显示保存提示
      Taro.hideLoading()
      Taro.showToast({
        title: '保存功能开发中',
        icon: 'none'
      })
    } catch (error) {
      Taro.hideLoading()
      Taro.showToast({
        title: '保存失败',
        icon: 'error'
      })
    }
  }

  return (
    <View className='identity-card' style={{
      background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)`
    }}>
      {/* 卡片头部 */}
      <View className='card-header'>
        <View className='level-badge'>
          <Text className='level-text'>Lv.{cardData.level}</Text>
        </View>
        <Text className='personality-label'>{cardData.personalityTypeLabel}</Text>
      </View>

      {/* 身份宣言 */}
      <View className='declaration-section'>
        <Text className='declaration-text'>{cardData.declaration}</Text>
      </View>

      {/* 三大优势 */}
      <View className='strengths-section'>
        <Text className='section-title'>核心优势</Text>
        <View className='strengths-list'>
          {cardData.strengths.map((strength, index) => (
            <View key={index} className='strength-item'>
              <View className='strength-dot' style={{ backgroundColor: themeColors.accent }} />
              <Text className='strength-text'>{strength}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 成长数据 */}
      <View className='stats-section'>
        <View className='stat-item'>
          <Text className='stat-value'>{cardData.daysOnPlatform}</Text>
          <Text className='stat-label'>在平台天数</Text>
        </View>
        <View className='stat-divider' />
        <View className='stat-item'>
          <Text className='stat-value'>{cardData.completedTasksCount}</Text>
          <Text className='stat-label'>完成项目</Text>
        </View>
        <View className='stat-divider' />
        <View className='stat-item'>
          <Text className='stat-value'>{cardData.avgScore}</Text>
          <Text className='stat-label'>平均评分</Text>
        </View>
      </View>

      {/* 底部操作按钮 */}
      {showShareButton && (
        <View className='card-actions'>
          <Button
            className='action-btn save-btn'
            onClick={handleSaveImage}
          >
            保存图片
          </Button>
          <Button
            className='action-btn share-btn'
            onClick={handleShare}
          >
            分享卡片
          </Button>
        </View>
      )}

      {/* 装饰元素 */}
      <View className='card-decoration' style={{ backgroundColor: themeColors.accent }} />
    </View>
  )
}

export default IdentityCard
