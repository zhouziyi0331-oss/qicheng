import { openai, AI_CONFIG } from '../config/openai'
import { PracticeProject } from '../models/PracticeProject'
import { DecompositionReport } from '../models/DecompositionReport'

interface ProjectData {
  title: string
  description: string
  company: string
  track: 'content' | 'dev'
  budget: number
  deliverables: string[]
  companyFeedback?: string
  processData?: {
    iterations: number
    revisionCount: number
    communicationCount: number
    toolsUsed: string[]
  }
}

export class AIDecompositionService {
  /**
   * 生成AI实践拆解报告的主函数
   */
  async generateDecompositionReport(projectId: string, userId: string): Promise<any> {
    try {
      // 1. 获取项目数据
      const project = await PracticeProject.findById(projectId)
      if (!project) {
        throw new Error('项目不存在')
      }

      if (project.status !== 'completed') {
        throw new Error('只有已完成的项目才能生成拆解报告')
      }

      // 2. 检查是否已有报告
      let report = await DecompositionReport.findOne({ projectId })
      if (!report) {
        report = new DecompositionReport({
          projectId,
          userId,
          status: 'generating'
        })
        await report.save()
      }

      // 3. 准备数据给AI
      const projectData: ProjectData = {
        title: project.title,
        description: project.description,
        company: project.company,
        track: project.track,
        budget: project.budget,
        deliverables: project.deliverables,
        companyFeedback: project.companyFeedback,
        processData: project.processData
      }

      // 4. 调用AI生成各模块
      const [
        abilityBreakdown,
        problemValue,
        targetCustomers,
        acquisitionChannels,
        growthPath
      ] = await Promise.all([
        this.generateAbilityBreakdown(projectData),
        this.generateProblemValue(projectData),
        this.generateTargetCustomers(projectData),
        this.generateAcquisitionChannels(projectData),
        this.generateGrowthPath(projectData)
      ])

      // 5. 保存AI生成结果
      report.abilityBreakdown = abilityBreakdown
      report.problemValue = problemValue
      report.targetCustomers = targetCustomers
      report.acquisitionChannels = acquisitionChannels
      report.growthPath = growthPath
      report.status = 'pending_review'
      report.generationMetadata = {
        aiModel: AI_CONFIG.model,
        promptVersion: '1.0',
        tokensUsed: 0, // 实际使用需要统计
        generatedAt: new Date()
      }

      await report.save()

      // 6. 返回预览数据（免费部分）
      return this.generatePreview(report)

    } catch (error) {
      console.error('生成拆解报告失败:', error)
      throw error
    }
  }

  /**
   * 模块1: 能力拆解
   */
  private async generateAbilityBreakdown(projectData: ProjectData): Promise<any> {
    const prompt = `你是一位专业的能力分析师。请分析以下实践项目，提取出核心能力。

项目信息：
- 标题：${projectData.title}
- 描述：${projectData.description}
- 公司：${projectData.company}
- 赛道：${projectData.track === 'content' ? '内容运营' : '产品开发'}
- 预算：¥${projectData.budget}
- 交付物：${projectData.deliverables.join(', ')}
${projectData.companyFeedback ? `- 企业反馈：${projectData.companyFeedback}` : ''}

任务要求：
1. 提取3-5个核心能力（不是工作内容，而是底层能力）
2. 每个能力必须包含：
   - 能力名称（准确、专业）
   - 能力描述（这个能力是什么，为什么重要）
   - 证据支撑（从项目中找到3条具体证据）
   - 市场价值（这个能力在市场上值多少钱，哪些岗位需要）

输出JSON格式：
{
  "abilities": [
    {
      "name": "能力名称",
      "description": "能力详细描述",
      "evidence": ["证据1", "证据2", "证据3"],
      "marketValue": "市场价值分析"
    }
  ]
}

注意：
- 能力要具体、可衡量、可复制
- 避免泛泛而谈（如"沟通能力"），要具体到细分领域
- 证据要从项目交付物和过程中提取，真实可信`

    try {
      const response = await openai.chat.completions.create({
        model: AI_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: '你是一位专业的能力分析师，擅长从实践项目中提取核心能力，并分析其市场价值。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: AI_CONFIG.temperature,
        max_tokens: AI_CONFIG.maxTokens,
        response_format: { type: 'json_object' }
      })

      const content = response.choices[0].message.content
      return JSON.parse(content || '{}')

    } catch (error) {
      console.error('生成能力拆解失败:', error)
      throw error
    }
  }

