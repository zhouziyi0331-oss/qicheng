import { Router, Request, Response } from 'express'
import logger from '../utils/logger';
import opcV2AnalysisService from '../services/opcV2AnalysisService'
import { authenticate } from '../middleware/auth'

const router = Router()

/**
 * 开始新的OPC v2.0测试
 * POST /api/v1/opc-v2/start
 */
router.post('/start', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId

    const assessmentId = await opcV2AnalysisService.startAssessment(userId)

    res.json({
      success: true,
      data: {
        assessmentId
      }
    })
  } catch (error: any) {
    logger.error('启动OPC v2.0测试失败:', error)
    res.status(500).json({
      success: false,
      message: error.message || '启动测试失败'
    })
  }
})

/**
 * 提交答案
 * POST /api/v1/opc-v2/answer
 */
router.post('/answer', authenticate, async (req: Request, res: Response) => {
  try {
    const { assessmentId, questionId, answerType, answerText, selectedOption } = req.body

    // 验证参数
    if (!assessmentId || !questionId || !answerType) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      })
    }

    if (answerType !== 'definition' && answerType !== 'choice') {
      return res.status(400).json({
        success: false,
        message: '答案类型无效'
      })
    }

    if (answerType === 'definition' && !answerText) {
      return res.status(400).json({
        success: false,
        message: '前置定义题需要提供文字答案'
      })
    }

    if (answerType === 'choice' && !selectedOption) {
      return res.status(400).json({
        success: false,
        message: '选择题需要提供选项'
      })
    }

    await opcV2AnalysisService.submitAnswer(
      assessmentId,
      questionId,
      answerType,
      { answerText, selectedOption }
    )

    res.json({
      success: true,
      message: '答案已保存'
    })
  } catch (error: any) {
    logger.error('提交答案失败:', error)
    res.status(500).json({
      success: false,
      message: error.message || '提交答案失败'
    })
  }
})

/**
 * 完成测试并生成分析报告
 * POST /api/v1/opc-v2/:assessmentId/complete
 */
router.post('/:assessmentId/complete', authenticate, async (req: Request, res: Response) => {
  try {
    const { assessmentId } = req.params

    // 生成分析报告（调用AI）
    const result = await opcV2AnalysisService.completeAssessment(assessmentId)

    res.json({
      success: true,
      data: result,
      message: '分析完成'
    })
  } catch (error: any) {
    logger.error('完成测试失败:', error)
    res.status(500).json({
      success: false,
      message: error.message || '分析失败，请重试'
    })
  }
})

/**
 * 获取测试进度
 * GET /api/v1/opc-v2/:assessmentId/progress
 */
router.get('/:assessmentId/progress', authenticate, async (req: Request, res: Response) => {
  try {
    const { assessmentId } = req.params

    // TODO: 实现获取进度逻辑
    res.json({
      success: true,
      data: {
        currentStep: 'choice_questions',
        preQuestionsCompleted: true,
        choiceQuestionsCompleted: false,
        answeredCount: 15,
        totalCount: 36
      }
    })
  } catch (error: any) {
    logger.error('获取进度失败:', error)
    res.status(500).json({
      success: false,
      message: error.message || '获取进度失败'
    })
  }
})

/**
 * 获取测试结果
 * GET /api/v1/opc-v2/:assessmentId/result
 */
router.get('/:assessmentId/result', authenticate, async (req: Request, res: Response) => {
  try {
    const { assessmentId } = req.params

    const result = await opcV2AnalysisService.getResult(assessmentId)

    if (!result) {
      return res.status(404).json({
        success: false,
        message: '测试结果不存在'
      })
    }

    res.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    logger.error('获取结果失败:', error)
    res.status(500).json({
      success: false,
      message: error.message || '获取结果失败'
    })
  }
})

/**
 * 获取用户最新的OPC结果
 * GET /api/v1/opc-v2/latest
 */
router.get('/latest', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId

    const result = await opcV2AnalysisService.getLatestResult(userId)

    if (!result) {
      return res.status(404).json({
        success: false,
        message: '尚未完成测试'
      })
    }

    res.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    logger.error('获取最新结果失败:', error)
    res.status(500).json({
      success: false,
      message: error.message || '获取结果失败'
    })
  }
})

export default router
