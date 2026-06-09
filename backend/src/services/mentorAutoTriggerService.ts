import Anthropic from '@anthropic-ai/sdk'
import { pool } from '../config/database'
import { config } from '../../config'
import logger from '../utils/logger'
import mentorContextEnhancer from './mentorContextEnhancer'

const anthropic = new Anthropic({
  apiKey: config.anthropicApiKey
})

interface MentorMessage {
  role: 'assistant'
  content: string
  context: string
  triggeredBy: 'T-01' | 'T-03' | 'T-05'
}

/**
 * AI导师自动触发服务
 * 实现T-01（接单后引导）、T-03（打回后修改引导）、T-05（完成后见证）
 */
class MentorAutoTriggerService {
  /**
   * T-01: 接单后30秒自动触发引导
   * 分析任务需求和学生画像，生成个性化引导
   */
  async triggerT01(orderId: string): Promise<MentorMessage> {
    const client = await pool.connect()
    try {
      // 获取订单、任务、学生信息
      const result = await client.query(
        `SELECT
          ta.id as assignment_id,
          ta.student_id,
          ta.task_id,
          t.title as task_title,
          t.description as task_description,
          t.requirements as task_requirements,
          t.skills_required,
          u.name as student_name,
          r.openness_score,
          r.persistence_score,
          r.creativity_score,
          r.learning_score,
          r.collaboration_score,
          r.resilience_score,
          r.personality_tags,
          r.recommended_track
         FROM task_assignments ta
         JOIN tasks t ON ta.task_id = t.id
         JOIN users u ON ta.student_id = u.id
         LEFT JOIN opc_v2_results r ON u.latest_opc_v2_result_id = r.id
         WHERE ta.id = $1`,
        [orderId]
      )

      if (result.rows.length === 0) {
        throw new Error('订单不存在')
      }

      const data = result.rows[0]

      // 获取任务翻译（启程老师的拆解）
      const translationResult = await client.query(
        `SELECT functional_modules, student_friendly_description, what_you_will_do, what_you_will_learn
         FROM task_translations
         WHERE task_id = $1`,
        [data.task_id]
      )

      const translation = translationResult.rows[0]

      // 构建AI提示词
      const prompt = this.buildT01Prompt(data, translation)

      // 调用Claude生成引导消息
      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        temperature: 0.8,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })

      const content = message.content[0]
      if (content.type !== 'text') {
        throw new Error('AI返回格式错误')
      }

      const mentorMessage: MentorMessage = {
        role: 'assistant',
        content: content.text,
        context: 'task_start',
        triggeredBy: 'T-01'
      }

      // 保存到导师对话历史
      await this.saveMentorMessage(data.task_id, data.student_id, mentorMessage)

      logger.info(`T-01触发成功: 订单${orderId}`)

