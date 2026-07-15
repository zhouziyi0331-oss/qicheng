import { View, Text, Image } from '@tarojs/components'
import Button from '../Button'
import './index.scss'

interface EnterpriseGuideModalProps {
  visible: boolean
  onClose: () => void
}

export default function EnterpriseGuideModal({ visible, onClose }: EnterpriseGuideModalProps) {
  if (!visible) return null

  const handleDownload = () => {
    // 这里可以添加跳转到企业版小程序的逻辑
    // 或者显示二维码供用户扫描
    console.log('引导下载企业版')
  }

  return (
    <View className="enterprise-modal-mask">
      <View className="enterprise-modal-container">
        <View className="enterprise-modal-header">
          <Text className="modal-icon">◈</Text>
          <Text className="modal-title">企业用户请使用企业版</Text>
          <Text className="modal-subtitle">功能更强大，专为企业设计</Text>
        </View>

        <View className="feature-list">
          <View className="feature-item">
            <Text className="feature-icon">▲</Text>
            <Text className="feature-text">发布和管理任务</Text>
          </View>
          <View className="feature-item">
            <Text className="feature-icon">◎</Text>
            <Text className="feature-text">查看OPC能力报告</Text>
          </View>
          <View className="feature-item">
            <Text className="feature-icon">◆</Text>
            <Text className="feature-text">智能匹配合适人才</Text>
          </View>
        </View>

        <View className="qrcode-placeholder">
          <Text className="qrcode-text">扫描二维码下载企业版</Text>
          <View className="qrcode-box">
            {/* 这里放置企业版小程序二维码 */}
            <Text className="qrcode-hint">[ 企业版二维码 ]</Text>
          </View>
        </View>

        <Button
          variant="secondary"
          onClick={onClose}
          className="close-button"
        >
          我知道了
        </Button>
      </View>
    </View>
  )
}
