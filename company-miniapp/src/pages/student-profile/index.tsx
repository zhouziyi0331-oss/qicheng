import { View, Text, Image } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import './index.scss'

interface StudentProfile {
  id: string
  name: string
  avatar: string
  level: number
  completedTasks: number
  rating: number
  opcResult?: {
    openness: number      // 开放性
    conscientiousness: number  // 尽责性
    extraversion: number  // 外向性
    agreeableness: number // 宜人性
    neuroticism: number   // 神经质
    primaryTrack: string  // 主赛道
    secondaryTrack: string // 副赛道
    interests: string[]   // 兴趣标签
    skills: string[]      // 技能标签
  }
  portfolio: Array<{
    taskTitle: string
    completedAt: string
    rating: number
    images: string[]
  }>
}

export default function StudentProfile() {
  const router = useRouter()
  const { studentId } = router.params
  const [student, setStudent] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStudentProfile()
  }, [])

  const loadStudentProfile = async () => {
    try {
      const token = Taro.getStorageSync('token')
      const res = await Taro.request({
        url: `http://localhost:3000/api/v1/company/students/${studentId}/profile`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (res.statusCode === 200 && res.data.success) {
        setStudent(res.data.data)
      } else {
        throw new Error(res.data.message || '加载失败')
      }
    } catch (error) {
      console.error('加载学生资料失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const renderRadarChart = () => {
    if (!student?.opcResult) return null

    const { openness, conscientiousness, extraversion, agreeableness, neuroticism } = student.opcResult

    return (
      <View className="radar-chart">
        <View className="radar-item">
          <Text className="radar-label">开放性</Text>
          <View className="radar-bar">
            <View className="radar-fill" style={{ width: `${openness}%` }} />
          </View>
          <Text className="radar-value">{openness}</Text>
        </View>

        <View className="radar-item">
          <Text className="radar-label">尽责性</Text>
          <View className="radar-bar">
            <View className="radar-fill" style={{ width: `${conscientiousness}%` }} />
          </View>
          <Text className="radar-value">{conscientiousness}</Text>
        </View>

        <View className="radar-item">
          <Text className="radar-label">外向性</Text>
          <View className="radar-bar">
            <View className="radar-fill" style={{ width: `${extraversion}%` }} />
          </View>
          <Text className="radar-value">{extraversion}</Text>
        </View>

        <View className="radar-item">
          <Text className="radar-label">宜人性</Text>
          <View className="radar-bar">
            <View className="radar-fill" style={{ width: `${agreeableness}%` }} />
          </View>
          <Text className="radar-value">{agreeableness}</Text>
        </View>

        <View className="radar-item">
          <Text className="radar-label">情绪稳定</Text>
          <View className="radar-bar">
            <View className="radar-fill" style={{ width: `${100 - neuroticism}%` }} />
          </View>
          <Text className="radar-value">{100 - neuroticism}</Text>
        </View>
      </View>
    )
  }

  if (loading) {
    return <View className="student-profile loading">加载中...</View>
  }

  if (!student) {
    return <View className="student-profile empty">学生信息不存在</View>
  }

  return (
    <View className="student-profile">
      {/* 学生基本信息 */}
      <View className="profile-header">
        <Image className="avatar" src={student.avatar} />
        <View className="info">
          <Text className="name">{student.name}</Text>
          <View className="stats">
            <Text className="stat-item">Lv.{student.level}</Text>
            <Text className="stat-divider">|</Text>
            <Text className="stat-item">{student.completedTasks}个任务</Text>
            <Text className="stat-divider">|</Text>
            <Text className="stat-item">{student.rating} 分</Text>
          </View>
        </View>
      </View>

      {/* OPC测评结果 */}
      {student.opcResult && (
        <View className="section">
          <View className="section-header">
            <Text className="section-title">OPC性格测评</Text>
            <Text className="section-subtitle">基于大五人格理论的专业评估</Text>
          </View>

          {renderRadarChart()}

          <View className="tracks">
            <View className="track-item primary">
              <Text className="track-label">主赛道</Text>
              <Text className="track-value">{student.opcResult.primaryTrack}赛道</Text>
            </View>
            <View className="track-item secondary">
              <Text className="track-label">副赛道</Text>
              <Text className="track-value">{student.opcResult.secondaryTrack}赛道</Text>
            </View>
          </View>
        </View>
      )}

      {/* 兴趣标签 */}
      {student.opcResult?.interests && (
        <View className="section">
          <Text className="section-title">兴趣领域</Text>
          <View className="tags">
            {student.opcResult.interests.map((interest, index) => (
              <View key={index} className="tag interest-tag">{interest}</View>
            ))}
          </View>
        </View>
      )}

      {/* 技能标签 */}
      {student.opcResult?.skills && (
        <View className="section">
          <Text className="section-title">技能特长</Text>
          <View className="tags">
            {student.opcResult.skills.map((skill, index) => (
              <View key={index} className="tag skill-tag">{skill}</View>
            ))}
          </View>
        </View>
      )}

      {/* 作品集 */}
      {student.portfolio.length > 0 && (
        <View className="section">
          <Text className="section-title">历史作品</Text>
          {student.portfolio.map((work, index) => (
            <View key={index} className="portfolio-item">
              <View className="portfolio-header">
                <Text className="portfolio-title">{work.taskTitle}</Text>
                <Text className="portfolio-rating">⭐ {work.rating}</Text>
              </View>
              <Text className="portfolio-date">{work.completedAt}</Text>
              <View className="portfolio-images">
                {work.images.map((img, imgIndex) => (
                  <Image key={imgIndex} className="portfolio-image" src={img} mode="aspectFill" />
                ))}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}
