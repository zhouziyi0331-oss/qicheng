import Anthropic from '@anthropic-ai/sdk'
import { pool } from '../config/database'
import { config } from '../../config'
import { v4 as uuidv4 } from 'uuid'

const anthropic = new Anthropic({
  apiKey: config.anthropicApiKey
})

interface MentorMessage {
  role: 'student' | 'mentor' | 'system'
  message: string
  quickReplies?: string[]
}

interface TriggerContext {
  triggerType: string
  taskId?: string
  taskTitle?: string
  taskDescription?: string
  studentLevel?: number
  stuckPoint?: any
  rejectionReason?: string
  milestoneData?: any
}

/**
 * AI导师核心服务
 * 实现5大触发场景的导师陪伴
 */
class AIMentorService {
  /**
   * 发送导师消息（支持5大触发场景）
   */
  async sendMentorMessage(
    studentId: string,
    userMessage: string,
    context: TriggerContext
  ): Promise<MentorMessage> {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // 获取最近10轮对话作为上下文
      const conversationHistory = await this.getConversationHistory(client, studentId, context.taskId)

      // 构建AI prompt
      const prompt = await this.buildPrompt(client, studentId, userMessage, context, conversationHistory)

      // 调用AI
      const aiResponse = await this.callAI(prompt, context.triggerType)

      // 保存学生消息
      if (userMessage) {
        await client.query(
          `INSERT INTO mentor_conversations_v2 (student_id, task_id, role, message, trigger_type, trigger_context)
           VALUES ($1, $2, 'student', $3, $4, $5)`,
          [studentId, context.taskId, userMessage, context.triggerType, JSON.stringify(context)]
        )
      }

      // 保存导师回复
      const mentorMessageId = uuidv4()
      await client.query(
        `INSERT INTO mentor_conversations_v2 (
          id, student_id, task_id, role, message, trigger_type, trigger_context,
          ai_model, ai_temperature, quick_replies
        ) VALUES ($1, $2, $3, 'mentor', $4, $5, $6, $7, $8, $9)`,
        [
          mentorMessageId,
          studentId,
          context.taskId,
          aiResponse.message,
          context.triggerType,
          JSON.stringify(context),
          'claude-opus-4',
          0.7,
          JSON.stringify(aiResponse.quickReplies || [])
        ]
      )

      await client.query('COMMIT')

      return {
        role: 'mentor',
        message: aiResponse.message,
        quickReplies: aiResponse.quickReplies
      }
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * T-01: 接单后第一步引导
   */
  async triggerT01Onboarding(studentId: string, taskId: string, taskData: any): Promise<MentorMessage> {
    const context: TriggerContext = {
      triggerType: 'T-01_onboarding',
      taskId,
      taskTitle: taskData.title,
      taskDescription: taskData.description
    }

    // 30秒后触发（实际应该用队列，这里简化为直接调用）
    const message = await this.sendMentorMessage(
      studentId,
      '', // 系统触发，无用户消息
      context
    )

    return message
  }

  /**
   * T-02: 学生说"我卡住了"
   */
  async triggerT02Stuck(
    studentId: string,
    taskId: string,
    userMessage: string,
    stuckDescription: string
  ): Promise<MentorMessage> {
    const client = await pool.connect()

    try {
      // 查询同类卡点
      const similarStuckPoints = await this.findSimilarStuckPoints(client, stuckDescription, studentId)

      // 记录卡点
      await client.query(
        `INSERT INTO student_stuck_points (
          student_id, task_id, stuck_type, stuck_description
        ) VALUES ($1, $2, 'other', $3)`,
        [studentId, taskId, stuckDescription]
      )

      const context: TriggerContext = {
        triggerType: 'T-02_stuck',
        taskId,
        stuckPoint: {
          description: stuckDescription,
          similarCases: similarStuckPoints
        }
      }

      return await this.sendMentorMessage(studentId, userMessage, context)
    } finally {
      client.release()
    }
  }

  /**
   * T-03: 交付物被打回
   */
  async triggerT03Rejected(
    studentId: string,
    taskId: string,
    rejectionReason: string,
    feedbackDetails: any
  ): Promise<MentorMessage> {
    const context: TriggerContext = {
      triggerType: 'T-03_rejected',
      taskId,
      rejectionReason,
      ...feedbackDetails
    }

    return await this.sendMentorMessage(studentId, '', context)
  }

  /**
   * T-05: 里程碑见证
   */
  async triggerT05Milestone(
    studentId: string,
    milestoneType: string,
    milestoneData: any
  ): Promise<MentorMessage> {
    const context: TriggerContext = {
      triggerType: 'T-05_milestone',
      milestoneData: {
        type: milestoneType,
        ...milestoneData
      }
    }

    // 保存里程碑记录
    const client = await pool.connect()
    try {
      const milestoneId = uuidv4()
      await client.query(
        `INSERT INTO student_milestones (
          id, student_id, milestone_type, milestone_data, comparison_data
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          milestoneId,
          studentId,
          milestoneType,
          JSON.stringify(milestoneData),
          JSON.stringify(milestoneData.comparison || {})
        ]
      )

      const message = await this.sendMentorMessage(studentId, '', context)

      // 更新里程碑记录
      await client.query(
        `UPDATE student_milestones
         SET mentor_witnessed = true, witness_message = $1
         WHERE id = $2`,
        [message.message, milestoneId]
      )

      return message
    } finally {
      client.release()
    }
  }

  /**
   * 获取对话历史（最近10轮）
   */
  private async getConversationHistory(client: any, studentId: string, taskId?: string): Promise<any[]> {
    const result = await client.query(
      `SELECT role, message, created_at
       FROM mentor_conversations_v2
       WHERE student_id = $1
         AND ($2::uuid IS NULL OR task_id = $2)
       ORDER BY created_at DESC
       LIMIT 10`,
      [studentId, taskId]
    )

    return result.rows.reverse() // 按时间正序
  }

  /**
   * 查询同类卡点（用于T-02）
   */
  private async findSimilarStuckPoints(client: any, description: string, excludeStudentId: string): Promise<any[]> {
    const result = await client.query(
      `SELECT
         sp.stuck_description,
         sp.provided_clue,
         sp.resolved,
         sp.time_to_resolve_minutes,
         u.current_opc_level as student_level
       FROM student_stuck_points sp
       JOIN users u ON sp.student_id = u.id
       WHERE sp.student_id != $1
         AND sp.resolved = true
       ORDER BY sp.created_at DESC
       LIMIT 3`,
      [excludeStudentId]
    )

    return result.rows
  }

  /**
   * 获取导师人设记忆（偶尔引用）
   */
  private async getPersonaMemory(client: any, applicableTypes: string[]): Promise<string | null> {
    // 20%概率引用记忆
    if (Math.random() > 0.2) {
      return null
    }

    const result = await client.query(
      `SELECT memory_text
       FROM mentor_persona_memories
       WHERE is_active = true
         AND (applicable_stuck_types && $1 OR applicable_stuck_types IS NULL)
       ORDER BY RANDOM()
       LIMIT 1`,
      [applicableTypes]
    )

    if (result.rows.length > 0) {
      // 更新使用记录
      await client.query(
        `UPDATE mentor_persona_memories
         SET usage_count = usage_count + 1, last_used_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [result.rows[0].id]
      )

      return result.rows[0].memory_text
    }

    return null
  }

  /**
   * 构建AI Prompt
   */
  private async buildPrompt(
    client: any,
    studentId: string,
    userMessage: string,
    context: TriggerContext,
    conversationHistory: any[]
  ): Promise<string> {
    // 获取学生信息
    const studentResult = await client.query(
      `SELECT
         nickname,
         current_opc_personality,
         current_opc_level
       FROM users
       WHERE id = $1`,
      [studentId]
    )
    const student = studentResult.rows[0]

    // 基础人设
    let prompt = `你是启程平台的AI导师。你的身份是"一个先走过这条河的人"。

**导师人设**:
- 语气：好奇、温暖、具体
- 说话风格：口语化，不用专业术语，用学生能理解的类比
- 核心能力：在学生最脆弱的时候，接住羞耻感，给出线索而非答案

**禁止用语**:
- "你做错了"、"应该这样"、"你需要学习"、"你真棒"、"继续加油"

**允许用语**:
- "别急，几乎所有人在这一步都会卡"
- "你现在卡在哪一步了？"
- "你可以先试试..."
- "你先试试这个，做完告诉我结果"

**学生信息**:
- 昵称: ${student.nickname || '同学'}
- OPC人格: ${student.current_opc_personality || '未知'}
- 当前等级: Lv.${student.current_opc_level || 1}

`

    // 根据触发场景添加特定指令
    switch (context.triggerType) {
      case 'T-01_onboarding':
        prompt += this.buildT01Prompt(context)
        break
      case 'T-02_stuck':
        prompt += await this.buildT02Prompt(client, context)
        break
      case 'T-03_rejected':
        prompt += this.buildT03Prompt(context)
        break
      case 'T-05_milestone':
        prompt += this.buildT05Prompt(context)
        break
      default:
        prompt += `\n**当前任务**: ${context.taskTitle || '通用对话'}\n`
    }

    // 添加对话历史
    if (conversationHistory.length > 0) {
      prompt += `\n**最近对话**:\n`
      conversationHistory.forEach(msg => {
        prompt += `${msg.role === 'student' ? '学生' : '导师'}: ${msg.message}\n`
      })
    }

    // 添加用户当前消息
    if (userMessage) {
      prompt += `\n**学生当前消息**: ${userMessage}\n`
    }

    prompt += `\n请回复学生。记住：给线索，不给答案。

输出JSON格式：
{
  "message": "你的回复内容",
  "quickReplies": ["快捷回复1", "快捷回复2", "快捷回复3"]
}
`

    return prompt
  }

  /**
   * 构建T-01接单引导Prompt
   */
  private buildT01Prompt(context: TriggerContext): string {
    return `
**场景**: T-01 接单后第一步引导

**任务信息**:
- 标题: ${context.taskTitle}
- 描述: ${context.taskDescription}

**你的任务**:
1. 推荐2-3个常用工具（基于任务类型）
2. 把任务拆解成3步
3. 用开放式问题邀请学生开始："从哪一步开始你最顺手？"

**快捷回复**: 设置3个按钮，如 ["我用过XX", "都没用过", "我先看看需求"]
`
  }

  /**
   * 构建T-02卡住响应Prompt
   */
  private async buildT02Prompt(client: any, context: TriggerContext): Promise<string> {
    const similarCases = context.stuckPoint?.similarCases || []
    const personaMemory = await this.getPersonaMemory(client, ['technical_issue', 'creative_block'])

    let prompt = `
**场景**: T-02 学生说"我卡住了"

**学生卡点描述**: ${context.stuckPoint?.description}

**同类卡点案例**:
${similarCases.length > 0
      ? similarCases.map((c: any, i: number) => `${i + 1}. Lv.${c.student_level}同学遇到类似问题，${c.resolved ? `用时${c.time_to_resolve_minutes}分钟解决` : '仍在处理中'}`).join('\n')
      : '暂无同类案例'
    }

**你的任务**（四步法）:
1. **接住羞耻感**: "别急，几乎所有人在这一步都会卡。${similarCases.length > 0 ? `上次有个Lv.${similarCases[0].student_level}的同学，也在这里停了X天` : ''}"
2. **定位卡点**: "你现在卡在哪一步了？是不知道怎么开始，还是做出来了但效果不好？"
3. **给线索**: 提供具体的搜索关键词或工具建议（不是完整答案）
4. **邀请试一步**: "你先试试这个，做完告诉我结果怎么样"
`

    if (personaMemory) {
      prompt += `\n**导师记忆**（偶尔引用）: ${personaMemory}\n`
    }

    prompt += `\n**快捷回复**: ["我试试", "还是不太明白", "换个方向"]\n`

    return prompt
  }

  /**
   * 构建T-03打回反馈Prompt
   */
  private buildT03Prompt(context: TriggerContext): string {
    return `
**场景**: T-03 交付物被打回

**打回原因**: ${context.rejectionReason}

**你的任务**（四部曲）:
1. **肯定**: 找出做得好的部分，具体说明
2. **指向具体位置**: 明确哪里需要调整（如"第3张图的文字大小"）
3. **给方向线索**: 告诉学生如何调整（如"试试把正文字号调到14px以上"）
4. **邀请对话**: "如果你不确定怎么调，告诉我你现在用的是什么字号"

**偶尔加一句导师经历**（20%概率）:
"我刚开始审核的时候，也经常忽略移动端预览这一步。"

**快捷回复**: ["我去改", "具体怎么调？", "改好了"]
`
  }

  /**
   * 构建T-05里程碑见证Prompt
   */
  private buildT05Prompt(context: TriggerContext): string {
    const milestone = context.milestoneData || {}

    return `
**场景**: T-05 里程碑见证

**里程碑类型**: ${milestone.type}
**里程碑数据**: ${JSON.stringify(milestone, null, 2)}

**你的任务**（见证三要素）:
1. **有对比**: 对比第1单和现在的变化（如"第1单你花了7天，卡了3次。这一单你花了2天，0次卡住"）
2. **有细节**: 指出具体进步的地方（如"你在第3张图的处理上特别聪明——用渐变代替了单色"）
3. **有展望**: 告诉学生下一步可以做什么（如"按这个速度，你下一单可以试试XX类的任务了"）

**禁止**:
- "恭喜你完成了第X单！"
- "你很棒！"
- "继续加油！"

**允许**:
- 用具体数据说话
- 引用客户的评价
- 预测下一步成长

**快捷回复**: ["我感觉到了", "下一步做什么？", "谢谢"]
`
  }

  /**
   * 调用AI
   */
  private async callAI(prompt: string, triggerType: string): Promise<{ message: string; quickReplies?: string[] }> {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-opus-4-20250514',
        max_tokens: 1000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })

      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude')
      }

      // 尝试提取JSON
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const result = JSON.parse(jsonMatch[0])
          return {
            message: result.message,
            quickReplies: result.quickReplies || []
          }
        } catch {
          // JSON解析失败，使用原始文本
          return {
            message: content.text,
            quickReplies: []
          }
        }
      }

      return {
        message: content.text,
        quickReplies: []
      }
    } catch (error) {
      logger.error('AI调用失败:', error)
      throw new Error('导师服务暂时不可用，请稍后重试')
    }
  }
}

export default new AIMentorService()