      return mentorMessage
    } finally {
      client.release()
    }
  }

  /**
   * T-04: 学生24小时无响应，自动触发轻推消息
   * 引用学生的最后一条消息，给予温和提醒
   */
  async triggerT04(taskId: string, studentId: string): Promise<MentorMessage> {
    const client = await pool.connect()
    try {
      // 获取学生最后一条消息（真实数据）
      const lastMessage = await mentorContextEnhancer.getLastStudentMessage(taskId)

      if (!lastMessage) {
        logger.warn(`T-04: No student message found for task ${taskId}`)
        throw new Error('无法找到学生的最后一条消息')
      }

      // 计算时间间隔
      const hoursSince = mentorContextEnhancer.getHoursSince(lastMessage.created_at)

      // 获取任务和学生信息
      const result = await client.query(
        `SELECT
          ta.id as assignment_id,
          ta.student_id,
          ta.task_id,
          t.title as task_title,
          u.name as student_name,
          r.personality_tags
         FROM task_assignments ta
         JOIN tasks t ON ta.task_id = t.id
         JOIN users u ON ta.student_id = u.id
         LEFT JOIN opc_v2_results r ON u.latest_opc_v2_result_id = r.id
         WHERE ta.task_id = $1 AND ta.student_id = $2`,
        [taskId, studentId]
      )

      if (result.rows.length === 0) {
        throw new Error('订单不存在')
      }

      const data = result.rows[0]

      // 构建AI提示词（引用真实对话）
      const prompt = this.buildT04Prompt(data, lastMessage, hoursSince)

      // 调用Claude生成轻推消息
      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 800,
        temperature: 0.8,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })

      const content = message.content[0]
      if (content.type !== 'text') {
        throw new Error('AI返回格式错误')
      }

      const mentorMessage: MentorMessage = {
        role: 'assistant',
        content: content.text,
        context: 'nudge_reminder',
        triggeredBy: 'T-04'
      }

      // 保存到导师对话历史
      await this.saveMentorMessage(data.task_id, data.student_id, mentorMessage)

      logger.info(`T-04触发成功: 任务${taskId}, 学生${studentId}, 间隔${hoursSince}小时`)

      return mentorMessage
    } finally {
      client.release()
    }
  }

  /**
   * T-03: 打回后自动触发修改引导
   * 理解企业反馈，翻译成学生能懂的具体指导
   */
  async triggerT03(orderId: string, rejectionReason: string): Promise<MentorMessage> {
    const client = await pool.connect()
    try {
      // 获取订单、任务、学生信息
      const result = await client.query(
        `SELECT
          ta.id as assignment_id,
          ta.student_id,
          ta.task_id,
          ts.description as submission_description,
          ts.submission_links,
          t.title as task_title,
          t.description as task_description,
          t.requirements as task_requirements,
          u.name as student_name,
          r.personality_tags,
          r.resilience_score
         FROM task_assignments ta
         JOIN tasks t ON ta.task_id = t.id
         JOIN users u ON ta.student_id = u.id
         LEFT JOIN task_submissions ts ON ta.id = ts.assignment_id
         LEFT JOIN opc_v2_results r ON u.latest_opc_v2_result_id = r.id
         WHERE ta.id = $1
         ORDER BY ts.created_at DESC
         LIMIT 1`,
        [orderId]
      )

      if (result.rows.length === 0) {
        throw new Error('订单不存在')
      }

      const data = result.rows[0]

      // 获取历史对话（查找之前的卡点）
      const historyResult = await client.query(
        `SELECT content, context
         FROM mentor_messages
         WHERE task_id = $1 AND student_id = $2
         ORDER BY created_at DESC
         LIMIT 10`,
        [data.task_id, data.student_id]
      )

      const history = historyResult.rows

      // 构建AI提示词
      const prompt = this.buildT03Prompt(data, rejectionReason, history)

      // 调用Claude生成引导消息
      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        temperature: 0.8,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })

      const content = message.content[0]
      if (content.type !== 'text') {
        throw new Error('AI返回格式错误')
      }

      const mentorMessage: MentorMessage = {
        role: 'assistant',
        content: content.text,
        context: 'rejection_guidance',
        triggeredBy: 'T-03'
      }

      // 保存到导师对话历史
      await this.saveMentorMessage(data.task_id, data.student_id, mentorMessage)

      logger.info(`T-03触发成功: 订单${orderId}`)

      return mentorMessage
    } finally {
      client.release()
    }
  }

  /**
   * T-05: 完成后自动触发见证
   * 回顾任务历程，引用历史卡点，见证成长
   */
  async triggerT05(orderId: string): Promise<MentorMessage> {
    const client = await pool.connect()
    try {
      // 获取订单、任务、学生信息
      const result = await client.query(
        `SELECT
          ta.id as assignment_id,
          ta.student_id,
          ta.task_id,
          ta.assigned_at as started_at,
          ta.completed_at,
          tr.rating as quality_score,
          tr.comment as client_feedback,
          t.title as task_title,
          t.description as task_description,
          u.name as student_name,
          r.personality_tags
         FROM task_assignments ta
         JOIN tasks t ON ta.task_id = t.id
         JOIN users u ON ta.student_id = u.id
         LEFT JOIN task_reviews tr ON ta.id = tr.assignment_id
         LEFT JOIN opc_v2_results r ON u.latest_opc_v2_result_id = r.id
         WHERE ta.id = $1`,
        [orderId]
      )

      if (result.rows.length === 0) {
        throw new Error('订单不存在')
      }

      const data = result.rows[0]

      // 【T-05核心】获取真实成长对比数据
      const growthComparison = await mentorContextEnhancer.getGrowthComparison(
        data.student_id,
        orderId
      )

      logger.info('T-05: Growth comparison loaded', {
        orderId,
        studentId: data.student_id,
        initialGapsCount: growthComparison.initial_gaps.length,
        currentSkillsCount: growthComparison.current_skills.length,
        gapsClosedCount: growthComparison.gaps_closed.length
      })

      // 获取完整的对话历史（查找卡点和突破）
      const historyResult = await client.query(
        `SELECT content, context, created_at
         FROM mentor_messages
         WHERE task_id = $1 AND student_id = $2
         ORDER BY created_at ASC`,
        [data.task_id, data.student_id]
      )

      const history = historyResult.rows

      // 分析历史对话，提取关键时刻
      const keyMoments = this.extractKeyMoments(history)

      // 构建AI提示词（注入真实成长数据）
      const prompt = this.buildT05Prompt(data, history, keyMoments, growthComparison)

      // 调用Claude生成见证消息
      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        temperature: 0.9,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })

      const content = message.content[0]
      if (content.type !== 'text') {
        throw new Error('AI返回格式错误')
      }

      const mentorMessage: MentorMessage = {
        role: 'assistant',
        content: content.text,
        context: 'milestone_celebration',
        triggeredBy: 'T-05'
      }

      // 保存到导师对话历史
      await this.saveMentorMessage(data.task_id, data.student_id, mentorMessage)

      logger.info(`T-05触发成功: 订单${orderId}`)

      return mentorMessage
    } finally {
      client.release()
    }
  }

  /**
   * 构建T-04提示词（轻推消息，引用真实对话）
   */
  private buildT04Prompt(data: any, lastMessage: any, hoursSince: number): string {
    const personalityTags = data.personality_tags?.map((t: any) => t.name).join('、') || '未知'

    return `你是启程平台的AI导师。学生已经${hoursSince}小时没有回复了，你需要发送一条温和的轻推消息。

# 学生信息
- 姓名：${data.student_name}
- 人格标签：${personalityTags}

# 任务信息
- 标题：${data.task_title}

# 学生的最后一条消息（${hoursSince}小时前）
"${lastMessage.content}"

# 你的任务

生成一条轻推消息，温和地提醒学生继续任务。

**核心原则（AI-07审核标准）**：
- ✅ 引用学生的真实对话内容（上面提供的最后一条消息）
- ✅ 理解学生可能遇到的困难，给予共情
- ✅ 用"要不要""可以试试"等开放性建议
- ❌ 不要制造焦虑（"别人都做完了""时间不多了"）
- ❌ 不要用控制性语言（"你应该""必须"）
- ❌ 不要空洞鼓励（"加油""你可以的"）

**要求**：
1. **引用真实对话**：提到学生上次说的具体内容
   - 例如："你上次提到'${lastMessage.content.substring(0, 30)}...'，后来怎么样了？"
2. **共情理解**：理解学生可能卡住了或者忙了
3. **轻松语气**：像朋友一样关心，不要像老师一样催促
4. **提供出口**：如果遇到困难可以随时来聊
5. **控制长度**：100-150字

**语气**：
- 轻松、友好、不带压力
- 可以用1个emoji
- 像发微信一样自然

现在生成轻推消息，只输出消息内容，不要有其他说明。`
  }

  /**
   * 构建T-01提示词
   */
  private buildT01Prompt(data: any, translation: any): string {
    const personalityTags = data.personality_tags?.map((t: any) => t.name).join('、') || '未知'

    return `你是启程平台的AI导师。一个学生刚刚接下了一个新任务，你需要给他发送第一条引导消息。

# 学生信息
- 姓名：${data.student_name}
- 人格标签：${personalityTags}
- 能力画像：
  - 开放性：${data.openness_score}/100
  - 坚持性：${data.persistence_score}/100
  - 创造力：${data.creativity_score}/100
  - 学习力：${data.learning_score}/100
  - 协作力：${data.collaboration_score}/100
  - 抗压力：${data.resilience_score}/100
- 推荐赛道：${data.recommended_track}

# 任务信息
- 标题：${data.task_title}
- 描述：${data.task_description}
- 要求：${data.task_requirements}
- 需要的技能：${data.skills_required?.join('、') || '未指定'}

${translation ? `
# 任务拆解（启程老师的分析）
- 学生友好描述：${translation.student_friendly_description}
- 你需要做什么：${translation.what_you_will_do}
- 你会学到什么：${translation.what_you_will_learn}
- 功能模块：${JSON.stringify(translation.functional_modules)}
` : ''}

# 你的任务

生成一条个性化的引导消息，帮助学生开始这个任务。

**要求**：
1. **个性化**：根据学生的人格标签和能力画像，调整你的语气和建议
   - 如果学生开放性高，鼓励他探索多种方法
   - 如果学生坚持性低，强调小步快跑，及时反馈
   - 如果学生抗压力低，给予更多鼓励和支持
2. **具体化**：不要说"你可以先了解需求"，而要说"你可以先看看第1个功能模块：用户登录，理解它需要什么"
3. **可执行**：给出明确的第一步行动建议
4. **温暖**：像一个关心学生的导师，而不是冷冰冰的机器人
5. **简洁**：控制在150-200字

**语气**：
- 不要用"您"，用"你"
- 不要太正式，保持轻松友好
- 可以用emoji，但不要过多（1-2个）

现在生成引导消息，只输出消息内容，不要有其他说明。`
  }

  /**
   * 构建T-03提示词
   */
  private buildT03Prompt(data: any, rejectionReason: string, history: any[]): string {
    const personalityTags = data.personality_tags?.map((t: any) => t.name).join('、') || '未知'

    return `你是启程平台的AI导师。学生的交付物被企业打回了，你需要帮助他理解反馈并给出修改建议。

# 学生信息
- 姓名：${data.student_name}
- 人格标签：${personalityTags}
- 抗压力：${data.resilience_score}/100

# 任务信息
- 标题：${data.task_title}
- 要求：${data.task_requirements}

# 学生的提交
- 描述：${data.submission_description}
- 链接：${data.submission_links?.join(', ') || '无'}

# 企业的反馈
${rejectionReason}

# 历史对话（最近10条）
${history.map((h, i) => `${i + 1}. [${h.context}] ${h.content.substring(0, 100)}...`).join('\n')}

# 你的任务

生成一条修改引导消息，帮助学生理解反馈并改进。

**要求**：
1. **先肯定**：找出学生做得好的一个具体点（从提交描述中找）
2. **翻译反馈**：如果企业说"感觉不对"，你要翻译成具体的方向
   - 例如："感觉不对" → "可能是配色不够统一，或者字体层级不够清晰"
3. **具体指导**：指出"第X部分的XX可以试试YY"
4. **引用历史**：如果历史对话中有相关的卡点，可以引用
5. **鼓励**：根据学生的抗压力调整鼓励程度
   - 抗压力低（<60）：多鼓励，强调"这很正常"
   - 抗压力高（>80）：直接指出问题，相信他能处理
6. **控制长度**：200-300字

现在生成引导消息，只输出消息内容，不要有其他说明。`
  }

  /**
   * 构建T-05提示词（注入真实成长对比数据）
   */
  private buildT05Prompt(data: any, history: any[], keyMoments: any[], growthComparison: any): string {
    const personalityTags = data.personality_tags?.map((t: any) => t.name).join('、') || '未知'
    const duration = this.calculateDuration(data.started_at, data.completed_at)

    return `你是启程平台的AI导师。学生刚刚完成了一个任务，你需要见证他的成长。

# 学生信息
- 姓名：${data.student_name}
- 人格标签：${personalityTags}

# 任务信息
- 标题：${data.task_title}
- 用时：${duration}
- 质量评分：${data.quality_score || '待评分'}
- 客户反馈：${data.client_feedback || '暂无'}

# 【真实成长对比数据】（T-05核心）
这是学生入驻时 vs 现在的真实数据对比：

**入驻时需要弥补的能力缺口**：
${growthComparison.initial_gaps.length > 0
  ? growthComparison.initial_gaps.map((gap: string) => `- ${gap}`).join('\n')
  : '（数据不足）'}

**本单中展示的能力**：
${growthComparison.current_skills.length > 0
  ? growthComparison.current_skills.map((skill: string) => `- ${skill}`).join('\n')
  : '（数据不足）'}

**已经闭合的能力缺口**：
${growthComparison.gaps_closed.length > 0
  ? growthComparison.gaps_closed.map((gap: string) => `- ${gap}`).join('\n')
  : '（暂无明显闭合）'}

${growthComparison.client_feedback ? `
**客户评价**：
- 评分：${growthComparison.client_feedback.rating}/5
- 评语：${growthComparison.client_feedback.comment}
` : ''}

# 关键时刻（从历史对话中提取）
${keyMoments.map((m, i) => `${i + 1}. ${m.type}: ${m.description}`).join('\n')}

# 完整对话历史
${history.map((h, i) => `${i + 1}. [${h.context}] ${h.content.substring(0, 150)}...`).join('\n')}

# 你的任务

生成一条见证消息，回顾这段旅程，庆祝学生的成长。

**核心原则（AI-07审核标准）**：
- ✅ 引用上面提供的【真实成长对比数据】
- ✅ 具体指出哪个能力缺口被闭合了（如果有）
- ✅ 引用学生的真实对话内容（从历史对话中）
- ✅ 如果客户有评价，可以引用具体内容
- ❌ 不要编造不存在的"其他学生"案例
- ❌ 不要说"你进步了"这种空洞表扬
- ❌ 如果没有明显闭合的缺口，不要假装有

**要求**：
1. **回顾历程**：提到1-2个具体的关键时刻
   - 例如："还记得你一开始卡在XX的时候吗？"
2. **引用原话**：如果可能，引用学生或你之前说过的话
3. **指出成长**：用真实数据说话
   - 如果有闭合的缺口：具体说"你一开始缺XX，现在通过这个项目展示了YY"
   - 如果没有闭合的缺口但有新技能：说"虽然还在成长路上，但这次你展示了XX能力"
   - 如果数据不足：聚焦对话历史中的突破时刻
4. **展望未来**：根据这次经验，建议下一步可以尝试什么
5. **情感共鸣**：像一个真正见证了全程的导师，表达真诚的欣慰
6. **控制长度**：250-350字

**语气**：
- 温暖、真诚
- 可以用emoji表达情感（2-3个）
- 像朋友一样庆祝，而不是老师一样评价

现在生成见证消息，只输出消息内容，不要有其他说明。`
  }

  /**
   * 提取关键时刻
   */
  private extractKeyMoments(history: any[]): any[] {
    const moments: any[] = []

    // 查找"卡住了"的时刻
    const stuckMessages = history.filter(h =>
      h.context === 'stuck' || h.content.includes('卡住') || h.content.includes('困难')
    )
    if (stuckMessages.length > 0) {
      moments.push({
        type: '遇到困难',
        description: stuckMessages[0].content.substring(0, 50)
      })
    }

    // 查找突破的时刻
    const breakthroughMessages = history.filter(h =>
      h.content.includes('明白了') || h.content.includes('懂了') || h.content.includes('解决了')
    )
    if (breakthroughMessages.length > 0) {
      moments.push({
        type: '突破时刻',
        description: breakthroughMessages[0].content.substring(0, 50)
      })
    }

    return moments
  }

  /**
   * 计算任务用时
   */
  private calculateDuration(startedAt: Date, completedAt: Date): string {
    const diff = new Date(completedAt).getTime() - new Date(startedAt).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return `${days}天${hours % 24}小时`
    } else {
      return `${hours}小时`
    }
  }

  /**
   * 保存导师消息到数据库
   */
  private async saveMentorMessage(
    taskId: string,
    studentId: string,
    message: MentorMessage
  ): Promise<void> {
    const client = await pool.connect()
    try {
      await client.query(
        `INSERT INTO mentor_messages (task_id, student_id, role, content, context, triggered_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [taskId, studentId, message.role, message.content, message.context, message.triggeredBy]
      )
    } finally {
      client.release()
    }
  }
}

export default new MentorAutoTriggerService()
