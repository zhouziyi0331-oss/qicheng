import { View, Text, ScrollView, Image, Button, Textarea } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import './post-detail.scss'

interface Comment {
  id: string
  author: {
    id: string
    name: string
    avatar: string
    level: number
  }
  content: string
  createdAt: string
  likeCount: number
  liked: boolean
  replies?: Comment[]
}

interface PostDetail {
  id: string
  type: 'recruit' | 'share' | 'help'
  title: string
  content: string
  author: {
    id: string
    name: string
    avatar: string
    level: number
    levelName: string
    tags: string[]
    rating: number
  }
  createdAt: string
  viewCount: number
  commentCount: number
  likeCount: number
  liked: boolean
  recruitInfo?: {
    projectSource: string
    mySkills: string[]
    neededSkills: Array<{ skill: string; required: boolean }>
    currentMembers: Array<{
      id: string
      name: string
      avatar: string
      level: number
      skills: string[]
    }>
    totalMembers: number
    duration: string
    profitShare: string
    status: 'recruiting' | 'full'
  }
  comments: Comment[]
}

export default function PostDetail() {
  const router = useRouter()
  const { id } = router.params
  const [post, setPost] = useState<PostDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [userLevel, setUserLevel] = useState(0)
  const [commentText, setCommentText] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [applyMessage, setApplyMessage] = useState('')

  useEffect(() => {
    loadUserLevel()
    loadPostDetail()
  }, [id])

  const loadUserLevel = async () => {
    try {
      const token = Taro.getStorageSync('token')
      const res = await Taro.request({
        url: '/api/v1/user/profile',
        method: 'GET',
        header: { 'Authorization': `Bearer ${token}` }
      })

      if (res.data.success) {
        setUserLevel(res.data.data.current_level || 0)
      }
    } catch (error) {
      console.error('加载用户等级失败:', error)
      setUserLevel(4)
    }
  }

  const loadPostDetail = async () => {
    setLoading(true)
    try {
      const token = Taro.getStorageSync('token')
      const res = await Taro.request({
        url: `/api/v1/community/posts/${id}`,
        method: 'GET',
        header: { 'Authorization': `Bearer ${token}` }
      })

      if (res.data.success) {
        setPost(res.data.data)
      } else {
        throw new Error('加载失败')
      }
    } catch (error) {
      console.error('加载帖子详情失败:', error)

      // 模拟数据
      const mockPost: PostDetail = {
        id: id || '1',
        type: 'recruit',
        title: '招募前端开发，一起做电商小程序',
        content: '我有一个电商小程序项目，需要一位前端开发伙伴。\n\n项目背景：这是一个面向年轻人的潮流电商平台，主要销售服装和配饰。\n\n我负责的部分：UI设计、产品规划、后端API已完成。\n\n你需要做的：使用Taro框架开发小程序前端，对接已有的API，实现商品展示、购物车、订单等功能。\n\n预计工作量：2周左右完成MVP版本。',
        author: {
          id: 'u1',
          name: '张小明',
          avatar: 'https://via.placeholder.com/100',
          level: 5,
          levelName: '河行者',
          tags: ['UI设计', '产品思维'],
          rating: 4.8
        },
        createdAt: '2026-05-27T10:30:00Z',
        viewCount: 128,
        commentCount: 15,
        likeCount: 23,
        liked: false,
        recruitInfo: {
          projectSource: '平台订单',
          mySkills: ['UI设计', '产品规划'],
          neededSkills: [
            { skill: 'React', required: true },
            { skill: 'Taro', required: true },
            { skill: 'TypeScript', required: false }
          ],
          currentMembers: [
            {
              id: 'u1',
              name: '张小明',
              avatar: 'https://via.placeholder.com/100',
              level: 5,
              skills: ['UI设计', '产品规划']
            }
          ],
          totalMembers: 2,
          duration: '2周',
          profitShare: '5:5分润',
          status: 'recruiting'
        },
        comments: [
          {
            id: 'c1',
            author: {
              id: 'u2',
              name: '李华',
              avatar: 'https://via.placeholder.com/100',
              level: 4
            },
            content: '项目看起来不错，我对Taro比较熟悉，可以聊聊吗？',
            createdAt: '2026-05-27T11:00:00Z',
            likeCount: 5,
            liked: false,
            replies: [
              {
                id: 'c1-1',
                author: {
                  id: 'u1',
                  name: '张小明',
                  avatar: 'https://via.placeholder.com/100',
                  level: 5
                },
                content: '好的，可以私信我详细聊',
                createdAt: '2026-05-27T11:15:00Z',
                likeCount: 2,
                liked: false
              }
            ]
          }
        ]
      }

      setPost(mockPost)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!post) return

    try {
      const token = Taro.getStorageSync('token')
      await Taro.request({
        url: `/api/v1/community/posts/${post.id}/like`,
        method: 'POST',
        header: { 'Authorization': `Bearer ${token}` }
      })

      setPost({
        ...post,
        liked: !post.liked,
        likeCount: post.liked ? post.likeCount - 1 : post.likeCount + 1
      })
    } catch (error) {
      console.error('点赞失败:', error)
    }
  }

  const handleCommentLike = async (commentId: string) => {
    if (!post) return

    try {
      const token = Taro.getStorageSync('token')
      await Taro.request({
        url: `/api/v1/community/comments/${commentId}/like`,
        method: 'POST',
        header: { 'Authorization': `Bearer ${token}` }
      })

      // 更新评论点赞状态
      const updateComments = (comments: Comment[]): Comment[] => {
        return comments.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              liked: !comment.liked,
              likeCount: comment.liked ? comment.likeCount - 1 : comment.likeCount + 1
            }
          }
          if (comment.replies) {
            return {
              ...comment,
              replies: updateComments(comment.replies)
            }
          }
          return comment
        })
      }

      setPost({
        ...post,
        comments: updateComments(post.comments)
      })
    } catch (error) {
      console.error('点赞评论失败:', error)
    }
  }

  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      Taro.showToast({
        title: '请输入评论内容',
        icon: 'none'
      })
      return
    }

    if (userLevel < 2) {
      Taro.showToast({
        title: '达到Lv.2后解锁评论',
        icon: 'none'
      })
      return
    }

    try {
      const token = Taro.getStorageSync('token')
      await Taro.request({
        url: `/api/v1/community/posts/${post?.id}/comments`,
        method: 'POST',
        header: { 'Authorization': `Bearer ${token}` },
        data: {
          content: commentText,
          parentId: replyingTo
        }
      })

      Taro.showToast({
        title: '评论成功',
        icon: 'success'
      })

      setCommentText('')
      setReplyingTo(null)
      loadPostDetail()
    } catch (error) {
      console.error('评论失败:', error)
      Taro.showToast({
        title: '评论失败',
        icon: 'none'
      })
    }
  }

  const handleApply = () => {
    if (userLevel < 5) {
      Taro.showToast({
        title: '达到Lv.5后可申请加入队伍',
        icon: 'none'
      })
      return
    }

    setShowApplyModal(true)
  }

  const submitApply = async () => {
    if (!applyMessage.trim()) {
      Taro.showToast({
        title: '请填写申请留言',
        icon: 'none'
      })
      return
    }

    try {
      const token = Taro.getStorageSync('token')
      await Taro.request({
        url: `/api/v1/community/posts/${post?.id}/apply`,
        method: 'POST',
        header: { 'Authorization': `Bearer ${token}` },
        data: {
          message: applyMessage
        }
      })

      Taro.showToast({
        title: '申请已提交',
        icon: 'success'
      })

      setShowApplyModal(false)
      setApplyMessage('')
    } catch (error) {
      console.error('申请失败:', error)
      Taro.showToast({
        title: '申请失败',
        icon: 'none'
      })
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString('zh-CN')
  }

  if (loading) {
    return (
      <View className="post-detail-page">
        <View className="loading-state">
          <Text className="loading-text">加载中...</Text>
        </View>
      </View>
    )
  }

  if (!post) {
    return (
      <View className="post-detail-page">
        <View className="empty-state">
          <Text className="empty-text">帖子不存在</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="post-detail-page">
      <ScrollView className="content-scroll" scrollY>
        {/* 帖子内容 */}
        <View className="post-content">
          <Text className="post-title">{post.title}</Text>

          <View className="author-section">
            <Image className="author-avatar" src={post.author.avatar} />
            <View className="author-info">
              <View className="author-name-row">
                <Text className="author-name">{post.author.name}</Text>
                <Text className="author-level">Lv.{post.author.level}</Text>
              </View>
              <View className="author-meta">
                <Text className="author-rating">⭐ {post.author.rating}</Text>
                <Text className="post-time">{formatTime(post.createdAt)}</Text>
              </View>
            </View>
          </View>

          <View className="author-tags">
            {post.author.tags.map((tag, index) => (
              <Text key={index} className="author-tag">{tag}</Text>
            ))}
          </View>

          <Text className="post-text">{post.content}</Text>

          <View className="post-stats">
            <Text className="stat-item">👁️ {post.viewCount}</Text>
            <Text className="stat-item">💬 {post.commentCount}</Text>
            <Text className="stat-item" onClick={handleLike}>
              {post.liked ? '❤️' : '🤍'} {post.likeCount}
            </Text>
          </View>
        </View>

        {/* 招募详情 */}
        {post.recruitInfo && (
          <View className="recruit-section">
            <Text className="section-title">队伍信息</Text>

            <View className="recruit-detail">
              <View className="detail-item">
                <Text className="detail-label">项目来源</Text>
                <Text className="detail-value">{post.recruitInfo.projectSource}</Text>
              </View>
              <View className="detail-item">
                <Text className="detail-label">预计周期</Text>
                <Text className="detail-value">{post.recruitInfo.duration}</Text>
              </View>
              <View className="detail-item">
                <Text className="detail-label">分润方式</Text>
                <Text className="detail-value">{post.recruitInfo.profitShare}</Text>
              </View>
            </View>

            <Text className="section-subtitle">当前成员 ({post.recruitInfo.currentMembers.length}/{post.recruitInfo.totalMembers})</Text>
            <View className="members-list">
              {post.recruitInfo.currentMembers.map(member => (
                <View key={member.id} className="member-card">
                  <Image className="member-avatar" src={member.avatar} />
                  <View className="member-info">
                    <Text className="member-name">{member.name}</Text>
                    <Text className="member-level">Lv.{member.level}</Text>
                    <View className="member-skills">
                      {member.skills.map((skill, index) => (
                        <Text key={index} className="skill-tag">{skill}</Text>
                      ))}
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {post.recruitInfo.status === 'recruiting' && (
              <Button className="apply-btn" onClick={handleApply}>
                <Text className="btn-text">申请加入</Text>
              </Button>
            )}

            {post.recruitInfo.status === 'full' && (
              <View className="full-notice">
                <Text className="full-text">队伍已满</Text>
              </View>
            )}
          </View>
        )}

        {/* 评论区 */}
        <View className="comments-section">
          <Text className="section-title">评论 ({post.commentCount})</Text>

          {post.comments.length === 0 ? (
            <View className="empty-comments">
              <Text className="empty-text">暂无评论，来抢沙发吧</Text>
            </View>
          ) : (
            <View className="comments-list">
              {post.comments.map(comment => (
                <View key={comment.id} className="comment-item">
                  <Image className="comment-avatar" src={comment.author.avatar} />
                  <View className="comment-content">
                    <View className="comment-header">
                      <Text className="comment-author">{comment.author.name}</Text>
                      <Text className="comment-level">Lv.{comment.author.level}</Text>
                    </View>
                    <Text className="comment-text">{comment.content}</Text>
                    <View className="comment-footer">
                      <Text className="comment-time">{formatTime(comment.createdAt)}</Text>
                      <Text
                        className="comment-like"
                        onClick={() => handleCommentLike(comment.id)}
                      >
                        {comment.liked ? '❤️' : '🤍'} {comment.likeCount}
                      </Text>
                      <Text
                        className="comment-reply"
                        onClick={() => setReplyingTo(comment.id)}
                      >
                        回复
                      </Text>
                    </View>

                    {/* 回复列表 */}
                    {comment.replies && comment.replies.length > 0 && (
                      <View className="replies-list">
                        {comment.replies.map(reply => (
                          <View key={reply.id} className="reply-item">
                            <Image className="reply-avatar" src={reply.author.avatar} />
                            <View className="reply-content">
                              <Text className="reply-author">{reply.author.name}</Text>
                              <Text className="reply-text">{reply.content}</Text>
                              <Text className="reply-time">{formatTime(reply.createdAt)}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 评论输入框 */}
      <View className="comment-input-bar">
        {userLevel < 2 ? (
          <View className="input-disabled">
            <Text className="disabled-text">达到Lv.2后解锁评论</Text>
          </View>
        ) : (
          <>
            <Textarea
              className="comment-input"
              placeholder={replyingTo ? '回复评论...' : '写下你的评论...'}
              value={commentText}
              onInput={(e) => setCommentText(e.detail.value)}
              maxlength={500}
            />
            <Button className="send-btn" onClick={handleSubmitComment}>
              <Text className="send-text">发送</Text>
            </Button>
          </>
        )}
      </View>

      {/* 申请弹窗 */}
      {showApplyModal && (
        <View className="apply-modal-overlay" onClick={() => setShowApplyModal(false)}>
          <View className="apply-modal" onClick={(e) => e.stopPropagation()}>
            <Text className="modal-title">申请加入队伍</Text>
            <Textarea
              className="apply-textarea"
              placeholder="介绍一下你的技能和经验..."
              value={applyMessage}
              onInput={(e) => setApplyMessage(e.detail.value)}
              maxlength={500}
            />
            <View className="modal-actions">
              <Button className="cancel-btn" onClick={() => setShowApplyModal(false)}>
                <Text className="btn-text">取消</Text>
              </Button>
              <Button className="confirm-btn" onClick={submitApply}>
                <Text className="btn-text">提交申请</Text>
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
