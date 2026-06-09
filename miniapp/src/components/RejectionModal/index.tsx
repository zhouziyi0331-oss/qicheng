import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

interface RejectionModalProps {
  visible: boolean
  rejectionCount: number // 1, 2, 3
  reason?: string
  suggestions?: string[]
  onClose: () => void
  onImprove: () => void
  onCallMaster?: () => void
}

export default function RejectionModal({
  visible,
  rejectionCount,
  reason,
  suggestions = [],
  onClose,
  onImprove,
  onCallMaster
}: RejectionModalProps) {
  if (!visible) return null

  const getModalConfig = () => {
    switch (rejectionCount) {
      case 1:
        return {
          icon: '💪',
          title: '别灰心，再试一次！',
          subtitle: '每一次改进都是成长',
          message: '企业对你的提交有一些建议，这是很正常的。根据反馈优化后，你会做得更好！',
          buttonText: '我要改进',
          buttonColor: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          showMaster: false
        }
      case 2:
        return {
          icon: '🎯',
          title: '你已经很努力了',
          subtitle: '让我们一起找到突破点',
          message: '看起来这个任务有些挑战性。别担心，我会给你更详细的指导和工具推荐，帮你突破难关！',
          buttonText: '获取详细指导',
          buttonColor: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
          showMaster: false
        }
      case 3:
        return {
          icon: '🌟',
          title: '你已经尽力了',
          subtitle: '是时候寻求更多帮助',
          message: '这个任务确实有难度。你可以选择继续尝试，或者召唤一位经验丰富的大师来帮助你。无论如何，你的努力都值得肯定！',
          buttonText: '继续尝试',
          buttonColor: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
          showMaster: true
        }
      default:
        return {
          icon: '💪',
          title: '继续加油',
          subtitle: '',
          message: '',
          buttonText: '我知道了',
          buttonColor: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
          showMaster: false
        }
    }
  }

  const config = getModalConfig()

  const handleCallMaster = () => {
    Taro.showModal({
      title: '召唤大师',
      content: '召唤大师需要消耗50积分，大师会帮你完成任务并指导你学习。确认召唤吗？',
      confirmText: '确认召唤',
      cancelText: '再想想',
      success: (res) => {
        if (res.confirm) {
          onCallMaster?.()
        }
      }
    })
  }

  return (
    <View className="rejection-modal-overlay" onClick={onClose}>
      <View className="rejection-modal" onClick={(e) => e.stopPropagation()}>
        {/* 图标 */}
        <View className="modal-icon">
          <Text className="icon-emoji">{config.icon}</Text>
        </View>

        {/* 标题 */}
        <Text className="modal-title">{config.title}</Text>
        {config.subtitle && (
          <Text className="modal-subtitle">{config.subtitle}</Text>
        )}

        {/* 消息 */}
        <Text className="modal-message">{config.message}</Text>

        {/* 拒绝原因 */}
        {reason && (
          <View className="reason-section">
            <Text className="reason-label">拒绝原因：</Text>
            <Text className="reason-text">{reason}</Text>
          </View>
        )}

        {/* 改进建议 */}
        {suggestions.length > 0 && (
          <View className="suggestions-section">
            <Text className="suggestions-label">改进建议：</Text>
            {suggestions.map((suggestion, index) => (
              <View key={index} className="suggestion-item">
                <Text className="suggestion-bullet">•</Text>
                <Text className="suggestion-text">{suggestion}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 按钮组 */}
        <View className="button-group">
          <Button
            className="primary-btn"
            style={{ background: config.buttonColor }}
            onClick={onImprove}
          >
            <Text className="btn-text">{config.buttonText}</Text>
          </Button>

          {config.showMaster && (
            <Button className="master-btn" onClick={handleCallMaster}>
              <Text className="btn-text">🌟 召唤大师</Text>
            </Button>
          )}

          <Button className="cancel-btn" onClick={onClose}>
            <Text className="btn-text">稍后处理</Text>
          </Button>
        </View>

        {/* 鼓励语 */}
        <View className="encouragement">
          <Text className="encouragement-text">
            {rejectionCount === 1 && '💡 提示：仔细阅读反馈，针对性改进'}
            {rejectionCount === 2 && '🛠️ 提示：使用推荐工具，寻求AI导师帮助'}
            {rejectionCount === 3 && '🤝 提示：大师会手把手教你，这是最好的学习机会'}
          </Text>
        </View>
      </View>
    </View>
  )
}
