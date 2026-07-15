import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState } from 'react'
import './index.scss'

interface SubTask {
  id: number
  name: string
  desc: string
  xp: number
  status: 'done' | 'active' | 'locked'
  progress?: number
}

const SUB_TASKS: SubTask[] = [
  { id: 1, name: 'AI 短视频脚本创作', desc: '用 AI 工具生成 3 条不同风格的短视频脚本', xp: 120, status: 'done' },
  { id: 2, name: 'AI 视频素材生成', desc: '使用 AI 生成工具制作 5 组视频素材', xp: 150, status: 'done' },
  { id: 3, name: '品牌宣传内容策划', desc: '为一个真实品牌策划完整的内容推广方案', xp: 200, status: 'active', progress: 60 },
  { id: 4, name: '长篇内容创作发布', desc: '在任意平台发布一篇完整的内容作品', xp: 180, status: 'locked' },
  { id: 5, name: 'Lv.4 综合测试', desc: '完成所有任务后参加综合能力测试', xp: 350, status: 'locked' }
]

export default function SkipLevelProgress() {
  const router = useRouter()
  const { level } = router.params
  const targetLevel = parseInt(level || '4')

  const [fromLevel] = useState(3)
  const [toLevel] = useState(targetLevel)
  const [trackName] = useState('内容创作赛道')
  const [daysLeft] = useState(4)
  const [totalProgress] = useState(40)
  const [completedTasks] = useState(2)
  const [totalTasks] = useState(5)

  const handleSubmitWork = () => {
    Taro.showActionSheet({
      itemList: ['上传截图', '提交链接'],
      success: (res) => {
        if (res.tapIndex === 0) {
          Taro.chooseImage({
            count: 9,
            success: () => {
              Taro.showToast({ title: '上传成功', icon: 'success' })
            }
          })
        } else {
          Taro.showModal({
            title: '提交作品链接',
            editable: true,
            placeholderText: '请输入作品链接',
            success: (res) => {
              if (res.confirm) {
                Taro.showToast({ title: '提交成功', icon: 'success' })
              }
            }
          })
        }
      }
    })
  }

  const handleSubmitForReview = () => {
    Taro.showModal({
      title: '提交全部作品',
      content: '确认提交后，导师将在1-3个工作日内完成评审',
      success: (res) => {
        if (res.confirm) {
          Taro.navigateTo({
            url: `/packageGrowth/pages/skip-level-score/index?level=${toLevel}`
          })
        }
      }
    })
  }

  return (
    <View className="skip-progress-page">
      {/* 顶部状态 */}
      <View className="progress-hero">
        <View className="hero-glow-1" />
        <View className="hero-glow-2" />

        <View className="status-row">
          <View className="status-badge">
            <Text className="badge-icon">●</Text>
            <Text className="badge-text">进行中</Text>
          </View>
          <View className="deadline">
            <Text className="deadline-icon">●</Text>
            <Text className="deadline-text">剩余 {daysLeft} 天</Text>
          </View>
        </View>

        <View className="level-row">
          <View className="level-from">
            <Text className="level-num">{fromLevel}</Text>
          </View>
          <View className="level-arrow" />
          <View className="level-to">
            <Text className="level-num">{toLevel}</Text>
          </View>
          <View style={{ flex: 1 }} />
          <View className="tag tag-rust">
            <Text className="tag-text">{trackName}</Text>
          </View>
        </View>

        <Text className="progress-title">Lv.{toLevel} 实践者 · 跳级挑战</Text>
        <Text className="progress-subtitle">完成以下任务清单，即可申请评分</Text>

        <View className="progress-bar-wrap">
          <View className="progress-bar-label">
            <Text className="label-text">总进度</Text>
            <Text className="label-percent">{totalProgress}%</Text>
          </View>
          <View className="progress-bar-track">
            <View className="progress-bar-fill" style={{ width: `${totalProgress}%` }} />
          </View>
        </View>
      </View>

      <ScrollView className="progress-scroll" scrollY>
        <View className="progress-body">
          {/* 赛道标识 */}
          <View className="track-badge-row">
            <View className="track-icon">
              <Text className="icon-text">▲</Text>
            </View>
            <Text className="track-name">{trackName} · Lv.{toLevel} 挑战任务</Text>
            <View className="track-tag">
              <Text className="tag-text">Lv.{toLevel}</Text>
            </View>
          </View>

          {/* 任务清单标题 */}
          <View className="section-header">
            <Text className="section-icon">●</Text>
            <Text className="section-title">{trackName} · Lv.{toLevel} 任务清单</Text>
            <Text className="section-count">{completedTasks}/{totalTasks} 已完成</Text>
          </View>

          {/* 任务卡片列表 */}
          <View className="tasks-list">
            {SUB_TASKS.map(task => (
              <View
                key={task.id}
                className={`task-card ${task.status}`}
              >
                <View className="task-header">
                  <View className={`task-check ${task.status}`}>
                    {task.status === 'done' && <Text className="check-icon">✓</Text>}
                    {task.status === 'active' && <Text className="check-icon">●</Text>}
                    {task.status === 'locked' && <Text className="check-icon">○</Text>}
                  </View>
                  <View className="task-info">
                    <Text className="task-name">{task.name}</Text>
                    <Text className="task-desc">{task.desc}</Text>
                  </View>
                  <Text className="task-xp">+{task.xp} XP</Text>
                </View>

                {task.status === 'active' && task.progress && (
                  <View className="task-progress-bar">
                    <View className="progress-track">
                      <View className="progress-fill" style={{ width: `${task.progress}%` }} />
                    </View>
                    <Text className="progress-text">{task.progress}%</Text>
                  </View>
                )}

                <View className="task-footer">
                  {task.status === 'done' && (
                    <>
                      <View className="tag tag-mist">
                        <Text className="tag-text">已完成</Text>
                      </View>
                      <Text className="task-time">2天前提交</Text>
                    </>
                  )}
                  {task.status === 'active' && (
                    <>
                      <View className="tag tag-terra">
                        <Text className="tag-text">进行中</Text>
                      </View>
                      <View className="btn-continue" onClick={handleSubmitWork}>
                        <Text className="btn-text">继续完成</Text>
                      </View>
                    </>
                  )}
                  {task.status === 'locked' && (
                    <>
                      <View className="tag tag-sand">
                        <Text className="tag-text">待解锁</Text>
                      </View>
                      <Text className="task-time">完成上一项后解锁</Text>
                    </>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* 提交区 */}
          <View className="submit-card">
            <View className="submit-header">
              <Text className="submit-icon">▲</Text>
              <Text className="submit-title">上传作品</Text>
            </View>
            <Text className="submit-desc">完成所有任务后，上传相关截图，导师将在 1-3 个工作日内完成评审。</Text>
            <View className="upload-area" onClick={handleSubmitWork}>
              <Text className="upload-icon">●</Text>
              <Text className="upload-text">上传截图 / 作品链接</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 底部按钮 */}
      <View className="progress-footer">
        <View className="btn-primary" onClick={handleSubmitForReview}>
          <Text className="btn-text">提交全部作品，申请评分</Text>
        </View>
      </View>
    </View>
  )
}
