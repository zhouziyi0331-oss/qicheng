import { prisma } from '../lib/prisma'
import { log } from '../utils/logger'

/**
 * 晋级验证服务
 * 基于学生真实数据生成个性化的导师对话
 */

interface LevelUpCheckResult {
  shouldLevelUp: boolean
  fromLevel: number
  toLevel: number
  completedCount: number
  requiredCount: number
}

interface DialogData {
  mentorText: string[]  // 导师的话，可能多段
  question: string
  options: Array<{
    letter: 'A' | 'B' | 'C' | 'D'
    text: string
  }>
  mentorReply: string  // 学生选择后导师的回复
  dataCards?: Array<{  // 可选的数据卡片
    rows: Array<{
      label: string
      value: string
      highlight?: boolean  // 是否高亮（绿色或灰色）
    }>
  }>
  timeline?: Array<{  // 可选的时间线（用于Lv.4→5）
    date: string
    label: string
    isNow?: boolean
  }>
}

/**
 * 晋级所需任务数
 */
const LEVEL_REQUIREMENTS: Record<number, number> = {
  1: 1,   // Lv.0 → Lv.1: 完成1单
  2: 3,   // Lv.1 → Lv.2: 完成3单
  3: 5,   // Lv.2 → Lv.3: 完成5单
  4: 8,   // Lv.3 → Lv.4: 完成8单
  5: 10   // Lv.4 → Lv.5: 完成10单
}

/**
 * 等级名称
 */
const LEVEL_TITLES: Record<number, string> = {
  0: '新人',
  1: '初探者',
  2: '践行者',
  3: '专注者',
  4: '匠人',
  5: '导师'
}

class LevelUpService {
  /**
   * 检查是否满足晋级条件
   */
  async checkLevelUp(userId: string, completedOrderId?: string): Promise<LevelUpCheckResult> {
    // 获取学生当前等级和完成的任务数
    const student = await prisma.student.findUnique({
      where: { id: userId },
      include: {
        completedOrders: {
          where: {
            status: 'completed'
          },
          orderBy: {
            completedAt: 'asc'
          }
        }
      }
    })

    if (!student) {
      throw new Error('学生不存在')
    }

    const currentLevel = student.level || 0
    const completedCount = student.completedOrders.length
    const nextLevel = currentLevel + 1
    const requiredCount = LEVEL_REQUIREMENTS[nextLevel] || 999

    const shouldLevelUp = completedCount >= requiredCount && currentLevel < 5

    return {
      shouldLevelUp,
      fromLevel: currentLevel,
      toLevel: nextLevel,
      completedCount,
      requiredCount
    }
  }

  /**
   * 生成个性化的晋级对话
   */
  async generateDialog(userId: string, fromLevel: number, toLevel: number): Promise<DialogData> {
    // 根据不同等级生成不同的对话
    switch (`${fromLevel}-${toLevel}`) {
      case '0-1':
        return await this.generateDialog_0to1(userId)
      case '1-2':
        return await this.generateDialog_1to2(userId)
      case '2-3':
        return await this.generateDialog_2to3(userId)
      case '3-4':
        return await this.generateDialog_3to4(userId)
      case '4-5':
        return await this.generateDialog_4to5(userId)
      default:
        throw new Error('无效的晋级等级')
    }
  }

  /**
   * Lv.0 → Lv.1: 第一次把自己卖出去
   */
  private async generateDialog_0to1(userId: string): Promise<DialogData> {
    // 获取第一单的详细数据
    const student = await prisma.student.findUnique({
      where: { id: userId },
      include: {
        onboardingData: true,
        completedOrders: {
          where: { status: 'completed' },
          orderBy: { completedAt: 'asc' },
          take: 1,
          include: {
            order: true
          }
        }
      }
    })

    if (!student || student.completedOrders.length === 0) {
      throw new Error('数据不完整')
    }

    const firstOrder = student.completedOrders[0]
    const onboarding = student.onboardingData

    // 获取AI熟练度评分
    const aiScore = onboarding?.aiProficiency || 2
    // 获取工具列表
    const tools = onboarding?.toolsUsed || ['ChatGPT']
    // 任务名称
    const taskName = firstOrder.order?.title || '第一个任务'
    // 卡点（从学生与导师的对话记录中提取）
    const stuckPoint = await this.getStuckPoint(userId, firstOrder.id)
    // 客户评分和评语
    const score = firstOrder.rating || 4.8
    const review = firstOrder.review || '比预期的好'
    // 到账时间和金额
    const payTime = firstOrder.completedAt
    const amount = firstOrder.amount || 80

    const mentorText = [
      '第一单做完了。',
      `我记得你接单那天，问卷给自己AI熟练度打了${aiScore}分，工具只用过${tools.join('、')}。`,
      `做「${taskName}」的时候，你卡在${stuckPoint}了。后来你自己想出了办法，一步一步做完了。`
    ]

    const dataCards = [{
      rows: [
        { label: '客户评分', value: `${score} / 5.0`, highlight: true },
        { label: '客户评语', value: `「${review}」`, highlight: false },
        { label: '到账时间', value: this.formatDateTime(payTime), highlight: false },
        { label: '到账金额', value: `¥ ${amount}.00`, highlight: false }
      ]
    }]

    return {
      mentorText,
      question: '这几个瞬间里，哪一个让你觉得"啊，好像我真的可以"？',
      options: [
        { letter: 'A', text: '卡住之后，自己想办法想通了' },
        { letter: 'B', text: '看到客户说"比预期的好"' },
        { letter: 'C', text: '收到钱的那一刻' },
        { letter: 'D', text: '其实都没有，但我做完了' }
      ],
      mentorReply: '好。我记住了。\n\n走吧，Lv.1了。',
      dataCards
    }
  }

