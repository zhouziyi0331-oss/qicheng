import React, { useEffect, useState } from 'react';
import { View } from '@tarojs/components';
import './index.scss';

interface AIWaitingScreenProps {
  stage: 'analyzing' | 'matching' | 'complete';
  progress?: number; // 0-100
  visible: boolean;
}

/**
 * AI分析等待页
 * 消灭白屏，给用户有温度的等待体验
 *
 * 展示内容：
 * 1. 大标题：正在分析...
 * 2. 三个呼吸点动画
 * 3. 副标题轮播（每2秒切换）
 * 4. 进度条（可选）
 */
const AIWaitingScreen: React.FC<AIWaitingScreenProps> = ({
  stage,
  progress = 0,
  visible,
}) => {
  const [subtitleIndex, setSubtitleIndex] = useState(0);

  const subtitles = [
    '在看你的AI工具使用习惯……',
    '在分析你的创作偏好……',
    '在匹配适合你的赛道……',
    '快好了，再等一下……',
  ];

  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      setSubtitleIndex(prev => (prev + 1) % subtitles.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [visible, subtitles.length]);

  if (!visible) return null;

  return (
    <View className="ai-waiting-screen">
      {/* 背景 */}
      <View className="waiting-background" />

      {/* 内容区 */}
      <View className="waiting-content">
        {/* 几何体动画占位（未来可用Lottie替换） */}
        <View className="geometry-container">
          <View className="geometry geometry-rotating">
            <View className="geometry-inner" />
          </View>
        </View>

        {/* 主标题 */}
        <View className="waiting-title">
          正在分析你的能力特征
        </View>

        {/* 呼吸点 */}
        <View className="breathing-dots">
          <View className="dot dot-1" />
          <View className="dot dot-2" />
          <View className="dot dot-3" />
        </View>

        {/* 副标题轮播 */}
        <View className="subtitle-container">
          {subtitles.map((text, index) => (
            <View
              key={index}
              className={`subtitle ${index === subtitleIndex ? 'subtitle-active' : ''}`}
            >
              {text}
            </View>
          ))}
        </View>

        {/* 进度条（可选） */}
        {progress > 0 && (
          <View className="progress-container">
            <View className="progress-bar">
              <View
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </View>
            <View className="progress-text">{progress}%</View>
          </View>
        )}

        {/* 提示文字 */}
        <View className="hint-text">
          这个过程需要10-15秒，请稍等片刻
        </View>
      </View>
    </View>
  );
};

export default AIWaitingScreen;
