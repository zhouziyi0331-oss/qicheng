import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import './completed.scss'

interface CompletedTask {
  id: string
  title: string
  company: string
  completedDate: string
  budget: number
  rating: number // 100分制
  ratingLevel: string
  avatar: string
  category: string
  level: number // 任务等级 1-6
}

export default function CompletedTasksPage() {
  const [tasks, setTasks] = useState<CompletedTask[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCompleted: 12,
    totalIncome: 8640,
    averageRating: 85
  })

  useEffect(() => {
    loadCompletedTasks()
  }, [])

  const loadCompletedTasks = async () => {
    setLoading(true)
    try {
      // 模拟数据
      const mockTasks: CompletedTask[] = [
        {
          id: '1',
          title: '为创业团队设计品牌视觉识别系统',
          company: '成功科技',
          completedDate: '7月5日',
          budget: 1200,
          rating: 95,
          ratingLevel: '优秀',
          avatar: '成',
          category: '视觉交互',
          level: 4
        },
        {
          id: '2',
          title: '撰写产品推广文案及社交媒体内容',
          company: '云端科技',
          completedDate: '6月28日',
          budget: 600,
          rating: 88,
          ratingLevel: '优秀',
          avatar: '云',
          category: '内容创作',
          level: 3
        },
        {
          id: '3',
          title: '设计用户调研问卷及分析报告',
          company: '思维咨询',
          completedDate: '6月20日',
          budget: 450,
          rating: 75,
          ratingLevel: '良好',
          avatar: '思',
          category: '系统搭建',
          level: 2
        },
        {
          id: '4',
          title: '为在线教育平台设计课程封面',
          company: '启智教育',
          completedDate: '6月15日',
          budget: 800,
          rating: 92,
          ratingLevel: '优秀',
          avatar: '启',
          category: '视觉交互',
          level: 3
        },
        {
          id: '5',
          title: '整理社区运营手册及流程文档',
          company: '创客空间',
          completedDate: '6月8日',
          budget: 500,
          rating: 68,
          ratingLevel: '及格',
          avatar: '创',
          category: '系统搭建',
          level: 1
        }
      ]
      setTasks(mockTasks)
    } catch (error) {
      console.error('加载已完成任务失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    Taro.navigateBack()
  }

  const handleTaskClick = (taskId: string) => {
    Taro.navigateTo({
      url: `/packageTask/pages/tasks/plan?id=${taskId}`
    })
  }

  const getRatingLevelColor = (level: string) => {
    switch (level) {
      case '优秀':
        return 'level-excellent'
      case '良好':
        return 'level-good'
      case '及格':
        return 'level-pass'
      default:
        return 'level-normal'
    }
  }

  const getRatingStars = (rating: number) => {
    // 100分制转换为5星: 每20分为1星
    return Math.floor(rating / 20)
  }

  return (
    <View className="completed-tasks-page">
      {/* 顶部导航 */}
      <View className="completed-header">
        <View className="header-bg" />
        <View className="header-content">
          <View className="topbar">
            <View className="back-btn" onClick={handleBack}>
              <Text className="back-icon">‹</Text>
            </View>
            <Text className="topbar-title">已完成任务</Text>
            <View className="back-btn" style={{ opacity: 0 }} />
          </View>

          {/* 汇总统计 */}
          <View className="header-stats">
            <View className="stat-item">
              <Text className="stat-value highlight">{stats.totalCompleted}</Text>
              <Text className="stat-label">完成任务</Text>
            </View>
            <View className="stat-item">
              <Text className="stat-value income">¥{stats.totalIncome}</Text>
              <Text className="stat-label">累计收入</Text>
            </View>
            <View className="stat-item">
              <Text className="stat-value rating">{stats.averageRating}</Text>
              <Text className="stat-label">平均评分</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView scrollY className="completed-scroll">
        <View className="completed-content">
          {loading ? (
            <View className="loading-state">
              <Text>加载中...</Text>
            </View>
          ) : (
            <View className="completed-list">
              {tasks.map((task, index) => (
                <View
                  key={task.id}
                  className="completed-card"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => handleTaskClick(task.id)}
                >
                  {/* 卡片头部 */}
                  <View className="card-header">
                    <View className="company-avatar">
                      <Text className="avatar-text">{task.avatar}</Text>
                    </View>
                    <View className="header-info">
                      <Text className="company-name">{task.company}</Text>
                      <Text className="completed-date">{task.completedDate} 完成</Text>
                    </View>
                    <View className="header-badges">
                      <View className="level-badge">
                        <Text className="level-text">L{task.level}</Text>
                      </View>
                      <View className="category-badge">
                        <Text className="category-text">{task.category}</Text>
                      </View>
                    </View>
                  </View>

                  {/* 任务标题 */}
                  <Text className="task-title">{task.title}</Text>

                  {/* 评分区域 */}
                  <View className="rating-section">
                    <View className="rating-display">
                      <View className="rating-circle">
                        <Text className="rating-number">{task.rating}</Text>
                      </View>
                      <View className="rating-info">
                        <View className="rating-stars">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Text
                              key={idx}
                              className={`star ${idx < getRatingStars(task.rating) ? 'filled' : 'empty'}`}
                            >
                              ★
                            </Text>
                          ))}
                        </View>
                        <View className={`rating-level-badge ${getRatingLevelColor(task.ratingLevel)}`}>
                          <Text className="level-text">{task.ratingLevel}</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* 底部收入 */}
                  <View className="card-footer">
                    <Text className="income-label">任务收入</Text>
                    <Text className="income-value">¥ {task.budget}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: '32rpx' }} />
        </View>
      </ScrollView>
    </View>
  )
}