  /**
   * 模块2: 问题价值分析
   */
  private async generateProblemValue(projectData: ProjectData): Promise<any> {
    const prompt = `你是一位商业分析师。请分析这个项目解决了什么核心问题，以及这个问题的商业价值。

项目信息：
- 标题：${projectData.title}
- 描述：${projectData.description}
- 公司：${projectData.company}
- 企业反馈：${projectData.companyFeedback || '暂无'}

任务要求：
1. 找出企业的核心痛点（不是表面现象，而是深层问题）
2. 分析根本原因（为什么会有这个痛点）
3. 量化影响（这个问题造成了什么损失）
4. 提供改进指标（before vs after，必须有具体数据或估算）

输出JSON格式：
{
  "painPoint": "核心痛点（一句话）",
  "rootCause": "根本原因分析（2-3句话）",
  "impact": "造成的影响（具体、量化）",
  "metrics": [
    {
      "label": "指标名称",
      "before": "改进前数据",
      "after": "改进后数据"
    }
  ]
}

注意：
- 痛点要具体，不要泛泛而谈
- 数据如果没有准确值，给合理估算
- 关注商业影响，不只是技术问题`

    try {
      const response = await openai.chat.completions.create({
        model: AI_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: '你是一位商业分析师，擅长分析企业痛点和商业价值。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: AI_CONFIG.temperature,
        max_tokens: AI_CONFIG.maxTokens,
        response_format: { type: 'json_object' }
      })

      const content = response.choices[0].message.content
      return JSON.parse(content || '{}')

    } catch (error) {
      console.error('生成问题价值分析失败:', error)
      throw error
    }
  }

  /**
   * 模块3: 目标客户分析
   */
  private async generateTargetCustomers(projectData: ProjectData): Promise<any> {
    const prompt = `你是一位市场分析师。请分析哪些类型的客户会需要类似的服务。

项目信息：
- 标题：${projectData.title}
- 描述：${projectData.description}
- 赛道：${projectData.track === 'content' ? '内容运营' : '产品开发'}
- 公司类型：${projectData.company}

任务要求：
1. 找出3-5类目标客户类型
2. 每类客户必须包含：
   - 客户类型（具体的行业/角色）
   - 描述（这类客户的特征）
   - 痛点（他们遇到的具体问题）
   - 适用性（high/medium/low）
   - 价格区间（他们愿意为这个服务付多少钱）

输出JSON格式：
{
  "types": [
    {
      "type": "客户类型",
      "description": "客户特征描述",
      "painPoints": ["痛点1", "痛点2", "痛点3"],
      "applicability": "high",
      "priceRange": "价格区间"
    }
  ]
}

注意：
- 客户类型要具体，不要泛泛而谈（如"所有公司"）
- 痛点要和项目解决的问题相关
- 价格要符合市场行情`

    try {
      const response = await openai.chat.completions.create({
        model: AI_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: '你是一位市场分析师，擅长分析目标客户和市场需求。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: AI_CONFIG.temperature,
        max_tokens: AI_CONFIG.maxTokens,
        response_format: { type: 'json_object' }
      })

      const content = response.choices[0].message.content
      return JSON.parse(content || '{}')

    } catch (error) {
      console.error('生成目标客户分析失败:', error)
      throw error
    }
  }

  /**
   * 模块4: 获客渠道推荐
   */
  private async generateAcquisitionChannels(projectData: ProjectData): Promise<any> {
    const prompt = `你是一位增长专家。请推荐如何找到需要这个服务的客户。

项目信息：
- 标题：${projectData.title}
- 描述：${projectData.description}
- 赛道：${projectData.track === 'content' ? '内容运营' : '产品开发'}

任务要求：
1. 推荐3-5个获客渠道
2. 每个渠道必须包含：
   - 渠道名称（具体平台或方法）
   - 难度（easy/medium/hard）
   - 见效时间（多久能看到结果）
   - 具体战术（3-5条可执行的具体步骤）
   - 预期转化率（估算）

输出JSON格式：
{
  "channels": [
    {
      "name": "渠道名称",
      "difficulty": "medium",
      "timeToResult": "见效时间",
      "tactics": ["战术1", "战术2", "战术3"],
      "expectedConversion": "预期转化率"
    }
  ]
}

注意：
- 渠道要具体、可执行
- 战术要详细到可以立刻去做
- 避免泛泛而谈（如"社交媒体营销"），要具体到平台和方法`

    try {
      const response = await openai.chat.completions.create({
        model: AI_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: '你是一位增长专家，擅长设计获客渠道和增长策略。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: AI_CONFIG.temperature,
        max_tokens: AI_CONFIG.maxTokens,
        response_format: { type: 'json_object' }
      })

      const content = response.choices[0].message.content
      return JSON.parse(content || '{}')

    } catch (error) {
      console.error('生成获客渠道推荐失败:', error)
      throw error
    }
  }

