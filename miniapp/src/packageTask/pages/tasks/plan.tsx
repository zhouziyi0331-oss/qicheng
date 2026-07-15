import { View, Text, ScrollView, Button } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import './plan.scss'

interface PlanStep {
  day: number
  dayRange?: string
  date: string
  title: string
  description: string
  status: 'completed' | 'today' | 'future'
  isToday?: boolean
  todayFocus?: string
}

export default function TaskPlanPage() {
  const [task, setTask] = useState({
    id: '1',
    title: '为青少年AI课程设计视觉化学习路径图',
    company: '晨曦教育科技',
    budget: 800,
    days: 7,
    deadline: '2026年7月19日（周六）',
    daysLeft: 7
  })

  const [planSteps, setPlanSteps] = useState<PlanStep[]>([
    {
      day: 1,
      date: '7月12日（今天）',
      title: '理解需求 · 确认交付标准',
      description: '仔细阅读任务说明，如有疑问通过任务消息向企业确认，明确6个模块的内容和风格要求',
      status: 'completed'
    },
    {
      day: 2,
      date: '7月13日',
      title: '草图构思 · 确定视觉风格',
      description: '手绘构思草图，确定整体布局和视觉语言，可参考3-5个同类案例',
      status: 'today',
      isToday: true,
      todayFocus: '完成至少 2 个模块的草图，并截图发给企业确认方向'
    },
    {
      day: 3,
      dayRange: '3-4',
      date: '7月14-15日',
      title: '正式设计 · 完成全部模块',
      description: '按确认的风格完成6个模块的正式设计稿，保持视觉一致性',
      status: 'future'
    },
    {
      day: 5,
      date: '7月16日',
      title: '自检 · 细节打磨',
      description: '检查文字、颜色、对齐等细节，确保符合12-16岁学生的阅读习惯',
      status: 'future'
    },
    {
      day: 6,
      dayRange: '6-7',
      date: '7月17-18日',
      title: '提交交付 · 等待审核',
      description: '整理可编辑设计稿，通过平台提交，等待企业和平台审核',
      status: 'future'
    }
  ])

  const handleBack = () => {
    Taro.navigateBack()
  }

  const handleSubmit = () => {
    Taro.navigateTo({
      url: '/packageTask/pages/tasks/submit'
    })
  }

  return (
    <View className="task-plan-page">
      {/* 顶部导航 */}
      <View className="plan-header">
        <View className="header-bg" />
        <View className="header-content">
          <View className="topbar">
            <View className="back-btn" onClick={handleBack}>
              <Text className="back-icon">‹</Text>
            </View>
            <Text className="topbar-title">AI 交付计划</Text>
            <View className="back-btn" style={{ opacity: 0 }} />
          </View>

          {/* 任务摘要 */}
          <View className="task-summary">
            <View className="summary-icon">
              <Text className="icon-letter">{task.company[0]}</Text>
            </View>
            <View className="summary-info">
              <Text className="summary-title">{task.title}</Text>
              <Text className="summary-meta">
                {task.company} · {task.days}天交付 · ¥{task.budget}
              </Text>
            </View>
          </View>

          {/* 截止日期 */}
          <View className="deadline-card">
            <View className="deadline-icon">●</View>
            <Text className="deadline-label">截止日期：</Text>
            <Text className="deadline-value">{task.deadline}</Text>
            <Text className="deadline-countdown">还剩 {task.daysLeft} 天</Text>
          </View>
        </View>
      </View>

      <ScrollView scrollY className="plan-scroll">
        <View className="plan-content">
          {/* AI 计划说明 */}
          <View className="ai-notice">
            <View className="notice-icon-wrap">
              <View className="notice-icon">ⓘ</View>
            </View>
            <View className="notice-content">
              <Text className="notice-title">AI 已为你生成交付计划</Text>
              <Text className="notice-text">
                根据任务要求和你的能力类型（视觉交互），AI 将 {task.days} 天拆解为 5 个关键节点，帮你稳步完成交付。
              </Text>
            </View>
          </View>

          {/* 计划步骤 */}
          <View className="plan-card">
            <View className="plan-card-header">
              <View className="plan-marker" />
              <Text className="plan-card-title">本周交付计划</Text>
            </View>

            <View className="plan-steps">
              {planSteps.map((step, index) => (
                <View
                  key={index}
                  className={`plan-step ${index < planSteps.length - 1 ? 'has-line' : ''}`}
                >
                  <View className={`step-dot ${step.status}`}>
                    {step.status === 'completed' ? (
                      <View className="check-icon">✓</View>
                    ) : (
                      <Text className="step-number">{step.dayRange || step.day}</Text>
                    )}
                  </View>

                  <View className="step-content">
                    <Text className={`step-day ${step.isToday ? 'today' : ''}`}>
                      Day {step.dayRange || step.day} · {step.date}
                      {step.isToday && ' · 今日任务'}
                    </Text>
                    <Text className="step-title">{step.title}</Text>
                    <Text className="step-description">{step.description}</Text>

                    {step.isToday && step.todayFocus && (
                      <View className="today-focus">
                        <Text className="focus-label">今日重点</Text>
                        <Text className="focus-text">{step.todayFocus}</Text>
                      </View>
                    )}

                    {step.status === 'completed' && (
                      <View className="status-badge completed">
                        <View className="badge-icon">✓</View>
                        <Text className="badge-text">已完成</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* 能力匹配说明 */}
          <View className="match-notice">
            <Text className="match-title">⬡ 能力匹配说明</Text>
            <Text className="match-text">
              你的<Text className="highlight">视觉交互</Text>类型与本任务高度匹配。信息处理（82分）帮助你理解复杂课程结构，协作驱动（75分）让你能设计出吸引学生的视觉语言。
            </Text>
          </View>

          {/* 提交入口 */}
          <Button className="submit-btn" onClick={handleSubmit}>
            提交交付物 →
          </Button>

          <View style={{ height: '16rpx' }} />
        </View>
      </ScrollView>
    </View>
  )
}
