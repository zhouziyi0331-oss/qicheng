'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import JourneyProgress from '@/components/onboarding/JourneyProgress'

interface OnboardingStatus {
  currentStep: string
  j1CompletedAt?: string
  j2CompletedAt?: string
  j3CompletedAt?: string
  j4CompletedAt?: string
  j5CompletedAt?: string
  j6CompletedAt?: string
  j7CompletedAt?: string
  j8CompletedAt?: string
  completedSteps: string[]
}

export default function JourneyPage() {
  const { role } = useAuthStore()
  const router = useRouter()
  const [status, setStatus] = useState<OnboardingStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (role !== 'student') {
      router.push('/tasks')
      return
    }
    fetchStatus()
  }, [role, router])

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/v1/student/onboarding/status', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (res.ok) {
        const data = await res.json()
        setStatus(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch onboarding status:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!status) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500">无法加载进度信息</div>
      </div>
    )
  }

  const completedSteps = [
    status.j1CompletedAt && 'J1',
    status.j2CompletedAt && 'J2',
    status.j3CompletedAt && 'J3',
    status.j4CompletedAt && 'J4',
    status.j5CompletedAt && 'J5',
    status.j6CompletedAt && 'J6',
    status.j7CompletedAt && 'J7',
    status.j8CompletedAt && 'J8',
  ].filter(Boolean) as string[]

  return (
    <div className="min-h-screen py-12" style={{ background: '#0d1117' }}>
      <JourneyProgress
        currentStep={status.currentStep}
        completedSteps={completedSteps}
      />

      {/* 下一步提示 */}
      <div className="max-w-4xl mx-auto px-6 mt-8">
        <div
          className="p-6 rounded-lg"
          style={{ background: '#161b22', border: '1px solid #30363d' }}
        >
          <h3 className="font-semibold mb-2" style={{ color: '#e6edf3' }}>
            下一步行动
          </h3>
          <p className="text-sm mb-4" style={{ color: '#8b949e' }}>
            {getNextActionText(status.currentStep)}
          </p>
          <button
            onClick={() => router.push(getNextActionLink(status.currentStep))}
            className="px-4 py-2 rounded text-sm font-medium"
            style={{ background: '#238636', color: 'white' }}
          >
            {getNextActionButton(status.currentStep)}
          </button>
        </div>
      </div>
    </div>
  )
}

function getNextActionText(step: string): string {
  switch (step) {
    case 'J1_registered':
      return '完成 OPC 能力测评，让 AI 了解你的独特优势'
    case 'J2_test_done':
      return '分享你的 OPC 人格标签，解锁更多功能'
    case 'J3_opc_label_shared':
      return '前往任务市场，接取你的第一个任务'
    case 'J4_first_task_accepted':
      return '完成任务步骤，提交你的成果'
    case 'J5_first_task_submitted':
      return '等待企业审核，首单将在 24 小时内结算'
    case 'J6_first_payment_settled':
      return '查看你的六维能力雷达图'
    case 'J7_radar_unlocked':
      return '恭喜完成所有里程碑！继续探索更多任务'
    case 'J8_journey_complete':
      return '你已完成启程之旅，继续成长吧！'
    default:
      return '继续你的启程之旅'
  }
}

function getNextActionLink(step: string): string {
  switch (step) {
    case 'J1_registered':
      return '/onboarding'
    case 'J2_test_done':
    case 'J3_opc_label_shared':
      return '/tasks'
    case 'J4_first_task_accepted':
    case 'J5_first_task_submitted':
      return '/my-tasks'
    case 'J6_first_payment_settled':
    case 'J7_radar_unlocked':
      return '/ability'
    case 'J8_journey_complete':
      return '/tasks'
    default:
      return '/tasks'
  }
}

function getNextActionButton(step: string): string {
  switch (step) {
    case 'J1_registered':
      return '开始测评'
    case 'J2_test_done':
      return '分享标签'
    case 'J3_opc_label_shared':
      return '浏览任务'
    case 'J4_first_task_accepted':
      return '查看任务'
    case 'J5_first_task_submitted':
      return '查看进度'
    case 'J6_first_payment_settled':
    case 'J7_radar_unlocked':
      return '查看能力图'
    case 'J8_journey_complete':
      return '探索任务'
    default:
      return '继续'
  }
}
