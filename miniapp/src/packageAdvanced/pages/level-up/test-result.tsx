import { View, Text, Button } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import './test-result.scss'

export default function TestResult() {
  const router = useRouter()
  const { testId, passed, score, targetLevel } = router.params

  const isPassed = passed === 'true'
  const scoreNum = parseInt(score || '0')

  const handleBackHome = () => {
    Taro.switchTab({
      url: '/pages/index/index'
    })
  }

  const handleRetry = () => {
    Taro.navigateBack({ delta: 2 })
  }

  return (
    <View className="test-result-page">
      <View className={`result-card ${isPassed ? 'passed' : 'failed'}`}>
        <Text className="result-icon">{isPassed ? '◇' : '▲'}</Text>
        <Text className="result-title">
          {isPassed ? '恭喜通过！' : '继续加油！'}
        </Text>
        <Text className="result-score">{scoreNum} 分</Text>
        <Text className="result-message">
          {isPassed
            ? `你已成功跳级到 Lv.${targetLevel}`
            : '很遗憾，未通过测试。完成2次任务后可再次申请'}
        </Text>
      </View>

      <View className="details-card">
        <View className="detail-item">
          <Text className="detail-label">目标等级</Text>
          <Text className="detail-value">Lv.{targetLevel}</Text>
        </View>
        <View className="detail-item">
          <Text className="detail-label">得分</Text>
          <Text className="detail-value">{scoreNum}分</Text>
        </View>
        <View className="detail-item">
          <Text className="detail-label">通过标准</Text>
          <Text className="detail-value">80分</Text>
        </View>
        <View className="detail-item">
          <Text className="detail-label">测试结果</Text>
          <Text className={`detail-value ${isPassed ? 'success' : 'fail'}`}>
            {isPassed ? '通过 ✓' : '未通过 ✗'}
          </Text>
        </View>
      </View>

      {isPassed && (
        <View className="reward-card">
          <Text className="reward-title">◆ 你获得了</Text>
          <View className="reward-list">
            <View className="reward-item">
              <Text className="reward-icon">⬆️</Text>
              <Text className="reward-text">等级提升至 Lv.{targetLevel}</Text>
            </View>
            <View className="reward-item">
              <Text className="reward-icon">○</Text>
              <Text className="reward-text">解锁更高难度任务</Text>
            </View>
            <View className="reward-item">
              <Text className="reward-icon">●</Text>
              <Text className="reward-text">获得更高任务报酬</Text>
            </View>
          </View>
        </View>
      )}

      {!isPassed && (
        <View className="tips-card">
          <Text className="tips-title">◇ 提升建议</Text>
          <View className="tips-list">
            <Text className="tips-item">• 完成更多相关任务积累经验</Text>
            <Text className="tips-item">• 学习相关领域的专业知识</Text>
            <Text className="tips-item">• 向AI导师请教学习路径</Text>
            <Text className="tips-item">• 完成2次任务后可再次测试</Text>
          </View>
        </View>
      )}

      <View className="action-buttons">
        <Button className="btn-primary" onClick={handleBackHome}>
          <Text className="btn-text">返回首页</Text>
        </Button>
        {!isPassed && (
          <Button className="btn-secondary" onClick={handleRetry}>
            <Text className="btn-text">查看其他测试</Text>
          </Button>
        )}
      </View>
    </View>
  )
}