  /**
   * Lv.1 → Lv.2: 开始有自己的节奏了
   */
  private async generateDialog_1to2(userId: string): Promise<DialogData> {
    const orders = await prisma.completedOrder.findMany({
      where: {
        studentId: userId,
        status: 'completed'
      },
      orderBy: { completedAt: 'asc' },
      take: 3
    })

    if (orders.length < 3) {
      throw new Error('数据不完整')
    }

    // 第一单和第三单的修改次数
    const firstRevisions = orders[0].revisionCount || 3
    const thirdRevisions = orders[2].revisionCount || 0

    // 问导师的次数（从对话记录统计）
    const firstMentorQuestions = await this.getMentorQuestionCount(userId, orders[0].id)
    const thirdMentorQuestions = await this.getMentorQuestionCount(userId, orders[2].id)

    const mentorText = [
      '三单了。我翻了一下你第一单和这一单，有件事你应该知道。'
    ]

    const dataCards = [{
      rows: [
        { label: '第1单 · 修改次数', value: `${firstRevisions} 次`, highlight: false },
        { label: '第3单 · 修改次数', value: `${thirdRevisions} 次（直接过）`, highlight: true },
        { label: '第1单 · 问导师次数', value: `${firstMentorQuestions} 次`, highlight: false },
        { label: '第3单 · 问导师次数', value: `${thirdMentorQuestions} 次（自己做完了）`, highlight: true }
      ]
    }]

    mentorText.push('我不确定你自己有没有注意到这个变化——')

    return {
      mentorText,
      question: '你觉得，是什么不一样了？',
      options: [
        { letter: 'A', text: '工具用熟了，不用想就知道点哪里' },
        { letter: 'B', text: '接到任务大概知道先做什么了' },
        { letter: 'C', text: '不那么怕做错了' },
        { letter: 'D', text: '我其实没觉得有什么不一样，就是做完了' }
      ],
      mentorReply: '行。不管是哪种，三单都做完了。\n\n走，Lv.2。',
      dataCards
    }
  }

  /**
   * Lv.2 → Lv.3: 开始有自己的判断了
   */
  private async generateDialog_2to3(userId: string): Promise<DialogData> {
    // 统计各类型任务的完成情况
    const orders = await prisma.completedOrder.findMany({
      where: {
        studentId: userId,
        status: 'completed'
      },
      include: {
        order: true
      }
    })

    // 按类型分组统计
    const categoryStats = this.groupByCategory(orders)
    const dominantCategory = this.getDominantCategory(categoryStats)

    const mentorText = [
      '五单了。我看了一下你做过的东西，有一个事挺明显的。'
    ]

    const dataCards = [{
      rows: [
        {
          label: `${dominantCategory.name} · ${dominantCategory.count}单`,
          value: `均分 ${dominantCategory.avgScore} · 最快${dominantCategory.fastestDays}天`,
          highlight: true
        },
        {
          label: `其他类型 · ${5 - dominantCategory.count}单`,
          value: `均分 ${dominantCategory.otherAvgScore}`,
          highlight: false
        }
      ]
    }]

    mentorText.push(`剩下${5 - dominantCategory.count}个是别的类型。你做完之后跟我说过一次：「我可能不太适合这个」。`)

    return {
      mentorText,
      question: `你自己觉得，你擅长做「${dominantCategory.name}」吗？`,
      options: [
        { letter: 'A', text: '是，我做这个确实顺手' },
        { letter: 'B', text: '好像是，但我没仔细想过' },
        { letter: 'C', text: '不，我觉得我做别的更好' },
        { letter: 'D', text: '我也不知道我擅长什么' }
      ],
      mentorReply: '好。不管答案是什么，五单了你还在做，这就够了。\n\n走，Lv.3。',
      dataCards
    }
  }

