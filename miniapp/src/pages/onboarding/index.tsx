import { View, Text, Button, Swiper, SwiperItem } from '@tarojs/components';
import { useState } from 'react';
import Taro from '@tarojs/taro';
import './index.scss';

export default function Onboarding() {
  const [current, setCurrent] = useState(0);

  const slides = [
    {
      icon: '🎯',
      title: '乘着问题，飞跃山峰',
      description: '在真实项目中成长，把兴趣转化为技能',
      color: '#667eea'
    },
    {
      icon: '🔒',
      title: '数据安全保障',
      description: '所有交付物加密存储，企业数据物理隔离，访问行为全程记录',
      color: '#11998e'
    },
    {
      icon: '🤝',
      title: '2单解锁联系方式',
      description: '与同一企业完成2单合作后，双方同意即可解锁联系方式，建立直接联系',
      color: '#f093fb',
      highlight: true
    },
    {
      icon: '⭐',
      title: '开始你的成长之旅',
      description: '接任务、提交作品、获得反馈，在实践中快速成长',
      color: '#fa709a'
    }
  ];

  const handleSwiperChange = (e) => {
    setCurrent(e.detail.current);
  };

  const handleNext = () => {
    if (current < slides.length - 1) {
      setCurrent(current + 1);
    } else {
      handleStart();
    }
  };

  const handleSkip = () => {
    handleStart();
  };

  const handleStart = () => {
    Taro.setStorageSync('hasSeenOnboarding', true);
    Taro.reLaunch({ url: '/pages/index/index' });
  };

  return (
    <View className="onboarding-page">
      <Swiper
        className="swiper"
        current={current}
        onChange={handleSwiperChange}
        indicatorDots={false}
      >
        {slides.map((slide, index) => (
          <SwiperItem key={index}>
            <View className="slide" style={{ background: slide.color }}>
              <View className="slide-content">
                <View className="slide-icon">{slide.icon}</View>
                <Text className="slide-title">{slide.title}</Text>
                <Text className="slide-description">{slide.description}</Text>

                {slide.highlight && (
                  <View className="highlight-box">
                    <View className="highlight-item">
                      <Text className="highlight-icon">✓</Text>
                      <Text className="highlight-text">完成第1单：建立初步信任</Text>
                    </View>
                    <View className="highlight-item">
                      <Text className="highlight-icon">✓</Text>
                      <Text className="highlight-text">完成第2单：可申请解锁</Text>
                    </View>
                    <View className="highlight-item">
                      <Text className="highlight-icon">✓</Text>
                      <Text className="highlight-text">双方同意：解锁联系方式</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </SwiperItem>
        ))}
      </Swiper>

      {/* 指示器 */}
      <View className="indicators">
        {slides.map((_, index) => (
          <View
            key={index}
            className={`indicator ${index === current ? 'active' : ''}`}
          />
        ))}
      </View>

      {/* 底部按钮 */}
      <View className="bottom-actions">
        {current < slides.length - 1 ? (
          <>
            <Button className="skip-btn" onClick={handleSkip}>
              跳过
            </Button>
            <Button className="next-btn" onClick={handleNext}>
              下一步
            </Button>
          </>
        ) : (
          <Button className="start-btn" onClick={handleStart}>
            开始使用
          </Button>
        )}
      </View>
    </View>
  );
}
