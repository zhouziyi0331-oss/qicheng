import { View, Text, ScrollView, Button, Picker, Textarea } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

export default function IPDeclaration() {
  const [taskId, setTaskId] = useState('')
  const [declaration, setDeclaration] = useState<any>(null)
  const [declarationType, setDeclarationType] = useState(0)
  const [customText, setCustomText] = useState('')
  const [loading, setLoading] = useState(false)

  const types = ['完全转让', '有限许可', '共同所有']

  const templates: any = {
    '完全转让': '本次合作产生的所有知识产权（包括但不限于著作权、专利权、商标权等）完全归委托方所有。受托方不保留任何权利。',
    '有限许可': '本次合作产生的知识产权归受托方所有，委托方获得非独占性、不可转让的使用许可。',
    '共同所有': '本次合作产生的知识产权由双方共同所有，任何一方使用需获得对方同意。'
  }

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params
    if (params?.taskId) {
      setTaskId(params.taskId)
      loadDeclaration(params.taskId)
    }
  }, [])

  const loadDeclaration = async (id: string) => {
    try {
      const token = Taro.getStorageSync('token')
      const res = await Taro.request({
        url: `/api/v1/acceptance/tasks/${id}/ip-declaration`,
        method: 'GET',
        header: { Authorization: `Bearer ${token}` }
      })
      if (res.data.success && res.data.data) {
        setDeclaration(res.data.data)
      }
    } catch (error) {
      console.log('暂无声明')
    }
  }

  const createDeclaration = async () => {
    const text = customText || templates[types[declarationType]]
    if (!text) {
      Taro.showToast({ title: '请填写声明内容', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      const token = Taro.getStorageSync('token')
      const res = await Taro.request({
        url: `/api/v1/acceptance/tasks/${taskId}/ip-declaration`,
        method: 'POST',
        header: { Authorization: `Bearer ${token}` },
        data: {
          declaration_type: types[declarationType],
          declaration_text: text,
          rights_scope: {
            usage_rights: 'unlimited',
            modification_rights: 'allowed',
            sublicense_rights: declarationType === 0 ? 'allowed' : 'not_allowed',
            commercial_rights: 'allowed'
          }
        }
      })

      if (res.data.success) {
        Taro.showToast({ title: '创建成功', icon: 'success' })
        loadDeclaration(taskId)
      }
    } catch (error: any) {
      Taro.showToast({ title: error.message || '创建失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const confirmDeclaration = async () => {
    setLoading(true)
    try {
      const token = Taro.getStorageSync('token')
      const res = await Taro.request({
        url: `/api/v1/acceptance/ip-declarations/${declaration.id}/confirm`,
        method: 'POST',
        header: { Authorization: `Bearer ${token}` }
      })

      if (res.data.success) {
        Taro.showToast({ title: '确认成功', icon: 'success' })
        loadDeclaration(taskId)
      }
    } catch (error: any) {
      Taro.showToast({ title: error.message || '确认失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  if (declaration) {
    return (
      <View className='ip-declaration'>
        <View className='declaration-card'>
          <View className='card-header'>
            <Text className='header-icon'>📜</Text>
            <Text className='header-title'>知识产权声明</Text>
          </View>

          <View className='declaration-type'>
            <Text className='type-label'>声明类型：</Text>
            <Text className='type-value'>{declaration.declaration_type}</Text>
          </View>

          <View className='declaration-content'>
            <Text className='content-label'>声明内容：</Text>
            <Text className='content-text'>{declaration.declaration_text}</Text>
          </View>

          <View className='rights-scope'>
            <Text className='scope-title'>权利范围：</Text>
            {Object.entries(JSON.parse(declaration.rights_scope)).map(([key, value]) => (
              <View key={key} className='scope-item'>
                <Text className='scope-key'>{key}:</Text>
                <Text className='scope-value'>{value as string}</Text>
              </View>
            ))}
          </View>

          <View className='confirmation-status'>
            <View className='status-item'>
              <Text className='status-label'>企业确认：</Text>
              <Text className={`status-value ${declaration.company_confirmed ? 'confirmed' : ''}`}>
                {declaration.company_confirmed ? '✅ 已确认' : '⏳ 待确认'}
              </Text>
            </View>
            <View className='status-item'>
              <Text className='status-label'>学生确认：</Text>
              <Text className={`status-value ${declaration.student_confirmed ? 'confirmed' : ''}`}>
                {declaration.student_confirmed ? '✅ 已确认' : '⏳ 待确认'}
              </Text>
            </View>
          </View>

          {!declaration.company_confirmed && (
            <Button
              className='confirm-btn'
              loading={loading}
              onClick={confirmDeclaration}
            >
              确认声明
            </Button>
          )}

          {declaration.company_confirmed && declaration.student_confirmed && (
            <View className='completion-badge'>
              🎉 双方已确认，声明生效
            </View>
          )}
        </View>
      </View>
    )
  }

  return (
    <View className='ip-declaration'>
      <ScrollView className='create-form' scrollY>
        <View className='form-header'>
          <Text className='form-title'>📜 创建知识产权声明</Text>
          <Text className='form-subtitle'>明确双方的知识产权归属</Text>
        </View>

        <View className='form-item'>
          <Text className='item-label'>声明类型</Text>
          <Picker
            mode='selector'
            range={types}
            value={declarationType}
            onChange={(e) => setDeclarationType(e.detail.value)}
          >
            <View className='picker-view'>
              <Text>{types[declarationType]}</Text>
              <Text className='arrow'>▼</Text>
            </View>
          </Picker>
        </View>

        <View className='template-preview'>
          <Text className='preview-label'>模板内容：</Text>
          <Text className='preview-text'>{templates[types[declarationType]]}</Text>
        </View>

        <View className='form-item'>
          <Text className='item-label'>自定义内容（选填）</Text>
          <Textarea
            className='item-textarea'
            placeholder='如需修改声明内容，请在此输入...'
            value={customText}
            onInput={(e) => setCustomText(e.detail.value)}
            maxlength={500}
          />
        </View>

        <Button
          className='create-btn'
          loading={loading}
          onClick={createDeclaration}
        >
          创建声明
        </Button>
      </ScrollView>
    </View>
  )
}
