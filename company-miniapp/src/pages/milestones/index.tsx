import { View, Text, ScrollView, Button, Input, Textarea } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

export default function Milestones() {
  const [taskId, setTaskId] = useState('')
  const [milestones, setMilestones] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newMilestone, setNewMilestone] = useState({
    milestone_name: '',
    description: '',
    due_date: '',
    budget_allocation: 0
  })

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params
    if (params?.taskId) {
      setTaskId(params.taskId)
      loadMilestones(params.taskId)
    }
  }, [])

  const loadMilestones = async (id: string) => {
    setLoading(true)
    try {
      const token = Taro.getStorageSync('token')
      const res = await Taro.request({
        url: `/api/v1/task-tracking/tasks/${id}/milestones`,
        method: 'GET',
        header: { Authorization: `Bearer ${token}` }
      })
      if (res.data.success) {
        setMilestones(res.data.data)
      }
    } catch (error) {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const createMilestone = async () => {
    if (!newMilestone.milestone_name) {
      Taro.showToast({ title: '请填写里程碑名称', icon: 'none' })
      return
    }

    try {
      Taro.showLoading({ title: '创建中...' })
      const token = Taro.getStorageSync('token')
      const res = await Taro.request({
        url: `/api/v1/task-tracking/tasks/${taskId}/milestones`,
        method: 'POST',
        header: { Authorization: `Bearer ${token}` },
        data: {
          ...newMilestone,
          sequence_number: milestones.length + 1
        }
      })
      Taro.hideLoading()

      if (res.data.success) {
        Taro.showToast({ title: '创建成功', icon: 'success' })
        setShowAddModal(false)
        setNewMilestone({ milestone_name: '', description: '', due_date: '', budget_allocation: 0 })
        loadMilestones(taskId)
      }
    } catch (error: any) {
      Taro.hideLoading()
      Taro.showToast({ title: error.message || '创建失败', icon: 'none' })
    }
  }

  const confirmMilestone = async (milestoneId: string, approved: boolean) => {
    try {
      Taro.showLoading({ title: '处理中...' })
      const token = Taro.getStorageSync('token')
      const res = await Taro.request({
        url: `/api/v1/task-tracking/milestones/${milestoneId}/confirm`,
        method: 'POST',
        header: { Authorization: `Bearer ${token}` },
        data: { approved, feedback: approved ? '通过' : '需要修改' }
      })
      Taro.hideLoading()

      if (res.data.success) {
        Taro.showToast({ title: approved ? '已通过' : '已驳回', icon: 'success' })
        loadMilestones(taskId)
      }
    } catch (error: any) {
      Taro.hideLoading()
      Taro.showToast({ title: error.message || '操作失败', icon: 'none' })
    }
  }

  const getStatusColor = (status: string) => {
    const map: any = {
      pending: '#999',
      in_progress: '#1890ff',
      submitted: '#faad14',
      approved: '#52c41a',
      rejected: '#ff4d4f'
    }
    return map[status] || '#999'
  }

  const getStatusText = (status: string) => {
    const map: any = {
      pending: '待开始',
      in_progress: '进行中',
      submitted: '已提交',
      approved: '✅ 已通过',
      rejected: '❌ 已驳回'
    }
    return map[status] || status
  }

  return (
    <View className='milestones-page'>
      <View className='page-header'>
        <Text className='title'>里程碑管理</Text>
        <Button className='add-btn' onClick={() => setShowAddModal(true)}>
          ➕ 新增里程碑
        </Button>
      </View>

      <ScrollView className='milestones-list' scrollY>
        {loading ? (
          <View className='loading'>加载中...</View>
        ) : milestones.length === 0 ? (
          <View className='empty'>
            <Text className='empty-icon'>📌</Text>
            <Text className='empty-text'>暂无里程碑</Text>
            <Button className='btn' onClick={() => setShowAddModal(true)}>
              创建第一个里程碑
            </Button>
          </View>
        ) : (
          milestones.map((milestone, index) => (
            <View key={milestone.id} className='milestone-card'>
              <View className='milestone-header'>
                <View className='milestone-number'>{index + 1}</View>
                <View className='milestone-info'>
                  <Text className='milestone-name'>{milestone.milestone_name}</Text>
                  <View
                    className='milestone-status'
                    style={{ background: getStatusColor(milestone.status) }}
                  >
                    {getStatusText(milestone.status)}
                  </View>
                </View>
              </View>

              {milestone.description && (
                <View className='milestone-desc'>
                  <Text>{milestone.description}</Text>
                </View>
              )}

              {milestone.due_date && (
                <View className='milestone-date'>
                  <Text className='label'>📅 截止日期：</Text>
                  <Text className='value'>
                    {new Date(milestone.due_date).toLocaleDateString('zh-CN')}
                  </Text>
                </View>
              )}

              {milestone.budget_allocation && (
                <View className='milestone-budget'>
                  <Text className='label'>💰 预算分配：</Text>
                  <Text className='value'>¥{milestone.budget_allocation}</Text>
                </View>
              )}

              {milestone.student_submission && (
                <View className='submission-box'>
                  <Text className='submission-label'>学生提交内容：</Text>
                  <Text className='submission-content'>{milestone.student_submission}</Text>
                  {milestone.submitted_at && (
                    <Text className='submission-time'>
                      提交时间：{new Date(milestone.submitted_at).toLocaleString('zh-CN')}
                    </Text>
                  )}
                </View>
              )}

              {milestone.company_feedback && (
                <View className='feedback-box'>
                  <Text className='feedback-label'>企业反馈：</Text>
                  <Text className='feedback-content'>{milestone.company_feedback}</Text>
                </View>
              )}

              {milestone.status === 'submitted' && (
                <View className='milestone-actions'>
                  <Button
                    className='btn btn-reject'
                    onClick={() => confirmMilestone(milestone.id, false)}
                  >
                    ❌ 驳回
                  </Button>
                  <Button
                    className='btn btn-approve'
                    onClick={() => confirmMilestone(milestone.id, true)}
                  >
                    ✅ 通过
                  </Button>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {showAddModal && (
        <View className='modal-overlay' onClick={() => setShowAddModal(false)}>
          <View className='modal-content' onClick={(e) => e.stopPropagation()}>
            <Text className='modal-title'>新增里程碑</Text>

            <View className='form-item'>
              <Text className='form-label'>里程碑名称*</Text>
              <Input
                className='form-input'
                placeholder='例如：首页设计完成'
                value={newMilestone.milestone_name}
                onInput={(e) => setNewMilestone({ ...newMilestone, milestone_name: e.detail.value })}
              />
            </View>

            <View className='form-item'>
              <Text className='form-label'>描述</Text>
              <Textarea
                className='form-textarea'
                placeholder='详细描述里程碑要求...'
                value={newMilestone.description}
                onInput={(e) => setNewMilestone({ ...newMilestone, description: e.detail.value })}
              />
            </View>

            <View className='form-item'>
              <Text className='form-label'>截止日期</Text>
              <Input
                className='form-input'
                type='date'
                value={newMilestone.due_date}
                onInput={(e) => setNewMilestone({ ...newMilestone, due_date: e.detail.value })}
              />
            </View>

            <View className='form-item'>
              <Text className='form-label'>预算分配（元）</Text>
              <Input
                className='form-input'
                type='number'
                placeholder='0'
                value={newMilestone.budget_allocation.toString()}
                onInput={(e) => setNewMilestone({ ...newMilestone, budget_allocation: parseFloat(e.detail.value) || 0 })}
              />
            </View>

            <View className='modal-actions'>
              <Button className='btn btn-cancel' onClick={() => setShowAddModal(false)}>
                取消
              </Button>
              <Button className='btn btn-confirm' onClick={createMilestone}>
                创建
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
