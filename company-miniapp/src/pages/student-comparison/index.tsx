import { View, Text, ScrollView, Button, Checkbox } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { studentComparisonApi } from '../../api/experienceOptimization'
import './index.scss'

export default function StudentComparison() {
  const [students, setStudents] = useState<any[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [comparisonResult, setComparisonResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [taskId, setTaskId] = useState<string>('')

  useEffect(() => {
    // 从路由参数获取学生ID和任务ID
    const params = Taro.getCurrentInstance().router?.params
    if (params?.studentIds) {
      const ids = params.studentIds.split(',')
      setSelectedStudents(ids)
      if (params.taskId) {
        setTaskId(params.taskId)
      }
      loadComparison(ids, params.taskId)
    }
  }, [])

  const loadComparison = async (studentIds: string[], taskId?: string) => {
    if (studentIds.length < 2) {
      Taro.showToast({ title: '请至少选择2个学生', icon: 'none' })
      return
    }

    if (studentIds.length > 5) {
      Taro.showToast({ title: '最多对比5个学生', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      const res = await studentComparisonApi.compare(studentIds, taskId)
      if (res.success) {
        setComparisonResult(res.data)
        setStudents(res.data.students)
      }
    } catch (error: any) {
      Taro.showToast({ title: error.message || '对比失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const renderComparisonRow = (label: string, getValue: (student: any) => any, format?: (val: any) => string) => {
    return (
      <View className='comparison-row'>
        <View className='row-label'>{label}</View>
        <View className='row-values'>
          {students.map((student, index) => (
            <View key={student.id} className='cell'>
              <Text>{format ? format(getValue(student)) : getValue(student)}</Text>
            </View>
          ))}
        </View>
      </View>
    )
  }

  const getHighlightClass = (students: any[], getValue: (s: any) => number, currentStudent: any, higher: boolean = true) => {
    const values = students.map(getValue)
    const currentValue = getValue(currentStudent)
    const best = higher ? Math.max(...values) : Math.min(...values)
    return currentValue === best ? 'highlight' : ''
  }

  return (
    <View className='student-comparison'>
      {loading ? (
        <View className='loading'>对比分析中...</View>
      ) : !comparisonResult ? (
        <View className='empty'>请选择学生进行对比</View>
      ) : (
        <ScrollView className='comparison-content' scrollY scrollX>
          {/* 学生信息卡片 */}
          <View className='student-cards'>
            {students.map((student) => (
              <View key={student.id} className='student-card'>
                <View className='avatar'>
                  {student.avatar ? (
                    <image src={student.avatar} mode='aspectFill' />
                  ) : (
                    <Text>👤</Text>
                  )}
                </View>
                <Text className='name'>{student.username}</Text>
                <Text className='level'>Lv.{student.student_level}</Text>
              </View>
            ))}
          </View>

          {/* 对比表格 */}
          <View className='comparison-table'>
            <View className='section-title'>📊 基础数据</View>

            {renderComparisonRow('学生等级', (s) => s.student_level, (v) => `Lv.${v}`)}
            {renderComparisonRow('完成任务', (s) => s.total_tasks_completed, (v) => `${v}个`)}
            {renderComparisonRow('平均评分', (s) => s.avg_task_rating?.toFixed(1) || '-', (v) => `${v}分`)}
            {renderComparisonRow('准时率', (s) => s.on_time_delivery_rate ? (s.on_time_delivery_rate * 100).toFixed(0) + '%' : '-')}
            {renderComparisonRow('响应时间', (s) => s.avg_response_time_hours?.toFixed(1) || '-', (v) => `${v}小时`)}
            {renderComparisonRow('时薪', (s) => s.hourly_rate || '-', (v) => `¥${v}/小时`)}

            {/* 任务匹配度（如果有taskId） */}
            {taskId && students[0].match_scores && (
              <>
                <View className='section-title'>🎯 任务匹配度</View>
                {renderComparisonRow('总体匹配', (s) => s.match_scores?.overall ? (s.match_scores.overall * 100).toFixed(0) + '%' : '-')}
                {renderComparisonRow('技能匹配', (s) => s.match_scores?.skill ? (s.match_scores.skill * 100).toFixed(0) + '%' : '-')}
                {renderComparisonRow('可靠性', (s) => s.match_scores?.reliability ? (s.match_scores.reliability * 100).toFixed(0) + '%' : '-')}
              </>
            )}

            {/* 能力画像 */}
            {students[0].avg_task_quality && (
              <>
                <View className='section-title'>💪 能力画像</View>
                {renderComparisonRow('任务质量', (s) => s.avg_task_quality ? (s.avg_task_quality * 100).toFixed(0) + '%' : '-')}
                {renderComparisonRow('成长速度', (s) => s.growth_rate ? `${(s.growth_rate * 100).toFixed(1)}%` : '-')}
              </>
            )}

            {/* 技能对比 */}
            <View className='section-title'>🛠 技能对比</View>
            <View className='skills-comparison'>
              {students.map((student) => (
                <View key={student.id} className='student-skills'>
                  <Text className='skills-title'>{student.username}</Text>
                  <View className='skills-tags'>
                    {student.capability_skills && Object.keys(student.capability_skills).slice(0, 5).map((skill: string) => (
                      <View key={skill} className='skill-tag'>
                        {skill}
                      </View>
                    ))}
                    {(!student.capability_skills || Object.keys(student.capability_skills).length === 0) && (
                      <Text className='no-skills'>暂无技能数据</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>

            {/* 工作偏好 */}
            {students[0].preferred_task_types && (
              <>
                <View className='section-title'>❤️ 工作偏好</View>
                <View className='preferences'>
                  {students.map((student) => (
                    <View key={student.id} className='student-preferences'>
                      <Text className='pref-title'>{student.username}</Text>
                      {student.preferred_task_types && student.preferred_task_types.length > 0 ? (
                        <View className='pref-tags'>
                          {student.preferred_task_types.map((type: string, index: number) => (
                            <View key={index} className='pref-tag'>
                              {type}
                            </View>
                          ))}
                        </View>
                      ) : (
                        <Text className='no-pref'>暂无偏好数据</Text>
                      )}
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>

          {/* 对比总结 */}
          <View className='comparison-summary'>
            <View className='summary-title'>📝 对比总结</View>
            {students.map((student, index) => (
              <View key={student.id} className='summary-item'>
                <View className='summary-header'>
                  <Text className='rank'>#{index + 1}</Text>
                  <Text className='name'>{student.username}</Text>
                </View>
                <View className='summary-content'>
                  {student.match_scores && (
                    <Text className='match'>
                      匹配度 {(student.match_scores.overall * 100).toFixed(0)}%
                    </Text>
                  )}
                  <Text className='stats'>
                    完成{student.total_tasks_completed}个任务 · 评分{student.avg_task_rating?.toFixed(1) || '-'}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* 操作按钮 */}
          <View className='actions'>
            <Button className='btn btn-secondary' onClick={() => Taro.navigateBack()}>
              返回
            </Button>
            <Button
              className='btn btn-primary'
              onClick={() => {
                // 可以跳转到邀请页面
                Taro.showToast({ title: '功能开发中', icon: 'none' })
              }}
            >
              选择学生
            </Button>
          </View>
        </ScrollView>
      )}
    </View>
  )
}
