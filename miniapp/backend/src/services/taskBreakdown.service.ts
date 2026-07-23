import { openai, AI_CONFIG } from '../config/openai'
import { log } from '../utils/logger'

/**
 * AI任务拆解服务
 * 核心：帮企业和学生之间"翻译"
 */

interface TaskBreakdownRequest {
  rawInput: string              // 企业原始输入："我要一个海报"
  industry?: string             // 行业
  additionalInfo?: any          // 追问后的额外信息
}

interface TaskBreakdownResult {
  // 1. 需求澄清（如果信息不足）
  needsClarification: boolean
  clarificationQuestions?: Array<{
    question: string
    options?: string[]
    required: boolean
  }>

  // 2. 结构化任务
  structuredTask: {
    taskType: string            // "平面设计 - 海报设计"
    industry: string
    description: string         // AI生成的清晰描述
    requirements: string[]      // 具体要求
    deliverables: string[]      // 交付物
    skills: string[]            // 需要的技能
    difficulty: 'easy' | 'medium' | 'hard'
    estimatedTime: string       // "2-3天"
    suggestedBudget: number
  }

  // 3. 学生执行步骤
  executionSteps: Array<{
    step: number
    title: string
    description: string
    tasks: Array<{
      task: string
      estimatedTime: string
      skills: string[]
    }>
    checkpoints: string[]       // 检查点
    tips: string[]              // AI导师建议
  }>

  // 4. 匹配标签（用于向量匹配）
  matchingTags: Array<{
    tagName: string
    weight: number
    reason: string
  }>
}

export class TaskBreakdownService {

  /**
   * 核心方法：分析并拆解任务
   */
  async analyzeAndBreakdown(request: TaskBreakdownRequest): Promise<TaskBreakdownResult> {
    try {
      log.info('开始任务拆解', { rawInput: request.rawInput })

      // 1. 第一次分析：是否需要追问
      const needsClarification = await this.checkIfNeedsClarification(request)

      if (needsClarification.needs) {
        return {
          needsClarification: true,
          clarificationQuestions: needsClarification.questions,
          structuredTask: {} as any,
          executionSteps: [],
          matchingTags: []
        }
      }

      // 2. 生成结构化任务
      const structuredTask = await this.generateStructuredTask(request)

      // 3. 生成执行步骤
      const executionSteps = await this.generateExecutionSteps(structuredTask)

      // 4. 生成匹配标签
      const matchingTags = await this.generateMatchingTags(structuredTask)

      return {
        needsClarification: false,
        structuredTask,
        executionSteps,
        matchingTags
      }

    } catch (error: any) {
      log.error('任务拆解失败', { error: error.message })
      throw error
    }
  }

  /**
   * 检查是否需要追问
   */
  private async checkIfNeedsClarification(request: TaskBreakdownRequest) {
    const prompt = `你是启程OPC的AI导师。企业发布了一个任务需求，你需要判断信息是否足够清晰。

【企业原始输入】
${request.rawInput}

【已知信息】
行业：${request.industry || '未知'}
${request.additionalInfo ? JSON.stringify(request.additionalInfo) : '无'}

【你的任务】
判断是否需要追问更多信息，才能生成清晰的任务描述。

如果需要追问，列出3-5个关键问题（每个问题提供选项）。

以JSON格式返回：
{
  "needs": true/false,
  "reason": "为什么需要/不需要追问",
  "questions": [
    {
      "question": "这个海报用在哪里？",
      "options": ["小红书", "微信朋友圈", "户外广告", "淘宝详情页"],
      "required": true
    }
  ]
}`

    const completion = await openai.chat.completions.create({
      model: AI_CONFIG.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })

    return JSON.parse(completion.choices[0].message.content || '{"needs":false}')
  }

