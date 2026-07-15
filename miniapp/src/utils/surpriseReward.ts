/**
 * 偶发奖励触发机制
 * 每次用户完成特定操作时，有一定概率触发偶发奖励
 */

interface SurpriseRewardData {
  icon: string
  tag: string
  title: string
  subtitle: string
  rewards: Array<{
    icon: string
    value: string
    label: string
  }>
}

// 奖励模板
const REWARD_TEMPLATES: SurpriseRewardData[] = [
  {
    icon: '▲',
    tag: '偶发奖励触发！',
    title: '灵感爆发！\n小猫送你一份惊喜',
    subtitle: '连续 3 天完成任务，你的专注让小猫很感动喵～\n特别奖励已送达你的背包！',
    rewards: [
      { icon: '●', value: '+150', label: '成长值' },
      { icon: '●', value: '碎片×1', label: '神秘礼盒' },
      { icon: '◇', value: '+20%', label: '今日创造力' }
    ]
  },
  {
    icon: '◇',
    tag: '偶发奖励触发！',
    title: '连胜奖励！\n持续优秀',
    subtitle: '你已经连续完成多个任务啦！\n小猫觉得你超棒的～',
    rewards: [
      { icon: '●', value: '+100', label: '成长值' },
      { icon: '◆', value: '徽章×1', label: '成就徽章' },
      { icon: '◇', value: '+15%', label: '今日效率' }
    ]
  },
  {
    icon: '◆',
    tag: '偶发奖励触发！',
    title: '完美一天！\n全部完成',
    subtitle: '今天的所有任务都完成了！\n小猫为你感到骄傲～',
    rewards: [
      { icon: '●', value: '+200', label: '成长值' },
      { icon: '●', value: '碎片×2', label: '神秘礼盒' },
      { icon: '◇', value: '+25%', label: '明日加成' }
    ]
  },
  {
    icon: '▲',
    tag: '偶发奖励触发！',
    title: '热情满满！\n活跃度爆表',
    subtitle: '今天你和AI导师聊了好久呢！\n小猫送你一个热情奖励～',
    rewards: [
      { icon: '●', value: '+120', label: '成长值' },
      { icon: '◆', value: '道具×1', label: '特殊道具' },
      { icon: '◇', value: '+18%', label: '对话加成' }
    ]
  },
  {
    icon: '◆',
    tag: '偶发奖励触发！',
    title: '宝藏发现！\n幸运时刻',
    subtitle: '哇！你触发了稀有的宝藏奖励！\n这可是小猫藏起来的好东西～',
    rewards: [
      { icon: '●', value: '+300', label: '成长值' },
      { icon: '●', value: '碎片×3', label: '神秘礼盒' },
      { icon: '◇', value: '+30%', label: '全属性加成' }
    ]
  }
]

class SurpriseRewardManager {
  private lastTriggerTime: number = 0
  private triggerCount: number = 0
  private readonly MIN_INTERVAL = 30 * 60 * 1000 // 最小间隔30分钟
  private readonly BASE_PROBABILITY = 0.15 // 基础触发概率15%

  /**
   * 尝试触发偶发奖励
   * @param actionType 操作类型：'task_complete', 'ai_chat', 'login', 'achievement'
   * @returns 如果触发成功，返回奖励数据；否则返回null
   */
  tryTrigger(actionType: string): SurpriseRewardData | null {
    const now = Date.now()

    // 检查时间间隔
    if (now - this.lastTriggerTime < this.MIN_INTERVAL) {
      return null
    }

    // 根据操作类型调整概率
    let probability = this.BASE_PROBABILITY
    switch (actionType) {
      case 'task_complete':
        probability = 0.20 // 完成任务20%
        break
      case 'ai_chat':
        probability = 0.10 // AI对话10%
        break
      case 'login':
        probability = 0.05 // 登录5%
        break
      case 'achievement':
        probability = 0.30 // 解锁成就30%
        break
    }

    // 每天前两次触发概率更高
    if (this.triggerCount < 2) {
      probability *= 1.5
    }

    // 随机判断是否触发
    if (Math.random() > probability) {
      return null
    }

    // 触发成功
    this.lastTriggerTime = now
    this.triggerCount++

    // 随机选择一个奖励模板
    const template = REWARD_TEMPLATES[Math.floor(Math.random() * REWARD_TEMPLATES.length)]

    return template
  }

  /**
   * 重置每日触发次数（应该在每天0点调用）
   */
  resetDailyCount() {
    this.triggerCount = 0
  }

  /**
   * 获取当前触发统计
   */
  getStats() {
    return {
      triggerCount: this.triggerCount,
      lastTriggerTime: this.lastTriggerTime
    }
  }
}

// 导出单例
export const surpriseRewardManager = new SurpriseRewardManager()

export default surpriseRewardManager
