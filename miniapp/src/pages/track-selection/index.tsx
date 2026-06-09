import { View, Text, ScrollView, Button } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

interface Track {
  id: string
  name: string
  icon: string
  description: string
  path: string[]
  skills: string[]
  recommended: boolean
  matchScore?: number
  matchReason?: string
}

export default function TrackSelection() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showComparison, setShowComparison] = useState(false)

  useEffect(() => {
    loadTrackRecommendation()
  }, [])

  const loadTrackRecommendation = async () => {
    setLoading(true)
    try {
      const token = Taro.getStorageSync('token')
      const res = await Taro.request({
        url: '/api/v1/profile/track-recommendation',
        method: 'GET',
        header: { 'Authorization': `Bearer ${token}` }
      })

      if (res.data.success) {
        setTracks(res.data.data.tracks)
        // 自动选中推荐赛道
        const recommended = res.data.data.tracks.find((t: Track) => t.recommended)
        if (recommended) {
          setSelectedTrack(recommended.id)
        }
      } else {
        throw new Error('加载失败')
      }
    } catch (error) {
      console.error('加载赛道推荐失败:', error)

      // 使用模拟数据
      const mockTracks: Track[] = [
        {
          id: 'ai-content',
          name: 'AI内容创作',
          icon: '🎨',
          description: '利用AI工具进行内容创作、设计和视觉表达',
          path: ['涉水者', '河成者', '河行者', '河成者', '河行者', '河成者'],
          skills: ['视觉设计', 'UI/UX', '内容策划', 'AI工具应用'],
          recommended: true,
          matchScore: 85,
          matchReason: '你的视觉叙事能力和创意思维非常适合这条赛道'
        },
        {
          id: 'ai-dev',
          name: 'AI工具开发',
          icon: '⚙️',
          description: '开发AI应用、工具和系统，解决实际问题',
          path: ['涉水者', '河成者', '河行者', '河成者', '河行者', '河成者'],
          skills: ['编程开发', '系统架构', '算法优化', 'AI集成'],
          recommended: false,
          matchScore: 72,
          matchReason: '你的逻辑思维和系统构建能力也很不错'
        }
      ]

      setTracks(mockTracks)
      setSelectedTrack('ai-content')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!selectedTrack) {
      Taro.showToast({
        title: '请选择赛道',
        icon: 'none'
      })
      return
    }

    try {
      const token = Taro.getStorageSync('token')
      await Taro.request({
        url: '/api/v1/profile/select-track',
        method: 'POST',
        header: { 'Authorization': `Bearer ${token}` },
        data: { trackId: selectedTrack }
      })

      Taro.showToast({
        title: '赛道选择成功',
        icon: 'success'
      })

      setTimeout(() => {
        Taro.reLaunch({
          url: '/pages/index/index'
        })
      }, 1500)
    } catch (error) {
      console.error('选择赛道失败:', error)
      Taro.showToast({
        title: '选择失败',
        icon: 'none'
      })
    }
  }

  if (loading) {
    return (
      <View className="track-selection-page">
        <View className="loading-state">
          <Text className="loading-text">正在分析你的测评结果...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="track-selection-page">
      <View className="header">
        <Text className="header-icon">🎯</Text>
        <Text className="header-title">选择你的成长赛道</Text>
        <Text className="header-subtitle">根据你的热情探索测试结果推荐</Text>
      </View>

      <ScrollView className="content-scroll" scrollY>
        <View className="tracks-container">
          {tracks.map(track => (
            <View
              key={track.id}
              className={`track-card ${selectedTrack === track.id ? 'selected' : ''} ${track.recommended ? 'recommended' : ''}`}
              onClick={() => setSelectedTrack(track.id)}
            >
              {track.recommended && (
                <View className="recommended-badge">
                  <Text className="badge-text">⭐ 推荐</Text>
                </View>
              )}

              <View className="track-header">
                <Text className="track-icon">{track.icon}</Text>
                <Text className="track-name">{track.name}</Text>
              </View>

              <Text className="track-description">{track.description}</Text>

              {track.matchScore && (
                <View className="match-info">
                  <View className="match-score">
                    <Text className="score-label">匹配度</Text>
                    <Text className="score-value">{track.matchScore}%</Text>
                  </View>
                  <Text className="match-reason">{track.matchReason}</Text>
                </View>
              )}

              <View className="track-path">
                <Text className="path-label">成长路径</Text>
                <View className="path-steps">
                  {track.path.map((step, index) => (
                    <View key={index} className="path-step">
                      <Text className="step-text">{step}</Text>
                      {index < track.path.length - 1 && (
                        <Text className="step-arrow">→</Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>

              <View className="track-skills">
                <Text className="skills-label">核心技能</Text>
                <View className="skills-tags">
                  {track.skills.map((skill, index) => (
                    <Text key={index} className="skill-tag">{skill}</Text>
                  ))}
                </View>
              </View>

              {selectedTrack === track.id && (
                <View className="selected-indicator">
                  <Text className="indicator-icon">✓</Text>
                  <Text className="indicator-text">已选择</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <View className="comparison-section">
          <Button 
            className="comparison-btn"
            onClick={() => setShowComparison(!showComparison)}
          >
            <Text className="btn-text">
              {showComparison ? '收起对比' : '查看两条赛道完整对比'}
            </Text>
          </Button>

          {showComparison && (
            <View className="comparison-content">
              <View className="comparison-table">
                <View className="table-row header-row">
                  <Text className="table-cell">对比项</Text>
                  <Text className="table-cell">AI内容创作</Text>
                  <Text className="table-cell">AI工具开发</Text>
                </View>
                <View className="table-row">
                  <Text className="table-cell">核心能力</Text>
                  <Text className="table-cell">创意表达</Text>
                  <Text className="table-cell">技术实现</Text>
                </View>
                <View className="table-row">
                  <Text className="table-cell">工作方式</Text>
                  <Text className="table-cell">视觉化创作</Text>
                  <Text className="table-cell">代码开发</Text>
                </View>
                <View className="table-row">
                  <Text className="table-cell">适合人群</Text>
                  <Text className="table-cell">设计思维强</Text>
                  <Text className="table-cell">逻辑思维强</Text>
                </View>
                <View className="table-row">
                  <Text className="table-cell">职业方向</Text>
                  <Text className="table-cell">设计师/创作者</Text>
                  <Text className="table-cell">开发者/工程师</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View className="footer">
        <Button className="confirm-btn" onClick={handleConfirm}>
          <Text className="btn-text">确认选择</Text>
        </Button>
        <Text className="footer-hint">💡 选择后可在个人中心修改</Text>
      </View>
    </View>
  )
}
