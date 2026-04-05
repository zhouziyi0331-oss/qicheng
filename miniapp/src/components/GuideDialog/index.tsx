import { View, Text } from '@tarojs/components'
import './index.scss'

interface GuideDialogProps {
  visible: boolean
  type: 'first-task' | 'first-complete' | 'level-up'
  onClose: () => void
  data?: any
}

export default function GuideDialog({ visible, type, onClose, data }: GuideDialogProps) {
  if (!visible) return null

  const getContent = () => {
    switch (type) {
      case 'first-task':
        return {
          title: '开启你的OPC之旅',
          message: '这是你的第一个任务！完成它，你将获得经验值和能力标签，开始你的成长之旅。',
          icon: '🎯',
          btnText: '开始任务'
        }
      case 'first-complete':
        return {
          title: '恭喜完成首个任务！',
          message: '你已经迈出了第一步！继续完成更多任务，解锁更多能力标签，提升你的OPC等级。',
          icon: '🎉',
          btnText: '继续探索'
        }
      case 'level-up':
        return {
          title: `恭喜升级到 Lv.${data?.level || 2}`,
          message: '你的努力得到了回报！等级提升意味着你可以接取更高难度、更高收益的任务。',
          icon: '⭐',
          btnText: '太棒了'
        }
      default:
        return {
          title: '',
          message: '',
          icon: '',
          btnText: '确定'
        }
    }
  }

  const content = getContent()

  return (
    <View className="guide-dialog-mask" onClick={onClose}>
      <View className="guide-dialog" onClick={(e) => e.stopPropagation()}>
        <View className="dialog-icon">
          <Text className="icon-emoji">{content.icon}</Text>
        </View>

        <Text className="dialog-title">{content.title}</Text>
        <Text className="dialog-message">{content.message}</Text>

        <View className="dialog-btn" onClick={onClose}>
          <Text className="btn-text">{content.btnText}</Text>
        </View>
      </View>
    </View>
  )
}