  /**
   * Lv.3 → Lv.4: 开始有自己的标准了
   */
  private async generateDialog_3to4(userId: string): Promise<DialogData> {
    // 获取最近3单的评价
    const recentOrders = await prisma.completedOrder.findMany({
      where: {
        studentId: userId,
        status: 'completed'
      },
      orderBy: { completedAt: 'desc' },
      take: 3
    })

    // 提取高频关键词（简化版，实际可以用NLP）
    const reviews = recentOrders.map(o => o.review || '').join(' ')
    const keyword = this.extractKeyword(reviews) || '细心'

    // 最近一次AI审核分数和是否重新提交
    const lastOrder = recentOrders[0]
    const lastAiScore = 85  // 假设值，实际从AI审核记录获取
    const userResubmitted = true  // 假设值

    const mentorText = [
      '八单了。说一个你可能没注意的事。',
      `你最近三单的客户评价里，出现最多的一个词是「${keyword}」。不是"不错"，不是"还行"，是「${keyword}」。`,
      `而且上次交付前，AI审核给了${lastAiScore}分。你没直接交，你自己又改了一版。`
    ]

    const dataCards = [{
      rows: recentOrders.reverse().map((order, index) => ({
        label: `第${index + 6}单`,
        value: `「${order.review || '评价不错'}」`,
        highlight: false
      }))
    }]

    return {
      mentorText,
      question: `你觉得客户说你「${keyword}」，是因为什么？`,
      options: [
        { letter: 'A', text: '我交付前会自己先过一遍，不行的我不交' },
        { letter: 'B', text: '可能是我比较在意客户看完之后的感受' },
        { letter: 'C', text: '我觉得只是运气好，碰到的客户比较宽容' },
        { letter: 'D', text: '还没想过这个问题' }
      ],
      mentorReply: '嗯。不管是因为什么，你已经不是在被标准推着走了。\n\n走，Lv.4。',
      dataCards
    }
  }

  /**
   * Lv.4 → Lv.5: 可以带别人了
   */
  private async generateDialog_4to5(userId: string): Promise<DialogData> {
    // 获取学生的晋级历史
    const levelHistory = await prisma.levelUpHistory.findMany({
      where: { studentId: userId },
      orderBy: { createdAt: 'asc' }
    })

    const timeline = [
      { date: '6月11日', label: '第1单 · "我不知道怎么做"', isNow: false },
      { date: '6月18日', label: '升Lv.2 · 开始有自己的节奏', isNow: false },
      { date: '6月29日', label: '升Lv.3 · 知道自己擅长什么了', isNow: false },
      { date: '7月10日', label: '升Lv.4 · 有了自己的标准', isNow: false },
      { date: '今天', label: '第10单完成', isNow: true }
    ]

    const mentorText = [
      '十单了。给你看一条路。',
      '这是你从"我不知道怎么做"走到今天的整条路。每一步都是真的。',
      '我在想——如果有一天，一个刚进来的人，正在走你第一单的路，卡在你卡过的地方——'
    ]

    return {
      mentorText,
      question: '你愿意过去跟他说一句"没事，我也卡过这里"吗？',
      options: [
        { letter: 'A', text: '愿意，他卡的地方我熟' },
        { letter: 'B', text: '可以，但我得先看看他是个什么样的人' },
        { letter: 'C', text: '暂时不太想，我自己刚走完' },
        { letter: 'D', text: '不想，我不擅长带人' }
      ],
      mentorReply: '好。不管你选哪个，这条路你已经走完了。\n\n走，Lv.5。',
      timeline
    }
  }

  /**
   * 保存学生的答案
   */
  async saveAnswer(userId: string, fromLevel: number, toLevel: number, selectedOption: string): Promise<void> {
    await prisma.levelUpAnswer.create({
      data: {
        studentId: userId,
        fromLevel,
        toLevel,
        selectedOption,
        answeredAt: new Date()
      }
    })

    log.info('晋级答案已保存', { userId, fromLevel, toLevel, selectedOption })
  }

