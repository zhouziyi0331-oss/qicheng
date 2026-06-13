import { View, Text, ScrollView, Button, Input, Checkbox } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { acceptanceChecklistApi } from '../../api/experienceOptimization'
import './index.scss'

export default function AcceptanceChecklist() {
  const [taskId, setTaskId] = useState('')
  const [checklist, setChecklist] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newItems, setNewItems] = useState<string[]>([''])

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params
    if (params?.taskId) {
      setTaskId(params.taskId)
      loadChecklist(params.taskId)
    }
  }, [])

  const loadChecklist = async (id: string) => {
    setLoading(true)
    try {
      const res = await acceptanceChecklistApi.get(id)
      if (res.success) {
        setChecklist(res.data)
      }
    } catch (error) {
      console.log('暂无清单，可以创建')
    } finally {
      setLoading(false)
    }
  }

  const createChecklist = async () => {
    const validItems = newItems.filter(item => item.trim())
    if (validItems.length === 0) {
      Taro.showToast({ title: '请至少添加一项', icon: 'none' })
      return
    }

    try {
      Taro.showLoading({ title: '创建中...' })
      const items = validItems.map(item => ({ item }))
      const res = await acceptanceChecklistApi.create(taskId, items)
      Taro.hideLoading()

      if (res.success) {
        Taro.showToast({ title: '创建成功', icon: 'success' })
        setShowAddModal(false)
        setNewItems([''])
        loadChecklist(taskId)
      }
    } catch (error: any) {
      Taro.hideLoading()
      Taro.showToast({ title: error.message || '创建失败', icon: 'none' })
    }
  }

  const updateItem = async (itemId: number, status: string) => {
    try {
      const res = await acceptanceChecklistApi.updateItem(checklist.id, itemId, status)
      if (res.success) {
        setChecklist(res.data)
        Taro.showToast({
          title: status === 'approved' ? '已通过' : '已驳回',
          icon: 'success'
        })
      }
    } catch (error: any) {
      Taro.showToast({ title: error.message || '操作失败', icon: 'none' })
    }
  }

  const addNewItemField = () => {
    setNewItems([...newItems, ''])
  }

  const updateNewItem = (index: number, value: string) => {
    const updated = [...newItems]
    updated[index] = value
    setNewItems(updated)
  }

  const removeNewItem = (index: number) => {
    if (newItems.length > 1) {
      setNewItems(newItems.filter((_, i) => i !== index))
    }
  }

  if (loading) {
    return <View className='acceptance-checklist'><View className='loading'>加载中...</View></View>
  }

  if (!checklist) {
    return (
      <View className='acceptance-checklist'>
        <View className='empty-state'>
          <Text className='empty-icon'>📋</Text>
          <Text className='empty-text'>暂无验收清单</Text>
          <Text className='empty-hint'>创建清单后可以逐项验收任务交付物</Text>
          <Button className='create-btn' onClick={() => setShowAddModal(true)}>
            创建验收清单
          </Button>
        </View>
      </View>
    )
  }

  const items = JSON.parse(JSON.stringify(checklist.checklist_items))
  const progress = (checklist.approved_items / checklist.total_items * 100).toFixed(0)

  return (
    <View className='acceptance-checklist'>
      <View className='checklist-header'>
        <View className='header-info'>
          <Text className='title'>验收清单</Text>
          <Text className='subtitle'>{checklist.approved_items}/{checklist.total_items} 项已通过</Text>
        </View>
        <View className='progress-ring'>
          <Text className='progress-text'>{progress}%</Text>
        </View>
      </View>

      <View className='progress-bar'>
        <View className='progress-fill' style={{ width: `${progress}%` }} />
      </View>

      <ScrollView className='checklist-items' scrollY>
        {items.map((item: any) => (
          <View key={item.id} className={`checklist-item status-${item.status}`}>
            <View className='item-content'>
              <View className='item-number'>{item.id}</View>
              <Text className='item-text'>{item.item}</Text>
            </View>

            <View className='item-status'>
              {item.status === 'pending' && (
                <View className='status-actions'>
                  <Button
                    className='btn btn-reject'
                    onClick={() => updateItem(item.id, 'rejected')}
                  >
                    ❌
                  </Button>
                  <Button
                    className='btn btn-approve'
                    onClick={() => updateItem(item.id, 'approved')}
                  >
                    ✅
                  </Button>
                </View>
              )}
              {item.status === 'approved' && (
                <View className='status-badge approved'>✅ 已通过</View>
              )}
              {item.status === 'rejected' && (
                <View className='status-badge rejected'>❌ 未通过</View>
              )}
            </View>

            {item.checked_at && (
              <Text className='check-time'>
                验收时间：{new Date(item.checked_at).toLocaleString('zh-CN')}
              </Text>
            )}
          </View>
        ))}
      </ScrollView>

      {checklist.overall_status === 'completed' && (
        <View className='completion-card'>
          <Text className='completion-icon'>🎉</Text>
          <Text className='completion-text'>全部验收完成！</Text>
        </View>
      )}

      {showAddModal && (
        <View className='modal-overlay' onClick={() => setShowAddModal(false)}>
          <View className='modal-content' onClick={(e) => e.stopPropagation()}>
            <Text className='modal-title'>创建验收清单</Text>

            <ScrollView className='items-editor' scrollY>
              {newItems.map((item, index) => (
                <View key={index} className='item-editor'>
                  <Text className='item-index'>{index + 1}.</Text>
                  <Input
                    className='item-input'
                    placeholder='输入验收项...'
                    value={item}
                    onInput={(e) => updateNewItem(index, e.detail.value)}
                  />
                  {newItems.length > 1 && (
                    <Button className='remove-btn' onClick={() => removeNewItem(index)}>
                      ❌
                    </Button>
                  )}
                </View>
              ))}
            </ScrollView>

            <Button className='add-item-btn' onClick={addNewItemField}>
              ➕ 添加验收项
            </Button>

            <View className='modal-actions'>
              <Button className='btn btn-cancel' onClick={() => setShowAddModal(false)}>
                取消
              </Button>
              <Button className='btn btn-confirm' onClick={createChecklist}>
                创建清单
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
