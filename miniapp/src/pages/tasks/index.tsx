import { View, Text, Input, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { taskAPI, matchAPI } from '../../services/api'
import TaskDialog from '../../components/TaskDialog'
import Loading from '../../components/Loading'
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

      // 模拟数据（开发模式）
      const mockTasks = [
        {
          id: 1,
          title: '设计一个小程序首页UI',
          description: '需要设计一个简洁美观的小程序首页，包含导航、轮播图、功能入口等模块',
          tags: ['UI设计', '小程序', '创意'],
          budget_net: 500,
          deadline: '3天后',
          publisher_name: '创业公司A',
          publisher_rating: 4.8,
          match_score: 95
        },
        {
          id: 2,
          title: '编写Python数据分析脚本',
          description: '需要编写一个Python脚本，用于分析CSV格式的销售数据，生成可视化图表',
          tags: ['Python', '数据分析', '编程'],
          budget_net: 800,
          deadline: '5天后',
          publisher_name: '电商平台B',
          publisher_rating: 4.9,
          match_score: 88
        },
        {
          id: 3,
          title: '撰写产品推广文案',
          description: '为新产品撰写推广文案，包括产品介绍、卖点提炼、用户痛点分析等',
          tags: ['文案', '营销', '创意'],
          budget_net: 300,
          deadline: '2天后',
          publisher_name: '品牌公司C',
          publisher_rating: 4.7,
          match_score: 82
        }
      ]

      const user = Taro.getStorageSync('user')

      try {
        if (user && user.id) {
          // 尝试使用真实API
          try {
            const matchedRes = await matchAPI.getMatchedTasks(user.id, 20)
            setMatchedTasks(matchedRes.tasks || [])
          } catch (matchError) {
            console.error('OPC匹配API失败，使用模拟数据:', matchError)
            setMatchedTasks(mockTasks)
          }
        } else {
          setMatchedTasks(mockTasks)
        }

        // 获取全部任务
        try {
          const allRes = await taskAPI.getList({ page: 1, limit: 20 })
          setAllTasks(allRes.tasks || [])
        } catch (error) {
          console.error('获取全部任务失败，使用模拟数据:', error)
          setAllTasks(mockTasks)
        }
      } catch (error) {
        console.error('加载任务失败，使用模拟数据:', error)
        setMatchedTasks(mockTasks)
        setAllTasks(mockTasks)
      }
    } catch (error) {
      console.error('加载任务失败:', error)
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
          <Text>你可能感兴趣的河道</Text>
        </View>
        <View
          className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          <Text>探索更多</Text>
        </View>
      </View>

      <ScrollView scrollY className="tasks-content">
        {loading ? (
          <Loading text="正在加载任务..." />
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
                      <Text className="match-text">这个项目可能让你发现自己</Text>
                    </View>
                  )}

                  {/* 冒险项目标签 */}
                  {task.is_stretch_project && (
                    <View className="stretch-badge">
                      <Text className="stretch-text">探索项目 - 这条河你没走过，要不要试试？</Text>
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
                <Text className="empty-text">暂时没有适合你的项目</Text>
                <Text className="empty-hint">试试探索更多，或者完善你的OPC画像，让我们更了解你</Text>
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
