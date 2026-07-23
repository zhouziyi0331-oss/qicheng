import { Request, Response } from 'express'
import { vectorCoreService } from '../services/vectorCore.service'
import { log } from '../utils/logger'

/**
 * 统一的向量核心控制器
 * 替代之前碎片化的7个控制器
 */

/**
 * 项目完成 - 触发向量更新和所有功能
 * POST /api/vector-core/project-complete
 */
export const onProjectComplete = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const { projectId, newTags } = req.body

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: '缺少projectId参数'
      })
    }

    // 触发向量更新，返回所有功能的响应
    const response = await vectorCoreService.updateStudentVector(
      userId,
      newTags || [],
      {
        trigger: 'project_complete',
        projectId
      }
    )

    res.json({
      success: true,
      data: response,
      message: '项目完成处理成功'
    })
  } catch (error: any) {
    log.error('项目完成处理失败', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * OPC测评完成 - 触发向量更新
 * POST /api/vector-core/assessment-complete
 */
export const onAssessmentComplete = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const { assessmentId, newTags } = req.body

    if (!assessmentId) {
      return res.status(400).json({
        success: false,
        error: '缺少assessmentId参数'
      })
    }

    const response = await vectorCoreService.updateStudentVector(
      userId,
      newTags || [],
      {
        trigger: 'assessment',
        assessmentId
      }
    )

    res.json({
      success: true,
      data: response,
      message: '测评完成处理成功'
    })
  } catch (error: any) {
    log.error('测评完成处理失败', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * 获取学生当前状态 - 所有功能的统一查询
 * GET /api/vector-core/student-state
 *
 * 返回：
 * - 当前向量位置
 * - 项目推荐
 * - 成就状态
 * - 职业路径
 * - 技能建议
 * - 导师建议
 */
export const getStudentState = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!

    const response = await vectorCoreService.getStudentState(userId)

    res.json({
      success: true,
      data: response,
      message: '获取学生状态成功'
    })
  } catch (error: any) {
    log.error('获取学生状态失败', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * 手动更新学生向量
 * POST /api/vector-core/update-vector
 */
export const updateVector = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const { newTags, reason } = req.body

    if (!newTags || newTags.length === 0) {
      return res.status(400).json({
        success: false,
        error: '缺少newTags参数'
      })
    }

    const response = await vectorCoreService.updateStudentVector(
      userId,
      newTags,
      {
        trigger: 'manual'
      }
    )

    res.json({
      success: true,
      data: response,
      message: '向量更新成功'
    })
  } catch (error: any) {
    log.error('向量更新失败', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}
