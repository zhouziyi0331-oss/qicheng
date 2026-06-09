import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import './index.scss'

interface LevelInfo {
  level: number;
  name: string;
  description: string;
  requirements: string;
  unlocks: string[];
  estimatedIncome: string;
  color: string;
}

export default function LevelRewards() {
  const [currentLevel, setCurrentLevel] = useState(0)

  const levels: LevelInfo[] = [
    {
      level: 0,
      name: '涉水者',
      description: '刚刚踏入启程的河流，开始探索自己的能力',
      requirements: '完成OPC测评',
      unlocks: ['查看任务大厅', '接受推荐任务', 'AI导师陪伴'],
      estimatedIncome: '¥0-500/月',
      color: '#A8D8EA'
    },
    {
      level: 1,
      name: '试流者',
      description: '完成了第一个任务，开始感受到成长的节奏',
      requirements: '完成1个任务',
      unlocks: ['解锁更多任务类型', '获得能力画像', '查看成长报告'],
      estimatedIncome: '¥500-1500/月',
      color: '#B8E986'
    },
    {
      level: 2,
      name: '行舟者',
      description: '已经能够稳定完成任务，开始建立自己的节奏',
      requirements: '完成3个任务，平均评分≥4.0',
      unlocks: ['发布技能分享帖', '评论和点赞', '参与社区讨论'],
      estimatedIncome: '¥1500-3000/月',
      color: '#FFE082'
    },
    {
      level: 3,
      name: '知向者',
      description: '清楚自己的方向，能够主动选择适合的任务',
      requirements: '完成5个任务，平均评分≥4.2',
      unlocks: ['接受更高难度任务', '查看详细匹配分析', '优先推荐机会'],
      estimatedIncome: '¥3000-5000/月',
      color: '#FFD1E3'
    },
    {
      level: 4,
      name: '自流者',
      description: '已经形成自己的工作风格，开始影响他人',
      requirements: '完成10个任务，平均评分≥4.5',
      unlocks: ['浏览社区广场', '查看招募帖', '展示作品'],
      estimatedIncome: '¥5000-8000/月',
      color: '#D4B5FF'
    },
    {
      level: 5,
      name: '河成者',
      description: '能够独立完成复杂项目，开始带领他人成长',
      requirements: '完成20个任务，平均评分≥4.7',
      unlocks: ['发布招募帖', '申请加入团队', '接受团队任务'],
      estimatedIncome: '¥8000-15000/月',
      color: '#F9C6D9'
    },
    {
      level: 6,
      name: '联合体',
      description: '能够组建和管理团队，创造更大的价值',
      requirements: '完成30个任务，平均评分≥4.8，带领团队完成项目',
      unlocks: ['创建团队', '发起共创项目', '获得平台推荐', '参与平台决策'],
      estimatedIncome: '¥15000+/月',
      color: '#EC4899'
    }
  ]

  useEffect(() => {
    loadUserLevel()
  }, [])

  const loadUserLevel = async () => {
    try {
      const token = Taro.getStorageSync('token')
      if (!token) return

      const res = await Taro.request({
        url: '/api/v1/user/profile',
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (res.data.success) {
        setCurrentLevel(res.data.data.current_level || 0)
      }
    } catch (error) {
      console.error('加载用户等级失败:', error)
    }
  }

  return (
    <View className="level-rewards-page">
      <View className="page-header">
        <Text className="page-title">成长等级体系</Text>
        <Text className="page-subtitle">每一步都是成长的见证</Text>
      </View>

      <ScrollView scrollY className="levels-container">
        {levels.map((level, index) => {
          const isUnlocked = currentLevel >= level.level
          const isCurrent = currentLevel === level.level

          return (
            <View
              key={level.level}
              className={`level-card ${isUnlocked ? 'unlocked' : 'locked'} ${isCurrent ? 'current' : ''}`}
              style={{ borderColor: level.color }}
            >
              {/* 等级头部 */}
              <View className="level-header" style={{ background: level.color }}>
                <View className="level-number-badge">
                  <Text className="level-number">Lv.{level.level}</Text>
                </View>
                <View className="level-title-section">
                  <Text className="level-name">{level.name}</Text>
                  {isCurrent && <Text className="current-badge">当前等级</Text>}
                  {!isUnlocked && <Text className="locked-badge">🔒 未解锁</Text>}
                </View>
              </View>

              {/* 等级内容 */}
              <View className="level-content">
                <Text className="level-description">{level.description}</Text>

                <View className="level-section">
                  <Text className="section-title">📋 升级条件</Text>
                  <Text className="section-content">{level.requirements}</Text>
                </View>

                <View className="level-section">
                  <Text className="section-title">🎁 解锁内容</Text>
                  <View className="unlocks-list">
                    {level.unlocks.map((unlock, idx) => (
                      <View key={idx} className="unlock-item">
                        <Text className="unlock-dot">•</Text>
                        <Text className="unlock-text">{unlock}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View className="level-section">
                  <Text className="section-title">💰 预计收入</Text>
                  <Text className="section-content income-text">{level.estimatedIncome}</Text>
                </View>
              </View>

              {/* 连接线 */}
              {index < levels.length - 1 && (
                <View className="level-connector">
                  <View className="connector-line" />
                  <Text className="connector-arrow">↓</Text>
                </View>
              )}
            </View>
          )
        })}
      </ScrollView>

      {/* 底部提示 */}
      <View className="bottom-tip">
        <Text className="tip-text">💡 完成任务、保持高质量交付，即可快速升级</Text>
      </View>
    </View>
  )
}