  /**
   * 生成结构化任务
   */
  private async generateStructuredTask(request: TaskBreakdownRequest) {
    const prompt = `你是启程OPC的AI导师。企业发布了一个任务，你需要将其转化为清晰的结构化任务描述。

【企业原始输入】
${request.rawInput}

【已知信息】
${JSON.stringify(request.additionalInfo || {}, null, 2)}

【你的任务】
将模糊的需求转化为清晰、可执行的任务描述。

以JSON格式返回：
{
  "taskType": "具体任务类型（如：平面设计-海报设计）",
  "industry": "行业",
  "description": "清晰的任务描述（200字内）",
  "requirements": [
    "具体要求1",
    "具体要求2",
    "具体要求3"
  ],
  "deliverables": [
    "交付物1：海报源文件（PSD/AI格式）",
    "交付物2：导出图片（JPG，1080x1920）"
  ],
  "skills": ["需要的技能1", "技能2"],
  "difficulty": "easy/medium/hard",
  "estimatedTime": "预估时间",
  "suggestedBudget": 建议预算（数字）
}`

    const completion = await openai.chat.completions.create({
      model: AI_CONFIG.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      response_format: { type: 'json_object' }
    })

    return JSON.parse(completion.choices[0].message.content || '{}')
  }

  /**
   * 生成执行步骤
   */
  private async generateExecutionSteps(structuredTask: any) {
    const prompt = `你是启程OPC的AI导师。现在有一个清晰的任务，你需要为学生拆解详细的执行步骤。

【任务描述】
${structuredTask.description}

【任务类型】
${structuredTask.taskType}

【任务要求】
${structuredTask.requirements.join('\n')}

【你的任务】
将任务拆解为4-6个执行步骤，每个步骤包含：
1. 具体要做的事
2. 预计用时
3. 需要的技能
4. 检查点（如何确认这一步完成）
5. AI导师的具体建议

以JSON格式返回：
{
  "steps": [
    {
      "step": 1,
      "title": "需求理解与调研",
      "description": "深入理解客户需求，研究行业和竞品",
      "tasks": [
        {
          "task": "分析目标受众特征",
          "estimatedTime": "30分钟",
          "skills": ["用户研究", "市场分析"]
        }
      ],
      "checkpoints": [
        "已明确目标受众画像",
        "收集了至少5个竞品案例"
      ],
      "tips": [
        "建议使用小红书搜索类似产品的海报",
        "注意年轻女性喜欢的配色和风格"
      ]
    }
  ]
}`

    const completion = await openai.chat.completions.create({
      model: AI_CONFIG.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })

    const result = JSON.parse(completion.choices[0].message.content || '{"steps":[]}')
    return result.steps || []
  }

  /**
   * 生成匹配标签（用于向量匹配学生）
   */
  private async generateMatchingTags(structuredTask: any) {
    const prompt = `你是启程OPC的AI导师。现在有一个任务，你需要提取关键标签，用于匹配合适的学生。

【任务】
${JSON.stringify(structuredTask, null, 2)}

【你的任务】
提取5-8个关键标签，每个标签包含：
- 标签名称
- 权重（0-1，重要性）
- 原因（为什么这个标签重要）

以JSON格式返回：
{
  "tags": [
    {
      "tagName": "平面设计",
      "weight": 1.0,
      "reason": "核心技能要求"
    },
    {
      "tagName": "美妆行业经验",
      "weight": 0.8,
      "reason": "行业经验能更好理解需求"
    }
  ]
}`

    const completion = await openai.chat.completions.create({
      model: AI_CONFIG.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      response_format: { type: 'json_object' }
    })

    const result = JSON.parse(completion.choices[0].message.content || '{"tags":[]}')
    return result.tags || []
  }

  /**
   * 为学生生成当前步骤的具体指导
   */
  async getStepGuidance(
    taskId: string,
    currentStep: number,
    studentContext: any
  ) {
    const prompt = `你是启程OPC的AI导师。学生正在执行任务的第${currentStep}步，需要你的具体指导。

【学生背景】
${JSON.stringify(studentContext, null, 2)}

【当前任务】
任务ID：${taskId}
当前步骤：第${currentStep}步

【你的任务】
为学生提供具体的、可操作的指导：
1. 这一步具体怎么做（步骤）
2. 常见问题和解决方案
3. 参考资源（工具、教程、案例）
4. 如何自检（检查清单）

直接返回指导内容（Markdown格式，不要JSON）。`

    const completion = await openai.chat.completions.create({
      model: AI_CONFIG.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 800
    })

    return completion.choices[0].message.content || '继续加油！'
  }
}

export const taskBreakdownService = new TaskBreakdownService()
