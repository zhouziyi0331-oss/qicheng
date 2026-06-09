import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

interface GrowthSummary {
  taskTitle: string
  completedAt: string
  earnings: number
  expGained: number
  levelUp?: {
    from: number
    to: number
  }
  skillsImproved: Array<{
    name: string
    before: number
    after: number
  }>
  newAbilities: string[]
  achievements: string[]
}

interface GrowthSummaryCardProps {
  visible: boolean
  summary: GrowthSummary
  onClose: () => void
  onShare?: () => void
}

export default function GrowthSummaryCard({
  visible,
  summary,
  onClose,
  onShare
}: GrowthSummaryCardProps) {
  if (!visible) return null

  const handleShare = () => {
    Taro.showModal({
      title: '分享到故事墙',
      content: '将你的成长故事分享到故事墙，激励更多小伙伴！',
      confirmText: '分享',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          onShare?.()
        }
      }
    })
  }

  return (
    <View className="growth-summary-overlay" onClick={onClose}>
      <View className="growth-summary-card" onClick={(e) => e.stopPropagation()}>
        {/* 庆祝动画 */}
        <View className="celebration-header">
          <Text className="celebration-emoji">🎉</Text>
          <Text className="celebration-title">任务完成！</Text>
          <Text className="celebration-subtitle">你又成长了一步</Text>
        </View>

        {/* 任务信息 */}
        <View className="task-info">
          <Text className="task-title">{summary.taskTitle}</Text>
          <Text className="task-time">
            完成于 {new Date(summary.completedAt).toLocaleString('zh-CN')}
          </Text>
        </View>

        {/* 收益卡片 */}
        <View className="earnings-section">
          <View className="earning-item money">
            <Text className="earning-icon">💰</Text>
            <View className="earning-info">
              <Text className="earning-label">获得报酬</Text>
              <Text className="earning-value">¥{summary.earnings}</Text>
            </View>
          </View>
          <View className="earning-item exp">
            <Text className="earning-icon">⭐</Text>
            <View className="earning-info">
              <Text className="earning-label">经验值</Text>
              <Text className="earning-value">+{summary.expGained}</Text>
            </View>
          </View>
        </View>

        {/* 升级提示 */}
        {summary.levelUp && (
          <View className="level-up-section">
            <Text className="level-up-icon">🎊</Text>
            <Text className="level-up-text">
              恭喜升级！Lv.{summary.levelUp.from} → Lv.{summary.levelUp.to}
            </Text>
          </View>
        )}

        {/* 技能提升 */}
        {summary.skillsImproved.length > 0 && (
          <View className="skills-section">
            <Text className="section-title">📈 技能提升</Text>
            {summary.skillsImproved.map((skill, index) => (
              <View key={index} className="skill-item">
                <Text className="skill-name">{skill.name}</Text>
                <View className="skill-progress">
                  <View className="progress-bar">
                    <View
                      className="progress-fill before"
                      style={{ width: `${skill.before}%` }}
                    />
                  </View>
                  <Text className="progress-arrow">→</Text>
                  <View className="progress-bar">
                    <View
                      className="progress-fill after"
                      style={{ width: `${skill.after}%` }}
                    />
                  </View>
                </View>
                <Text className="skill-change">+{skill.after - skill.before}%</Text>
              </View>
            ))}
          </View>
        )}

        {/* 新解锁能力 */}
        {summary.newAbilities.length > 0 && (
          <View className="abilities-section">
            <Text className="section-title">🔓 解锁新能力</Text>
            <View className="abilities-grid">
              {summary.newAbilities.map((ability, index) => (
                <View key={index} className="ability-badge">
                  <Text className="ability-text">{ability}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 成就徽章 */}
        {summary.achievements.length > 0 && (
          <View className="achievements-section">
            <Text className="section-title">🏆 获得成就</Text>
            <View className="achievements-grid">
              {summary.achievements.map((achievement, index) => (
                <View key={index} className="achievement-badge">
                  <Text className="achievement-icon">🏅</Text>
                  <Text className="achievement-text">{achievement}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 按钮组 */}
        <View className="button-group">
          <Button className="share-btn" onClick={handleShare}>
            <Text className="btn-text">📖 分享到故事墙</Text>
          </Button>
          <Button className="close-btn" onClick={onClose}>
            <Text className="btn-text">继续前进</Text>
          </Button>
        </View>

        {/* 鼓励语 */}
        <View className="encouragement">
          <Text className="encouragement-text">
            "每一次完成都是新的起点，继续加油！"
          </Text>
        </View>
      </View>
    </View>
  )
}
