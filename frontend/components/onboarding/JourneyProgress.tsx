'use client'

interface JourneyStep {
  id: string
  label: string
  description: string
  completed: boolean
  current: boolean
}

const JOURNEY_STEPS: Omit<JourneyStep, 'completed' | 'current'>[] = [
  { id: 'J1', label: '注册账号', description: '创建你的启程账号' },
  { id: 'J2', label: 'OPC测评', description: '完成25题能力测试' },
  { id: 'J3', label: '分享标签', description: '分享你的OPC人格' },
  { id: 'J4', label: '接第一单', description: '选择并接取任务' },
  { id: 'J5', label: '完成任务', description: '提交任务成果' },
  { id: 'J6', label: '首单结算', description: '获得第一笔收入' },
  { id: 'J7', label: '解锁雷达', description: '查看六维能力图' },
  { id: 'J8', label: '正式启程', description: '开启成长之旅' },
]

interface Props {
  currentStep: string
  completedSteps: string[]
}

export default function JourneyProgress({ currentStep, completedSteps }: Props) {
  const steps: JourneyStep[] = JOURNEY_STEPS.map((step) => ({
    ...step,
    completed: completedSteps.includes(step.id),
    current: currentStep === step.id,
  }))

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#e6edf3' }}>
          你的启程之旅
        </h2>
        <p className="text-sm" style={{ color: '#8b949e' }}>
          完成 8 个里程碑，解锁完整平台功能
        </p>
      </div>

      <div className="relative">
        {/* 连接线 */}
        <div
          className="absolute left-6 top-0 bottom-0 w-0.5"
          style={{ background: '#30363d' }}
        />

        {/* 步骤列表 */}
        <div className="space-y-6">
          {steps.map((step, index) => (
            <div key={step.id} className="relative flex items-start gap-4">
              {/* 圆点 */}
              <div
                className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  background: step.completed
                    ? '#238636'
                    : step.current
                    ? '#1f6feb'
                    : '#21262d',
                  border: `2px solid ${
                    step.completed
                      ? '#2ea043'
                      : step.current
                      ? '#58a6ff'
                      : '#30363d'
                  }`,
                }}
              >
                {step.completed ? (
                  <span className="text-xl">✓</span>
                ) : (
                  <span
                    className="text-sm font-bold"
                    style={{
                      color: step.current ? '#58a6ff' : '#8b949e',
                    }}
                  >
                    {index + 1}
                  </span>
                )}
              </div>

              {/* 内容 */}
              <div className="flex-1 pt-2">
                <div className="flex items-center gap-2 mb-1">
                  <h3
                    className="font-semibold"
                    style={{
                      color: step.completed || step.current ? '#e6edf3' : '#8b949e',
                    }}
                  >
                    {step.label}
                  </h3>
                  {step.current && (
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ background: '#1f3358', color: '#58a6ff' }}
                    >
                      进行中
                    </span>
                  )}
                </div>
                <p
                  className="text-sm"
                  style={{ color: '#8b949e' }}
                >
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 进度统计 */}
      <div
        className="mt-8 p-4 rounded-lg"
        style={{ background: '#161b22', border: '1px solid #30363d' }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm" style={{ color: '#8b949e' }}>
            整体进度
          </span>
          <span className="text-sm font-bold" style={{ color: '#58a6ff' }}>
            {completedSteps.length} / {JOURNEY_STEPS.length}
          </span>
        </div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: '#21262d' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(completedSteps.length / JOURNEY_STEPS.length) * 100}%`,
              background: '#238636',
            }}
          />
        </div>
      </div>
    </div>
  )
}
