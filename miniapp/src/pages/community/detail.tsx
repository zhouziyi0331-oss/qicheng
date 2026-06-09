import { View, Text, ScrollView, Input, Button } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useEffect, useState } from 'react'
import toast from '../../utils/toast'
import Empty from '../../components/Empty'
import { useRouteGuard } from '../../utils/routeGuard'
import './detail.scss'

interface Post {
  id: string;
  type: string;
  title: string;
  content: string;
  author: {
    name: string;
    level: number;
    track: string;
    avatar?: string;
  };
  mySkills?: string[];
  requiredSkillsDetail?: Array<{ skillName: string; requiredLevel: string }>;
  likeCount: number;
  replyCount: number;
  createdAt: string;
  userLiked?: boolean;
  teamMembers?: any[];
  vacancyCount?: number;
  recruitCount?: number;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userLevel: number;
  content: string;
  likeCount: number;
  replyCount: number;
  createdAt: string;
  parentId?: string;
}

export default function CommunityDetail() {
  const router = useRouter()
  const postId = router.params.id || ''

  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [userLevel, setUserLevel] = useState(0)

  useEffect(() => {
    checkPermission()
    loadPostDetail()
    loadUserLevel()
  }, [postId])

  const checkPermission = async () => {
    const hasPermission = await useRouteGuard('/pages/community/detail')
    if (!hasPermission) {
      return
    }
  }

  const loadUserLevel = async () => {
    try {
      const token = Taro.getStorageSync('token')
      if (!token) return

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
    }
  }

  const loadPostDetail = async () => {
    try {
      setLoading(true)
      const token = Taro.getStorageSync('token')

      const res = await Taro.request({
        url: `/api/v1/community/posts/${postId}`,
        method: 'GET',
        header: { 'Authorization': `Bearer ${token}` }
      })

      if (res.data.success) {
        setPost(res.data.data)
        setComments(res.data.data.comments || [])
      }
    } catch (error) {
      console.error('加载帖子详情失败:', error)
      toast.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!post) return

    try {
      const token = Taro.getStorageSync('token')

      const res = await Taro.request({
        url: '/api/v1/community/like',
        method: 'POST',
        header: { 'Authorization': `Bearer ${token}` },
        data: {
          targetType: 'post',
          targetId: postId
        }
      })

      if (res.data.success) {
        setPost({
          ...post,
          userLiked: res.data.data.liked,
          likeCount: post.likeCount + (res.data.data.liked ? 1 : -1)
        })
      }
    } catch (error: any) {
      toast.error(error.message || '操作失败')
    }
  }

  const handleCommentLike = async (commentId: string) => {
    try {
      const token = Taro.getStorageSync('token')

      await Taro.request({
        url: '/api/v1/community/like',
        method: 'POST',
        header: { 'Authorization': `Bearer ${token}` },
        data: {
          targetType: 'comment',
          targetId: commentId
        }
      })

      // 重新加载评论列表
      loadPostDetail()
    } catch (error: any) {
      toast.error(error.message || '操作失败')
    }
  }

  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      toast.warning('请输入评论内容')
      return
    }

    if (userLevel < 2) {
      toast.permissionDenied(2)
      return
    }

    try {
      toast.loading('发布中...')
      const token = Taro.getStorageSync('token')

      const res = await Taro.request({
        url: `/api/v1/community/posts/${postId}/comments`,
        method: 'POST',
        header: { 'Authorization': `Bearer ${token}` },
        data: {
          content: commentText,
          parentId: replyingTo
        }
      })

      toast.hideLoading()

      if (res.data.success) {
        toast.success('评论成功')
        setCommentText('')
        setReplyingTo(null)
        loadPostDetail()
      }
    } catch (error: any) {
      toast.hideLoading()
      toast.error(error.message || '评论失败')
    }
  }

  const handleApply = async () => {
    if (userLevel < 5) {
      toast.permissionDenied(5)
      return
    }

    const confirmed = await toast.confirm({
      title: '申请加入',
      content: '确认申请加入这个招募吗？'
    })

    if (!confirmed) return

    try {
      toast.loading('提交申请...')
      const token = Taro.getStorageSync('token')

      const res = await Taro.request({
        url: `/api/v1/community/posts/${postId}/apply`,
        method: 'POST',
        header: { 'Authorization': `Bearer ${token}` },
        data: {
          message: '我对这个项目很感兴趣，希望能加入团队！'
        }
      })

      toast.hideLoading()

      if (res.data.success) {
        toast.success('申请已提交')
      }
    } catch (error: any) {
      toast.hideLoading()
      toast.error(error.message || '申请失败')
    }
  }

  const formatTime = (time: string): string => {
    const now = new Date().getTime()
    const postTime = new Date(time).getTime()
    const diff = now - postTime

    const minute = 60 * 1000
    const hour = 60 * minute
    const day = 24 * hour

    if (diff < minute) return '刚刚'
    if (diff < hour) return `${Math.floor(diff / minute)}分钟前`
    if (diff < day) return `${Math.floor(diff / hour)}小时前`
    if (diff < 7 * day) return `${Math.floor(diff / day)}天前`
    return new Date(time).toLocaleDateString()
  }

  if (loading) {
    return (
      <View className="community-detail-page">
        <View className="loading-container">
          <Text className="loading-text">加载中...</Text>
        </View>
      </View>
    )
  }

  if (!post) {
    return (
      <View className="community-detail-page">
        <Empty text="帖子不存在" />
      </View>
    )
  }

  return (
    <View className="community-detail-page">
      <ScrollView scrollY className="detail-container">
        {/* 帖子头部 */}
        <View className="post-header">
          <View className="author-info">
            <View className="author-avatar">
              <Text className="avatar-text">{post.author.name[0]}</Text>
            </View>
            <View className="author-details">
              <Text className="author-name">{post.author.name}</Text>
              <Text className="author-level">Lv.{post.author.level}</Text>
            </View>
          </View>
          <Text className="post-time">{formatTime(post.createdAt)}</Text>
        </View>

        {/* 帖子标题 */}
        <Text className="post-title">{post.title}</Text>

        {/* 帖子内容 */}
        <Text className="post-content">{post.content}</Text>

        {/* 技能标签（招募帖） */}
        {post.type === 'recruit' && (
          <View className="skills-section">
            {post.mySkills && post.mySkills.length > 0 && (
              <View className="skills-row">
                <Text className="skills-label">发布者技能：</Text>
                <View className="skills-tags">
                  {post.mySkills.map((skill, idx) => (
                    <View key={idx} className="skill-tag skill-tag-blue">
                      <Text className="skill-tag-text">{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {post.requiredSkillsDetail && post.requiredSkillsDetail.length > 0 && (
              <View className="skills-row">
                <Text className="skills-label">需要技能：</Text>
                <View className="skills-tags">
                  {post.requiredSkillsDetail.map((skill, idx) => (
                    <View key={idx} className="skill-tag skill-tag-orange">
                      <Text className="skill-tag-text">{skill.skillName}</Text>
                      {skill.requiredLevel === 'must' && (
                        <Text className="skill-badge">必须</Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* 队伍现状（招募帖） */}
        {post.type === 'recruit' && post.teamMembers && (
          <View className="team-section">
            <Text className="section-title">队伍现状</Text>
            <View className="team-members">
              {post.teamMembers.map((member, idx) => (
                <View key={idx} className="member-card">
                  <View className="member-avatar">
                    <Text className="avatar-text">{member.name[0]}</Text>
                  </View>
                  <View className="member-info">
                    <Text className="member-name">{member.name}</Text>
                    <Text className="member-level">Lv.{member.level}</Text>
                  </View>
                </View>
              ))}
            </View>
            <Text className="vacancy-text">
              剩余名额：{(post.recruitCount || 0) - (post.teamMembers?.length || 0)}
            </Text>
            {userLevel >= 5 && (
              <Button className="apply-btn" onClick={handleApply}>
                申请加入
              </Button>
            )}
            {userLevel < 5 && (
              <View className="apply-btn-disabled">
                <Text className="apply-btn-text">达到Lv.5后可申请</Text>
              </View>
            )}
          </View>
        )}

        {/* 互动区 */}
        <View className="interaction-section">
          <View className="interaction-item" onClick={handleLike}>
            <Text className="interaction-icon">{post.userLiked ? '❤️' : '🤍'}</Text>
            <Text className="interaction-text">{post.likeCount}</Text>
          </View>
          <View className="interaction-item">
            <Text className="interaction-icon">💬</Text>
            <Text className="interaction-text">{post.replyCount}</Text>
          </View>
        </View>

        {/* 评论区 */}
        <View className="comments-section">
          <Text className="section-title">评论 ({comments.length})</Text>
          {comments.length === 0 ? (
            <Empty icon="💬" text="暂无评论" hint="来发表第一条评论吧" />
          ) : (
            comments.map(comment => (
              <View key={comment.id} className="comment-item">
                <View className="comment-header">
                  <View className="comment-author">
                    <Text className="comment-author-name">{comment.userName}</Text>
                    <Text className="comment-author-level">Lv.{comment.userLevel}</Text>
                  </View>
                  <Text className="comment-time">{formatTime(comment.createdAt)}</Text>
                </View>
                <Text className="comment-content">{comment.content}</Text>
                <View className="comment-actions">
                  <View className="comment-action" onClick={() => handleCommentLike(comment.id)}>
                    <Text className="action-icon">👍</Text>
                    <Text className="action-text">{comment.likeCount}</Text>
                  </View>
                  <View className="comment-action" onClick={() => setReplyingTo(comment.id)}>
                    <Text className="action-icon">💬</Text>
                    <Text className="action-text">回复</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* 评论输入框 */}
      <View className="comment-input-section">
        {replyingTo && (
          <View className="replying-to">
            <Text className="replying-text">回复评论中...</Text>
            <Text className="cancel-reply" onClick={() => setReplyingTo(null)}>取消</Text>
          </View>
        )}
        <View className="input-row">
          <Input
            className="comment-input"
            placeholder={userLevel < 2 ? '完成首单升级到Lv.2后可评论' : '说点什么...'}
            value={commentText}
            onInput={(e) => setCommentText(e.detail.value)}
            disabled={userLevel < 2}
            maxlength={500}
          />
          <Button className="send-btn" onClick={handleSubmitComment} disabled={userLevel < 2}>
            发送
          </Button>
        </View>
      </View>
    </View>
  )
}
