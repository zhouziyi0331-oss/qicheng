import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { draftAPI } from '../../services/api'
import './index.scss'

interface Draft {
  id: string
  title: string
  description?: string
  category?: string
  budget_min?: number
  budget_max?: number
  deadline?: string
  status: 'draft' | 'published' | 'archived'
  created_at: string
  updated_at: string
}

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'draft' | 'published'>('all')

  useEffect(() => {
    fetchDrafts()
  }, [filter])

  const fetchDrafts = async () => {
    setLoading(true)
    try {
      const res = await draftAPI.getList({
        status: filter === 'all' ? undefined : filter
      })
      setDrafts(res.data || [])
    } catch (err) {
      console.error('获取草稿失败:', err)
      Taro.showToast({ title: '获取草稿失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    const res = await Taro.showModal({
      title: '确认删除',
      content: '确定要删除这个草稿吗？'
    })

    if (res.confirm) {
      try {
        await draftAPI.delete(id)
        Taro.showToast({ title: '删除成功', icon: 'success' })
        fetchDrafts()
      } catch (err) {
        Taro.showToast({ title: '删除失败', icon: 'none' })
      }
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      await draftAPI.duplicate(id)
      Taro.showToast({ title: '复制成功', icon: 'success' })
      fetchDrafts()
    } catch (err) {
      Taro.showToast({ title: '复制失败', icon: 'none' })
    }
  }

  const handlePublish = async (id: string) => {
    const res = await Taro.showModal({
      title: '确认发布',
      content: '确定要发布这个任务吗？'
    })

    if (res.confirm) {
      try {
        await draftAPI.publish(id)
        Taro.showToast({ title: '发布成功', icon: 'success' })
        fetchDrafts()
      } catch (err: any) {
        Taro.showToast({ title: err.message || '发布失败', icon: 'none' })
      }
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  return (
    <View className='drafts-page'>
      {/* 头部 */}
      <View className='header'>
        <Text className='title'>任务草稿箱</Text>
        <View className='btn-new' onClick={() => Taro.navigateTo({ url: '/pages/publish/index?draft=true' })}>
          + 新建
        </View>
      </View>

      {/* 筛选 */}
      <View className='filters'>
        <View className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
          全部
        </View>
        <View className={`filter-btn ${filter === 'draft' ? 'active' : ''}`} onClick={() => setFilter('draft')}>
          草稿
        </View>
        <View className={`filter-btn ${filter === 'published' ? 'active' : ''}`} onClick={() => setFilter('published')}>
          已发布
        </View>
      </View>

      {/* 草稿列表 */}
      <ScrollView scrollY className='draft-list'>
        {loading ? (
          <View className='loading'>加载中...</View>
        ) : drafts.length === 0 ? (
          <View className='empty'>
            <Text className='empty-icon'>📝</Text>
            <Text className='empty-text'>暂无草稿</Text>
          </View>
        ) : (
          drafts.map(draft => (
            <View key={draft.id} className='draft-card'>
              {/* 状态标签 */}
              <View className='card-header'>
                <View className={`status-tag ${draft.status}`}>
                  {draft.status === 'published' ? '已发布' : draft.status === 'draft' ? '草稿' : '已归档'}
                </View>
                {draft.category && (
                  <View className='category-tag'>{draft.category}</View>
                )}
              </View>

              {/* 标题 */}
              <Text className='draft-title'>{draft.title}</Text>

              {/* 描述 */}
              {draft.description && (
                <Text className='draft-desc'>{draft.description}</Text>
              )}

              {/* 预算 */}
              {(draft.budget_min || draft.budget_max) && (
                <View className='draft-budget'>
                  预算: ¥{draft.budget_min || 0} - ¥{draft.budget_max || 0}
                </View>
              )}

              {/* 时间 */}
              <Text className='draft-time'>更新于 {formatDate(draft.updated_at)}</Text>

              {/* 操作按钮 */}
              <View className='card-actions'>
                <View className='btn-edit' onClick={() => Taro.navigateTo({ url: `/pages/publish/index?draftId=${draft.id}` })}>
                  编辑
                </View>
                {draft.status === 'draft' && (
                  <View className='btn-publish' onClick={() => handlePublish(draft.id)}>
                    发布
                  </View>
                )}
                <View className='btn-icon' onClick={() => handleDuplicate(draft.id)}>📋</View>
                <View className='btn-icon' onClick={() => handleDelete(draft.id)}>🗑️</View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}
