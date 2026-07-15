import { View, Text, Button, Swiper, SwiperItem } from '@tarojs/components';
import { useState } from 'react';
import Taro from '@tarojs/taro';
import './index.scss';

export default function Onboarding() {
  const [current, setCurrent] = useState(0);

  const slides = [
    {
      icon: '目标',
      title: '乘着问题，飞跃山峰',
      description: '在真实项目中成长，把问题转化为能力，让每一次尝试都成为你的勋章',
      color: '#667eea'
    },
    {
      icon: '基因',
      title: '发现你的OPC人格',
      description: '通过OPC测评，了解你的六维能力：开放性、目的性、创造性、情绪稳定性、外向性、宜人性',
      color: '#11998e',
      features: [
        '25道题快速测评',
        '获得专属能力标签',
        '解锁个性化任务推荐'
      ]
    },
    {
      icon: '启动',
      title: '选择成长赛道',
      description: '两条清晰的成长路径，从探索者到独立OPC，6个等级见证你的成长',
      color: '#8B5CF6',
      features: [
        '内容创作：从推文到个人IP',
        '工具开发：从表格到商业AI工具',
        '完整能力进阶体系'
      ]
    },
    {
      icon: '锁',
      title: '安全可靠的保障',
      description: '数据加密存储，托管交易保障，完成2单可解锁联系方式',
      color: '#f093fb',
      features: [
        '交付物加密存储保护',
        '企业数据物理隔离',
        '访问行为全程记录'
      ]
    },
    {
      icon: '★',
      title: '开始你的成长之旅',
      description: 'AI导师全程陪伴，接任务、提交作品、获得反馈，在实践中快速成长',
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

    // 检查用户是否已完成必要的初始化流程
    const userInfo = Taro.getStorageSync('userInfo')

    if (!userInfo || !userInfo.role) {
      // 未选择角色，跳转到角色选择页
      Taro.redirectTo({ url: '/pages/role-select/index' })
    } else if (!userInfo.opcTags || userInfo.opcTags.length === 0) {
      // 未完成OPC测评，跳转到测评页
      Taro.redirectTo({ url: '/pages/opc-test/index' })
    } else if (!userInfo.track) {
      // 未选择赛道，跳转到赛道大厅
      Taro.redirectTo({ url: '/packageCourse/pages/sector-hall/index' })
    } else {
      // 已完成所有初始化，跳转到首页
      Taro.switchTab({ url: '/pages/index/index' })
    }
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

                {slide.features && (
                  <View className="highlight-box">
                    {slide.features.map((feature, idx) => (
                      <View key={idx} className="highlight-item">
                        <Text className="highlight-icon">✓</Text>
                        <Text className="highlight-text">{feature}</Text>
                      </View>
                    ))}
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
