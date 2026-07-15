import { View, Text, ScrollView } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import { reportAPI } from '../../../services/api'
import Loading from '../../../components/Loading'
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
        title: 'R1 能力全景图',
        type: 'R1',
        date: '2024-01-15',
        status: 'free',
        summary: '你的专业技能和执行力组合很独特——在测试过的用户中，只有约15%的人有这样的搭配...'
      },
      {
        id: 2,
        title: 'R2 执行力档案',
        type: 'R2',
        date: '2024-01-10',
        status: 'locked',
        price: 69,
        summary: '从你完成的任务来看，你的执行模式属于...'
      },
      {
        id: 3,
        title: 'R3 学习成长曲线',
        type: 'R3',
        date: '2024-01-05',
        status: 'locked',
        price: 99,
        summary: '追踪你的学习轨迹和成长速度，识别你的学习模式'
      },
      {
        id: 4,
        title: 'R4 简历包装方案',
        type: 'R4',
        date: '2024-01-01',
        status: 'locked',
        price: 99,
        summary: '基于你的任务经历，为你定制专业的简历包装方案'
      },
      {
        id: 5,
        title: 'R5 OPC方向报告',
        type: 'R5',
        date: '2024-01-01',
        status: 'locked',
        price: 199,
        summary: '基于你的OPC人格标签和实际任务经历，为你推荐最适合的职业方向'
      },
      {
        id: 6,
        title: 'R6 创业综合报告',
        type: 'R6',
        date: '2024-01-01',
        status: 'locked',
        price: 349,
        summary: '定制化创业分析 + 通用创业指南，包含方向建议、市场分析、客户获取策略、公司注册流程等'
      },
      {
        id: 7,
        title: '完整版报告（R1-R5）',
        type: 'full',
        date: '2024-01-01',
        status: 'locked',
        price: 299,
        summary: '整合你从注册到现在的完整成长轨迹，包含所有五份报告'
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
              // 调用后端购买接口
              const result = await reportAPI.order({
                reportType: report.type,
                paymentMethod: 'wechat'
              })
              if (result.success) {
                Taro.showToast({
                  title: '订单创建成功',
                  icon: 'success'
                })
                // 这里应该跳转到支付页面，暂时先提示
                Taro.showModal({
                  title: '支付提示',
                  content: `订单已创建，金额 ¥${result.data.amount}。支付成功后报告将在${report.type === 'R6' ? '立即' : '24小时内'}生成。`,
                  showCancel: false
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
