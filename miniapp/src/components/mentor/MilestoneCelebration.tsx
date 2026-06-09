import { View, Text } from '@tarojs/components';
import { useState, useEffect } from 'react';
import './MilestoneCelebration.scss';

interface MilestoneCelebrationProps {
  visible: boolean;
  milestone: {
    type: string;
    title: string;
    description: string;
    reward?: string;
  };
  onClose: () => void;
}

const MILESTONE_CONFIG = {
  first_session: { icon: '🎉', color: '#8B5CF6', title: '首次对话' },
  requirement_mastered: { icon: '📋', color: '#10B981', title: '需求理解达人' },
  execution_expert: { icon: '🚀', color: '#EC4899', title: '执行专家' },
  quality_champion: { icon: '✅', color: '#06B6D4', title: '质量冠军' },
  communication_pro: { icon: '🌉', color: '#F59E0B', title: '沟通高手' },
  week_streak: { icon: '🔥', color: '#EF4444', title: '连续学习' },
  tool_explorer: { icon: '🛠️', color: '#3B82F6', title: '工具探索者' }
};

export default function MilestoneCelebration({
  visible,
  milestone,
  onClose
}: MilestoneCelebrationProps) {
  const [show, setShow] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      setTimeout(() => setAnimate(true), 50);
    } else {
      setAnimate(false);
      setTimeout(() => setShow(false), 300);
    }
  }, [visible]);

  if (!show) return null;

  const config = MILESTONE_CONFIG[milestone.type] || MILESTONE_CONFIG.first_session;

  return (
    <View className={`milestone-overlay ${animate ? 'show' : ''}`} onClick={onClose}>
      <View className={`milestone-modal ${animate ? 'show' : ''}`} onClick={(e) => e.stopPropagation()}>
        {/* 庆祝动画背景 */}
        <View className="confetti-container">
          {[...Array(20)].map((_, i) => (
            <View key={i} className={`confetti confetti-${i % 5}`} />
          ))}
        </View>

        {/* 主内容 */}
        <View className="milestone-content">
          <View className="milestone-icon" style={{ backgroundColor: config.color }}>
            <Text>{config.icon}</Text>
          </View>

          <Text className="milestone-title">{milestone.title}</Text>
          <Text className="milestone-description">{milestone.description}</Text>

          {milestone.reward && (
            <View className="milestone-reward">
              <Text className="reward-label">🎁 解锁奖励</Text>
              <Text className="reward-text">{milestone.reward}</Text>
            </View>
          )}

          <View className="milestone-btn" onClick={onClose}>
            <Text>太棒了！</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
