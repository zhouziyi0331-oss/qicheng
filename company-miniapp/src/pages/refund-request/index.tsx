import { View, Text, ScrollView, Button, Picker, Input, Textarea } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

export default function RefundRequest() {
  const [taskId, setTaskId] = useState('')
  const [requests, setRequests] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    record_type: 0,
    reason: 0,
    reason_detail: '',
    requested_amount: 0
  })
  const [loading, setLoading] = useState(false)

  const recordTypes = ['全额退款', '部分退款', '补偿']
  const reasons = ['任务取消', '质量问题', '范围变更', '延期未交', '违约']

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params
    if (params?.taskId) {
      setTaskId(params.taskId)
      loadRequests()
    }
  }, [])

  const loadRequests = async () => {
    try {
      const token = Taro.getStorageSync('token')
      const res = await Taro.request({
        url: '/api/v1/acceptance/refund-requests',
        method: 'GET',
        header: { Authorization: `Bearer ${token}` }
      })
      if (res.data.success) {
        setRequests(res.data.data)
      }
    } catch (error) {
      console.log('加载失败', error)
    }
  }

  const submitRequest = async () => {
    if (!form.reason_detail.trim()) {
      Taro.showToast({ title: '请填写详细原因', icon: 'none' })
      return
    }
    if (form.requested_amount <= 0) {
      Taro.showToast({ title: '请填写申请金额', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      const token = Taro.getStorageSync('token')
      const res = await Taro.request({
        url: '/api/v1/acceptance/refund-requests',
        method: 'POST',
        header: { Authorization: `Bearer ${token}` },
        data: {
          task_id: taskId,
          record_type: recordTypes[form.record_type],
          reason: reasons[form.reason],
          reason_detail: form.reason_detail,
          requested_amount: form.requested_amount
        }
      })

      if (res.data.success) {
        Taro.showToast({ title: '提交成功', icon: 'success' })
        setShowForm(false)
        setForm({ record_type: 0, reason: 0, reason_detail: '', requested_amount: 0 })
        loadRequests()
      }
    } catch (error: any) {
      Taro.showToast({ title: error.message || '提交失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const getStatusText = (status: string) => {
    const map: any = {
      pending: '待审核',
      reviewing: '审核中',
      approved: '已批准',
      rejected: '已拒绝',
      processed: '已处理'
    }
    return map[status] || status
  }

  const getStatusColor = (status: string) => {
    const map: any = {
      pending: '#faad14',
      reviewing: '#1890ff',
      approved: '#52c41a',
      rejected: '#ff4d4f',
      processed: '#52c41a'
    }
    return map[status] || '#999'
  }

  if (showForm) {
    return (
      <View className='refund-request'>
        <ScrollView className='request-form' scrollY>
          <View className='form-header'>
            <Button className='back-btn' onClick={() => setShowForm(false)}>← 返回</Button>
            <Text className='form-title'>申请退款/补偿</Text>
          </View>

          <View className='form-item'>
            <Text className='item-label'>申请类型</Text>
            <Picker
              mode='selector'
              range={recordTypes}
              value={form.record_type}
              onChange={(e) => setForm({ ...form, record_type: e.detail.value })}
            >
              <View className='picker-view'>
                <Text>{recordTypes[form.record_type]}</Text>
                <Text className='arrow'>▼</Text>
              </View>
            </Picker>
          </View>

          <View className='form-item'>
            <Text className='item-label'>申请原因</Text>
            <Picker
              mode='selector'
              range={reasons}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.detail.value })}
            >
              <View className='picker-view'>
                <Text>{reasons[form.reason]}</Text>
                <Text className='arrow'>▼</Text>
              </View>
            </Picker>
          </View>

          <View className='form-item'>
            <Text className='item-label'>申请金额（元）</Text>
            <Input
              className='item-input'
              type='digit'
              placeholder='请输入金额'
              value={form.requested_amount.toString()}
              onInput={(e) => setForm({ ...form, requested_amount: parseFloat(e.detail.value) || 0 })}
            />
          </View>

          <View className='form-item'>
            <Text className='item-label'>详细原因*</Text>
            <Textarea
              className='item-textarea'
              placeholder='请详细说明申请退款/补偿的原因...'
              value={form.reason_detail}
              onInput={(e) => setForm({ ...form, reason_detail: e.detail.value })}
              maxlength={500}
            />
          </View>

          <Button className='submit-btn' loading={loading} onClick={submitRequest}>
            提交申请
          </Button>
        </ScrollView>
      </View>
    )
  }

  return (
    <View className='refund-request'>
      <View className='page-header'>
        <Text className='title'>退款/补偿</Text>
        <Button className='new-btn' onClick={() => setShowForm(true)}>+ 新申请</Button>
      </View>

      <ScrollView className='requests-list' scrollY>
        {requests.length === 0 ? (
          <View className='empty'>
            <Text className='empty-icon'>💰</Text>
            <Text className='empty-text'>暂无申请记录</Text>
          </View>
        ) : (
          requests.map((request) => (
            <View key={request.id} className='request-card'>
              <View className='card-header'>
                <View className='request-type'>{request.record_type}</View>
                <View className='request-status' style={{ background: getStatusColor(request.status) }}>
                  {getStatusText(request.status)}
                </View>
              </View>

              <View className='request-info'>
                <View className='info-row'>
                  <Text className='label'>申请金额：</Text>
                  <Text className='value'>¥{request.requested_amount}</Text>
                </View>
                <View className='info-row'>
                  <Text className='label'>申请原因：</Text>
                  <Text className='value'>{request.reason}</Text>
                </View>
                <View className='info-row'>
                  <Text className='label'>详细说明：</Text>
                  <Text className='detail'>{request.reason_detail}</Text>
                </View>
              </View>

              {request.approved_amount && (
                <View className='approved-amount'>
                  批准金额：¥{request.approved_amount}
                </View>
              )}

              {request.review_comment && (
                <View className='review-comment'>
                  <Text className='comment-label'>审核意见：</Text>
                  <Text className='comment-text'>{request.review_comment}</Text>
                </View>
              )}

              <Text className='request-time'>
                申请时间：{new Date(request.created_at).toLocaleString('zh-CN')}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}
