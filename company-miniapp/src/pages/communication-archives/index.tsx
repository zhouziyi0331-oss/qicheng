import { View, Text, ScrollView, Button } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

export default function CommunicationArchives() {
  const [taskId, setTaskId] = useState('')
  const [archives, setArchives] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params
    if (params?.taskId) {
      setTaskId(params.taskId)
      loadArchives(params.taskId)
    }
  }, [])

  const loadArchives = async (id: string) => {
    setLoading(true)
    try {
      const token = Taro.getStorageSync('token')
      const res = await Taro.request({
        url: `/api/v1/task-tracking/tasks/${id}/archives`,
        method: 'GET',
        header: { Authorization: `Bearer ${token}` }
      })
      if (res.data.success) {
        setArchives(res.data.data)
      }
    } catch (error) {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const createArchive = async () => {
    try {
      Taro.showLoading({ title: '归档中...' })
      const token = Taro.getStorageSync('token')
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

      const res = await Taro.request({
        url: `/api/v1/task-tracking/tasks/${taskId}/archive-communication`,
        method: 'POST',
        header: { Authorization: `Bearer ${token}` },
        data: {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        }
      })
      Taro.hideLoading()

      if (res.data.success) {
        Taro.showToast({ title: '归档成功', icon: 'success' })
        loadArchives(taskId)
      }
    } catch (error: any) {
      Taro.hideLoading()
      Taro.showToast({ title: error.message || '归档失败', icon: 'none' })
    }
  }

  const viewArchiveDetail = (archive: any) => {
    const messages = JSON.parse(archive.messages)
    Taro.showModal({
      title: '归档详情',
      content: `共${messages.length}条消息\n企业：${archive.company_messages}条\n学生：${archive.student_messages}条`,
      showCancel: false
    })
  }

  return (
    <View className='communication-archives'>
      <View className='page-header'>
        <View className='header-info'>
          <Text className='title'>沟通记录归档</Text>
          <Text className='subtitle'>保存重要的沟通记录</Text>
        </View>
        <Button className='archive-btn' onClick={createArchive}>
          + 创建归档
        </Button>
      </View>

      <ScrollView className='archives-list' scrollY>
        {loading ? (
          <View className='loading'>加载中...</View>
        ) : archives.length === 0 ? (
          <View className='empty'>
            <Text className='empty-icon'>📁</Text>
            <Text className='empty-text'>暂无归档记录</Text>
            <Text className='empty-hint'>归档后可以永久保存沟通记录</Text>
            <Button className='btn' onClick={createArchive}>
              创建第一个归档
            </Button>
          </View>
        ) : (
          archives.map((archive) => (
            <View key={archive.id} className='archive-card' onClick={() => viewArchiveDetail(archive)}>
              <View className='archive-header'>
                <View className='archive-icon'>📁</View>
                <View className='archive-info'>
                  <Text className='archive-date'>
                    {new Date(archive.start_date).toLocaleDateString('zh-CN')} - {new Date(archive.end_date).toLocaleDateString('zh-CN')}
                  </Text>
                  <Text className='archive-time'>
                    归档于 {new Date(archive.archived_at).toLocaleString('zh-CN')}
                  </Text>
                </View>
                {archive.is_locked && (
                  <View className='locked-badge'>🔒 已锁定</View>
                )}
              </View>

              <View className='archive-stats'>
                <View className='stat-item'>
                  <Text className='stat-value'>{archive.total_messages}</Text>
                  <Text className='stat-label'>总消息</Text>
                </View>
                <View className='stat-item'>
                  <Text className='stat-value'>{archive.company_messages}</Text>
                  <Text className='stat-label'>企业</Text>
                </View>
                <View className='stat-item'>
                  <Text className='stat-value'>{archive.student_messages}</Text>
                  <Text className='stat-label'>学生</Text>
                </View>
                {archive.avg_response_time_hours && (
                  <View className='stat-item'>
                    <Text className='stat-value'>{archive.avg_response_time_hours.toFixed(1)}h</Text>
                    <Text className='stat-label'>平均响应</Text>
                  </View>
                )}
              </View>

              {archive.archived_by_name && (
                <Text className='archived-by'>
                  归档人：{archive.archived_by_name}
                </Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}
