import { View, Text, Input, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { taskAPI } from '../../services/api'
import { CONTENT_TRACK_LEVELS, TaskTrack, TaskLevel } from '../../types/task'
import TaskDialog from '../../components/TaskDialog'
import Loading from '../../components/Loading'
import Empty from '../../components/Empty'
import toast from '../../utils/toast'
import './index.scss'

export default function Tasks() {
  const [matchedTasks, setMatchedTasks] = useState<any[]>([])
  const [allTasks, setAllTasks] = useState<any[]>([])
  const [searchText, setSearchText] = useState('')
  const [activeFilter, setActiveFilter] = useState('matched')
  const [dialogVisible, setDialogVisible] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [studentLevel, setStudentLevel] = useState(0)
  const [studentTrack, setStudentTrack] = useState('content')
  const [allowedDifficulties, setAllowedDifficulties] = useState<number[]>([1])

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

      // 获取推荐任务（基于等级过滤）
      try {
        const matchedRes = await taskAPI.getMatched()
        if (matchedRes.success && matchedRes.data) {
          setMatchedTasks(matchedRes.data)
          // 保存学生等级信息
          if (matchedRes.studentLevel !== undefined) {
            setStudentLevel(matchedRes.studentLevel)
          }
          if (matchedRes.studentTrack) {
            setStudentTrack(matchedRes.studentTrack)
          }
          if (matchedRes.allowedDifficulties) {
            setAllowedDifficulties(matchedRes.allowedDifficulties)
          }
        }
      } catch (matchError) {
        console.error('获取推荐任务失败:', matchError)
        Taro.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        })
      }

      // 获取全部任务（任务市场）
      try {
        const allRes = await taskAPI.getList({ page: 1, limit: 20 })
        if (allRes.success && allRes.data) {
          setAllTasks(allRes.data)
        }
      } catch (error) {
        console.error('获取任务市场失败:', error)
      }
    } catch (error) {
      console.error('加载任务失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDisplayTasks = () => {
    let tasks = activeFilter === 'matched' ? matchedTasks : allTasks

    // 赛道过滤（只显示学生选择赛道的任务）
    if (studentTrack && activeFilter === 'all') {
      tasks = tasks.filter(task =>
        !task.track || task.track === studentTrack || task.track === 'both'
      )
    }

    // 等级过滤（只显示符合等级的任务 + 挑战项目）
    if (studentLevel !== undefined && activeFilter === 'all') {
      tasks = tasks.filter(task => {
        if (!task.level && !task.required_level) return true
        const taskLevel = task.required_level || task.level || 0
        // 显示当前等级及以下的任务，以及高一级的挑战项目
        return taskLevel <= studentLevel + 1
      })
    }

    // 标记挑战项目（高一级项目）
    tasks = tasks.map(task => {
      const taskLevel = task.required_level || task.level || 0
      const isChallenge = taskLevel === studentLevel + 1
      return {
        ...task,
        is_challenge: isChallenge,
        is_stretch_project: task.is_stretch_project || isChallenge
      }
    })

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
    // 检查等级权限
    const taskLevel = task.required_level || task.level || 0
    if (taskLevel > studentLevel + 1) {
      toast.warning(`此任务需要 Lv.${taskLevel}，当前等级不足`)
      return
    }

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

      {/* 等级过滤提示 */}
      {activeFilter === 'matched' && studentLevel !== undefined && (
        <View className="level-filter-tip">
          <View className="tip-icon">ℹ️</View>
          <Text className="tip-text">
            当前等级 Lv.{studentLevel} ({studentTrack === 'content' ? 'AI内容创作' : 'AI工具开发'})，
            为你推荐难度 {allowedDifficulties.join(', ')} 的任务
          </Text>
        </View>
      )}

      {/* 赛道过滤提示 */}
      {activeFilter === 'all' && studentTrack && (
        <View className="level-filter-tip">
          <View className="tip-icon">🎯</View>
          <Text className="tip-text">
            只显示 {studentTrack === 'content' ? 'AI内容创作' : 'AI工具开发'} 赛道的任务
            （Lv.{studentLevel} 及以下 + 挑战项目）
          </Text>
        </View>
      )}

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

                  {/* 挑战项目标签 */}
                  {task.is_challenge && !task.is_stretch_project && (
                    <View className="challenge-badge">
                      <Text className="challenge-text">🔥 挑战项目 - 高一级任务，完成可快速升级</Text>
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
                        <Text className="match-reason">💡 推荐理由：{task.matchReason}</Text>
                      )}
                      {task.growthValue && (
                        <Text className="growth-value">📈 成长价值：{task.growthValue}</Text>
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
              <Empty
                icon={activeFilter === 'matched' ? '🎯' : '🔍'}
                text={activeFilter === 'matched' ? '暂时没有适合你的推荐任务' : '没有找到相关任务'}
                hint={activeFilter === 'matched'
                  ? '试试探索更多，或者完善你的OPC画像，让我们更了解你'
                  : '试试调整搜索关键词，或者查看推荐任务'}
              />
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
