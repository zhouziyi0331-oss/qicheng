import { Router, Request, Response } from 'express';
import matchingEnhancementService from '../../services/matchingEnhancementService';
import { authenticate } from '../../middleware/auth';

const router = Router();

/**
 * E-05a: 试稿机制
 */

// 创建试稿邀请
router.post('/trial-invitations', authenticate, async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.userId;
    const { task_id, student_id, trial_requirement, trial_deadline, trial_budget } = req.body;

    if (!task_id || !student_id || !trial_requirement || !trial_deadline) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数',
      });
    }

    const invitation = await matchingEnhancementService.createTrialInvitation({
      task_id,
      student_id,
      company_id: companyId,
      trial_requirement,
      trial_deadline: new Date(trial_deadline),
      trial_budget,
    });

    res.json({
      success: true,
      data: invitation,
      message: '试稿邀请已发送',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '创建试稿邀请失败',
    });
  }
});

// 学生响应试稿邀请
router.post('/trial-invitations/:id/respond', authenticate, async (req: Request, res: Response) => {
  try {
    const studentId = req.user!.userId;
    const { id } = req.params;
    const { accepted, response } = req.body;

    const invitation = await matchingEnhancementService.respondToTrialInvitation(
      id,
      studentId,
      accepted,
      response
    );

    res.json({
      success: true,
      data: invitation,
      message: accepted ? '已接受试稿邀请' : '已拒绝试稿邀请',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '响应试稿邀请失败',
    });
  }
});

// 学生提交试稿
router.post('/trial-invitations/:id/submit', authenticate, async (req: Request, res: Response) => {
  try {
    const studentId = req.user!.userId;
    const { id } = req.params;
    const { submission, files } = req.body;

    if (!submission) {
      return res.status(400).json({
        success: false,
        message: '请提供试稿内容',
      });
    }

    const invitation = await matchingEnhancementService.submitTrial(id, studentId, submission, files);

    res.json({
      success: true,
      data: invitation,
      message: '试稿提交成功',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '提交试稿失败',
    });
  }
});

// 企业评估试稿
router.post('/trial-invitations/:id/evaluate', authenticate, async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.userId;
    const { id } = req.params;
    const { evaluation, score, approved } = req.body;

    if (!evaluation || score === undefined || approved === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数',
      });
    }

    const invitation = await matchingEnhancementService.evaluateTrial(
      id,
      companyId,
      evaluation,
      score,
      approved
    );

    res.json({
      success: true,
      data: invitation,
      message: '试稿评估完成',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '评估试稿失败',
    });
  }
});

// 获取试稿邀请列表
router.get('/trial-invitations', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const { status } = req.query;

    const invitations = await matchingEnhancementService.getTrialInvitations(
      userId,
      userRole,
      status as string
    );

    res.json({
      success: true,
      data: invitations,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '获取试稿邀请列表失败',
    });
  }
});

// 获取试稿统计
router.get('/trial-stats', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const stats = await matchingEnhancementService.getTrialStats(userId, userRole);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '获取试稿统计失败',
    });
  }
});

/**
 * E-05b: 学生对比视图
 */

// 对比多个学生
router.post('/compare-students', authenticate, async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.userId;
    const { student_ids, task_id, dimensions } = req.body;

    if (!student_ids || !Array.isArray(student_ids) || student_ids.length < 2) {
      return res.status(400).json({
        success: false,
        message: '请至少选择2个学生进行对比',
      });
    }

    if (student_ids.length > 5) {
      return res.status(400).json({
        success: false,
        message: '最多只能对比5个学生',
      });
    }

    const comparison = await matchingEnhancementService.compareStudents(
      companyId,
      student_ids,
      task_id,
      dimensions
    );

    res.json({
      success: true,
      data: comparison,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '对比学生失败',
    });
  }
});

/**
 * E-05c: 手动搜索和筛选
 */

// 搜索学生
router.post('/search-students', authenticate, async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.userId;
    const { filters, task_id } = req.body;

    if (!filters || typeof filters !== 'object') {
      return res.status(400).json({
        success: false,
        message: '请提供筛选条件',
      });
    }

    const students = await matchingEnhancementService.searchStudents(companyId, filters, task_id);

    res.json({
      success: true,
      data: students,
      count: students.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '搜索学生失败',
    });
  }
});

/**
 * E-05d: 匹配拒绝反馈
 */

// 记录拒绝反馈
router.post('/rejection-feedback', authenticate, async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.userId;
    const { task_id, student_id, reason, detail } = req.body;

    if (!task_id || !student_id || !reason) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数',
      });
    }

    const feedback = await matchingEnhancementService.recordRejectionFeedback(
      task_id,
      student_id,
      companyId,
      reason,
      detail
    );

    res.json({
      success: true,
      data: feedback,
      message: '反馈已记录',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '记录反馈失败',
    });
  }
});

// 获取学生的拒绝反馈
router.get('/rejection-feedback/student', authenticate, async (req: Request, res: Response) => {
  try {
    const studentId = req.user!.userId;

    const feedback = await matchingEnhancementService.getStudentRejectionFeedback(studentId);

    res.json({
      success: true,
      data: feedback,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '获取反馈失败',
    });
  }
});

// 分析拒绝原因统计
router.get('/rejection-patterns', authenticate, async (req: Request, res: Response) => {
  try {
    const { task_id } = req.query;

    const patterns = await matchingEnhancementService.analyzeRejectionPatterns(task_id as string);

    res.json({
      success: true,
      data: patterns,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '分析拒绝原因失败',
    });
  }
});

/**
 * 学生可见度设置
 */

// 更新学生可见度设置
router.put('/visibility-settings', authenticate, async (req: Request, res: Response) => {
  try {
    const studentId = req.user!.userId;
    const settings = req.body;

    const result = await matchingEnhancementService.updateVisibilitySettings(studentId, settings);

    res.json({
      success: true,
      data: result,
      message: '可见度设置已更新',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '更新可见度设置失败',
    });
  }
});

export default router;
