import { Router, Request, Response } from 'express';
import cultivationService from '../../services/cultivationService';
import { authenticate } from '../../middleware/auth';

const router = Router();

/**
 * E-12: 定向培养计划路由
 */

// 创建培养计划
router.post('/plans', authenticate, async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.userId;

    const plan = await cultivationService.createPlan({
      company_id: companyId,
      ...req.body,
    });

    res.json({
      success: true,
      data: plan,
      message: '培养计划创建成功',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '创建培养计划失败',
    });
  }
});

// 学生响应培养计划
router.post('/plans/:id/respond', authenticate, async (req: Request, res: Response) => {
  try {
    const studentId = req.user!.userId;
    const { id } = req.params;
    const { accepted, response } = req.body;

    const plan = await cultivationService.respondToPlan(id, studentId, accepted, response);

    res.json({
      success: true,
      data: plan,
      message: accepted ? '已接受培养计划' : '已拒绝培养计划',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '响应培养计划失败',
    });
  }
});

// 获取企业的培养计划列表
router.get('/plans/company', authenticate, async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.userId;
    const { status } = req.query;

    const plans = await cultivationService.getCompanyPlans(companyId, status as string);

    res.json({
      success: true,
      data: plans,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '获取培养计划列表失败',
    });
  }
});

// 获取学生的培养计划列表
router.get('/plans/student', authenticate, async (req: Request, res: Response) => {
  try {
    const studentId = req.user!.userId;
    const { status } = req.query;

    const plans = await cultivationService.getStudentPlans(studentId, status as string);

    res.json({
      success: true,
      data: plans,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '获取培养计划列表失败',
    });
  }
});

// 获取培养计划详情
router.get('/plans/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const plan = await cultivationService.getPlanById(id);

    res.json({
      success: true,
      data: plan,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '获取培养计划详情失败',
    });
  }
});

// 更新培养计划
router.put('/plans/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const plan = await cultivationService.updatePlan(id, req.body);

    res.json({
      success: true,
      data: plan,
      message: '培养计划更新成功',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '更新培养计划失败',
    });
  }
});

// 关联任务到培养计划
router.post('/plans/:id/link-task', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { task_id, phase_number, purpose } = req.body;

    if (!task_id || !phase_number) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数',
      });
    }

    await cultivationService.linkTask(id, task_id, phase_number, purpose);

    res.json({
      success: true,
      message: '任务关联成功',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '关联任务失败',
    });
  }
});

// 记录技能学习
router.post('/plans/:id/skills/start', authenticate, async (req: Request, res: Response) => {
  try {
    const studentId = req.user!.userId;
    const { id } = req.params;
    const { skill_name, skill_category } = req.body;

    if (!skill_name) {
      return res.status(400).json({
        success: false,
        message: '请提供技能名称',
      });
    }

    const record = await cultivationService.recordSkillLearning(
      id,
      studentId,
      skill_name,
      skill_category
    );

    res.json({
      success: true,
      data: record,
      message: '技能学习记录已创建',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '记录技能学习失败',
    });
  }
});

// 完成技能学习
router.post('/skills/:recordId/complete', authenticate, async (req: Request, res: Response) => {
  try {
    const { recordId } = req.params;
    const { proficiency_level, verified_by_task_id } = req.body;

    if (!proficiency_level) {
      return res.status(400).json({
        success: false,
        message: '请提供熟练度评分',
      });
    }

    const record = await cultivationService.completeSkillLearning(
      recordId,
      proficiency_level,
      verified_by_task_id
    );

    res.json({
      success: true,
      data: record,
      message: '技能学习已完成',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '完成技能学习失败',
    });
  }
});

// 添加反馈
router.post('/plans/:id/feedback', authenticate, async (req: Request, res: Response) => {
  try {
    const feedbackBy = req.user!.userId;
    const { id } = req.params;
    const { feedback_role, feedback_type, content } = req.body;

    if (!feedback_type || !content) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数',
      });
    }

    const feedback = await cultivationService.addFeedback(
      id,
      feedbackBy,
      feedback_role,
      feedback_type,
      content
    );

    res.json({
      success: true,
      data: feedback,
      message: '反馈添加成功',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '添加反馈失败',
    });
  }
});

// 获取反馈列表
router.get('/plans/:id/feedback', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const feedbacks = await cultivationService.getFeedbacks(id);

    res.json({
      success: true,
      data: feedbacks,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '获取反馈列表失败',
    });
  }
});

// 评估培养计划
router.post('/plans/:id/evaluate', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { evaluation, success_score } = req.body;

    if (!evaluation || success_score === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数',
      });
    }

    const plan = await cultivationService.evaluatePlan(id, evaluation, success_score);

    res.json({
      success: true,
      data: plan,
      message: '培养计划评估完成',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '评估培养计划失败',
    });
  }
});

// 获取培养统计
router.get('/stats', authenticate, async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.userId;

    const stats = await cultivationService.getCultivationStats(companyId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '获取培养统计失败',
    });
  }
});

// 获取推荐培养方案模板
router.get('/templates/:targetRole', authenticate, async (req: Request, res: Response) => {
  try {
    const { targetRole } = req.params;

    const template = await cultivationService.getRecommendedTemplate(targetRole);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: '未找到该角色的培养方案模板',
      });
    }

    res.json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '获取培养方案模板失败',
    });
  }
});

export default router;
