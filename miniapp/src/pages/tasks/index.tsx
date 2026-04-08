import { View, Text, Input, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { taskAPI } from '../../services/api'
import TaskDialog from '../../components/TaskDialog'
import './index.scss'

export default function Tasks() {
  const [matchedTasks, setMatchedTasks] = useState<any[]>([])
  const [allTasks, setAllTasks] = useState<any[]>([])
  const [searchText, setSearchText] = useState('')
  const [activeFilter, setActiveFilter] = useState('matched')
  const [dialogVisible, setDialogVisible] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 更新自定义 TabBar 选中状态
    const page = Taro.getCurrentInstance().page
    if (page && typeof page.getTabBar === 'function') {
      const tabBar = page.getTabBar()
      if (tabBar && typeof tabBar.setData === 'function') {
        tabBar.setData({ selected: 1 })
      }
    }

    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      setLoading(true)

      // 获取智能匹配任务（基于OPC标签、情绪状态、历史任务）
      const matchedRes = await taskAPI.getMatched()
      setMatchedTasks(matchedRes.tasks || [])

      // 获取全部任务
      const allRes = await taskAPI.getList({ page: 1, limit: 20 })
      setAllTasks(allRes.tasks || [])
    } catch (error) {
      console.error('加载任务失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const getDisplayTasks = () => {
    let tasks = activeFilter === 'matched' ? matchedTasks : allTasks

    // 搜索过滤
    if (searchText) {
      tasks = tasks.filter(task =>
        task.title.includes(searchText) ||
        task.description.includes(searchText) ||
        task.tags?.some((tag: string) => tag.includes(searchText))
      )
    }

    return tasks
  }

  const handleTaskClick = (task: any) => {
    // 直接跳转到任务详情页
    Taro.navigateTo({
      url: `/pages/tasks/detail?id=${task.id}`
    })
  }

  const handleAcceptTask = async () => {
    if (!selectedTask) return

    try {
      // 接取任务
      await taskAPI.accept(selectedTask.id)

      Taro.showToast({ title: '任务已接取', icon: 'success' })
      setDialogVisible(false)

      // 跳转到任务执行页面
      setTimeout(() => {
        Taro.navigateTo({ url: `/pages/tasks/working?id=${selectedTask.id}` })
      }, 1000)
    } catch (error) {
      console.error('接取任务失败:', error)
      Taro.showToast({
        title: '接取失败',
        icon: 'none'
      })
    }
  }

  const handleCancelDialog = () => {
    setDialogVisible(false)
  }

  const displayTasks = getDisplayTasks()

  return (
    <View className="tasks-page">
      {/* 搜索栏 */}
      <View className="search-bar">
        <View className="search-icon">
          <Text className="icon-text">🔍</Text>
        </View>
        <Input
          className="search-input"
          placeholder="搜索任务、标签..."
          value={searchText}
          onInput={(e) => setSearchText(e.detail.value)}
        />
      </View>

      {/* 筛选标签 */}
      <View className="filter-tabs">
        <View
          className={`filter-tab ${activeFilter === 'matched' ? 'active' : ''}`}
          onClick={() => setActiveFilter('matched')}
        >
          <Text>AI推荐</Text>
        </View>
        <View
          className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          <Text>全部任务</Text>
        </View>
      </View>

      <ScrollView scrollY className="tasks-content">
        {loading ? (
          <View className="loading-state">
            <Text>加载中...</Text>
          </View>
        ) : (
          <View className="task-list">
            {displayTasks.length > 0 ? (
              displayTasks.map(task => (
                <View
                  key={task.id}
                  className="task-card"
                  onClick={() => handleTaskClick(task)}
                >
                  {/* AI推荐标签 */}
                  {activeFilter === 'matched' && task.match_score && (
                    <View className="match-badge">
                      <Text className="match-text">匹配度 {Math.round(task.match_score * 100)}%</Text>
                    </View>
                  )}

                  {/* 任务标题 */}
                  <Text className="task-title">{task.title}</Text>

                  {/* 任务描述 */}
                  <Text className="task-desc">{task.description}</Text>

                  {/* 任务标签 */}
                  {task.tags && task.tags.length > 0 && (
                    <View className="task-tags">
                      {task.tags.map((tag: string, idx: number) => (
                        <View key={idx} className="task-tag">#{tag}</View>
                      ))}
                    </View>
                  )}

                  {/* 发布者信息 */}
                  <View className="task-publisher">
                    <View className="publisher-avatar-circle">
                      <Text className="avatar-letter">
                        {task.publisher_name ? task.publisher_name[0].toUpperCase() : 'U'}
                      </Text>
                    </View>
                    <View className="publisher-info">
                      <Text className="publisher-name">{task.publisher_name || '匿名用户'}</Text>
                      {task.publisher_rating && (
                        <View className="publisher-rating">
                          <Text className="rating-value">★ {task.publisher_rating}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* 任务底部信息 */}
                  <View className="task-footer">
                    <View className="task-price">
                      <Text className="price-label">预算</Text>
                      <Text className="price-value">¥{task.budget_net}</Text>
                    </View>
                    <View className="task-meta">
                      <Text className="meta-item">{task.deadline}</Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View className="empty-state">
                <Text className="empty-text">没有找到相关任务</Text>
                <Text className="empty-hint">试试其他关键词或筛选条件</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* 游戏化任务对话框 */}
      {selectedTask && (
        <TaskDialog
          visible={dialogVisible}
          task={{
            title: selectedTask.title,
            description: selectedTask.description,
            budget: selectedTask.budget_net,
            level: selectedTask.difficulty || '中级'
          }}
          onAccept={handleAcceptTask}
          onCancel={handleCancelDialog}
        />
      )}
    </View>
  )
}
