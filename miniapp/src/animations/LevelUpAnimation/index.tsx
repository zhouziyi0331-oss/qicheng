import React, { useEffect, useState } from 'react';
import { View } from '@tarojs/components';
import { useAnimationSequence, useDelayedShow } from '../../hooks/useAnimation';
import './index.scss';

interface LevelUpAnimationProps {
  oldLevel: number;
  newLevel: number;
  newLevelName: string;
  unlockedFeatures: string[];
  mentorMessage?: string;
  onClose: () => void;
  visible: boolean;
}

/**
 * 等级提升动画
 *
 * 动画序列：
 * 1. 旧徽章缩小消失 (0.3s)
 * 2. 暂停 (0.2s)
 * 3. 新徽章弹跳出现 (0.6s, elastic)
 * 4. 星光粒子旋转 (1.5s)
 * 5. 等级名称上升 (0.8s)
 * 6. 特性列表滑入 (交错0.1s)
 *
 * 总时长：约4-5秒
 */
const LevelUpAnimation: React.FC<LevelUpAnimationProps> = ({
  oldLevel,
  newLevel,
  newLevelName,
  unlockedFeatures,
  mentorMessage,
  onClose,
  visible,
}) => {
  const { currentStep, nextStep } = useAnimationSequence(6);
  const [showStars, setShowStars] = useState(false);

  useEffect(() => {
    if (!visible) return;

    const sequence = async () => {
      // Step 0: 旧徽章显示
      await wait(300);
      nextStep();

      // Step 1: 旧徽章缩小消失
      await wait(300);
      nextStep();

      // Step 2: 暂停
      await wait(200);
      nextStep();

      // Step 3: 新徽章弹出
      setShowStars(true);
      await wait(600);
      nextStep();

      // Step 4: 星光持续1.5s
      await wait(1500);
      setShowStars(false);
      nextStep();

      // Step 5: 等级名称上升
      await wait(800);
      nextStep();

      // Step 6: 特性列表滑入
      await wait(unlockedFeatures.length * 100 + 400);
    };

    sequence();
  }, [visible, nextStep, unlockedFeatures.length]);

  if (!visible) return null;

  return (
    <View className="level-up-animation">
      {/* 深色遮罩 */}
      <View className="level-up-backdrop" />

      {/* 内容区 */}
      <View className="level-up-content">
        {/* 徽章区域 */}
        <View className="badge-container">
          {/* 旧徽章 - 缩小消失 */}
          {currentStep === 0 && (
            <View className={`badge badge-old badge-level-${oldLevel}`}>
              <View className="badge-level">Lv.{oldLevel}</View>
            </View>
          )}

          {currentStep === 1 && (
            <View className={`badge badge-old badge-level-${oldLevel} badge-shrink`}>
              <View className="badge-level">Lv.{oldLevel}</View>
            </View>
          )}

          {/* 新徽章 - 弹跳出现 */}
          {currentStep >= 3 && (
            <View className={`badge badge-new badge-level-${newLevel} badge-pop`}>
              <View className="badge-level">Lv.{newLevel}</View>

              {/* 星光粒子 */}
              {showStars && (
                <View className="star-particles">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <View
                      key={i}
                      className="star"
                      style={{
                        '--angle': `${i * 45}deg`,
                      } as any}
                    />
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* 等级名称 */}
        {currentStep >= 5 && (
          <View className="level-name-container">
            <View className="level-name">{newLevelName}</View>
            <View className="level-subtitle">恭喜升级！</View>
          </View>
        )}

        {/* 新解锁能力 */}
        {currentStep >= 6 && (
          <View className="features-container">
            <View className="features-title">新解锁能力</View>
            <View className="features-list">
              {unlockedFeatures.map((feature, index) => (
                <FeatureItem
                  key={index}
                  feature={feature}
                  delay={index * 100}
                />
              ))}
            </View>
          </View>
        )}

        {/* 导师留言 */}
        {currentStep >= 6 && mentorMessage && (
          <View className="mentor-message">
            <View className="mentor-avatar">🐱</View>
            <View className="mentor-text">{mentorMessage}</View>
          </View>
        )}

        {/* 关闭按钮 */}
        {currentStep >= 6 && (
          <View className="close-button" onClick={onClose}>
            知道了
          </View>
        )}
      </View>
    </View>
  );
};

// 特性列表项组件
const FeatureItem: React.FC<{ feature: string; delay: number }> = ({ feature, delay }) => {
  const show = useDelayedShow(delay);

  return (
    <View className={`feature-item ${show ? 'feature-item-show' : ''}`}>
      <View className="feature-icon">✨</View>
      <View className="feature-text">{feature}</View>
    </View>
  );
};

// 辅助函数
function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default LevelUpAnimation;
