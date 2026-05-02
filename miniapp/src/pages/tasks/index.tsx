import { View, Text, Input, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { taskAPI } from '../../services/api'
import { CONTENT_TRACK_LEVELS, TaskTrack, TaskLevel } from '../../types/task'
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
    try {
      const page = Taro.getCurrentInstance().page
      if (page && typeof page.getTabBar === 'function') {
        const tabBar = page.getTabBar()
        if (tabBar && typeof tabBar.setData === 'function') {
          tabBar.setData({ selected: 1 })
        }
      }
    } catch (error) {
      console.log('TabBar更新失败:', error)
    }

    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      setLoading(true)

      // 模拟数据（包含赛道和等级信息）
      const mockTasks = [
        {
          id: 1,
          title: 'AI生成品牌宣传海报',
          description: '使用AI工具为新产品生成3张不同风格的宣传海报，要求风格统一、色彩协调',
          track: 'content' as TaskTrack,
          level: 0 as TaskLevel,
          tags: ['AI绘图', 'Midjourney', '平面设计'],
          budget_net: 150,
          budgetRange: '100-200元',
          deadline: '3天后',
          duration: '2-3小时',
          publisher_name: '创意工作室A',
          publisher_rating: 4.8,
          match_score: 95,
          matchReason: '你的创造性很高，适合这类创意任务',
          difficultyAssessment: '简单',
          growthValue: '提升AI绘图能力 +5'
        },
        {
          id: 2,
          title: '制作产品介绍短视频',
          description: '使用AI工具制作一个30秒的产品介绍短视频，包含配音和字幕',
          track: 'content' as TaskTrack,
          level: 1 as TaskLevel,
          tags: ['AI视频', '剪映', '内容创作'],
          budget_net: 500,
          budgetRange: '400-600元',
          deadline: '5天后',
          duration: '1天',
          publisher_name: '电商品牌B',
          publisher_rating: 4.9,
          match_score: 88,
          matchReason: '你已完成2个Lv.0任务，可以尝试Lv.1挑战',
          difficultyAssessment: '适中',
          growthValue: '提升视频制作能力 +10'
        },
        {
          id: 3,
          title: '开发简单的AI问答小程序',
          description: '使用AI辅助开发一个简单的问答小程序，实现基础的对话功能',
          track: 'tool' as TaskTrack,
          level: 1 as TaskLevel,
          tags: ['小程序开发', 'AI编程', 'JavaScript'],
          budget_net: 600,
          budgetRange: '500-800元',
          deadline: '7天后',
          duration: '2-3天',
          publisher_name: '科技公司C',
          publisher_rating: 4.7,
          match_score: 82,
          matchReason: '探索新赛道：AI工具开发，拓展技能树',
          difficultyAssessment: '有挑战',
          growthValue: '开启工具开发赛道',
          is_stretch_project: true
        },
        {
          id: 4,
          title: 'AI生成系列表情包',
          description: '使用AI工具生成一套10个表情包，风格可爱，适合社交媒体使用',
          track: 'content' as TaskTrack,
          level: 0 as TaskLevel,
          tags: ['AI绘图', '表情包', '创意设计'],
          budget_net: 120,
          budgetRange: '100-150元',
          deadline: '2天后',
          duration: '1-2小时',
          publisher_name: '自媒体工作室D',
          publisher_rating: 4.6,
          match_score: 90,
          matchReason: '轻松的入门任务，快速积累经验',
          difficultyAssessment: '简单',
          growthValue: '提升创意表达 +3'
        }
      ]

      // 获取推荐任务（基于OPC匹配）
      try {
        const matchedRes = await taskAPI.getRecommended()
        if (matchedRes.success && matchedRes.data) {
          setMatchedTasks(matchedRes.data)
        } else {
          setMatchedTasks(mockTasks)
        }
      } catch (matchError) {
        console.error('获取推荐任务失败，使用模拟数据:', matchError)
        setMatchedTasks(mockTasks)
      }

      // 获取全部任务（任务市场）
      try {
        const allRes = await taskAPI.getList({ page: 1, limit: 20 })
        if (allRes.success && allRes.data) {
          setAllTasks(allRes.data)
        } else {
          setAllTasks(mockTasks)
        }
      } catch (error) {
        console.error('获取任务市场失败，使用模拟数据:', error)
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
                  {/* 赛道和等级标签 */}
                  {task.track && task.level !== undefined && (
                    <View className="task-level-badge">
                      <Text className="level-track">{getTrackName(task.track)}</Text>
                      <Text className="level-name">{getLevelInfo(task.level, task.track).name}</Text>
                    </View>
                  )}

                  {/* AI推荐标签 */}
                  {activeFilter === 'matched' && task.match_score && (
                    <View className="match-badge">
                      <Text className="match-text">匹配度 {task.match_score}%</Text>
                    </View>
                  )}

                  {/* 冒险项目标签 */}
                  {task.is_stretch_project && (
                    <View className="stretch-badge">
                      <Text className="stretch-text">🌟 探索项目 - 这条河你没走过，要不要试试？</Text>
                    </View>
                  )}

                  {/* 任务标题 */}
                  <Text className="task-title">{task.title}</Text>

                  {/* 任务描述 */}
                  <Text className="task-desc">{task.description}</Text>

                  {/* 匹配理由和成长价值 */}
                  {activeFilter === 'matched' && (task.matchReason || task.growthValue) && (
                    <View className="match-info">
                      {task.matchReason && (
                        <Text className="match-reason">💡 {task.matchReason}</Text>
                      )}
                      {task.growthValue && (
                        <Text className="growth-value">📈 {task.growthValue}</Text>
                      )}
                    </View>
                  )}

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
                      <Text className="meta-item">⏰ {task.deadline}</Text>
                      {task.duration && (
                        <Text className="meta-item">⏱ {task.duration}</Text>
                      )}
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
