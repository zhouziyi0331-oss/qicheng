import { View, Text, ScrollView, Image, Button, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { storyAPI, milestoneAPI } from '../../services/api'
import Loading from '../../components/Loading'
import './index.scss'

interface Story {
  id: string
  author: {
    nickname: string
    avatar: string
    opc: string
  }
  content: string
  images: string[]
  createdAt: string
  likes: number
  comments: number
  liked: boolean
}

export default function Story() {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(false)
  const [commentingStoryId, setCommentingStoryId] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')

  useEffect(() => {
    // 更新自定义 TabBar 选中状态
    const pageInstance = Taro.getCurrentInstance().page
    if (pageInstance && typeof pageInstance.getTabBar === 'function') {
      const tabBar = pageInstance.getTabBar()
      if (tabBar && typeof tabBar.setData === 'function') {
        tabBar.setData({ selected: 2 })
      }
    }

    loadStories()
  }, [])

  const loadStories = async () => {
    try {
      setLoading(true)

      // 优先尝试从新的OPC故事墙API加载
      try {
        const opcStories = await milestoneAPI.getStoryWall()
        if (opcStories.success && opcStories.stories) {
          // 转换OPC故事墙格式到Story格式
          const formattedStories = opcStories.stories.map((s: any) => ({
            id: s.studentId,
            author: {
              nickname: s.username,
              avatar: s.avatar || s.username[0],
              opc: s.opcTag
            },
            content: s.storyText,
            images: [],
            createdAt: '最近',
            likes: 0,
            comments: 0,
            liked: false,
            currentStatus: s.currentStatus,
            level: s.level,
            completedTasks: s.completedTasks
          }))
          setStories(formattedStories)
          return
        }
      } catch (opcError) {
        console.error('OPC故事墙API失败，尝试旧API:', opcError)
      }

      // 降级到旧API
      try {
        const data = await storyAPI.getFeed(1)
        setStories(data)
      } catch (apiError) {
        console.error('API加载失败，使用模拟数据:', apiError)

        // 使用模拟数据
        const mockStories: Story[] = [
          {
            id: '1',
            author: {
              nickname: '小明',
              avatar: 'M',
              opc: 'C, E'
            },
            content: '今天完成了第一个任务，感觉很有成就感！通过这个任务，我学会了如何更好地管理时间。',
            images: [],
            createdAt: '2小时前',
            likes: 12,
            comments: 3,
            liked: false
          },
          {
            id: '2',
            author: {
              nickname: '小红',
              avatar: 'H',
              opc: 'O, P'
            },
            content: '分享一下我的成长心得：坚持每天进步一点点，就能看到巨大的变化。',
            images: [],
            createdAt: '5小时前',
            likes: 28,
            comments: 7,
            liked: false
          }
        ]
        setStories(mockStories)
      }
    } catch (err: any) {
      console.error('加载故事失败:', err)
      // 静默失败，不显示错误提示
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (storyId: string) => {
    try {
      // 乐观更新UI
      setStories(prev => prev.map(story =>
        story.id === storyId
          ? { ...story, liked: !story.liked, likes: story.liked ? story.likes - 1 : story.likes + 1 }
          : story
      ))

      // 调用API
      await storyAPI.like(storyId)
      Taro.vibrateShort()
    } catch (err: any) {
      // 失败时回滚
      setStories(prev => prev.map(story =>
        story.id === storyId
          ? { ...story, liked: !story.liked, likes: story.liked ? story.likes - 1 : story.likes + 1 }
          : story
      ))
      Taro.showToast({
        title: err.message || '操作失败',
        icon: 'none'
      })
    }
  }

  const handleCommentClick = (storyId: string) => {
    setCommentingStoryId(storyId)
    setCommentText('')
  }

  const handleCommentSubmit = async (storyId: string) => {
    if (!commentText.trim()) {
      Taro.showToast({ title: '请输入评论内容', icon: 'none' })
      return
    }

    try {
      await storyAPI.comment(storyId, commentText.trim())

      // 更新评论数
      setStories(prev => prev.map(story =>
        story.id === storyId
          ? { ...story, comments: story.comments + 1 }
          : story
      ))

      setCommentingStoryId(null)
      setCommentText('')
      Taro.showToast({ title: '评论成功', icon: 'success' })
    } catch (err: any) {
      Taro.showToast({
        title: err.message || '评论失败',
        icon: 'none'
      })
    }
  }

  const handleCancelComment = () => {
    setCommentingStoryId(null)
    setCommentText('')
  }

  const handleShare = (storyId: string) => {
    Taro.showShareMenu({
      withShareTicket: true
    })
  }

  const handlePost = () => {
    Taro.navigateTo({ url: '/pages/story/post' })
  }

  const handleStoryDetail = (storyId: string) => {
    // 如果正在评论，不跳转详情
    if (commentingStoryId === storyId) {
      return
    }
    Taro.showToast({
      title: '故事详情开发中',
      icon: 'none'
    })
  }

  return (
    <View className="story-page">
      {/* 头部装饰 */}
      <View className="story-header">
        <View className="header-decoration">
          <View className="decoration-circle decoration-1"></View>
          <View className="decoration-circle decoration-2"></View>
        </View>
        <View className="header-content">
          <Text className="story-title">故事墙</Text>
          <Text className="story-subtitle">分享你的成长故事</Text>
        </View>
        <Button className="post-button" onClick={handlePost}>
          <Text className="post-text">发布</Text>
        </Button>
      </View>

      {/* 故事列表 */}
      <ScrollView scrollY className="story-list">
        {loading ? (
          <Loading text="正在加载故事墙..." />
        ) : stories.length === 0 ? (
          <View className="empty-state">
            <Text className="empty-icon">📖</Text>
            <Text className="empty-text">还没有故事</Text>
            <Button className="empty-btn" onClick={handlePost}>
              发布第一个故事
            </Button>
          </View>
        ) : (
          <>
            {stories.map(story => (
              <View key={story.id} className="story-card" onClick={() => handleStoryDetail(story.id)}>
                {/* 用户信息 */}
                <View className="story-user">
                  <View className="user-avatar-circle">
                    <Text className="avatar-letter">{story.author.avatar}</Text>
                  </View>
                  <View className="user-info">
                    <Text className="user-name">{story.author.nickname}</Text>
                    <View className="user-meta">
                      <View className="user-opc">
                        <Text className="opc-text">{story.author.opc}</Text>
                      </View>
                      <Text className="story-time">{story.createdAt}</Text>
                    </View>
                  </View>
                </View>

                {/* 故事内容 */}
                <Text className="story-content">{story.content}</Text>

                {/* 图片 */}
                {story.images && story.images.length > 0 && (
                  <View className="story-images">
                    {story.images.map((img, idx) => (
                      <Image key={idx} src={img} className="story-image" mode="aspectFill" />
                    ))}
                  </View>
                )}

                {/* 互动区域 */}
                <View className="story-actions">
                  <View
                    className={`action-item ${story.liked ? 'liked' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleLike(story.id)
                    }}
                  >
                    <Text className="action-text">{story.liked ? '已赞' : '点赞'} {story.likes}</Text>
                  </View>

                  <View
                    className="action-item"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCommentClick(story.id)
                    }}
                  >
                    <Text className="action-text">评论 {story.comments}</Text>
                  </View>

                  <View
                    className="action-item"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleShare(story.id)
                    }}
                  >
                    <Text className="action-text">分享</Text>
                  </View>
                </View>

                {/* 评论输入框 */}
                {commentingStoryId === story.id && (
                  <View className="comment-input-wrapper" onClick={(e) => e.stopPropagation()}>
                    <Input
                      className="comment-input"
                      placeholder="写下你的评论..."
                      value={commentText}
                      onInput={(e) => setCommentText(e.detail.value)}
                      focus
                    />
                    <View className="comment-actions">
                      <Button className="comment-cancel" onClick={handleCancelComment}>
                        取消
                      </Button>
                      <Button className="comment-submit" onClick={() => handleCommentSubmit(story.id)}>
                        发送
                      </Button>
                    </View>
                  </View>
                )}
              </View>
            ))}

            {/* 底部提示 */}
            <View className="story-footer">
              <Text className="footer-text">✨ 已经到底啦 ✨</Text>
              <Text className="footer-hint">快去发布你的故事吧</Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}
