import express from 'express';
import riskDetectionService from '../../services/riskDetectionService';
import { authenticateToken } from '../../middleware/auth';

const router = express.Router();

/**
 * POST /api/risk-detection/assess
 * 实时风险评估（任务发布前）
 */
router.post('/assess', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      budget,
      deadline,
      requiredSkills,
      deliverableRequirements,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: title, description',
      });
    }

    const assessment = await riskDetectionService.assessTaskRisk({
      title,
      description,
      budget,
      deadline: deadline ? new Date(deadline) : undefined,
      requiredSkills,
      deliverableRequirements,
    });

    res.json({
      success: true,
      data: assessment,
      message: '风险评估完成',
    });
  } catch (error: any) {
    logger.error('风险评估失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '风险评估失败',
    });
  }
});

/**
 * POST /api/risk-detection/tasks/:taskId/assess
 * 评估已创建任务的风险
 */
router.post('/tasks/:taskId/assess', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    // 权限检查：只有企业用户可以评估自己的任务
    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业用户可以评估任务风险',
      });
    }

    // 获取任务信息
    const taskResult = await req.app.locals.pool.query(
      `SELECT * FROM tasks WHERE id = $1 AND company_id = $2`,
      [taskId, userId]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '任务不存在或无权访问',
      });
    }

    const task = taskResult.rows[0];

    const assessment = await riskDetectionService.assessTaskRisk({
      taskId,
      title: task.title,
      description: task.description,
      budget: task.budget,
      deadline: task.deadline,
      requiredSkills: task.required_skills || [],
      deliverableRequirements: task.deliverable_requirements,
    });

    res.json({
      success: true,
      data: assessment,
      message: '风险评估完成',
    });
  } catch (error: any) {
    logger.error('评估任务风险失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '风险评估失败',
    });
  }
});

/**
 * GET /api/risk-detection/tasks/:taskId/history
 * 获取任务的风险评估历史
 */
router.get('/tasks/:taskId/history', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    // 权限检查
    const taskResult = await req.app.locals.pool.query(
      `SELECT company_id FROM tasks WHERE id = $1`,
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '任务不存在',
      });
    }

    const hasAccess =
      userRole === 'admin' || taskResult.rows[0].company_id === userId;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: '无权查看风险评估历史',
      });
    }

    const history = await riskDetectionService.getTaskRiskHistory(taskId);

    res.json({
      success: true,
      data: {
        history,
        total: history.length,
      },
    });
  } catch (error: any) {
    logger.error('获取风险历史失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取风险历史失败',
    });
  }
});

/**
 * POST /api/risk-detection/assessments/:assessmentId/acknowledge
 * 企业确认风险评估
 */
router.post('/assessments/:assessmentId/acknowledge', authenticateToken, async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业用户可以确认风险',
      });
    }

    const { decision, notes } = req.body;

    if (!decision || !['proceed_anyway', 'revise_task', 'cancel'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'decision必须是: proceed_anyway, revise_task, 或 cancel',
      });
    }

    // 验证评估归属
    const assessmentResult = await req.app.locals.pool.query(
      `SELECT ra.*, t.company_id
       FROM risk_assessments ra
       JOIN tasks t ON ra.task_id = t.id
       WHERE ra.id = $1`,
      [assessmentId]
    );

    if (assessmentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '风险评估不存在',
      });
    }

    if (assessmentResult.rows[0].company_id !== companyId) {
      return res.status(403).json({
        success: false,
        message: '无权操作该风险评估',
      });
    }

    await riskDetectionService.acknowledgeRisk(
      assessmentId,
      companyId,
      decision,
      notes
    );

    res.json({
      success: true,
      message: '风险确认成功',
    });
  } catch (error: any) {
    logger.error('确认风险失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '确认风险失败',
    });
  }
});

/**
 * GET /api/risk-detection/my-stats
 * 获取企业的风险统计
 */
router.get('/my-stats', authenticateToken, async (req, res) => {
  try {
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业用户可以查看统计',
      });
    }

    const stats = await riskDetectionService.getCompanyRiskStats(companyId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    logger.error('获取风险统计失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取统计失败',
    });
  }
});

/**
 * GET /api/risk-detection/risk-types
 * 获取常见风险类型
 */
router.get('/risk-types', authenticateToken, async (req, res) => {
  try {
    const riskTypes = await riskDetectionService.getCommonRiskTypes();

    res.json({
      success: true,
      data: {
        risk_types: riskTypes,
        total: riskTypes.length,
      },
    });
  } catch (error: any) {
    logger.error('获取风险类型失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取风险类型失败',
    });
  }
});

export default router;
