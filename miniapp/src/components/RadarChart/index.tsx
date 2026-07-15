import { View, Canvas } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useRef } from 'react'
import './index.scss'

interface RadarChartProps {
  data: {
    information_processing: number
    creation_drive: number
    tool_learning: number
    task_execution: number
    collaboration: number
    risk_attitude: number
  }
  compareData?: {
    information_processing: number
    creation_drive: number
    tool_learning: number
    task_execution: number
    collaboration: number
    risk_attitude: number
  }
  size?: number
  showLabels?: boolean
  animate?: boolean
}

const DIMENSIONS = [
  { key: 'information_processing', label: '信息处理', angle: 0 },
  { key: 'creation_drive', label: '创作驱动', angle: 60 },
  { key: 'tool_learning', label: '工具学习', angle: 120 },
  { key: 'task_execution', label: '任务执行', angle: 180 },
  { key: 'collaboration', label: '协作倾向', angle: 240 },
  { key: 'risk_attitude', label: '风险态度', angle: 300 },
]

export default function RadarChart({
  data,
  compareData,
  size = 300,
  showLabels = true,
  animate = false
}: RadarChartProps) {
  const canvasId = useRef(`radar-chart-${Date.now()}`).current
  const animationProgress = useRef(0)

  useEffect(() => {
    drawChart()
  }, [data, compareData])

  const drawChart = () => {
    const query = Taro.createSelectorQuery()
    query.select(`#${canvasId}`)
      .fields({ node: true, size: true })
      .exec((res) => {
        if (res[0]) {
          const canvas = res[0].node
          const ctx = canvas.getContext('2d')

          const dpr = Taro.getSystemInfoSync().pixelRatio
          canvas.width = size * dpr
          canvas.height = size * dpr
          ctx.scale(dpr, dpr)

          if (animate) {
            animateChart(ctx)
          } else {
            renderChart(ctx, 1)
          }
        }
      })
  }

  const animateChart = (ctx: any) => {
    const duration = 1000
    const startTime = Date.now()

    const frame = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      animationProgress.current = easeOutCubic(progress)

      renderChart(ctx, animationProgress.current)

      if (progress < 1) {
        requestAnimationFrame(frame)
      }
    }

    requestAnimationFrame(frame)
  }

  const renderChart = (ctx: any, progress: number) => {
    const centerX = size / 2
    const centerY = size / 2
    const maxRadius = size * 0.35

    // 清空画布
    ctx.clearRect(0, 0, size, size)

    // 绘制背景网格（5层）
    for (let i = 1; i <= 5; i++) {
      const radius = (maxRadius / 5) * i
      ctx.beginPath()

      DIMENSIONS.forEach((dim, index) => {
        const angle = (dim.angle - 90) * Math.PI / 180
        const x = centerX + radius * Math.cos(angle)
        const y = centerY + radius * Math.sin(angle)

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.closePath()
      ctx.strokeStyle = i === 5 ? '#E5E5EA' : '#F5F5F7'
      ctx.lineWidth = i === 5 ? 2 : 1
      ctx.stroke()
    }

    // 绘制轴线
    DIMENSIONS.forEach((dim) => {
      const angle = (dim.angle - 90) * Math.PI / 180
      const x = centerX + maxRadius * Math.cos(angle)
      const y = centerY + maxRadius * Math.sin(angle)

      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(x, y)
      ctx.strokeStyle = '#E5E5EA'
      ctx.lineWidth = 1
      ctx.stroke()
    })

    // 绘制对比数据（如果有）
    if (compareData) {
      ctx.beginPath()
      DIMENSIONS.forEach((dim, index) => {
        const value = compareData[dim.key] || 0
        const radius = (maxRadius * value / 100) * progress
        const angle = (dim.angle - 90) * Math.PI / 180
        const x = centerX + radius * Math.cos(angle)
        const y = centerY + radius * Math.sin(angle)

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      ctx.closePath()
      ctx.fillStyle = 'rgba(200, 200, 200, 0.2)'
      ctx.fill()
      ctx.strokeStyle = '#CCCCCC'
      ctx.lineWidth = 2
      ctx.stroke()
    }

    // 绘制当前数据
    ctx.beginPath()
    DIMENSIONS.forEach((dim, index) => {
      const value = data[dim.key] || 0
      const radius = (maxRadius * value / 100) * progress
      const angle = (dim.angle - 90) * Math.PI / 180
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.closePath()

    // 渐变填充
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius)
    gradient.addColorStop(0, 'rgba(147, 112, 219, 0.4)')
    gradient.addColorStop(1, 'rgba(147, 112, 219, 0.1)')
    ctx.fillStyle = gradient
    ctx.fill()

    ctx.strokeStyle = '#9370DB'
    ctx.lineWidth = 2.5
    ctx.stroke()

    // 绘制数据点
    DIMENSIONS.forEach((dim) => {
      const value = data[dim.key] || 0
      const radius = (maxRadius * value / 100) * progress
      const angle = (dim.angle - 90) * Math.PI / 180
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)

      ctx.beginPath()
      ctx.arc(x, y, 4, 0, 2 * Math.PI)
      ctx.fillStyle = '#9370DB'
      ctx.fill()
    })

    // 绘制维度标签
    ctx.font = '12px sans-serif'
    ctx.fillStyle = '#6B5540'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    DIMENSIONS.forEach((dim) => {
      const angle = (dim.angle - 90) * Math.PI / 180
      const labelRadius = maxRadius + 30
      const x = centerX + labelRadius * Math.cos(angle)
      const y = centerY + labelRadius * Math.sin(angle)

      if (dim.angle >= 45 && dim.angle <= 135) {
        ctx.textBaseline = 'top'
      } else if (dim.angle >= 225 && dim.angle <= 315) {
        ctx.textBaseline = 'bottom'
      } else {
        ctx.textBaseline = 'middle'
      }

      if (dim.angle > 90 && dim.angle < 270) {
        ctx.textAlign = 'right'
      } else if (dim.angle === 90 || dim.angle === 270) {
        ctx.textAlign = 'center'
      } else {
        ctx.textAlign = 'left'
      }

      ctx.fillText(dim.label, x, y)
    })
  }

  const easeOutCubic = (t: number) => {
    return 1 - Math.pow(1 - t, 3)
  }

  return (
    <View className="radar-chart-container">
      <Canvas
        id={canvasId}
        canvasId={canvasId}
        type="2d"
        className="radar-canvas"
        style={{ width: `${size}px`, height: `${size}px` }}
      />
    </View>
  )
}
