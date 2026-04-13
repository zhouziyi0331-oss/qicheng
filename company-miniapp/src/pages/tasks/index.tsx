import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { taskAPI } from '../../services/api'
import { CONTENT_TRACK_LEVELS, TaskTrack, TaskLevel } from '../../types/task'
import './index.scss'

export default function Tasks() {
  const [activeTab, setActiveTab] = useState('all')
  const [tasks, setTasks] = useState<any[]>([])

  useEffect(() => {
    loadTasks()
  }, [activeTab])

  const loadTasks = async () => {
    // 模拟数据 - 添加赛道和等级信息
    const allTasks = [
      {
        id: 1,
        title: '开发微信小程序商城',
        track: 'tool' as TaskTrack,
        level: 2 as TaskLevel,
        status: 'in-progress',
        statusText: '进行中',
        student: '张同学',
        studentId: 'stu001',
        progress: 60,
        budget: 3000,
        deadline: '2026-04-20',
        matchScore: 92
      },
      {
        id: 2,
        title: '设计企业官网UI',
        track: 'content' as TaskTrack,
        level: 1 as TaskLevel,
        status: 'pending-confirm',
        statusText: '待确认',
        student: '李同学',
        studentId: 'stu002',
        progress: 100,
        budget: 2000,
        deadline: '2026-04-15',
        matchScore: 88
      },
      {
        id: 3,
        title: '编写产品需求文档',
        track: 'content' as TaskTrack,
        level: 0 as TaskLevel,
        status: 'in-progress',
        statusText: '进行中',
        student: '王同学',
        studentId: 'stu003',
        progress: 30,
        budget: 1500,
        deadline: '2026-04-18',
        matchScore: 85
      },
      {
        id: 4,
        title: 'Python数据分析脚本',
        track: 'tool' as TaskTrack,
        level: 1 as TaskLevel,
        status: 'completed',
        statusText: '已完成',
        student: '赵同学',
        studentId: 'stu004',
        progress: 100,
        budget: 1000,
        deadline: '2026-04-10',
        matchScore: 90
      },
      {
        id: 5,
        title: '品牌Logo设计',
        track: 'content' as TaskTrack,
        level: 0 as TaskLevel,
        status: 'pending-accept',
        statusText: '待接单',
        student: '-',
        studentId: null,
        progress: 0,
        budget: 2500,
        deadline: '2026-04-25'
      }
    ]

    if (activeTab === 'all') {
      setTasks(allTasks)
    } else if (activeTab === 'active') {
      setTasks(allTasks.filter(t => t.status === 'in-progress'))
    } else if (activeTab === 'completed') {
      setTasks(allTasks.filter(t => t.status === 'completed'))
    } else if (activeTab === 'pending') {
      setTasks(allTasks.filter(t => t.status === 'pending-accept' || t.status === 'pending-confirm'))
    }
  }

  const getTrackName = (track: TaskTrack) => {
    return track === 'content' ? 'AI内容创作' : 'AI工具开发'
  }

  const getLevelInfo = (level: TaskLevel, track: TaskTrack) => {
    const levelInfo = CONTENT_TRACK_LEVELS[level]
    const taskType = track === 'content' ? levelInfo.contentTask : levelInfo.toolTask
    return {
      name: levelInfo.name,
      taskType,
      reward: levelInfo.reward
    }
  }

  const viewTaskDetail = (taskId) => {
    Taro.navigateTo({
      url: `/pages/task-detail/index?id=${taskId}`
    })
  }

  const handleQuickAction = (task, action) => {
    switch (action) {
      case 'verify':
        // 待确认 -> 跳转到验收页面
        Taro.navigateTo({
          url: `/pages/task-verification/index?taskId=${task.id}`
        })
        break
      case 'progress':
        // 进行中 -> 查看进度
        Taro.navigateTo({
          url: `/pages/task-progress/index?taskId=${task.id}`
        })
        break
      case 'students':
        // 待接单 -> 查看匹配的学生列表
        Taro.navigateTo({
          url: `/pages/select-students/index?taskId=${task.id}`
        })
        break
      case 'chat':
        // 联系学生
        Taro.navigateTo({
          url: `/pages/chat-detail/index?taskId=${task.id}&studentId=${task.studentId}`
        })
        break
    }
  }

  return (
    <View className='tasks-page'>
      {/* 标签页 */}
      <View className='tabs'>
        <View
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <Text>全部</Text>
        </View>
        <View
          className={`tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          <Text>进行中</Text>
        </View>
        <View
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <Text>待处理</Text>
        </View>
        <View
          className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          <Text>已完成</Text>
        </View>
      </View>

      {/* 任务列表 */}
      <ScrollView className='task-list' scrollY>
        {tasks.map(task => (
          <View key={task.id} className='task-card' onClick={() => viewTaskDetail(task.id)}>
            {/* 赛道和等级标签 */}
            {task.track && task.level !== undefined && (
              <View className='task-level-badge'>
                <Text className='level-track'>{getTrackName(task.track)}</Text>
                <Text className='level-name'>{getLevelInfo(task.level, task.track).name}</Text>
              </View>
            )}

            <View className='task-header'>
              <Text className='task-title'>{task.title}</Text>
              <Text className={`task-status status-${task.status}`}>{task.statusText}</Text>
            </View>

            <View className='task-meta'>
              <View className='meta-item'>
                <Text className='meta-label'>执行学生:</Text>
                <Text className='meta-value'>{task.student}</Text>
              </View>
              <View className='meta-item'>
                <Text className='meta-label'>预算:</Text>
                <Text className='meta-value'>¥{task.budget}</Text>
              </View>
            </View>

            {/* 匹配度显示 */}
            {task.matchScore && (
              <View className='match-score'>
                <Text className='match-label'>匹配度:</Text>
                <Text className='match-value'>{task.matchScore}%</Text>
              </View>
            )}

            <View className='task-meta'>
              <View className='meta-item'>
                <Text className='meta-label'>截止日期:</Text>
                <Text className='meta-value'>{task.deadline}</Text>
              </View>
              <View className='meta-item'>
                <Text className='meta-label'>进度:</Text>
                <Text className='meta-value'>{task.progress}%</Text>
              </View>
            </View>

            {task.progress > 0 && (
              <View className='progress-bar'>
                <View className='progress-fill' style={{ width: `${task.progress}%` }} />
              </View>
            )}

            <View className='task-actions'>
              {task.status === 'pending-confirm' && (
                <View className='action-btn primary' onClick={(e) => { e.stopPropagation(); handleQuickAction(task, 'verify') }}>验收任务</View>
              )}
              {task.status === 'in-progress' && (
                <>
                  <View className='action-btn' onClick={(e) => { e.stopPropagation(); handleQuickAction(task, 'progress') }}>查看进度</View>
                  {task.studentId && (
                    <View className='action-btn' onClick={(e) => { e.stopPropagation(); handleQuickAction(task, 'chat') }}>联系学生</View>
                  )}
                </>
              )}
              {task.status === 'pending-accept' && (
                <View className='action-btn primary' onClick={(e) => { e.stopPropagation(); handleQuickAction(task, 'students') }}>查看匹配学生 (Top 3)</View>
              )}
            </View>
          </View>
        ))}

        {tasks.length === 0 && (
          <View className='empty-state'>
            <Text className='empty-text'>暂无任务</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
