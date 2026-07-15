import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { tokenManager } from '../../../utils/token'
import { getApiUrl } from '../../../config'
import './index.scss'

interface Deliverable {
  id: string;
  courseName: string;
  careerName: string;
  createdTime: string;
  content: string;
  evaluation?: {
    completeness: number;
    correctness: number;
    innovation: number;
    codeQuality: number;
  };
}

export default function Portfolio() {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPortfolio()
  }, [])

  const loadPortfolio = async () => {
    try {
      const token = tokenManager.getAccessToken()
      if (!token) {
        setLoading(false)
        return
      }

      const res = await Taro.request({
        url: getApiUrl('/api/v1/portfolio'),
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (res.data.success) {
        setDeliverables(res.data.data.deliverables || [])
      }
    } catch (error) {
      console.error('加载作品集失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const viewDeliverable = (item: Deliverable) => {
    Taro.navigateTo({
      url: `/pages/deliverable-detail/index?id=${item.id}`
    })
  }

  const shareDeliverable = (item: Deliverable) => {
    Taro.showModal({
      title: '分享作品',
      content: '功能开发中',
      showCancel: false
    })
  }

  if (loading) {
    return (
      <View className="portfolio-page">
        <View className="loading">加载中...</View>
      </View>
    )
  }

  return (
    <View className="portfolio-page">
      {/* 头部统计 */}
      <View className="portfolio-header">
        <View className="stat-card">
          <Text className="stat-value">{deliverables.length}</Text>
          <Text className="stat-label">作品总数</Text>
        </View>
      </View>

      {/* 作品列表 */}
      {deliverables.length > 0 ? (
        <View className="deliverables-list">
          {deliverables.map(item => (
            <View key={item.id} className="deliverable-card">
              <View className="deliverable-header">
                <View className="deliverable-info">
                  <Text className="deliverable-course">{item.courseName}</Text>
                  <Text className="deliverable-career">{item.careerName}</Text>
                </View>
                <Text className="deliverable-time">{item.createdTime}</Text>
              </View>

              <View className="deliverable-content">
                <Text className="content-preview">{item.content}</Text>
              </View>

              {item.evaluation && (
                <View className="deliverable-meta">
                  <View className="meta-item">
                    <Text className="meta-label">完整性</Text>
                    <Text className="meta-value">{item.evaluation.completeness}/10</Text>
                  </View>
                  <View className="meta-item">
                    <Text className="meta-label">正确性</Text>
                    <Text className="meta-value">{item.evaluation.correctness}/10</Text>
                  </View>
                  <View className="meta-item">
                    <Text className="meta-label">创新性</Text>
                    <Text className="meta-value">{item.evaluation.innovation}/10</Text>
                  </View>
                  <View className="meta-item">
                    <Text className="meta-label">代码质量</Text>
                    <Text className="meta-value">{item.evaluation.codeQuality}/10</Text>
                  </View>
                </View>
              )}

              <View className="deliverable-actions">
                <Button className="action-btn view" onClick={() => viewDeliverable(item)}>
                  查看详情
                </Button>
                <Button className="action-btn share" onClick={() => shareDeliverable(item)}>
                  分享
                </Button>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View className="empty">
          <Text className="empty-icon">●</Text>
          <Text className="empty-text">还没有作品，完成项目后会自动收录</Text>
        </View>
      )}
    </View>
  )
}
