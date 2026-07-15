import { View, Text, ScrollView, Image, Button, Textarea } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { tokenManager } from '../../../utils/token'
import { getApiUrl } from '../../../config'
import './detail.scss'

interface Member {
  id: string
  name: string
  avatar: string
  level: number
  role: 'leader' | 'member'
  skills: string[]
  assignedModule?: string
}

interface Application {
  id: string
  applicant: {
    id: string
    name: string
    avatar: string
    level: number
    skills: string[]
    rating: number
  }
  message: string
  createdAt: string
}

interface TeamDetail {
  id: string
  name: string
  projectName: string
  description: string
  status: 'recruiting' | 'in_progress' | 'completed' | 'disbanded'
  role: 'leader' | 'member'
  members: Member[]
  totalMembers: number
  applications: Application[]
  modules: string[]
  createdAt: string
}

export default function TeamDetail() {
  const router = useRouter()
  const { id } = router.params
  const [team, setTeam] = useState<TeamDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [selectedModule, setSelectedModule] = useState('')

  useEffect(() => {
    loadTeamDetail()
  }, [id])

  const loadTeamDetail = async () => {
    setLoading(true)
    try {
      const token = tokenManager.getAccessToken()
      const res = await Taro.request({
        url: getApiUrl(`/api/v1/teams/${id}`),
        method: 'GET',
        header: { 'Authorization': `Bearer ${token}` }
      })

      if (res.data.success) {
        setTeam(res.data.data)
      } else {
        throw new Error('加载失败')
      }
    } catch (error) {
      console.error('加载队伍详情失败:', error)

      // 使用模拟数据
      const mockTeam: TeamDetail = {
        id: id || 't1',
        name: '电商小程序开发团队',
        projectName: '潮流电商平台',
        description: '开发一个面向年轻人的潮流电商小程序，包括商品展示、购物车、订单管理等功能',
        status: 'in_progress',
        role: 'leader',
        members: [
          {
            id: 'u1',
            name: '张小明',
            avatar: 'https://via.placeholder.com/100',
            level: 5,
            role: 'leader',
            skills: ['UI设计', '产品规划'],
            assignedModule: 'UI设计'
          },
          {
            id: 'u2',
            name: '李华',
            avatar: 'https://via.placeholder.com/100',
            level: 4,
            role: 'member',
            skills: ['React', 'Taro'],
            assignedModule: '前端开发'
          }
        ],
        totalMembers: 3,
        applications: [
          {
            id: 'a1',
            applicant: {
              id: 'u3',
              name: '王小红',
              avatar: 'https://via.placeholder.com/100',
              level: 4,
              skills: ['Node.js', 'API开发'],
              rating: 4.5
            },
            message: '我有2年Node.js开发经验，可以负责后端API开发',
            createdAt: '2026-05-27T10:00:00Z'
          }
        ],
        modules: ['UI设计', '前端开发', '后端开发', '测试'],
        createdAt: '2026-05-20T10:00:00Z'
      }

      setTeam(mockTeam)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignModule = (member: Member) => {
    setSelectedMember(member)
    setSelectedModule(member.assignedModule || '')
    setShowAssignModal(true)
  }

  const confirmAssign = async () => {
    if (!selectedMember || !selectedModule) return

    try {
      const token = tokenManager.getAccessToken()
      await Taro.request({
        url: getApiUrl(`/api/v1/teams/${team?.id}/assign`),
        method: 'POST',
        header: { 'Authorization': `Bearer ${token}` },
        data: {
          memberId: selectedMember.id,
          module: selectedModule
        }
      })

      Taro.showToast({
        title: '分配成功',
        icon: 'success'
      })

      setShowAssignModal(false)
      loadTeamDetail()
    } catch (error) {
      console.error('分配失败:', error)
      Taro.showToast({
        title: '分配失败',
        icon: 'none'
      })
    }
  }

  const handleApproveApplication = async (applicationId: string) => {
    try {
      const token = tokenManager.getAccessToken()
      await Taro.request({
        url: getApiUrl(`/api/v1/teams/${team?.id}/applications/${applicationId}/approve`),
        method: 'POST',
        header: { 'Authorization': `Bearer ${token}` }
      })

      Taro.showToast({
        title: '已通过申请',
        icon: 'success'
      })

      loadTeamDetail()
    } catch (error) {
      console.error('通过申请失败:', error)
      Taro.showToast({
        title: '操作失败',
        icon: 'none'
      })
    }
  }

  const handleRejectApplication = async (applicationId: string) => {
    try {
      const token = tokenManager.getAccessToken()
      await Taro.request({
        url: getApiUrl(`/api/v1/teams/${team?.id}/applications/${applicationId}/reject`),
        method: 'POST',
        header: { 'Authorization': `Bearer ${token}` }
      })

      Taro.showToast({
        title: '已拒绝申请',
        icon: 'success'
      })

      loadTeamDetail()
    } catch (error) {
      console.error('拒绝申请失败:', error)
      Taro.showToast({
        title: '操作失败',
        icon: 'none'
      })
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'recruiting': return '招募中'
      case 'in_progress': return '进行中'
      case 'completed': return '已完成'
      case 'disbanded': return '已解散'
      default: return ''
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'recruiting': return '#F59E0B'
      case 'in_progress': return '#3B82F6'
      case 'completed': return '#10B981'
      case 'disbanded': return '#6B7280'
      default: return '#6B7280'
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString('zh-CN')
  }

  if (loading) {
    return (
      <View className="team-detail-page">
        <View className="loading-state">
          <Text className="loading-text">加载中...</Text>
        </View>
      </View>
    )
  }

  if (!team) {
    return (
      <View className="team-detail-page">
        <View className="empty-state">
          <Text className="empty-text">队伍不存在</Text>
        </View>
      </View>
    )
  }

  const isLeader = team.role === 'leader'

  return (
    <View className="team-detail-page">
      <ScrollView className="content-scroll" scrollY>
        {/* 队伍信息 */}
        <View className="team-info-section">
          <View className="info-header">
            <View className="header-text">
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

          <Text className="team-description">{team.description}</Text>

          <View className="team-meta">
            <Text className="meta-item">
              ● {team.members.length}/{team.totalMembers}人
            </Text>
            <Text className="meta-item">
              ● 创建于 {formatTime(team.createdAt)}
            </Text>
          </View>
        </View>

        {/* 成员列表 */}
        <View className="members-section">
          <Text className="section-title">队伍成员</Text>
          <View className="members-list">
            {team.members.map(member => (
              <View key={member.id} className="member-card">
                <Image className="member-avatar" src={member.avatar} />
                <View className="member-info">
                  <View className="member-header">
                    <Text className="member-name">{member.name}</Text>
                    <Text className="member-level">Lv.{member.level}</Text>
                    {member.role === 'leader' && (
                      <View className="leader-badge">
                        <Text className="badge-text">◆ 队长</Text>
                      </View>
                    )}
                  </View>
                  <View className="member-skills">
                    {member.skills.map((skill, index) => (
                      <Text key={index} className="skill-tag">{skill}</Text>
                    ))}
                  </View>
                  {member.assignedModule && (
                    <View className="assigned-module">
                      <Text className="module-label">负责:</Text>
                      <Text className="module-name">{member.assignedModule}</Text>
                    </View>
                  )}
                </View>
                {isLeader && (
                  <View
                    className="assign-btn"
                    onClick={() => handleAssignModule(member)}
                  >
                    <Text className="assign-text">分配</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* 申请列表（仅队长可见） */}
        {isLeader && team.applications.length > 0 && (
          <View className="applications-section">
            <Text className="section-title">
              待处理申请 ({team.applications.length})
            </Text>
            <View className="applications-list">
              {team.applications.map(application => (
                <View key={application.id} className="application-card">
                  <View className="applicant-header">
                    <Image
                      className="applicant-avatar"
                      src={application.applicant.avatar}
                    />
                    <View className="applicant-info">
                      <View className="applicant-name-row">
                        <Text className="applicant-name">
                          {application.applicant.name}
                        </Text>
                        <Text className="applicant-level">
                          Lv.{application.applicant.level}
                        </Text>
                      </View>
                      <Text className="applicant-rating">
                        ◇ {application.applicant.rating}
                      </Text>
                    </View>
                  </View>

                  <View className="applicant-skills">
                    {application.applicant.skills.map((skill, index) => (
                      <Text key={index} className="skill-tag">{skill}</Text>
                    ))}
                  </View>

                  <View className="application-message">
                    <Text className="message-text">{application.message}</Text>
                  </View>

                  <View className="application-footer">
                    <Text className="application-time">
                      {formatTime(application.createdAt)}
                    </Text>
                    <View className="action-buttons">
                      <Button
                        className="reject-btn"
                        onClick={() => handleRejectApplication(application.id)}
                      >
                        <Text className="btn-text">拒绝</Text>
                      </Button>
                      <Button
                        className="approve-btn"
                        onClick={() => handleApproveApplication(application.id)}
                      >
                        <Text className="btn-text">通过</Text>
                      </Button>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* 分配模块弹窗 */}
      {showAssignModal && selectedMember && (
        <View
          className="assign-modal-overlay"
          onClick={() => setShowAssignModal(false)}
        >
          <View className="assign-modal" onClick={(e) => e.stopPropagation()}>
            <Text className="modal-title">分配任务模块</Text>

            <View className="modal-content">
              <Text className="member-name-text">
                为 {selectedMember.name} 分配模块
              </Text>

              <View className="modules-list">
                {team.modules.map((module, index) => (
                  <View
                    key={index}
                    className={`module-item ${selectedModule === module ? 'selected' : ''}`}
                    onClick={() => setSelectedModule(module)}
                  >
                    <Text className="module-text">{module}</Text>
                    {selectedModule === module && (
                      <Text className="check-icon">✓</Text>
                    )}
                  </View>
                ))}
              </View>
            </View>

            <View className="modal-actions">
              <Button
                className="cancel-btn"
                onClick={() => setShowAssignModal(false)}
              >
                <Text className="btn-text">取消</Text>
              </Button>
              <Button className="confirm-btn" onClick={confirmAssign}>
                <Text className="btn-text">确认</Text>
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
