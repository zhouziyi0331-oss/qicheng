import { View, Text, ScrollView } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import './quiz.scss'

// 6个维度定义
const DIMS = ['信息处理', '创作驱动', '工具学习', '任务执行', '协作倾向', '风险承受度']
const DIM_COLORS = ['#BC6446', '#D88760', '#3A8A84', '#5B8FAB', '#BF9E71', '#9B8EC4']

// 36道题目数据
const QUESTIONS = [
  // 维度0：信息处理
  { dim: 0, q: '当你需要理解一个新领域时，你通常会怎么做？', opts: ['先找系统的书或课程，从头到尾学一遍', '直接找一个实际项目，边做边学', '先看大量案例，摸索整体模式后深入', '找这个领域的人聊，听他们的经验和建议'], scores: [4, 2, 3, 1] },
  { dim: 0, q: '面对一大堆杂乱的信息，你的第一反应是？', opts: ['立即开始分类整理，建立清晰的框架', '先快速浏览，找到最需要的那几条', '慢慢摸索整体脉络，再梳理清楚', '找人讨论，通过对话来理解'], scores: [4, 3, 2, 1] },
  { dim: 0, q: '你更喜欢哪种学习方式？', opts: ['系统学习，从基础到进阶', '边做边学，遇到问题再查', '大量阅读，积累感性认知', '向有经验的人请教'], scores: [4, 2, 3, 1] },
  { dim: 0, q: '当你需要做一个重要决策时，你会？', opts: ['收集大量数据，系统分析后再决定', '快速判断，相信自己的直觉', '参考多个案例，找到规律', '和信任的人商量，听取建议'], scores: [4, 3, 2, 1] },
  { dim: 0, q: '你在阅读一篇长文章时，通常会？', opts: ['从头到尾仔细阅读，不漏任何细节', '先看标题和结论，再决定是否深读', '快速扫描，捕捉关键词和核心观点', '边读边做笔记，记录重要信息'], scores: [3, 2, 4, 1] },
  { dim: 0, q: '你如何处理工作中的复杂问题？', opts: ['把问题拆解成小部分，逐一攻破', '先尝试解决，遇到障碍再调整', '从整体视角看问题，找到核心矛盾', '和团队一起头脑风暴'], scores: [4, 2, 3, 1] },

  // 维度1：创作驱动
  { dim: 1, q: '当你有一个新想法时，你通常会？', opts: ['立即开始动手实现，边做边完善', '把想法详细规划好后再行动', '先和别人分享，听听他们的看法', '把想法记录下来，等合适的时机再做'], scores: [4, 2, 3, 1] },
  { dim: 1, q: '你在创作（写作/设计/编程等）时，最享受哪个阶段？', opts: ['构思阶段，想象各种可能性', '执行阶段，把想法变成现实', '打磨阶段，让作品越来越完美', '分享阶段，看到别人的反馈'], scores: [4, 3, 2, 1] },
  { dim: 1, q: '你更倾向于哪种工作方式？', opts: ['自由创作，不受太多限制', '有明确目标，按计划推进', '在规则框架内寻找创意空间', '根据团队需求灵活调整'], scores: [4, 2, 3, 1] },
  { dim: 1, q: '当你感到无聊时，你会？', opts: ['开始一个新的创作项目', '找一件有挑战性的任务来做', '和朋友聊天或出去玩', '学习一个新技能'], scores: [4, 2, 1, 3] },
  { dim: 1, q: '你对"完美"的理解是？', opts: ['完美是不断追求的方向，永远有改进空间', '完美是在限制条件下的最优解', '完美是让使用者满意的状态', '完美是团队共同认可的结果'], scores: [4, 3, 2, 1] },
  { dim: 1, q: '你最有成就感的时刻是？', opts: ['创造出一个全新的东西', '高效完成一个复杂任务', '帮助别人解决了问题', '学会了一个新技能'], scores: [4, 3, 1, 2] },

  // 维度2：工具学习
  { dim: 2, q: '面对一个新工具或新软件，你会？', opts: ['立即上手摸索，边用边学', '先看教程，系统学习后再使用', '找人演示，跟着学', '先了解这个工具的核心逻辑，再开始使用'], scores: [4, 2, 1, 3] },
  { dim: 2, q: '你学习新技能的速度通常？', opts: ['很快，能在短时间内掌握基本用法', '中等，需要一定时间才能熟练', '较慢，但一旦学会就很扎实', '取决于技能类型，有的快有的慢'], scores: [4, 2, 3, 1] },
  { dim: 2, q: '当你发现一个更好的工具可以替代现有工具时，你会？', opts: ['立即切换，享受探索新工具的过程', '评估迁移成本，谨慎决定是否切换', '先试用一段时间，确认更好后再切换', '问问团队的看法，一起决定'], scores: [4, 2, 3, 1] },
  { dim: 2, q: '你对AI工具（如ChatGPT等）的态度是？', opts: ['积极拥抱，已经在大量使用', '有兴趣，但还在探索阶段', '谨慎使用，担心依赖性', '不太感兴趣，更相信自己的能力'], scores: [4, 3, 2, 1] },
  { dim: 2, q: '你通常如何提升自己的工作效率？', opts: ['不断寻找和尝试新工具', '优化工作流程和方法', '减少干扰，专注深度工作', '和高效的人协作，学习他们的方法'], scores: [4, 3, 2, 1] },
  { dim: 2, q: '你对"工具"的理解是？', opts: ['工具是放大能力的杠杆，越多越好', '工具是辅助手段，核心还是能力本身', '好的工具能改变工作方式', '工具要适合自己，不一定要最新最好'], scores: [4, 2, 3, 1] },

  // 维度3：任务执行
  { dim: 3, q: '当你接到一个新任务时，你通常会？', opts: ['立即开始行动，边做边调整', '先制定详细计划，再开始执行', '先评估任务难度和所需资源', '先和相关人员沟通，确认需求后再开始'], scores: [3, 4, 2, 1] },
  { dim: 3, q: '面对截止日期，你通常会？', opts: ['提前完成，给自己留出缓冲时间', '刚好在截止日期前完成', '在压力下效率更高', '根据任务重要性决定投入程度'], scores: [4, 3, 2, 1] },
  { dim: 3, q: '当任务遇到障碍时，你会？', opts: ['想办法绕过障碍，继续推进', '分析障碍原因，找到根本解决方案', '寻求帮助，借助外部资源', '重新评估任务，必要时调整目标'], scores: [3, 4, 2, 1] },
  { dim: 3, q: '你如何管理多个并行任务？', opts: ['按优先级排序，专注最重要的', '制定详细的时间表，按计划推进', '灵活切换，根据当下状态决定做什么', '先和团队分工，各自负责不同部分'], scores: [3, 4, 2, 1] },
  { dim: 3, q: '你对"完成"的定义是？', opts: ['达到预期目标，可以交付', '超出预期，让对方惊喜', '在时间和质量之间找到平衡', '团队认可，大家都满意'], scores: [3, 4, 2, 1] },
  { dim: 3, q: '你在执行任务时，最大的挑战是？', opts: ['保持专注，不被其他事情分心', '在质量和效率之间找到平衡', '处理突发情况和变化', '协调不同人的需求和期待'], scores: [2, 4, 3, 1] },

  // 维度4：协作倾向
  { dim: 4, q: '你更喜欢哪种工作环境？', opts: ['独立工作，自己掌控节奏', '小团队协作，紧密配合', '大团队，分布协作', '灵活切换，根据任务决定'], scores: [1, 4, 3, 2] },
  { dim: 4, q: '当团队出现分歧时，你通常会？', opts: ['坚持自己的观点，据理力争', '寻找折中，找到大家都能接受的方案', '倾听各方意见，综合判断', '让最有经验的人来决定'], scores: [1, 4, 3, 2] },
  { dim: 4, q: '你在团队中通常扮演什么角色？', opts: ['独立贡献者，专注自己的部分', '协调者，帮助团队更好地协作', '执行者，把任务高质量完成', '领导者，推动团队向目标前进'], scores: [1, 4, 2, 3] },
  { dim: 4, q: '你如何看待团队协作？', opts: ['协作会降低效率，不如独立工作', '协作能产生1+1>2的效果', '协作的质量取决于团队成员', '协作是必要的，但需要好的机制'], scores: [1, 4, 2, 3] },
  { dim: 4, q: '当你需要帮助时，你会？', opts: ['尽量自己解决，不麻烦别人', '主动寻求帮助，相信团队的力量', '先尝试自己解决，实在不行再求助', '根据问题类型决定是否寻求帮助'], scores: [1, 4, 2, 3] },
  { dim: 4, q: '你对"团队成功"的理解是？', opts: ['团队成功=个人成功的总和', '团队成功>个人成功的总和', '团队成功需要每个人都发挥最大价值', '团队成功需要好的领导和机制'], scores: [1, 4, 3, 2] },

  // 维度5：风险承受度
  { dim: 5, q: '面对一个有风险但回报很高的机会，你会？', opts: ['果断抓住，相信自己能应对风险', '仔细评估风险，确认可控后再行动', '先小规模尝试，验证后再投入', '先和信任的人商量，听取建议后决定'], scores: [4, 2, 3, 1] },
  { dim: 5, q: '你对"失败"的态度是？', opts: ['失败是成功的必经之路，不怕失败', '失败是有代价的，要尽量避免', '失败可以接受，但要从中学习', '失败会影响他人，要谨慎行动'], scores: [4, 2, 3, 1] },
  { dim: 5, q: '当你进入一个完全陌生的领域时，你会？', opts: ['兴奋，享受探索未知的感觉', '谨慎，先做充分准备后再行动', '有些不安，但会鼓励自己去尝试', '寻找有经验的人带路'], scores: [4, 2, 3, 1] },
  { dim: 5, q: '你如何看待"稳定"？', opts: ['稳定意味着停滞，要不断突破', '稳定是基础，在稳定中寻求发展', '稳定很重要，但不能因此错过机会', '稳定对团队和家人很重要'], scores: [4, 2, 3, 1] },
  { dim: 5, q: '当计划出现意外变化时，你会？', opts: ['快速适应，把变化当成新机会', '分析变化原因，调整计划', '感到不安，但会努力应对', '和团队一起讨论应对方案'], scores: [4, 3, 2, 1] },
  { dim: 5, q: '你对"创业"的态度是？', opts: ['非常感兴趣，愿意承担风险去尝试', '感兴趣，但需要先做充分准备', '有想法，但更倾向于在大平台发展', '更喜欢稳定的工作环境'], scores: [4, 3, 2, 1] }
]

