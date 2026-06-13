import { View, Text, ScrollView, Button, Slider, Input, Checkbox } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { studentSearchApi } from '../../api/experienceOptimization'
import './index.scss'

export default function StudentSearch() {
  const [filters, setFilters] = useState<any>({
    student_level_min: 1,
    student_level_max: 10,
    min_rating: 0,
    min_completed_tasks: 0,
    max_response_hours: 48,
    location: '',
    max_hourly_rate: 1000,
    required_skills: []
  })

  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(true)

  // 搜索学生
  const handleSearch = async () => {
    setLoading(true)
    try {
      const res = await studentSearchApi.search(filters)
      if (res.success) {
        setResults(res.data)
        setShowFilters(false)
        Taro.showToast({
          title: `找到${res.data.length}个学生`,
          icon: 'success'
        })
      }
    } catch (error: any) {
      Taro.showToast({
        title: error.message || '搜索失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  // 选择学生
  const toggleStudent = (studentId: string) => {
    setSelectedStudents((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId)
      } else {
        if (prev.length >= 5) {
          Taro.showToast({ title: '最多选择5个学生', icon: 'none' })
          return prev
        }
        return [...prev, studentId]
      }
    })
  }

  // 对比学生
  const handleCompare = () => {
    if (selectedStudents.length < 2) {
      Taro.showToast({ title: '请至少选择2个学生', icon: 'none' })
      return
    }

    Taro.navigateTo({
      url: `/pages/student-comparison/index?studentIds=${selectedStudents.join(',')}`
    })
  }

  // 查看学生详情
  const viewStudentDetail = (studentId: string) => {
    Taro.navigateTo({
      url: `/pages/student-profile/index?id=${studentId}`
    })
  }

  return (
    <View className='student-search'>
      {/* 筛选器 */}
      {showFilters && (
        <ScrollView className='filters-panel' scrollY>
          <View className='panel-header'>
            <Text className='title'>🔍 学生筛选</Text>
            <Text className='subtitle'>根据条件查找合适的学生</Text>
          </View>

          {/* 学生等级 */}
          <View className='filter-section'>
            <Text className='section-title'>学生等级</Text>
            <View className='level-range'>
              <Text className='range-value'>Lv.{filters.student_level_min}</Text>
              <Text className='range-separator'>-</Text>
              <Text className='range-value'>Lv.{filters.student_level_max}</Text>
            </View>
            <View className='slider-group'>
              <Text className='slider-label'>最低等级</Text>
              <Slider
                value={filters.student_level_min}
                min={1}
                max={10}
                step={1}
                activeColor='#1890ff'
                onChange={(e) => setFilters({ ...filters, student_level_min: e.detail.value })}
              />
            </View>
            <View className='slider-group'>
              <Text className='slider-label'>最高等级</Text>
              <Slider
                value={filters.student_level_max}
                min={1}
                max={10}
                step={1}
                activeColor='#1890ff'
                onChange={(e) => setFilters({ ...filters, student_level_max: e.detail.value })}
              />
            </View>
          </View>

          {/* 评分要求 */}
          <View className='filter-section'>
            <Text className='section-title'>最低评分</Text>
            <View className='rating-display'>
              <Text className='rating-value'>{filters.min_rating.toFixed(1)}</Text>
              <Text className='rating-stars'>{'⭐'.repeat(Math.round(filters.min_rating))}</Text>
            </View>
            <Slider
              value={filters.min_rating}
              min={0}
              max={5}
              step={0.5}
              activeColor='#1890ff'
              onChange={(e) => setFilters({ ...filters, min_rating: e.detail.value })}
            />
          </View>

          {/* 完成任务数 */}
          <View className='filter-section'>
            <Text className='section-title'>最少完成任务</Text>
            <Input
              className='filter-input'
              type='number'
              placeholder='0'
              value={filters.min_completed_tasks.toString()}
              onInput={(e) => setFilters({ ...filters, min_completed_tasks: parseInt(e.detail.value) || 0 })}
            />
          </View>

          {/* 响应时间 */}
          <View className='filter-section'>
            <Text className='section-title'>最长响应时间</Text>
            <View className='time-display'>
              <Text className='time-value'>{filters.max_response_hours}小时内</Text>
            </View>
            <Slider
              value={filters.max_response_hours}
              min={1}
              max={72}
              step={1}
              activeColor='#1890ff'
              onChange={(e) => setFilters({ ...filters, max_response_hours: e.detail.value })}
            />
          </View>

          {/* 地区 */}
          <View className='filter-section'>
            <Text className='section-title'>地区</Text>
            <Input
              className='filter-input'
              placeholder='输入城市名称（可选）'
              value={filters.location}
              onInput={(e) => setFilters({ ...filters, location: e.detail.value })}
            />
          </View>

          {/* 最高时薪 */}
          <View className='filter-section'>
            <Text className='section-title'>最高时薪</Text>
            <View className='price-display'>
              <Text className='price-value'>≤ ¥{filters.max_hourly_rate}/小时</Text>
            </View>
            <Slider
              value={filters.max_hourly_rate}
              min={50}
              max={1000}
              step={50}
              activeColor='#1890ff'
              onChange={(e) => setFilters({ ...filters, max_hourly_rate: e.detail.value })}
            />
          </View>

          {/* 搜索按钮 */}
          <Button
            className='search-btn'
            loading={loading}
            onClick={handleSearch}
          >
            {loading ? '搜索中...' : '开始搜索'}
          </Button>
        </ScrollView>
      )}

      {/* 搜索结果 */}
      {!showFilters && (
        <View className='results-container'>
          {/* 结果头部 */}
          <View className='results-header'>
            <View className='header-info'>
              <Text className='result-count'>找到 {results.length} 个学生</Text>
              {selectedStudents.length > 0 && (
                <Text className='selected-count'>已选 {selectedStudents.length}/5</Text>
              )}
            </View>
            <View className='header-actions'>
              <Button
                className='btn btn-text'
                onClick={() => setShowFilters(true)}
              >
                修改筛选
              </Button>
              {selectedStudents.length >= 2 && (
                <Button
                  className='btn btn-primary'
                  onClick={handleCompare}
                >
                  对比({selectedStudents.length})
                </Button>
              )}
            </View>
          </View>

          {/* 学生列表 */}
          <ScrollView className='results-list' scrollY>
            {results.length === 0 ? (
              <View className='empty'>
                <Text>😕</Text>
                <Text>没有找到符合条件的学生</Text>
                <Button className='btn' onClick={() => setShowFilters(true)}>
                  调整筛选条件
                </Button>
              </View>
            ) : (
              results.map((student) => (
                <View
                  key={student.id}
                  className={`student-card ${selectedStudents.includes(student.id) ? 'selected' : ''}`}
                >
                  {/* 选择框 */}
                  <View className='select-box' onClick={() => toggleStudent(student.id)}>
                    <Checkbox
                      checked={selectedStudents.includes(student.id)}
                      color='#1890ff'
                    />
                  </View>

                  {/* 学生信息 */}
                  <View className='student-info' onClick={() => viewStudentDetail(student.id)}>
                    <View className='info-header'>
                      <View className='avatar'>
                        {student.avatar ? (
                          <image src={student.avatar} mode='aspectFill' />
                        ) : (
                          <Text>👤</Text>
                        )}
                      </View>
                      <View className='basic-info'>
                        <Text className='name'>{student.username}</Text>
                        <Text className='level'>Lv.{student.student_level}</Text>
                      </View>
                    </View>

                    {/* 统计数据 */}
                    <View className='stats'>
                      <View className='stat-item'>
                        <Text className='stat-label'>完成任务</Text>
                        <Text className='stat-value'>{student.total_tasks_completed}</Text>
                      </View>
                      <View className='stat-item'>
                        <Text className='stat-label'>平均评分</Text>
                        <Text className='stat-value'>
                          {student.avg_task_rating?.toFixed(1) || '-'}⭐
                        </Text>
                      </View>
                      <View className='stat-item'>
                        <Text className='stat-label'>准时率</Text>
                        <Text className='stat-value'>
                          {student.on_time_delivery_rate
                            ? (student.on_time_delivery_rate * 100).toFixed(0) + '%'
                            : '-'}
                        </Text>
                      </View>
                    </View>

                    {/* 响应时间 */}
                    {student.avg_response_time_hours && (
                      <View className='response-time'>
                        <Text className='label'>平均响应：</Text>
                        <Text className='value'>
                          {student.avg_response_time_hours.toFixed(1)}小时
                        </Text>
                      </View>
                    )}

                    {/* 时薪 */}
                    {student.hourly_rate && (
                      <View className='hourly-rate'>
                        <Text className='label'>时薪：</Text>
                        <Text className='value'>¥{student.hourly_rate}/小时</Text>
                      </View>
                    )}

                    {/* 地区 */}
                    {student.location && (
                      <View className='location'>
                        <Text className='label'>📍</Text>
                        <Text className='value'>{student.location}</Text>
                      </View>
                    )}

                    {/* 简介 */}
                    {student.bio && (
                      <View className='bio'>
                        <Text>{student.bio}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )}
    </View>
  )
}
