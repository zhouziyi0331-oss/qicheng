import { View, Text, ScrollView, Button } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

export default function TaskProgress() {
  const [taskId, setTaskId] = useState('')
  const [dashboard, setDashboard] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params
    if (params?.taskId) {
      setTaskId(params.taskId)
      loadDashboard(params.taskId)
    }
  }, [])

  const loadDashboard = async (id: string) => {
    setLoading(true)
    try {
      const token = Taro.getStorageSync('token')
      const res = await Taro.request({
        url: `/api/v1/task-tracking/tasks/${id}/progress-dashboard`,
        method: 'GET',
        header: { Authorization: `Bearer ${token}` }
      })
      if (res.data.success) {
        setDashboard(res.data.data)
      }
    } catch (error) {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <View className='task-progress'><View className='loading'>加载中...</View></View>
  if (!dashboard) return <View className='task-progress'><View className='empty'>暂无数据</View></View>

  const { task, snapshot, milestones, warnings } = dashboard

  return (
    <View className='task-progress'>
      <ScrollView className='dashboard-content' scrollY>
        <View className='task-overview'>
          <Text className='task-title'>{task.title}</Text>
        </View>
        {snapshot && (
          <View className='progress-card'>
            <Text className='card-title'>进度：{snapshot.completion_percentage}%</Text>
            <View className='progress-bar'>
              <View className='progress-fill' style={{ width: `${snapshot.completion_percentage}%` }} />
            </View>
          </View>
        )}
        {milestones && milestones.length > 0 && (
          <View className='milestones-card'>
            {milestones.map((m: any) => (
              <View key={m.id} className='milestone-item'>
                <Text>{m.milestone_name}</Text>
              </View>
            ))}
          </View>
        )}
        <Button className='btn' onClick={() => loadDashboard(taskId)}>刷新</Button>
      </ScrollView>
    </View>
  )
}