export default function OPCQuiz() {
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(36).fill(null))

  const q = QUESTIONS[currentQ]
  const total = QUESTIONS.length
  const dimIdx = q.dim
  const progress = ((currentQ + 1) / total) * 100

  const handlePickOpt = (i: number) => {
    const newAnswers = [...answers]
    newAnswers[currentQ] = i
    setAnswers(newAnswers)
  }

  const handlePrev = () => {
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1)
    }
  }

  const handleNext = () => {
    if (answers[currentQ] === null) {
      Taro.showToast({ title: '请选择一个选项', icon: 'none' })
      return
    }

    if (currentQ < total - 1) {
      setCurrentQ(currentQ + 1)
    } else {
      // 完成选择题，进入开放题
      Taro.navigateTo({
        url: `/packageOnboarding/pages/opc-test/open-question1?answers=${JSON.stringify(answers)}`
      })
    }
  }

  // 计算各维度当前进度
  const dimProgress = DIMS.map((_, i) => {
    const done = QUESTIONS.filter((qq, qi) => qq.dim === i && qi <= currentQ).length
    return { done, active: i === dimIdx }
  })

  return (
    <View className="opc-quiz-page">
      {/* 顶部状态栏 */}
      <View className="quiz-header">
        <View className="header-content">
          <View className="topbar">
            <View className="back-btn" onClick={() => Taro.navigateBack()}>
              <Text className="back-icon">‹</Text>
            </View>
            <Text className="topbar-title">OPC 能力测试</Text>
            <Text className="quiz-counter">{currentQ + 1} / {total}</Text>
          </View>

          {/* 总进度条 */}
          <View className="progress-bar">
            <View className="progress-fill" style={{ width: `${progress}%` }} />
          </View>

          {/* 6维度进度小条 */}
          <View className="dim-bars">
            {dimProgress.map((d, i) => (
              <View
                key={i}
                className="dim-bar"
                style={{
                  background: d.active ? '#F2CD78' : d.done > 0 ? 'rgba(255,255,255,.4)' : 'rgba(255,255,255,.2)'
                }}
              />
            ))}
          </View>

          {/* 当前维度标签 */}
          <View className="dim-label">
            <View className="dim-dot" />
            <Text className="dim-text">维度{dimIdx + 1}：{DIMS[dimIdx]} · 第 {QUESTIONS.slice(0, currentQ + 1).filter(qq => qq.dim === dimIdx).length} / 6 题</Text>
          </View>
        </View>
      </View>

      {/* 题目内容 */}
      <ScrollView scrollY className="quiz-scroll">
        <View className="quiz-content">
          <Text className="question-text">{q.q}</Text>

          <View className="options-list">
            {q.opts.map((opt, i) => {
              const selected = answers[currentQ] === i
              return (
                <View
                  key={i}
                  className={`option-item ${selected ? 'selected' : ''}`}
                  onClick={() => handlePickOpt(i)}
                >
                  <View className="option-label">{['A', 'B', 'C', 'D'][i]}</View>
                  <Text className="option-text">{opt}</Text>
                </View>
              )
            })}
          </View>
        </View>
      </ScrollView>

      {/* 底部按钮 */}
      <View className="quiz-footer">
        <View
          className="prev-button"
          style={{ opacity: currentQ === 0 ? 0.4 : 1 }}
          onClick={handlePrev}
        >
          <Text className="button-text">上一题</Text>
        </View>
        <View className="next-button" onClick={handleNext}>
          <Text className="button-text">{currentQ === total - 1 ? '完成选择题 →' : '下一题 →'}</Text>
        </View>
      </View>
    </View>
  )
}
