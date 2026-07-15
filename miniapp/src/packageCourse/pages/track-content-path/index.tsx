import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect } from 'react'
import './index.scss'

interface LevelData {
  level: number
  name: string
  description: string
  status: 'done' | 'current' | 'locked'
}

export default function TrackContentPath() {
  const levels: LevelData[] = [
    {
      level: 0,
      name: '探索者',
      description: 'AI 辅助生成单张配图、基础推文文案、简单图文排版',
      status: 'done'
    },
    {
      level: 1,
      name: '入门者',
      description: 'AI 生成系列配图、短视频基础脚本、标准化宣传文案',
      status: 'done'
    },
    {
      level: 2,
      name: '实践者',
      description: 'AI 生成完整剧情短视频、短篇内容作品、品牌基础宣传内容',
      status: 'current'
    },
    {
      level: 3,
      name: '熟练者',
      description: 'AI 生成长篇漫影、系列 IP 内容、完整新媒体内容矩阵',
      status: 'locked'
    },
    {
      level: 4,
      name: '专业者',
      description: '独立搭建品牌内容矩阵、落地商业化内容运营、适配企业品牌营销需求',
      status: 'locked'
    },
    {
      level: 5,
      name: '独立 OPC（毕业）',
      description: '独立承接商业定制项目、打造个人 IP、入驻平台大师体系承接高端订单',
      status: 'locked'
    }
  ]

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: '内容创作赛道' })
  }, [])

  const handleBack = () => {
    Taro.navigateBack()
  }

  const handleLevelClick = (level: number, status: string) => {
    if (status === 'current') {
      // 跳转到等级详情页面
      Taro.navigateTo({ url: `/packageAdvanced/pages/level-detail/index?level=${level}&track=content` })
    } else if (status === 'locked') {
      Taro.showToast({ title: '完成当前等级后解锁', icon: 'none' })
    }
  }

  return (
    <View className="track-path-page">
      {/* Hero */}
      <View className="track-hero">
        <View className="top-bar">
          <View className="tb-back" onClick={handleBack}>
            <Text className="back-icon">‹</Text>
          </View>
          <Text className="tb-title">内容创作赛道</Text>
          <View className="tb-spacer" />
        </View>

        <View className="track-badge">▪ 赛道A</View>
        <View className="track-icon-wrap">
          <View className="track-icon-circle">
            <Text className="track-icon-emoji">▪</Text>
          </View>
          <View>
            <Text className="track-title">内容创作赛道</Text>
            <Text className="track-sub">Content Creation Track</Text>
          </View>
        </View>
        <Text className="track-desc">
          从 AI 辅助配图到独立打造个人 IP，系统化掌握新媒体内容创作全链路能力，最终成为可承接商业定制项目的独立 OPC。
        </Text>
        <View className="track-stats">
          <View className="ts-item">
            <Text className="ts-val">6</Text>
            <Text className="ts-label">成长等级</Text>
          </View>
          <View className="ts-item">
            <Text className="ts-val">1,284</Text>
            <Text className="ts-label">在读人数</Text>
          </View>
          <View className="ts-item">
            <Text className="ts-val">¥3.2k</Text>
            <Text className="ts-label">平均月收入</Text>
          </View>
          <View className="ts-item">
            <Text className="ts-val">92%</Text>
            <Text className="ts-label">好评率</Text>
          </View>
        </View>
      </View>

      {/* Body */}
      <ScrollView className="scroll-area" scrollY>
        <View className="track-body">
          {/* 当前等级卡片 */}
          <View className="my-level-card">
            <View className="mlc-top">
              <View className="mlc-badge">
                <Text className="badge-num">2</Text>
              </View>
              <View className="mlc-info">
                <Text className="mlc-name">当前：Lv.2 实践者</Text>
                <Text className="mlc-title">内容创作赛道</Text>
                <Text className="mlc-xp">经验值 680 / 1000 XP</Text>
              </View>
              <View className="mlc-tag">
                <Text className="tag-text">进行中</Text>
              </View>
            </View>
            <View className="mlc-progress-label">
              <Text className="label-left">升级进度</Text>
              <Text className="label-right">68%</Text>
            </View>
            <View className="prog-bar">
              <View className="prog-fill" style={{ width: '68%' }} />
            </View>
          </View>

          {/* 等级列表 */}
          <View className="card">
            <View className="sec-header">
              <Text className="sec-title">◆ 成长路径</Text>
              <Text className="sec-more">全部 →</Text>
            </View>
            <View className="level-list">
              {levels.map(level => (
                <View
                  key={level.level}
                  className={`level-item ${level.status}`}
                  onClick={() => handleLevelClick(level.level, level.status)}
                >
                  {level.status === 'current' && (
                    <View className="current-tag">
                      <Text className="tag-text">当前</Text>
                    </View>
                  )}
                  <View className={`li-badge ${level.status}-badge`}>
                    {level.level === 5 ? (
                      <Text className="badge-emoji">◆</Text>
                    ) : (
                      <Text className="badge-num">{level.level}</Text>
                    )}
                  </View>
                  <View className="li-info">
                    <Text className="li-name">Lv.{level.level} · {level.name}</Text>
                    <Text className="li-desc">{level.description}</Text>
                  </View>
                  <View className="li-right">
                    <View className={`li-status ${level.status}-s`}>
                      <Text className="status-text">
                        {level.status === 'done' ? '✓ 已完成' : level.status === 'current' ? '进行中' : '○ 未解锁'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* 赛道特色 */}
          <View className="card">
            <View className="sec-header">
              <Text className="sec-title">◇ 赛道特色</Text>
            </View>
            <View className="feature-list">
              <View className="feature-item">
                <View className="feature-icon rust-icon">
                  <Text className="icon-emoji">●</Text>
                </View>
                <View className="feature-content">
                  <Text className="feature-title">AI 工具全覆盖</Text>
                  <Text className="feature-desc">Midjourney、Runway、即梦等主流 AI 创作工具系统训练</Text>
                </View>
              </View>
              <View className="feature-item">
                <View className="feature-icon mist-icon">
                  <Text className="icon-emoji">●</Text>
                </View>
                <View className="feature-content">
                  <Text className="feature-title">真实项目实战</Text>
                  <Text className="feature-desc">每个等级配套真实商业项目，边学边赚，积累作品集</Text>
                </View>
              </View>
              <View className="feature-item">
                <View className="feature-icon golden-icon">
                  <Text className="icon-emoji">●</Text>
                </View>
                <View className="feature-content">
                  <Text className="feature-title">商业变现路径</Text>
                  <Text className="feature-desc">从接单到个人 IP，完整商业化变现体系，毕业即可独立接单</Text>
                </View>
              </View>
            </View>
          </View>

          <View className="bottom-btn-wrapper">
            <View className="btn-primary" onClick={() => handleLevelClick(2, 'current')}>
              <Text className="btn-text">▲ 继续我的成长之旅</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