  /**
   * 模块5: 成长路径规划
   */
  private async generateGrowthPath(projectData: ProjectData): Promise<any> {
    const prompt = `你是一位职业发展顾问。请为完成这个项目的人规划未来成长路径。

项目信息：
- 标题：${projectData.title}
- 描述：${projectData.description}
- 赛道：${projectData.track === 'content' ? '内容运营' : '产品开发'}
- 预算：¥${projectData.budget}

任务要求：
1. 设计3个阶段的成长路径：基础巩固、能力进阶、商业突破
2. 每个阶段包含：
   - 阶段名称
   - 时长（多久完成这个阶段）
   - 目标（3-5个具体目标）
   - 预期价值（完成后能达到什么水平）

输出JSON格式：
{
  "foundation": {
    "phase": "基础巩固",
    "duration": "1-3个月",
    "goals": ["目标1", "目标2", "目标3"],
    "expectedValue": "预期达到的价值"
  },
  "advanced": {
    "phase": "能力进阶",
    "duration": "3-6个月",
    "goals": ["目标1", "目标2", "目标3"],
    "expectedValue": "预期达到的价值"
  },
  "breakthrough": {
    "phase": "商业突破",
    "duration": "6-12个月",
    "goals": ["目标1", "目标2", "目标3"],
    "expectedValue": "预期达到的价值"
  }
}

注意：
- 成长路径要循序渐进、符合逻辑
- 目标要具体、可衡量
- 预期价值要量化（如收入提升、客单价提升等）`

    try {
      const response = await openai.chat.completions.create({
        model: AI_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: '你是一位职业发展顾问，擅长规划个人成长路径和商业发展策略。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: AI_CONFIG.temperature,
        max_tokens: AI_CONFIG.maxTokens,
        response_format: { type: 'json_object' }
      })

      const content = response.choices[0].message.content
      return JSON.parse(content || '{}')

    } catch (error) {
      console.error('生成成长路径规划失败:', error)
      throw error
    }
  }

  /**
   * 生成免费预览数据
   */
  private generatePreview(report: any): any {
    return {
      id: report._id,
      projectId: report.projectId,
      status: report.status,
      isUnlocked: report.isUnlocked,
      preview: {
        abilitiesCount: report.abilityBreakdown?.abilities?.length || 0,
        customerTypesCount: report.targetCustomers?.types?.length || 0,
        channelsCount: report.acquisitionChannels?.channels?.length || 0,
        hasGrowthPath: !!report.growthPath
      },
      // 只显示第一个能力的名称作为诱饵
      abilityPreview: report.abilityBreakdown?.abilities?.[0]?.name || '',
      createdAt: report.createdAt
    }
  }

  /**
   * 解锁报告（付费后）
   */
  async unlockReport(reportId: string, userId: string, paymentAmount: number): Promise<any> {
    const report = await DecompositionReport.findById(reportId)

    if (!report) {
      throw new Error('报告不存在')
    }

    if (report.userId !== userId) {
      throw new Error('无权访问此报告')
    }

    if (report.isUnlocked) {
      throw new Error('报告已解锁')
    }

    // 标记为已解锁
    report.isUnlocked = true
    report.unlockedAt = new Date()
    report.paymentAmount = paymentAmount
    await report.save()

    return report
  }

  /**
   * 获取完整报告（需要已解锁）
   */
  async getFullReport(reportId: string, userId: string): Promise<any> {
    const report = await DecompositionReport.findById(reportId)

    if (!report) {
      throw new Error('报告不存在')
    }

    if (report.userId !== userId) {
      throw new Error('无权访问此报告')
    }

    if (!report.isUnlocked) {
      throw new Error('报告未解锁，请先付费')
    }

    return report
  }
}

export const aiDecompositionService = new AIDecompositionService()
