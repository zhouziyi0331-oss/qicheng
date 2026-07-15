import { View, Text, ScrollView, Button } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { opcStoryAPI } from '../../services/api'
import RadarChart from '../../components/RadarChart'
import './index.scss'

interface StoryDetail {
  id: string
  title: string
  type: 'job' | 'opc' | 'turn' | 'study'
  author: {
    name: string
    avatar?: string
    type: string
    experience: string
  }
  publishedAt: string
  likeCount: number
  isLiked: boolean
  content: {
    intro: string
    radarData?: {
      scores: number[]
      typeName: string
      typeNameEn: string
      typeDesc: string
    }
    journey: string
    outcomes: string[]
    finalWords: string
  }
  relatedStories: Array<{
    id: string
    title: string
    author: string
    type: string
  }>
}

export default function StoryDetail() {
  const router = useRouter()
  const { id } = router.params
  const [story, setStory] = useState<StoryDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showRadarModal, setShowRadarModal] = useState(false)

  useEffect(() => {
    if (id) {
      loadStoryDetail(id)
    }
  }, [id])

  const loadStoryDetail = async (storyId: string) => {
    try {
      setLoading(true)

      // 暂时直接使用模拟数据，不请求 API
      // const response = await opcStoryAPI.getStoryDetail(storyId)
      // if (response.success && response.data) {
      //   setStory(response.data)
      //   Taro.setNavigationBarTitle({ title: '故事详情' })
      //   return
      // }

      // 使用文档中的真实案例数据
      const mockStories = {
        '1': {
          id: '1',
          title: '从迷茫的大三生到找到真正适合的方向',
          type: 'job' as const,
          author: {
            name: '顾晓晨',
            type: '探索整合者',
            experience: '毕业1年'
          },
          publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          likeCount: 186,
          isLiked: false,
          content: {
            intro: '毕业那年，我投了超过200份简历。每次面试完，我都不知道该怎么介绍自己——我学的是新闻，但我喜欢设计，我做过运营，但我更想做策划。',
            radarData: {
              scores: [72, 68, 65, 70, 88, 82],
              typeName: '探索整合者',
              typeNameEn: 'Explorer Integrator',
              typeDesc: '协作倾向与风险承受度都高，擅长在不确定中整合资源、推进连接。'
            },
            journey: '看到"探索整合者"这个结果，我突然明白了——我不是什么都会一点，而是我天生擅长把不同的东西连接起来。带着这个认知，我重新修改了简历，把自己定位为"跨界整合运营"。两周后，我收到了一家内容创业公司的offer——他们说，正是因为我能同时理解内容、设计和用户，他们选择了我。',
            outcomes: [
              '收到内容创业公司 offer，担任跨界整合运营',
              '重新建立了对自身能力的认知框架',
              '从"不知道自己能做什么"到"清楚自己的核心优势"',
              '入职3个月后，主导了公司第一个跨部门协作项目'
            ],
            finalWords: '如果你也在迷茫，不知道自己能做什么，我想说，你不是没有能力，你只是还没有看见它。OPC测评不是给你贴标签，而是帮你种下镜子。'
          },
          relatedStories: [
            { id: '2', title: '从销售转向产品经理', author: '林建国', type: 'turn' },
            { id: '3', title: '我成为了一名OPC', author: '白璟远', type: 'opc' }
          ]
        },
        '2': {
          id: '2',
          title: '从销售转向产品经理，OPC帮我看见了系统思维',
          type: 'turn' as const,
          author: {
            name: '林建国',
            type: '系统搭建者',
            experience: '工作5年'
          },
          publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          likeCount: 143,
          isLiked: false,
          content: {
            intro: '做了5年销售，业绩一直不错，但我总觉得哪里不对。每次拿下一个大客户，我享受的不是签单那一刻，而是在前期帮客户梳理需求、设计解决方案的过程。',
            radarData: {
              scores: [78, 55, 88, 82, 65, 70],
              typeName: '系统搭建者',
              typeNameEn: 'System Builder',
              typeDesc: '工具学习与任务执行都高，擅长把复杂问题结构化，搭建可复用的系统。'
            },
            journey: '测评结果显示我是"系统搭建者"——工具学习88分，任务执行82分。我突然意识到，我在销售中最擅长的，其实是帮客户搭建解决方案的系统。我用3个月时间系统学习了产品方法论，把5年销售经验中积累的用户洞察作为核心竞争力，最后拿到了一家SaaS公司的产品经理offer。',
            outcomes: [
              '成功转向为SaaS公司产品经理，薪资涨幅40%',
              '找到了销售经验与产品思维的连接点',
              '用"系统搭建者"定位重新包装了职业故事',
              '入职6个月后主导了公司核心功能的产品设计'
            ],
            finalWords: '转行不是从零开始，而是找到你已有能力的新用法。OPC帮我看见了我一直在用但从未命名的能力。'
          },
          relatedStories: [
            { id: '1', title: '从迷茫大三生到找到方向', author: '顾晓晨', type: 'job' },
            { id: '3', title: '我成为了一名OPC', author: '白璟远', type: 'opc' }
          ]
        },
        '3': {
          id: '3',
          title: '我成为了一名OPC，帮助100+人发现自己的能力',
          type: 'opc' as const,
          author: {
            name: '白璟远',
            type: '创意执行者',
            experience: '自由职业'
          },
          publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          likeCount: 267,
          isLiked: false,
          content: {
            intro: '两年前，我也是一个不知道自己能做什么的人。辞掉了稳定的工作，想做自由职业，但不知道自己能提供什么价值。',
            radarData: {
              scores: [65, 92, 72, 78, 68, 75],
              typeName: '创意执行者',
              typeNameEn: 'Creative Executor',
              typeDesc: '创作驱动最高，能把创意想法转化为真实成果，每天都在产出新内容和创造。'
            },
            journey: '测评结果显示我是"创意执行者"——创作驱动92分。我第一次知道，我的创造欲是真实存在的能力。那次测评改变了我。我开始认真对待自己的创造欲，把它当作一种可以帮助别人的能力，而不只是自己的爱好。我开始学习OPC的方法论，参加了认证培训。半年后，我成为了一名认证OPC，开始为其他人做能力发现咨询。',
            outcomes: [
              '成为认证OPC，建立了稳定的自由职业收入',
              '帮助100+人完成能力发现，获得持续正向反馈',
              '把创造欲从爱好转化为可持续的职业价值',
              '正在筹备自己的能力发现工作坊课程'
            ],
            finalWords: '每次看到一个人在测评结果面前突然沉默，然后说"原来我是这样的人"，我都觉得这件事值得做一辈子。'
          },
          relatedStories: [
            { id: '1', title: '从迷茫大三生到找到方向', author: '顾晓晨', type: 'job' },
            { id: '2', title: '从销售转向产品经理', author: '林建国', type: 'turn' }
          ]
        },
        '4': {
          id: '4',
          title: '大三迷茫期，OPC测评让我找到了研究方向',
          type: 'study' as const,
          author: {
            name: '张晨轩',
            type: '逻辑解析者',
            experience: '在校学生'
          },
          publishedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
          likeCount: 98,
          isLiked: false,
          content: {
            intro: '大三上学期，我站在考研和工作的十字路口，完全不知道该怎么选。专业是计算机，成绩中等，不算差但也不算特别好。',
            radarData: {
              scores: [95, 58, 78, 70, 52, 68],
              typeName: '逻辑解析者',
              typeNameEn: 'Logic Analyzer',
              typeDesc: '信息处理能力极高，擅长分析复杂系统、发现规律、构建模型。'
            },
            journey: '测评结果显示我的信息处理能力95分，远超其他维度。那一刻我突然明白了——我不是不够聪明，而是我的优势在于深度理解和系统分析。带着这个认知，我重新审视了考研这个选择。我不是为了逃避工作才考研，而是因为我真的擅长也喜欢钻研问题。我选择了数据挖掘作为研究方向，这正好匹配我的信息处理强项。现在研一，已经跟着导师发了一篇会议论文，找到了真正适合自己的路。',
            outcomes: [
              '明确了考研方向，选择了数据挖掘研究领域',
              '找到了"信息处理"这个核心能力标签',
              '研一期间发表会议论文一篇',
              '从"不知道为什么考研"到"清楚自己的学术优势"'
            ],
            finalWords: '选择不是二选一的赌博，而是基于对自己能力的清晰认知。OPC测评让我看见了自己真正的优势在哪里。'
          },
          relatedStories: [
            { id: '1', title: '从迷茫大三生到找到方向', author: '顾晓晨', type: 'job' },
            { id: '2', title: '从销售转向产品经理', author: '林建国', type: 'turn' }
          ]
        },
        '5': {
          id: '5',
          title: '我以为自己没有优势，直到看见了那张雷达图',
          type: 'job' as const,
          author: {
            name: '刘静婷',
            type: '稳妥交付者',
            experience: '工作3年'
          },
          publishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          likeCount: 154,
          isLiked: false,
          content: {
            intro: '工作三年，我一直是团队里那个"不出错但也不出彩"的人。每次听到同事说要创新、要突破，我都觉得自己很普通，没什么特别的。',
            radarData: {
              scores: [68, 55, 72, 90, 75, 85],
              typeName: '稳妥交付者',
              typeNameEn: 'Reliable Deliverer',
              typeDesc: '任务执行与风险控制都高，擅长在压力下保证质量，是团队的定海神针。'
            },
            journey: '看到测评结果的那一刻，我愣住了——任务执行90分，风险控制85分。OPC咨询师告诉我："你不是没有优势，稳妥交付本身就是一种稀缺能力。很多团队缺的不是创意，而是能把事情可靠做完的人。"那次对话改变了我的自我认知。我开始主动承担项目中的交付保障角色，负责把控进度、规避风险。三个月后，我被提拔为项目经理，专门负责高风险项目的交付管理。',
            outcomes: [
              '被提拔为项目经理，负责高风险项目交付',
              '从"觉得自己普通"到"认可自己的稳妥交付价值"',
              '建立了个人品牌：团队最可靠的交付保障',
              '薪资涨幅30%，并获得年度优秀员工'
            ],
            finalWords: '不是每个人都要做创新者。能把事情稳妥做好，这本身就是一种核心竞争力。'
          },
          relatedStories: [
            { id: '1', title: '从迷茫大三生到找到方向', author: '顾晓晨', type: 'job' },
            { id: '3', title: '我成为了一名OPC', author: '白璟远', type: 'opc' }
          ]
        }
      }

      const mockStory = mockStories[storyId] || mockStories['1']
      setStory(mockStory)
      Taro.setNavigationBarTitle({ title: '故事详情' })
    } catch (error) {
      console.error('加载故事详情失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!story) return
    try {
      const response = await opcStoryAPI.toggleLike(story.id)
      if (response.success) {
        setStory({
          ...story,
          isLiked: !story.isLiked,
          likeCount: story.isLiked ? story.likeCount - 1 : story.likeCount + 1
        })
      }
    } catch (error) {
      console.error('点赞失败:', error)
    }
  }

  const handleRelatedClick = (storyId: string) => {
    Taro.redirectTo({
      url: `/pages/story-wall/story-detail?id=${storyId}`
    })
  }

  const handleBack = () => {
    Taro.navigateBack()
  }

  const getTypeLabel = (type: string): { text: string; color: string } => {
    const map = {
      job: { text: '找到工作', color: 'mist' },
      opc: { text: '成为OPC', color: 'golden' },
      turn: { text: '职业转型', color: 'rust' },
      study: { text: '重新学习', color: 'blue' }
    }
    return map[type] || { text: '成长', color: 'mist' }
  }

  const getAvatarBg = (type: string): string => {
    const map = {
      job: 'linear-gradient(135deg, #3A8A84, #5ABFB8)',
      opc: 'linear-gradient(135deg, #C88A20, #F2CD78)',
      turn: 'linear-gradient(135deg, #BC6446, #D88760)',
      study: 'linear-gradient(135deg, #5B8FAB, #93AEC1)'
    }
    return map[type] || map.job
  }

  const getCoverBg = (type: string): string => {
    const map = {
      job: 'linear-gradient(135deg, #1A3A2A 0%, #2A5A4A 40%, #3A8A7A 100%)',
      opc: 'linear-gradient(135deg, #2A3A1A 0%, #4A6A2A 50%, #6A9A3A 100%)',
      turn: 'linear-gradient(135deg, #3D1F10 0%, #6B3520 50%, #9B5030 100%)',
      study: 'linear-gradient(135deg, #1A2A3A 0%, #2A4A5A 40%, #3A7A8A 100%)'
    }
    return map[type] || map.job
  }

  const formatTimeAgo = (dateStr: string): string => {
    const date = new Date(dateStr)
    const now = new Date()
    const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (days === 0) return '今天'
    if (days === 1) return '1天前'
    if (days < 7) return `${days}天前`
    if (days < 30) return `${Math.floor(days / 7)}周前`
    return `${Math.floor(days / 30)}个月前`
  }

  if (loading || !story) {
    return (
      <View className="story-detail-page loading">
        <Text>加载中...</Text>
      </View>
    )
  }

  const typeInfo = getTypeLabel(story.type)

  return (
    <View className="story-detail-page">
      {/* 顶部英雄区 */}
      <View className="detail-hero">
        <View className="hero-bg" style={{ background: getCoverBg(story.type) }} />
        <View className="hero-overlay" />

        {/* 返回按钮 */}
        <View className="back-btn" onClick={handleBack}>
          <Text className="back-icon">←</Text>
        </View>

        {/* 分享按钮 */}
        <View className="share-btn">
          <Button className="share-button" openType="share">
            <Text className="share-icon">⋯</Text>
          </Button>
        </View>

        <View className="hero-content">
          <View className={`type-badge badge-${typeInfo.color}`}>
            <Text className="badge-icon">✓</Text>
            <Text className="badge-text">{typeInfo.text}</Text>
          </View>
          <Text className="hero-title">{story.title}</Text>
          <View className="hero-meta">
            <View className="author-avatar" style={{ background: getAvatarBg(story.type) }}>
              <Text className="avatar-text">{story.author.name.charAt(0)}</Text>
            </View>
            <View className="author-info">
              <Text className="author-name">{story.author.name}</Text>
              <Text className="author-sub">{story.author.type} · {story.author.experience} · {formatTimeAgo(story.publishedAt)}</Text>
            </View>
            <View className="like-btn" onClick={handleLike}>
              <Text className="like-icon">{story.isLiked ? '♥' : '♡'}</Text>
              <Text className="like-count">{story.likeCount}</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView className="detail-scroll" scrollY>
        <View className="detail-body">
          {/* 故事正文 */}
          <View className="detail-section">
            <View className="section-label">
              <Text className="label-bar" />
              <Text className="label-text">TA的故事</Text>
            </View>
            <Text className="detail-text">{story.content.intro}</Text>

            {story.content.intro.includes('「') && (
              <View className="highlight-box">
                <Text className="highlight-text">
                  {story.content.intro.match(/「(.+?)」/)?.[1] || ''}
                </Text>
              </View>
            )}
          </View>

          {/* 雷达图 - 改为点击按钮查看 */}
          {story.content.radarData && (
            <View className="radar-section">
              <View className="radar-header">
                <Text className="radar-icon">◆</Text>
                <Text className="radar-title">{story.author.name}的六维能力雷达</Text>
              </View>
              <View className="radar-button-wrap">
                <Button
                  className="view-radar-btn"
                  onClick={() => setShowRadarModal(true)}
                >
                  点击查看雷达图
                </Button>
              </View>
            </View>
          )}

          {/* 人格类型揭示 */}
          {story.content.radarData && (
            <View className={`type-reveal reveal-${typeInfo.color}`}>
              <View className="type-icon-wrap" style={{ background: getAvatarBg(story.type) }}>
                <Text className="type-icon">○</Text>
              </View>
              <View className="type-content">
                <Text className="type-name">{story.content.radarData.typeName}</Text>
                <Text className="type-name-en">{story.content.radarData.typeNameEn}</Text>
                <Text className="type-desc">{story.content.radarData.typeDesc}</Text>
              </View>
            </View>
          )}

          {/* 转变过程 */}
          <View className="detail-section">
            <View className="section-label">
              <Text className="label-bar" />
              <Text className="label-text">转变的过程</Text>
            </View>
            <Text className="detail-text">{story.content.journey}</Text>
          </View>

          {/* 结果卡片 */}
          {story.content.outcomes.length > 0 && (
            <View className="outcome-card">
              <View className="outcome-header">
                <Text className="outcome-icon">★</Text>
                <Text className="outcome-title">TA获得了什么</Text>
              </View>
              {story.content.outcomes.map((outcome, index) => (
                <View key={index} className="outcome-item">
                  <View className="outcome-dot" />
                  <Text className="outcome-text">{outcome}</Text>
                </View>
              ))}
            </View>
          )}

          {/* TA想说的话 */}
          <View className="detail-section">
            <View className="section-label">
              <Text className="label-bar" />
              <Text className="label-text">TA想说的话</Text>
            </View>
            <Text className="detail-text">{story.content.finalWords}</Text>
          </View>
        </View>
        <View className="bottom-space" />
      </ScrollView>

      {/* 雷达图弹窗 */}
      {showRadarModal && story?.content.radarData && (
        <View className="radar-modal" onClick={() => setShowRadarModal(false)}>
          <View className="radar-modal-content" onClick={(e) => e.stopPropagation()}>
            <View className="radar-modal-header">
              <Text className="radar-modal-title">{story.author.name}的六维能力雷达</Text>
              <Text className="radar-modal-close" onClick={() => setShowRadarModal(false)}>×</Text>
            </View>
            <View className="radar-modal-body">
              <RadarChart
                data={{
                  information_processing: story.content.radarData.scores[0],
                  creation_drive: story.content.radarData.scores[1],
                  tool_learning: story.content.radarData.scores[2],
                  task_execution: story.content.radarData.scores[3],
                  collaboration: story.content.radarData.scores[4],
                  risk_attitude: story.content.radarData.scores[5]
                }}
                size={600}
                showLabels={false}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
