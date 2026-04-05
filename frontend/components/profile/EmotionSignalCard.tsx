'use client'

interface EmotionSignal {
  id: number
  signalType: 'cooling' | 'frustrated' | 'high_frustrated' | 'excited'
  signalValue: number
  triggerEvent: string
  detectedAt: string
}

const SIGNAL_CONFIG = {
  cooling: {
    icon: '❄️',
    label: '冷却中',
    color: '#58a6ff',
    bgColor: '#1f3358',
    description: '你已经有一段时间没有活跃了',
  },
  frustrated: {
    icon: '😔',
    label: '遇到挫折',
    color: '#f0883e',
    bgColor: '#3d2817',
    description: '最近的任务遇到了一些困难',
  },
  high_frustrated: {
    icon: '😰',
    label: '需要帮助',
    color: '#f85149',
    bgColor: '#3d1f1f',
    description: '连续遇到困难，我们的客服会主动联系你',
  },
  excited: {
    icon: '🎉',
    label: '状态很好',
    color: '#3fb950',
    bgColor: '#1f3328',
    description: '你的表现很棒，继续保持！',
  },
}

interface Props {
  signals: EmotionSignal[]
}

export default function EmotionSignalCard({ signals }: Props) {
  if (!signals || signals.length === 0) {
    return null
  }

  // 只显示最新的信号
  const latestSignal = signals[0]
  const config = SIGNAL_CONFIG[latestSignal.signalType]

  return (
    <div
      className="p-4 rounded-lg mb-4"
      style={{
        background: config.bgColor,
        border: `1px solid ${config.color}`,
      }}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl">{config.icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-sm font-semibold"
              style={{ color: config.color }}
            >
              {config.label}
            </span>
            <span className="text-xs" style={{ color: '#8b949e' }}>
              {new Date(latestSignal.detectedAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm" style={{ color: '#e6edf3' }}>
            {config.description}
          </p>
          {latestSignal.signalType === 'cooling' && (
            <a
              href="/story/peers"
              className="text-xs mt-2 inline-block"
              style={{ color: config.color }}
            >
              看看和你差不多的人最近在做什么 →
            </a>
          )}
          {latestSignal.signalType === 'high_frustrated' && (
            <p className="text-xs mt-2" style={{ color: '#8b949e' }}>
              客服会在 24 小时内联系你，提供帮助
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
