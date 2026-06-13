import { View, Text, ScrollView, Button, Textarea } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { trialInvitationApi } from '../../api/experienceOptimization'
import './index.scss'

export default function TrialManagement() {
  const [invitations, setInvitations] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(false)
  const [selectedInvitation, setSelectedInvitation] = useState<any>(null)
  const [showEvaluateModal, setShowEvaluateModal] = useState(false)
  const [evaluation, setEvaluation] = useState('')
  const [score, setScore] = useState(0)

  useEffect(() => {
    loadInvitations()
  }, [activeTab])

  const loadInvitations = async () => {
    setLoading(true)
    try {
      const status = activeTab === 'all' ? undefined : activeTab
      const res = await trialInvitationApi.getList(status)
      if (res.success) {
        setInvitations(res.data)
      }
    } catch (error) {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleEvaluate = (invitation: any) => {
    setSelectedInvitation(invitation)
    setShowEvaluateModal(true)
  }

  const submitEvaluation = async (approved: boolean) => {
    if (!selectedInvitation) return

    if (!evaluation.trim()) {
      Taro.showToast({ title: '请填写评估意见', icon: 'none' })
      return
    }

    if (score < 0 || score > 1) {
      Taro.showToast({ title: '评分范围0-1', icon: 'none' })
      return
    }

    try {
      Taro.showLoading({ title: '提交中...' })
      const res = await trialInvitationApi.evaluate(
        selectedInvitation.id,
        evaluation,
        score,
        approved
      )
      Taro.hideLoading()

      if (res.success) {
        Taro.showToast({ title: '评估完成', icon: 'success' })
        setShowEvaluateModal(false)
        setEvaluation('')
        setScore(0)
        loadInvitations()
      }
    } catch (error: any) {
      Taro.hideLoading()
      Taro.showToast({ title: error.message || '提交失败', icon: 'none' })
    }
  }

  const getStatusText = (status: string) => {
    const map: any = {
      pending: '待响应',
      accepted: '已接受',
      rejected: '已拒绝',
      submitted: '已提交'
    }
    return map[status] || status
  }

  const getStatusClass = (status: string) => {
    const map: any = {
      pending: 'status-pending',
      accepted: 'status-accepted',
      rejected: 'status-rejected',
      submitted: 'status-submitted'
    }
    return map[status] || ''
  }

  return (
    <View className='trial-management'>
      {/* 标签页 */}
      <View className='tabs'>
        {[
          { key: 'all', label: '全部' },
          { key: 'pending', label: '待响应' },
          { key: 'submitted', label: '已提交' }
        ].map((tab) => (
          <View
            key={tab.key}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </View>
        ))}
      </View>

      {/* 试稿列表 */}
      <ScrollView className='invitation-list' scrollY>
        {loading ? (
          <View className='loading'>加载中...</View>
        ) : invitations.length === 0 ? (
          <View className='empty'>暂无试稿邀请</View>
        ) : (
          invitations.map((invitation) => (
            <View key={invitation.id} className='invitation-card'>
              {/* 状态标签 */}
              <View className={`status-badge ${getStatusClass(invitation.student_status)}`}>
                {getStatusText(invitation.student_status)}
              </View>

              {/* 任务信息 */}
              <View className='task-info'>
                <Text className='task-title'>{invitation.task_title}</Text>
                <Text className='task-category'>{invitation.task_category}</Text>
              </View>

              {/* 学生信息 */}
              <View className='student-info'>
                <View className='avatar'>
                  {invitation.student_avatar ? (
                    <image src={invitation.student_avatar} mode='aspectFill' />
                  ) : (
                    <Text>👤</Text>
                  )}
                </View>
                <View className='student-details'>
                  <Text className='student-name'>{invitation.student_name}</Text>
                  <Text className='student-level'>Lv.{invitation.student_level}</Text>
                </View>
              </View>

              {/* 试稿要求 */}
              <View className='requirement'>
                <Text className='label'>试稿要求：</Text>
                <Text className='content'>{invitation.trial_requirement}</Text>
              </View>

              {/* 截止时间 */}
              <View className='deadline'>
                <Text className='label'>截止时间：</Text>
                <Text className='time'>
                  {new Date(invitation.trial_deadline).toLocaleString('zh-CN')}
                </Text>
              </View>

              {/* 试稿费用 */}
              {invitation.trial_budget && (
                <View className='budget'>
                  <Text className='label'>试稿费用：</Text>
                  <Text className='amount'>¥{invitation.trial_budget}</Text>
                </View>
              )}

              {/* 学生提交内容 */}
              {invitation.student_status === 'submitted' && (
                <View className='submission'>
                  <Text className='label'>提交内容：</Text>
                  <Text className='content'>{invitation.trial_submission}</Text>
                  {invitation.trial_files && invitation.trial_files.length > 0 && (
                    <View className='files'>
                      <Text className='files-label'>附件：</Text>
                      {JSON.parse(invitation.trial_files).map((file: any, index: number) => (
                        <View key={index} className='file-item'>
                          📎 {file.name}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* 评估结果 */}
              {invitation.is_approved !== null && (
                <View className={`evaluation ${invitation.is_approved ? 'approved' : 'rejected'}`}>
                  <Text className='eval-label'>
                    {invitation.is_approved ? '✅ 已通过' : '❌ 未通过'}
                  </Text>
                  <Text className='eval-score'>评分：{invitation.evaluation_score}</Text>
                  <Text className='eval-content'>{invitation.company_evaluation}</Text>
                </View>
              )}

              {/* 操作按钮 */}
              {invitation.student_status === 'submitted' && invitation.is_approved === null && (
                <View className='actions'>
                  <Button
                    className='btn btn-primary'
                    onClick={() => handleEvaluate(invitation)}
                  >
                    评估试稿
                  </Button>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* 评估弹窗 */}
      {showEvaluateModal && selectedInvitation && (
        <View className='modal-overlay' onClick={() => setShowEvaluateModal(false)}>
          <View className='modal-content' onClick={(e) => e.stopPropagation()}>
            <Text className='modal-title'>评估试稿</Text>

            <View className='form-item'>
              <Text className='form-label'>评分 (0-1)：</Text>
              <input
                className='form-input'
                type='number'
                step='0.1'
                min='0'
                max='1'
                value={score}
                onChange={(e: any) => setScore(parseFloat(e.target.value))}
              />
            </View>

            <View className='form-item'>
              <Text className='form-label'>评估意见：</Text>
              <Textarea
                className='form-textarea'
                placeholder='请填写评估意见...'
                value={evaluation}
                onInput={(e) => setEvaluation(e.detail.value)}
                maxlength={500}
              />
            </View>

            <View className='modal-actions'>
              <Button
                className='btn btn-secondary'
                onClick={() => submitEvaluation(false)}
              >
                不通过
              </Button>
              <Button
                className='btn btn-primary'
                onClick={() => submitEvaluation(true)}
              >
                通过
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
