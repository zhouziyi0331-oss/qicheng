import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { teamAPI } from '../../../services/api'
import './index.scss'

interface Team {
  id: string
  name: string
  projectName: string
  status: 'recruiting' | 'in_progress' | 'completed' | 'disbanded'
  role: 'leader' | 'member'
  members: Array<{
    id: string
    name: string
    avatar: string
    role: 'leader' | 'member'
    skills: string[]
  }>
  totalMembers: number
  createdAt: string
}

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [userLevel, setUserLevel] = useState(0)

  useEffect(() => {
    checkUserLevel()
    loadTeams()
  }, [])

  const checkUserLevel = async () => {
    try {
      const userInfo = Taro.getStorageSync('userInfo')
      if (userInfo?.level) {
        setUserLevel(userInfo.level)
      } else {
        setUserLevel(5) // 默认等级
      }
    } catch (error) {
      console.error('检查用户等级失败:', error)
      setUserLevel(5)
    }
  }

  const loadTeams = async () => {
    setLoading(true)
    try {
      const result = await teamAPI.getMyTeams()

      if (result.success && result.data) {
        setTeams(result.data)
      } else {
        throw new Error(result.error?.message || '加载失败')
      }
    } catch (error: any) {
      console.error('加载队伍列表失败:', error)

      // 使用模拟数据作为降级方案
      const mockTeams: Team[] = [
        {
          id: 't1',
          name: '电商小程序开发团队',
          projectName: '潮流电商平台',
          status: 'in_progress',
          role: 'leader',
          members: [
            {
              id: 'u1',
              name: '张小明',
              avatar: 'https://via.placeholder.com/100',
              role: 'leader',
              skills: ['UI设计', '产品规划']
            },
            {
              id: 'u2',
              name: '李华',
              avatar: 'https://via.placeholder.com/100',
              role: 'member',
              skills: ['React', 'Taro']
            }
          ],
          totalMembers: 2,
          createdAt: '2026-05-20T10:00:00Z'
        },
        {
          id: 't2',
          name: 'AI工具开发小组',
          projectName: '智能写作助手',
          status: 'recruiting',
          role: 'member',
          members: [
            {
              id: 'u3',
              name: '王大师',
              avatar: 'https://via.placeholder.com/100',
              role: 'leader',
              skills: ['Python', 'AI算法']
            },
            {
              id: 'u1',
              name: '张小明',
              avatar: 'https://via.placeholder.com/100',
              role: 'member',
              skills: ['UI设计']
            }
          ],
          totalMembers: 3,
          createdAt: '2026-05-25T14:30:00Z'
        }
      ]

      setTeams(mockTeams)

      // 只在非网络错误时显示toast
      if (!error.message?.includes('网络')) {
        Taro.showToast({
          title: error.message || '加载失败',
          icon: 'none',
          duration: 2000
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleTeamClick = (teamId: string) => {
    Taro.navigateTo({
      url: `/pages/teams/detail?id=${teamId}`
    })
  }

  const handleCreateTeam = () => {
    if (userLevel < 6) {
      Taro.showToast({
        title: '达到Lv.6后可创建队伍',
        icon: 'none'
      })
      return
    }

    Taro.navigateTo({
      url: '/pages/teams/create'
    })
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'recruiting':
        return '招募中'
      case 'in_progress':
        return '进行中'
      case 'completed':
        return '已完成'
      case 'disbanded':
        return '已解散'
      default:
        return ''
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'recruiting':
        return '#F59E0B'
      case 'in_progress':
        return '#3B82F6'
      case 'completed':
        return '#10B981'
      case 'disbanded':
        return '#6B7280'
      default:
        return '#6B7280'
    }
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
  }

  if (userLevel < 5) {
    return (
      <View className="teams-page">
        <View className="locked-state">
          <Text className="lock-icon">○</Text>
          <Text className="lock-title">队伍功能未解锁</Text>
          <Text className="lock-subtitle">达到Lv.5后解锁</Text>
          <View className="lock-description">
            <Text className="description-text">
              升至Lv.5后，你可以加入其他学生的队伍，一起完成项目
            </Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className="teams-page">
      <View className="page-header">
        <Text className="header-title">我的队伍</Text>
        {userLevel >= 6 && (
          <View className="create-btn" onClick={handleCreateTeam}>
            <Text className="create-text">+ 创建</Text>
          </View>
        )}
      </View>

      <ScrollView className="teams-scroll" scrollY>
        {loading ? (
          <View className="loading-state">
            <Text className="loading-text">加载中...</Text>
          </View>
        ) : teams.length === 0 ? (
          <View className="empty-state">
            <Text className="empty-icon">●</Text>
            <Text className="empty-text">暂无队伍</Text>
            <Text className="empty-hint">
              {userLevel >= 6 ? '创建队伍或在社区申请加入' : '在社区申请加入队伍'}
            </Text>
          </View>
        ) : (
          <View className="teams-list">
            {teams.map(team => (
              <View
                key={team.id}
                className="team-card"
                onClick={() => handleTeamClick(team.id)}
              >
                <View className="team-header">
                  <View className="team-info">
                    <Text className="team-name">{team.name}</Text>
                    <Text className="project-name">{team.projectName}</Text>
                  </View>
                  <View
                    className="status-badge"
                    style={{ background: getStatusColor(team.status) }}
                  >
                    <Text className="status-text">{getStatusText(team.status)}</Text>
                  </View>
                </View>

                <View className="team-members">
                  <View className="members-avatars">
                    {team.members.slice(0, 4).map(member => (
                      <Image
                        key={member.id}
                        className="member-avatar"
                        src={member.avatar}
                      />
                    ))}
                    {team.members.length > 4 && (
                      <View className="more-members">
                        <Text className="more-text">+{team.members.length - 4}</Text>
                      </View>
                    )}
                  </View>
                  <Text className="members-count">
                    {team.members.length}/{team.totalMembers}人
                  </Text>
                </View>

                <View className="team-footer">
                  <View className="role-badge">
                    <Text className="role-text">
                      {team.role === 'leader' ? '◆ 队长' : '● 成员'}
                    </Text>
                  </View>
                  <Text className="create-date">创建于 {formatDate(team.createdAt)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}
