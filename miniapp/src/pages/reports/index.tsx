import { View, Text, ScrollView } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import { reportAPI } from '../../services/api'
import Loading from '../../components/Loading'
import './index.scss'

interface Report {
  id: number
  title: string
  type: string
  date: string
  status: 'free' | 'paid' | 'locked'
  price?: number
  summary: string
}

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      const res = await reportAPI.getList()
      if (res.success) {
        setReports(res.data)
      } else {
        setReports(getMockReports())
      }
    } catch (error) {
      setReports(getMockReports())
    } finally {
      setLoading(false)
    }
  }

  const getMockReports = (): Report[] => {
    return [
      {
        id: 1,
        title: 'OPC能力测评报告',
        type: '基础报告',
        date: '2024-01-15',
        status: 'free',
        summary: '你的OPC类型是O型-探索者，擅长创意和学习，建议从设计类任务开始'
      },
      {
        id: 2,
        title: '六维能力分析报告',
        type: '进阶报告',
        date: '2024-01-10',
        status: 'paid',
        summary: '详细分析你的创意、技术、沟通、执行、学习、协作六大能力维度'
      },
      {
        id: 3,
        title: '成长路径规划报告',
        type: '高级报告',
        date: '2024-01-05',
        status: 'locked',
        price: 99,
        summary: '基于你的能力和目标，为你定制3个月的成长路径和任务推荐'
      },
      {
        id: 4,
        title: '任务匹配度分析',
        type: '专项报告',
        date: '2024-01-01',
        status: 'locked',
        price: 49,
        summary: '分析你与不同类型任务的匹配度，帮你找到最适合的任务方向'
      }
    ]
  }

  const handleViewReport = (report: Report) => {
    if (report.status === 'locked') {
      Taro.showModal({
        title: '购买报告',
        content: `「${report.title}」需要支付 ¥${report.price}，是否购买？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await reportAPI.purchase(report.id)
              if (result.success) {
                Taro.showToast({
                  title: '购买成功',
                  icon: 'success'
                })
                // 跳转到报告详情
                Taro.navigateTo({
                  url: `/pages/reports/detail?id=${report.id}`
                })
              }
            } catch (error) {
              Taro.showToast({
                title: '购买失败',
                icon: 'none'
              })
            }
          }
        }
      })
    } else {
      // 免费或已购买，直接查看
      Taro.navigateTo({
        url: `/pages/reports/detail?id=${report.id}`
      })
    }
  }

  const getStatusText = (status: string) => {
    const statusMap = {
      free: '免费',
      paid: '已购买',
      locked: '未购买'
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status: string) => {
    const colorMap = {
      free: '#D4F291',
      paid: '#A8D8EA',
      locked: '#E5E5EA'
    }
    return colorMap[status] || '#E5E5EA'
  }

  if (loading) {
    return <Loading text="正在加载报告..." />
  }

  return (
    <View className="reports-page">
      <View className="header">
        <Text className="title">OPC报告</Text>
        <Text className="subtitle">深度了解你的能力和成长方向</Text>
      </View>

      <ScrollView className="reports-container" scrollY>
        <View className="reports-list">
          {reports.map(report => (
            <View
              key={report.id}
              className="report-card"
              onClick={() => handleViewReport(report)}
            >
              <View className="card-header">
                <View className="header-left">
                  <Text className="report-title">{report.title}</Text>
                  <Text className="report-type">{report.type}</Text>
                </View>
                <View
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(report.status) }}
                >
                  <Text className="status-text">{getStatusText(report.status)}</Text>
                </View>
              </View>

              <Text className="report-summary">{report.summary}</Text>

              <View className="card-footer">
                <Text className="report-date">{report.date}</Text>
                {report.status === 'locked' && report.price && (
                  <Text className="report-price">¥{report.price}</Text>
                )}
                {report.status !== 'locked' && (
                  <Text className="view-btn">查看报告 →</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {reports.length === 0 && (
          <View className="empty">
            <Text className="empty-text">还没有报告</Text>
            <Text className="empty-hint">完成OPC测评后会生成你的第一份报告</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