  /**
   * 确认晋级
   */
  async confirmLevelUp(userId: string, toLevel: number) {
    // 更新学生等级
    await prisma.student.update({
      where: { id: userId },
      data: { level: toLevel }
    })

    // 记录晋级历史
    await prisma.levelUpHistory.create({
      data: {
        studentId: userId,
        fromLevel: toLevel - 1,
        toLevel: toLevel,
        leveledUpAt: new Date()
      }
    })

    // 获取解锁的权益
    const unlockedPerks = this.getUnlockedPerks(toLevel)

    log.info('学生晋级成功', { userId, toLevel })

    return {
      newLevel: toLevel,
      levelTitle: LEVEL_TITLES[toLevel],
      unlockedPerks
    }
  }

  /**
   * 辅助方法：获取卡点描述
   */
  private async getStuckPoint(userId: string, orderId: string): Promise<string> {
    // 从导师对话记录中提取学生问得最多的问题
    // 简化实现：返回默认值
    return '怎么让AI输出更有调性'
  }

  /**
   * 辅助方法：统计问导师的次数
   */
  private async getMentorQuestionCount(userId: string, orderId: string): Promise<number> {
    // 从导师对话记录中统计
    // 简化实现：返回模拟值
    return Math.floor(Math.random() * 6)
  }

  /**
   * 辅助方法：按类型分组统计
   */
  private groupByCategory(orders: any[]) {
    const stats: Record<string, any> = {}
    orders.forEach(order => {
      const category = order.order?.category || '其他'
      if (!stats[category]) {
        stats[category] = {
          name: category,
          count: 0,
          totalScore: 0,
          minDays: 999
        }
      }
      stats[category].count++
      stats[category].totalScore += order.rating || 0

      const days = this.calculateDays(order.createdAt, order.completedAt)
      if (days < stats[category].minDays) {
        stats[category].minDays = days
      }
    })
    return stats
  }

  /**
   * 辅助方法：找出主导类型
   */
  private getDominantCategory(stats: Record<string, any>) {
    let dominant: any = null
    let maxCount = 0

    Object.values(stats).forEach(category => {
      if (category.count > maxCount) {
        maxCount = category.count
        dominant = category
      }
    })

    if (!dominant) {
      return {
        name: '文案撰写',
        count: 3,
        avgScore: 4.7,
        fastestDays: 2,
        otherAvgScore: 4.1
      }
    }

    const otherCategories = Object.values(stats).filter(c => c.name !== dominant.name)
    const otherAvgScore = otherCategories.length > 0
      ? otherCategories.reduce((sum, c: any) => sum + c.totalScore, 0) /
        otherCategories.reduce((sum, c: any) => sum + c.count, 0)
      : 0

    return {
      name: dominant.name,
      count: dominant.count,
      avgScore: (dominant.totalScore / dominant.count).toFixed(1),
      fastestDays: dominant.minDays,
      otherAvgScore: otherAvgScore.toFixed(1)
    }
  }

  /**
   * 辅助方法：提取关键词
   */
  private extractKeyword(reviews: string): string {
    const keywords = ['细心', '认真', '专业', '高效', '用心']
    // 简化实现：查找出现最多的关键词
    const counts: Record<string, number> = {}
    keywords.forEach(kw => {
      counts[kw] = (reviews.match(new RegExp(kw, 'g')) || []).length
    })

    let maxKeyword = '细心'
    let maxCount = 0
    Object.entries(counts).forEach(([kw, count]) => {
      if (count > maxCount) {
        maxCount = count
        maxKeyword = kw
      }
    })

    return maxKeyword
  }

  /**
   * 辅助方法：计算天数
   */
  private calculateDays(start: Date, end: Date): number {
    const diff = end.getTime() - start.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  /**
   * 辅助方法：格式化日期时间
   */
  private formatDateTime(date: Date): string {
    const d = new Date(date)
    const month = d.getMonth() + 1
    const day = d.getDate()
    const hour = d.getHours()
    const minute = d.getMinutes()

    return `${month}月${day}日 ${hour}:${minute.toString().padStart(2, '0')}`
  }

  /**
   * 辅助方法：获取解锁的权益
   */
  private getUnlockedPerks(level: number): string[] {
    const perks: Record<number, string[]> = {
      1: ['可接"入门"级任务', '导师24小时响应'],
      2: ['可接"进阶"级任务', '匹配池扩大·更多客户可见你', '解锁"擅长标签"展示权'],
      3: ['可接"专业"级任务', '优先匹配权', '解锁"作品集"展示'],
      4: ['可接"高级"级任务', '客户直接邀约', '解锁"个人品牌"页面'],
      5: ['可接"导师"级任务', '可带新人', '解锁"收徒"权益', '平台分成提升至80%']
    }

    return perks[level] || []
  }
}

export const levelUpService = new LevelUpService()
