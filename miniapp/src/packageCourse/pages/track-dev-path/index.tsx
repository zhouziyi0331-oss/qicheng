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

export default function TrackDevPath() {
  const levels: LevelData[] = [
    {
      level: 0,
      name: '探索者',
      description: 'AI 辅助完成文档优化、数据整理、基础表格制作',
      status: 'done'
    },
    {
      level: 1,
      name: '入门者',
      description: 'AI 生成简易实用小工具、基础功能小程序、自动化表格工具',
      status: 'done'
    },
    {
      level: 2,
      name: '实践者',
      description: '搭建具备独立落地功能的小程序、轻量化办公自动化工具',
      status: 'done'
    },
    {
      level: 3,
      name: '熟练者',
      description: '搭建基础智能 Agent 应用、行业轻量化自动化工作流工具',
      status: 'current'
    },
    {
      level: 4,
      name: '专业者',
      description: '开发复杂智能 Agent、全流程自动化工作流、定制化 AI 工具',
      status: 'locked'
    },
    {
      level: 5,
      name: '独立 OPC（毕业）',
      description: '独立落地商业化 AI 工具、承接企业定制化开发订单，入驻大师生态',
      status: 'locked'
    }
  ]

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: '开发赛道' })
  }, [])

  const handleBack = () => {
    Taro.navigateBack()
  }

  const handleLevelClick = (level: number, status: string) => {
    if (status === 'current' || status === 'done') {
      // 跳转到等级详情页面
      Taro.navigateTo({ url: `/packageAdvanced/pages/level-detail/index?level=${level}&track=dev` })
    } else if (status === 'locked') {
      Taro.showToast({ title: '完成当前等级后解锁', icon: 'none' })
    }
  }

  return (
    <View className="track-path-page dev">
      {/* Hero */}
      <View className="track-hero dev-hero">
        <View className="top-bar">
          <View className="tb-back" onClick={handleBack}>
            <Text className="back-icon">‹</Text>
          </View>
          <Text className="tb-title">开发赛道</Text>
          <View className="tb-spacer" />
        </View>

        <View className="track-badge dev-badge">● 赛道B</View>
        <View className="track-icon-wrap">
          <View className="track-icon-circle">
            <Text className="track-icon-emoji">●</Text>
          </View>
          <View>
            <Text className="track-title">开发赛道</Text>
            <Text className="track-sub">Development Track</Text>
          </View>
        </View>
        <Text className="track-desc">
          从 AI 辅助文档整理到独立开发商业化 AI 工具，系统化掌握智能 Agent、自动化工作流全链路开发能力，最终成为可承接企业定制化开发订单的独立 OPC。
        </Text>
        <View className="track-stats">
          <View className="ts-item">
            <Text className="ts-val">6</Text>
            <Text className="ts-label">成长等级</Text>
          </View>
          <View className="ts-item">
            <Text className="ts-val">876</Text>
            <Text className="ts-label">在读人数</Text>
          </View>
          <View className="ts-item">
            <Text className="ts-val">¥5.8k</Text>
            <Text className="ts-label">平均月收入</Text>
          </View>
          <View className="ts-item">
            <Text className="ts-val">95%</Text>
            <Text className="ts-label">好评率</Text>
          </View>
        </View>
      </View>

      {/* Body */}
      <ScrollView className="scroll-area" scrollY>
        <View className="track-body">
          {/* 当前等级卡片 */}
          <View className="my-level-card dev-level-card">
            <View className="mlc-top">
              <View className="mlc-badge dev-mlc-badge">
                <Text className="badge-num">3</Text>
              </View>
              <View className="mlc-info">
                <Text className="mlc-name">当前：Lv.3 熟练者</Text>
                <Text className="mlc-title dev-mlc-title">工具开发赛道</Text>
                <Text className="mlc-xp">经验值 520 / 1000 XP</Text>
              </View>
              <View className="mlc-tag dev-mlc-tag">
                <Text className="tag-text">进行中</Text>
              </View>
            </View>
            <View className="mlc-progress-label">
              <Text className="label-left">升级进度</Text>
              <Text className="label-right dev-label-right">52%</Text>
            </View>
            <View className="prog-bar">
              <View className="prog-fill dev-prog-fill" style={{ width: '52%' }} />
            </View>
          </View>

          {/* 等级列表 */}
          <View className="card">
            <View className="sec-header">
              <Text className="sec-title">◆ 成长路径</Text>
              <Text className="sec-more dev-sec-more">全部 →</Text>
            </View>
            <View className="level-list">
              {levels.map(level => (
                <View
                  key={level.level}
                  className={`level-item ${level.status} ${level.status === 'current' ? 'dev-current' : ''}`}
                  onClick={() => handleLevelClick(level.level, level.status)}
                >
                  {level.status === 'current' && (
                    <View className="current-tag dev-current-tag">
                      <Text className="tag-text">当前</Text>
                    </View>
                  )}
                  <View className={`li-badge ${level.status}-badge ${level.status === 'current' ? 'dev-current-badge' : ''}`}>
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
                    <View className={`li-status ${level.status}-s ${level.status === 'current' ? 'dev-current-s' : ''}`}>
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
                <View className="feature-icon dev-icon-1">
                  <Text className="icon-emoji">○</Text>
                </View>
                <View className="feature-content">
                  <Text className="feature-title">Agent 全栈训练</Text>
                  <Text className="feature-desc">Coze、Dify、n8n 等主流 Agent 平台系统训练，从零到一搭建智能应用</Text>
                </View>
              </View>
              <View className="feature-item">
                <View className="feature-icon dev-icon-2">
                  <Text className="icon-emoji">▲</Text>
                </View>
                <View className="feature-content">
                  <Text className="feature-title">真实企业需求</Text>
                  <Text className="feature-desc">对接真实企业自动化需求，边学边做，积累可交付的工具作品集</Text>
                </View>
              </View>
              <View className="feature-item">
                <View className="feature-icon dev-icon-3">
                  <Text className="icon-emoji">●</Text>
                </View>
                <View className="feature-content">
                  <Text className="feature-title">高价值变现</Text>
                  <Text className="feature-desc">企业级 AI 工具需求旺盛，毕业 OPC 平均月收入高于内容赛道 80%</Text>
                </View>
              </View>
            </View>
          </View>

          <View className="bottom-btn-wrapper">
            <View className="btn-primary dev-btn-primary" onClick={() => handleLevelClick(3, 'current')}>
              <Text className="btn-text">▲ 继续我的成长之旅</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
