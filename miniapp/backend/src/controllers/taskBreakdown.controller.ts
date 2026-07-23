import { Request, Response } from 'express'
import { taskBreakdownService } from '../services/taskBreakdown.service'
import { vectorCoreService } from '../services/vectorCore.service'
import { log } from '../utils/logger'

/**
 * 任务拆解控制器
 * 核心：企业-学生之间的翻译器
 */

/**
 * POST /api/task-breakdown/analyze
 * 企业发布任务 - 第一步分析
 */
export const analyzeTask = async (req: Request, res: Response) => {
  try {
    const { rawInput, industry, additionalInfo } = req.body

    if (!rawInput) {
      return res.status(400).json({ error: '请提供任务描述' })
    }

    // 🎯 核心：AI任务拆解
    const result = await taskBreakdownService.analyzeAndBreakdown({
      rawInput,
      industry,
      additionalInfo
    })

    // 如果需要追问
    if (result.needsClarification) {
      return res.json({
        success: true,
        needsClarification: true,
        questions: result.clarificationQuestions,
        message: '需要更多信息才能生成任务'
      })
    }

    // 如果信息足够，返回完整拆解
    res.json({
      success: true,
      needsClarification: false,
      data: {
        structuredTask: result.structuredTask,
        executionSteps: result.executionSteps,
        matchingTags: result.matchingTags
      },
      message: '任务拆解完成'
    })

  } catch (error: any) {
    log.error('任务分析失败', { error: error.message })
    res.status(500).json({ error: '任务分析失败' })
  }
}

/**
 * POST /api/task-breakdown/match-students
 * 基于拆解结果匹配学生
 */
export const matchStudents = async (req: Request, res: Response) => {
  try {
    const { matchingTags, structuredTask } = req.body

    if (!matchingTags || !Array.isArray(matchingTags)) {
      return res.status(400).json({ error: '缺少匹配标签' })
    }

    // TODO: 基于标签生成任务向量，然后在学生向量空间中搜索
    // 暂时返回模拟数据
    res.json({
      success: true,
      data: {
        matchedStudents: [],
        message: '向量匹配功能需要OpenAI API Key'
      }
    })

  } catch (error: any) {
    log.error('匹配学生失败', { error: error.message })
    res.status(500).json({ error: '匹配学生失败' })
  }
}

/**
 * POST /api/task-breakdown/step-guidance
 * 学生执行任务时，获取当前步骤的具体指导
 */
export const getStepGuidance = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const { taskId, currentStep, studentContext } = req.body

    if (!taskId || !currentStep) {
      return res.status(400).json({ error: '缺少taskId或currentStep' })
    }

    // 🎯 AI导师的具体指导
    const guidance = await taskBreakdownService.getStepGuidance(
      taskId,
      currentStep,
      studentContext || {}
    )

    res.json({
      success: true,
      data: {
        guidance,
        step: currentStep
      }
    })

  } catch (error: any) {
    log.error('获取步骤指导失败', { error: error.message })
    res.status(500).json({ error: '获取步骤指导失败' })
  }
}

/**
 * POST /api/task-breakdown/create-project
 * 基于拆解结果创建正式项目
 */
export const createProjectFromBreakdown = async (req: Request, res: Response) => {
  try {
    const enterpriseId = (req as any).userId
    const { structuredTask, executionSteps, matchingTags } = req.body

    if (!structuredTask) {
      return res.status(400).json({ error: '缺少任务信息' })
    }

    // TODO: 创建RealProject记录
    // 暂时返回成功
    res.json({
      success: true,
      data: {
        projectId: 'temp_project_id',
        message: '项目创建成功，等待学生申请'
      }
    })

  } catch (error: any) {
    log.error('创建项目失败', { error: error.message })
    res.status(500).json({ error: '创建项目失败' })
  }
}
