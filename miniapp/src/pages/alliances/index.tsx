import { View, Text, Image } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import api from '../../services/api'
import './index.scss'

/**
 * 团队协作页面
 *
 * 核心理念：孵化计划学生可以组建团队，一起接大项目
 * - 创始人发起团队
 * - 邀请其他孵化学生加入
 * - 一起接项目，分配收益
 */

interface Alliance {
  id: string
  name: string
  description: string
  vision: string
  member_ids: string[]
  role: string
  created_at: string
}

export default function Alliances() {
  const [alliances, setAlliances] = useState<Alliance[]>([])
  const [invitations, setInvitations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAlliances()
    loadInvitations()
  }, [])

  const loadAlliances = async () => {
    try {
      const studentId = Taro.getStorageSync('userId')
      const response = await api.alliance.getStudentAlliances(studentId)
      setAlliances(response.alliances)
    } catch (error) {
      console.error('加载团队失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadInvitations = async () => {
    try {
      const studentId = Taro.getStorageSync('userId')
      const response = await api.alliance.getPendingInvitations(studentId)
      setInvitations(response.invitations)
    } catch (error) {
      console.error('加载邀请失败:', error)
    }
  }

  const handleCreateAlliance = () => {
    Taro.navigateTo({
      url: '/pages/alliance-create/index'
    })
  }

  const handleAllianceClick = (allianceId: string) => {
    Taro.navigateTo({
      url: `/pages/alliance-detail/index?id=${allianceId}`
    })
  }

  const handleRespondInvitation = async (invitationId: string, accept: boolean) => {
    try {
      await api.alliance.respondToInvitation(invitationId, accept)
      Taro.showToast({ title: accept ? '已加入团队' : '已拒绝邀请', icon: 'success' })
      loadAlliances()
      loadInvitations()
    } catch (error) {
      console.error('响应邀请失败:', error)
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'founder': return '创始人'
      case 'core': return '核心成员'
      case 'member': return '成员'
      default: return '成员'
    }
  }

  if (loading) {
    return (
      <View className='alliances-page'>
        <View className='loading'>加载中...</View>
      </View>
    )
  }

  return (
    <View className='alliances-page'>
      {/* 理念说明 */}
      <View className='concept-card'>
        <View className='concept-icon'>🤝</View>
        <View className='concept-text'>
          <View className='concept-title'>团队协作是什么？</View>
          <View className='concept-desc'>
            孵化计划学生可以组建团队，一起接大项目、分配收益、共同成长
          </View>
        </View>
      </View>

      {/* 待处理邀请 */}
      {invitations.length > 0 && (
        <View className='invitations-section'>
          <View className='section-title'>待处理邀请</View>
          {invitations.map(invitation => (
            <View key={invitation.id} className='invitation-card'>
              <View className='invitation-header'>
                <View className='invitation-info'>
                  <View className='invitation-name'>{invitation.alliance_name}</View>
                  <View className='invitation-from'>来自 {invitation.inviter_name} 的邀请</View>
                </View>
              </View>
              {invitation.invitation_message && (
                <View className='invitation-message'>{invitation.invitation_message}</View>
              )}
              <View className='invitation-actions'>
                <View
                  className='btn-accept'
                  onClick={() => handleRespondInvitation(invitation.id, true)}
                >
                  接受
                </View>
                <View
                  className='btn-reject'
                  onClick={() => handleRespondInvitation(invitation.id, false)}
                >
                  拒绝
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* 我的团队 */}
      <View className='alliances-section'>
        <View className='section-header'>
          <View className='section-title'>我的团队</View>
          <View className='create-btn' onClick={handleCreateAlliance}>
            + 创建
          </View>
        </View>

        {alliances.length === 0 ? (
          <View className='empty-state'>
            <View className='empty-icon'>🌟</View>
            <View className='empty-text'>还没有加入团队</View>
            <View className='empty-hint'>创建或加入团队，一起接大项目</View>
          </View>
        ) : (
          <View className='alliances-list'>
            {alliances.map(alliance => (
              <View
                key={alliance.id}
                className='alliance-card'
                onClick={() => handleAllianceClick(alliance.id)}
              >
                <View className='alliance-header'>
                  <View className='alliance-name'>{alliance.name}</View>
                  <View className='alliance-role'>{getRoleText(alliance.role)}</View>
                </View>
                <View className='alliance-desc'>{alliance.description}</View>
                <View className='alliance-meta'>
                  <View className='meta-item'>
                    <View className='meta-icon'>👥</View>
                    <Text>{alliance.member_ids.length} 人</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  )
}
