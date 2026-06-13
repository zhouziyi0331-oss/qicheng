import { View, Text, ScrollView, Button, Slider, Textarea } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { dimensionalScoreApi } from '../../api/experienceOptimization'
import './index.scss'

export default function DimensionalScore() {
  const [taskId, setTaskId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [scores, setScores] = useState({
    quality_score: 4,
    completeness_score: 4,
    timeliness_score: 4,
    communication_score: 4,
    professionalism_score: 4
  })
  const [comments, setComments] = useState({
    quality_comment: '',
    completeness_comment: '',
    timeliness_comment: '',
    communication_comment: '',
    professionalism_comment: '',
    overall_comment: ''
  })
  const [existingScore, setExistingScore] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params
    if (params?.taskId) {
      setTaskId(params.taskId)
      setStudentId(params.studentId || '')
      loadExistingScore(params.taskId)
    }
  }, [])

  const loadExistingScore = async (id: string) => {
    try {
      const res = await dimensionalScoreApi.get(id)
      if (res.success && res.data) {
        setExistingScore(res.data)
        setScores({
          quality_score: res.data.quality_score,
          completeness_score: res.data.completeness_score,
          timeliness_score: res.data.timeliness_score,
          communication_score: res.data.communication_score,
          professionalism_score: res.data.professionalism_score
        })
        setComments({
          quality_comment: res.data.quality_comment || '',
          completeness_comment: res.data.completeness_comment || '',
          timeliness_comment: res.data.timeliness_comment || '',
          communication_comment: res.data.communication_comment || '',
          professionalism_comment: res.data.professionalism_comment || '',
          overall_comment: res.data.overall_comment || ''
        })
      }
    } catch (error) {
      console.log('暂无评分记录')
    }
  }

  const calculateOverallScore = () => {
    return (
      scores.quality_score * 0.3 +
      scores.completeness_score * 0.25 +
      scores.timeliness_score * 0.2 +
      scores.communication_score * 0.15 +
      scores.professionalism_score * 0.1
    ).toFixed(2)
  }

  const submitScore = async () => {
    if (!comments.overall_comment.trim()) {
      Taro.showToast({ title: '请填写总体评价', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      const res = await dimensionalScoreApi.create(taskId, {
        student_id: studentId,
        ...scores,
        ...comments
      })

      if (res.success) {
        Taro.showToast({ title: '评分提交成功', icon: 'success' })
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      }
    } catch (error: any) {
      Taro.showToast({ title: error.message || '提交失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const dimensions = [
    {
      key: 'quality_score',
      label: '质量',
      icon: '⭐',
      weight: '30%',
      desc: '交付物的质量水平'
    },
    {
      key: 'completeness_score',
      label: '完整度',
      icon: '📋',
      weight: '25%',
      desc: '需求实现的完整程度'
    },
    {
      key: 'timeliness_score',
      label: '及时性',
      icon: '⏰',
      weight: '20%',
      desc: '按时交付的表现'
    },
    {
      key: 'communication_score',
      label: '沟通',
      icon: '💬',
      weight: '15%',
      desc: '沟通响应的效率'
    },
    {
      key: 'professionalism_score',
      label: '专业性',
      icon: '👔',
      weight: '10%',
      desc: '工作态度和专业素养'
    }
  ]

  const overallScore = parseFloat(calculateOverallScore())
  const scoreLevel = overallScore >= 4.5 ? '优秀' : overallScore >= 4 ? '良好' : overallScore >= 3 ? '合格' : '待改进'

  return (
    <View className='dimensional-score'>
      <View className='score-header'>
        <Text className='title'>维度化评分</Text>
        {existingScore && (
          <View className='existing-badge'>已评分</View>
        )}
      </View>

      <ScrollView className='score-content' scrollY>
        {/* 总分预览 */}
        <View className='overall-preview'>
          <View className='overall-circle'>
            <Text className='overall-value'>{overallScore}</Text>
            <Text className='overall-max'>/5.0</Text>
          </View>
          <View className='overall-info'>
            <Text className='overall-level'>{scoreLevel}</Text>
            <Text className='overall-hint'>根据各维度加权计算</Text>
          </View>
        </View>

        {/* 各维度评分 */}
        {dimensions.map((dim) => (
          <View key={dim.key} className='dimension-section'>
            <View className='dimension-header'>
              <View className='dimension-title'>
                <Text className='dimension-icon'>{dim.icon}</Text>
                <Text className='dimension-label'>{dim.label}</Text>
                <Text className='dimension-weight'>权重{dim.weight}</Text>
              </View>
              <Text className='dimension-score'>{scores[dim.key]}.0</Text>
            </View>

            <Text className='dimension-desc'>{dim.desc}</Text>

            <View className='score-slider'>
              <View className='score-labels'>
                {[1, 2, 3, 4, 5].map((val) => (
                  <Text key={val} className='score-label'>{val}</Text>
                ))}
              </View>
              <Slider
                value={scores[dim.key]}
                min={1}
                max={5}
                step={1}
                activeColor='#1890ff'
                backgroundColor='#e8e8e8'
                blockSize={28}
                onChange={(e) => setScores({ ...scores, [dim.key]: e.detail.value })}
              />
            </View>

            <Textarea
              className='dimension-comment'
              placeholder={`对${dim.label}的具体评价（选填）...`}
              value={comments[`${dim.key.replace('_score', '_comment')}`]}
              onInput={(e) => setComments({
                ...comments,
                [`${dim.key.replace('_score', '_comment')}`]: e.detail.value
              })}
              maxlength={200}
            />
          </View>
        ))}

        {/* 总体评价 */}
        <View className='overall-section'>
          <Text className='section-title'>📝 总体评价*</Text>
          <Textarea
            className='overall-textarea'
            placeholder='请填写对本次合作的总体评价...'
            value={comments.overall_comment}
            onInput={(e) => setComments({ ...comments, overall_comment: e.detail.value })}
            maxlength={500}
          />
          <Text className='char-count'>
            {comments.overall_comment.length}/500
          </Text>
        </View>

        {/* 提交按钮 */}
        <View className='submit-section'>
          <Button
            className='submit-btn'
            loading={loading}
            onClick={submitScore}
          >
            {loading ? '提交中...' : existingScore ? '更新评分' : '提交评分'}
          </Button>

          <Text className='submit-hint'>
            评分将影响学生的信用和推荐权重
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}
