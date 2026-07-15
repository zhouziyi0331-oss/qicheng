import { View, Text, Button } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { tokenManager } from '../../../utils/token'
import { getApiUrl } from '../../../config'
import './index.scss'

interface Rewards {
  thinkingPoints: number;
  fragments: number;
  badges: string[];
}

interface AbilityGrowth {
  name: string;
  oldLevel: number;
  newLevel: number;
  progress: number;
}

export default function ProjectComplete() {
  const router = useRouter()
  const { projectId, projectName } = router.params

  const [showAnimation, setShowAnimation] = useState(true)
  const [rewards, setRewards] = useState<Rewards>({
    thinkingPoints: 0,
    fragments: 0,
    badges: []
  })
  const [abilities, setAbilities] = useState<AbilityGrowth[]>([])

  useEffect(() => {
    loadCompletionData()
    setTimeout(() => setShowAnimation(false), 2000)
  }, [])

  const loadCompletionData = async () => {
    try {
      const token = tokenManager.getAccessToken()
      if (!token) return

      const res = await Taro.request({
        url: `/api/v1/projects/${projectId}/completion`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (res.data.success) {
        setRewards(res.data.data.rewards || { thinkingPoints: 0, fragments: 0, badges: [] })
        setAbilities(res.data.data.abilities || [])
      }
    } catch (error) {
      console.error('加载完成数据失败:', error)
    }
  }

  const viewAbilityMap = () => {
    Taro.navigateTo({ url: '/pages/ability-map/index' })
  }

  const backToDashboard = () => {
    Taro.switchTab({ url: '/pages/index/index' })
  }

  const viewRecommendations = () => {
    Taro.navigateTo({
      url: `/pages/cross-sector-recommend/index?projectId=${projectId}`
    })
  }

  return (
    <View className="complete-page">
      {/* 庆祝动画 */}
      {showAnimation && (
        <View className="celebration">
          <Text className="celebration-icon">◇</Text>
          <Text className="celebration-text">恭喜完成！</Text>
        </View>
      )}

      {/* 完成卡片 */}
      <View className="complete-card">
        <Text className="complete-icon">✓</Text>
        <Text className="complete-title">项目完成！</Text>
        <Text className="complete-subtitle">{projectName || '未知项目'}</Text>
      </View>

      {/* 奖励展示 */}
      <View className="rewards-section">
        <Text className="section-title">◆ 获得奖励</Text>

        <View className="rewards-grid">
          <View className="reward-item">
            <Text className="reward-icon">◇</Text>
            <Text className="reward-value">+{rewards.thinkingPoints}</Text>
            <Text className="reward-label">思考值</Text>
          </View>

          <View className="reward-item">
            <Text className="reward-icon">◆</Text>
            <Text className="reward-value">+{rewards.fragments}</Text>
            <Text className="reward-label">能力碎片</Text>
          </View>

          {rewards.badges.length > 0 && (
            <View className="reward-item">
              <Text className="reward-icon">◆️</Text>
              <Text className="reward-value">+{rewards.badges.length}</Text>
              <Text className="reward-label">徽章</Text>
            </View>
          )}
        </View>
      </View>

      {/* 能力提升 */}
      {abilities.length > 0 && (
        <View className="ability-section">
          <Text className="section-title">● 能力提升</Text>
          <Text className="section-desc">你在以下能力上获得了提升</Text>

          <View className="ability-list">
            {abilities.map((ability, index) => (
              <View key={index} className="ability-item">
                <Text className="ability-name">{ability.name}</Text>
                <View className="ability-progress">
                  <View className="progress-bar">
                    <View className="progress-fill" style={{ width: `${ability.progress}%` }} />
                  </View>
                  <Text className="progress-text">
                    Lv.{ability.oldLevel} → Lv.{ability.newLevel}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <Button className="view-map-btn" onClick={viewAbilityMap}>
            查看完整能力图谱
          </Button>
        </View>
      )}

      {/* 底部操作 */}
      <View className="bottom-actions">
        <Button className="action-btn secondary" onClick={backToDashboard}>
          返回主页
        </Button>
        <Button className="action-btn primary" onClick={viewRecommendations}>
          查看推荐课程
        </Button>
      </View>
    </View>
  )
}
