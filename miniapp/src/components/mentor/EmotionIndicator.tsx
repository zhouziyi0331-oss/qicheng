import { View, Text } from '@tarojs/components';
import './EmotionIndicator.scss';

interface EmotionIndicatorProps {
  emotion: string;
  intensity: number;
  showTip?: boolean;
}

const EMOTION_MAP = {
  anxious: { name: '焦虑', icon: '😰', color: '#F59E0B', tip: '深呼吸，我们一步步来' },
  frustrated: { name: '沮丧', icon: '😤', color: '#EF4444', tip: '遇到困难很正常，我陪着你' },
  confused: { name: '困惑', icon: '😕', color: '#6B7280', tip: '有不明白的随时问我' },
  excited: { name: '兴奋', icon: '🤩', color: '#10B981', tip: '保持这份热情！' },
  confident: { name: '自信', icon: '😎', color: '#3B82F6', tip: '你做得很棒！' },
  overwhelmed: { name: '不堪重负', icon: '😵', color: '#DC2626', tip: '我们把任务分解一下' },
  proud: { name: '自豪', icon: '😊', color: '#8B5CF6', tip: '为你感到骄傲！' }
};

export default function EmotionIndicator({ emotion, intensity, showTip = true }: EmotionIndicatorProps) {
  const emotionInfo = EMOTION_MAP[emotion] || EMOTION_MAP.confused;
  const barWidth = Math.round(intensity * 100);

  return (
    <View className="emotion-indicator" style={{ borderColor: emotionInfo.color }}>
      <View className="emotion-header">
        <Text className="emotion-icon">{emotionInfo.icon}</Text>
        <View className="emotion-info">
          <Text className="emotion-name">我感觉到你现在有点{emotionInfo.name}</Text>
          {showTip && (
            <Text className="emotion-tip">{emotionInfo.tip}</Text>
          )}
        </View>
      </View>
      <View className="emotion-bar-container">
        <View
          className="emotion-bar"
          style={{
            width: `${barWidth}%`,
            backgroundColor: emotionInfo.color
          }}
        />
      </View>
    </View>
  );
}
