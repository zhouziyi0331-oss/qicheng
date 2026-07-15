import { View, Text, ScrollView, Button } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { reportAPI } from '../../../services/api'
import Loading from '../../../components/Loading'
import './detail.scss'

interface ReportDetail {
  id: string
  reportType: string
  title: string
  status: 'pending' | 'paid' | 'generating' | 'done' | 'failed'
  paidAt?: string
  generatedAt?: string
  contentJson?: any
  previewHook?: {
    previewFirstLines: string
    blurredHint: string
  }
}

export default function ReportDetail() {
  const router = useRouter()
  const { id } = router.params
  const [report, setReport] = useState<ReportDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadReport()
    }
  }, [id])

  const loadReport = async () => {
    try {
      const res = await reportAPI.getDetail(id!)
      if (res.success) {
        setReport(res.data)
      }
    } catch (error) {
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      Taro.showLoading({ title: '生成PDF中...' })
      const res = await reportAPI.downloadPDF(id!)
      Taro.hideLoading()

      if (res.statusCode === 200) {
        const savedPath = await Taro.saveFile({ tempFilePath: res.tempFilePath })
        Taro.showModal({
          title: '下载成功',
          content: '是否打开PDF文件？',
          success: (modalRes) => {
            if (modalRes.confirm) {
              Taro.openDocument({ filePath: savedPath.savedFilePath, fileType: 'pdf' })
            }
          }
        })
      } else {
        Taro.showToast({ title: '下载失败', icon: 'none' })
      }
    } catch (error) {
      Taro.hideLoading()
      Taro.showToast({ title: '下载失败', icon: 'none' })
    }
  }

  const handleSharePDF = async () => {
    try {
      Taro.showLoading({ title: '准备分享...' })
      const res = await reportAPI.downloadPDF(id!)
      Taro.hideLoading()

      if (res.statusCode === 200) {
        Taro.shareFileMessage({
          filePath: res.tempFilePath,
          fileName: `创业综合报告.pdf`,
          success: () => {
            Taro.showToast({ title: '分享成功', icon: 'success' })
          },
          fail: () => {
            Taro.showToast({ title: '分享失败', icon: 'none' })
          }
        })
      }
    } catch (error) {
      Taro.hideLoading()
      Taro.showToast({ title: '分享失败', icon: 'none' })
    }
  }

  const renderReportContent = () => {
    if (!report) return null

    // 如果报告未购买，显示预览
    if (report.status === 'pending' && report.previewHook) {
      return (
        <View className="preview-section">
          <View className="preview-content">
            <Text className="preview-text">{report.previewHook.previewFirstLines}</Text>
            <View className="blur-overlay">
              <Text className="blur-hint">{report.previewHook.blurredHint}</Text>
            </View>
          </View>
        </View>
      )
    }

    // 如果报告正在生成
    if (report.status === 'generating') {
      return (
        <View className="status-section">
          <Text className="status-text">报告生成中，请稍候...</Text>
          <Text className="status-hint">预计需要 1-2 分钟</Text>
        </View>
      )
    }

    // 如果报告生成失败
    if (report.status === 'failed') {
      return (
        <View className="status-section">
          <Text className="status-text">报告生成失败</Text>
          <Text className="status-hint">请联系客服处理</Text>
        </View>
      )
    }

    // 显示完整报告内容
    if (report.status === 'done' && report.contentJson) {
      return renderFullReport(report.contentJson)
    }

    return null
  }

  const renderFullReport = (content: any) => {
    // R6 创业综合报告的特殊渲染
    if (report?.reportType === 'R6' && content.customizedAnalysis) {
      const analysis = content.customizedAnalysis
      return (
        <View className="full-report r6-report">
          {/* 能力优势分析 */}
          <View className="report-section">
            <Text className="section-title">▲ 能力优势分析</Text>
            <Text className="section-content">{analysis.strengthAnalysis}</Text>
          </View>

          {/* 创业方向建议 */}
          <View className="report-section">
            <Text className="section-title">▲ 创业方向建议</Text>
            {analysis.futurePossibilities?.map((item: any, index: number) => (
              <View key={index} className="possibility-card">
                <Text className="card-title">{index + 1}. {item.title}</Text>
                <Text className="card-content">{item.description}</Text>
                <View className="card-meta">
                  <Text className="meta-tag">市场：{item.marketSize}</Text>
                  <Text className="meta-tag">难度：{item.difficulty}</Text>
                </View>
                {item.actionPlan && (
                  <View className="action-plan">
                    <Text className="plan-title">行动计划</Text>
                    <Text className="plan-content">{item.actionPlan}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* 痛点分析 */}
          <View className="report-section">
            <Text className="section-title">◆ 痛点分析</Text>
            <Text className="section-content">{analysis.painPointAnalysis}</Text>
          </View>

          {/* 目标市场 */}
          <View className="report-section">
            <Text className="section-title">● 目标市场</Text>
            <Text className="section-content">{analysis.targetMarket}</Text>
          </View>

          {/* 获客策略 */}
          <View className="report-section">
            <Text className="section-title">● 获客策略</Text>
            <Text className="section-content">{analysis.acquisitionStrategy}</Text>
          </View>

          {/* 产品服务方案 */}
          <View className="report-section">
            <Text className="section-title">◇ 产品服务方案</Text>
            {analysis.productServiceIdeas?.map((item: any, index: number) => (
              <View key={index} className="product-card">
                <Text className="card-title">{index + 1}. {item.title}</Text>
                <Text className="card-content">{item.description}</Text>
                {item.timeline && <Text className="card-info">● 时间线：{item.timeline}</Text>}
                {item.budget && <Text className="card-info">● 预算：{item.budget}</Text>}
                {item.mvp && <Text className="card-info">◆ MVP：{item.mvp}</Text>}
              </View>
            ))}
          </View>

          {/* 首要行动步骤 */}
          <View className="report-section">
            <Text className="section-title">✓ 首要行动步骤</Text>
            {analysis.firstSteps?.map((step: string, index: number) => (
              <View key={index} className="step-item">
                <Text className="step-number">{index + 1}</Text>
                <Text className="step-content">{step}</Text>
              </View>
            ))}
          </View>

          {/* DIY路径 */}
          {analysis.diyPath && (
            <View className="report-section path-section">
              <Text className="section-title">● {analysis.diyPath.title}</Text>
              <View className="path-meta">
                <Text className="meta-item">● {analysis.diyPath.totalCost}</Text>
                <Text className="meta-item">● {analysis.diyPath.difficulty}</Text>
              </View>
              {analysis.diyPath.steps?.map((step: any, index: number) => (
                <View key={index} className="path-step">
                  <Text className="step-title">{step.step}</Text>
                  <Text className="step-desc">{step.description}</Text>
                  <Text className="step-time">● {step.estimatedTime}</Text>
                  {step.resources && step.resources.length > 0 && (
                    <View className="resources">
                      <Text className="resources-title">参考资源：</Text>
                      {step.resources.map((resource: string, rIndex: number) => (
                        <Text key={rIndex} className="resource-item">• {resource}</Text>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* 代办路径 */}
          {analysis.agencyPath && (
            <View className="report-section path-section">
              <Text className="section-title">● {analysis.agencyPath.title}</Text>
              <Text className="path-cost">● {analysis.agencyPath.totalCost}</Text>
              {analysis.agencyPath.services?.map((service: any, index: number) => (
                <View key={index} className="service-card">
                  <Text className="service-title">{index + 1}. {service.service}</Text>
                  <Text className="service-desc">{service.description}</Text>
                  <Text className="service-cost">● {service.estimatedCost}</Text>
                  {service.providers && service.providers.length > 0 && (
                    <View className="providers">
                      <Text className="providers-title">推荐服务商：</Text>
                      {service.providers.map((provider: string, pIndex: number) => (
                        <Text key={pIndex} className="provider-item">• {provider}</Text>
                      ))}
                    </View>
                  )}
                </View>
              ))}
              {analysis.agencyPath.advantages && analysis.agencyPath.advantages.length > 0 && (
                <View className="advantages">
                  <Text className="advantages-title">代办优势：</Text>
                  {analysis.agencyPath.advantages.map((advantage: string, index: number) => (
                    <Text key={index} className="advantage-item">✓ {advantage}</Text>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* 通用创业指南 */}
          {content.startupGuides && content.startupGuides.length > 0 && (
            <View className="report-section">
              <Text className="section-title">● 通用创业指南</Text>
              {content.startupGuides.map((guide: any, index: number) => (
                <View key={index} className="guide-card">
                  <Text className="guide-title">{guide.title}</Text>
                  <Text className="guide-content">{guide.content}</Text>
                </View>
              ))}
            </View>
          )}

          {/* 生成时间 */}
          {content.generatedAt && (
            <View className="report-footer">
              <Text className="footer-text">● 报告生成时间：{new Date(content.generatedAt).toLocaleString('zh-CN')}</Text>
            </View>
          )}
        </View>
      )
    }

    // 其他报告类型的通用渲染
    return (
      <View className="full-report">
        <View className="report-section">
          <Text className="section-content">{JSON.stringify(content, null, 2)}</Text>
        </View>
      </View>
    )
  }

  if (loading) {
    return <Loading text="正在加载报告..." />
  }

  if (!report) {
    return (
      <View className="error-page">
        <Text className="error-text">报告不存在</Text>
      </View>
    )
  }

  return (
    <View className="report-detail-page">
      <View className="header">
        <Text className="title">{report.title}</Text>
        <Text className="subtitle">{getStatusText(report.status)}</Text>
      </View>

      {/* PDF操作按钮 - 仅在报告完成时显示 */}
      {report.status === 'done' && report.reportType === 'R6' && (
        <View className="action-buttons">
          <Button className="btn-download" onClick={handleDownloadPDF}>下载PDF</Button>
          <Button className="btn-share" onClick={handleSharePDF}>分享到微信</Button>
        </View>
      )}

      <ScrollView className="content-container" scrollY>
        {renderReportContent()}
      </ScrollView>
    </View>
  )
}

function getStatusText(status: string): string {
  const statusMap = {
    pending: '未购买',
    paid: '已购买',
    generating: '生成中',
    done: '已完成',
    failed: '生成失败'
  }
  return statusMap[status] || status
}
