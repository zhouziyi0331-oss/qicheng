/**
 * 邀请系统API路由
 * 处理邀请任务的创建、查询、响应等请求
 */

import { Router, Request, Response } from 'express';
import logger from '../../utils/logger';
import { authenticate } from '../../middleware/auth';
import { invitationTaskService } from '../../services/invitation/invitationService';
import { invitationMatchService } from '../../services/invitation/matchService';
import { activityService } from '../../services/invitation/activityService';

const router = Router();

// ==================== 商家端API ====================

/**
 * POST /api/v1/invitation/tasks
 * 创建邀请任务并自动匹配学生
 */
router.post('/tasks', authenticate, async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.userId;
    if (!companyId) {
      return res.status(401).json({ error: '未授权' });
    }

    const {
      title,
      description,
      requirements,
      deliverables,
      budget,
      deadline,
      target_level_min,
      target_abilities,
      target_tags,
      max_invitations,
      invitation_message,
    } = req.body;

    if (!title || !description || !budget) {
      return res.status(400).json({ error: '缺少必填字段' });
    }

    const result = await invitationTaskService.createInvitationTask(companyId, {
      title,
      description,
      requirements,
      deliverables,
      budget: parseFloat(budget),
      deadline: deadline ? new Date(deadline) : undefined,
      target_level_min: target_level_min || 10,
      target_abilities,
      target_tags,
      max_invitations: max_invitations || 5,
      invitation_message,
    });

    res.json({
      success: true,
      task: result.task,
      invitations: result.invitations,
      message: `成功创建邀请任务，已向${result.invitations.length}位学生发送邀请`,
    });
  } catch (error: any) {
    logger.error('创建邀请任务失败:', error);
    res.status(500).json({ error: error.message || '创建邀请任务失败' });
  }
});

/**
 * GET /api/v1/invitation/tasks/:taskId/invitations
 * 获取某个任务的所有邀请记录
 */
router.get('/tasks/:taskId/invitations', authenticate, async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.userId;
    const { taskId } = req.params;

    const invitations = await invitationTaskService.getCompanyInvitations(companyId!, taskId);

    res.json({
      success: true,
      invitations,
    });
  } catch (error: any) {
    logger.error('获取邀请记录失败:', error);
    res.status(500).json({ error: error.message || '获取邀请记录失败' });
  }
});

/**
 * DELETE /api/v1/invitation/invitations/:invitationId
 * 商家撤回邀请
 */
router.delete('/invitations/:invitationId', authenticate, async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.userId;
    const { invitationId } = req.params;

    await invitationTaskService.withdrawInvitation(invitationId, companyId!);

    res.json({
      success: true,
      message: '邀请已撤回',
    });
  } catch (error: any) {
    logger.error('撤回邀请失败:', error);
    res.status(500).json({ error: error.message || '撤回邀请失败' });
  }
});

/**
 * GET /api/v1/invitation/stats
 * 获取商家邀请统计
 */
router.get('/stats', authenticate, async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.userId;

    const stats = await invitationTaskService.getInvitationStats(companyId!);

    res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    logger.error('获取邀请统计失败:', error);
    res.status(500).json({ error: error.message || '获取邀请统计失败' });
  }
});

/**
 * PUT /api/v1/invitation/match-config
 * 更新商家匹配配置
 */
router.put('/match-config', authenticate, async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.userId;
    const config = req.body;

    await invitationMatchService.updateMatchConfig(companyId!, config);

    res.json({
      success: true,
      message: '匹配配置已更新',
    });
  } catch (error: any) {
    logger.error('更新匹配配置失败:', error);
    res.status(500).json({ error: error.message || '更新匹配配置失败' });
  }
});

// ==================== 学生端API ====================

/**
 * GET /api/v1/invitation/my-invitations
 * 获取学生收到的邀请列表
 */
router.get('/my-invitations', authenticate, async (req: Request, res: Response) => {
  try {
    const studentId = req.user?.userId;
    const { status } = req.query;

    // 记录活跃度
    await activityService.recordActivity(studentId!);

    const invitations = await invitationTaskService.getStudentInvitations(
      studentId!,
      status as string
    );

    res.json({
      success: true,
      invitations,
    });
  } catch (error: any) {
    logger.error('获取邀请列表失败:', error);
    res.status(500).json({ error: error.message || '获取邀请列表失败' });
  }
});

/**
 * POST /api/v1/invitation/invitations/:invitationId/accept
 * 学生接受邀请
 */
router.post('/invitations/:invitationId/accept', authenticate, async (req: Request, res: Response) => {
  try {
    const studentId = req.user?.userId;
    const { invitationId } = req.params;
    const { response_message } = req.body;

    // 检查邀请资格
    const eligible = await activityService.checkInvitationEligibility(studentId!);
    if (!eligible) {
      return res.status(403).json({ error: '您暂时没有接受邀请的资格' });
    }

    const result = await invitationTaskService.acceptInvitation(
      invitationId,
      studentId!,
      response_message
    );

    res.json({
      success: true,
      message: '邀请已接受，任务已创建',
      taskId: result.taskId,
    });
  } catch (error: any) {
    logger.error('接受邀请失败:', error);
    res.status(500).json({ error: error.message || '接受邀请失败' });
  }
});

/**
 * POST /api/v1/invitation/invitations/:invitationId/reject
 * 学生拒绝邀请
 */
router.post('/invitations/:invitationId/reject', authenticate, async (req: Request, res: Response) => {
  try {
    const studentId = req.user?.userId;
    const { invitationId } = req.params;
    const { response_message } = req.body;

    await invitationTaskService.rejectInvitation(invitationId, studentId!, response_message);

    res.json({
      success: true,
      message: '邀请已拒绝',
    });
  } catch (error: any) {
    logger.error('拒绝邀请失败:', error);
    res.status(500).json({ error: error.message || '拒绝邀请失败' });
  }
});

/**
 * POST /api/v1/invitation/invitations/:invitationId/view
 * 标记邀请为已查看
 */
router.post('/invitations/:invitationId/view', authenticate, async (req: Request, res: Response) => {
  try {
    const studentId = req.user?.userId;
    const { invitationId } = req.params;

    await invitationTaskService.markAsViewed(invitationId, studentId!);

    res.json({
      success: true,
    });
  } catch (error: any) {
    logger.error('标记已查看失败:', error);
    res.status(500).json({ error: error.message || '标记已查看失败' });
  }
});

/**
 * GET /api/v1/invitation/eligibility
 * 检查学生邀请资格
 */
router.get('/eligibility', authenticate, async (req: Request, res: Response) => {
  try {
    const studentId = req.user?.userId;

    const eligible = await activityService.checkInvitationEligibility(studentId!);
    const activityLog = await activityService.getActivityLog(studentId!);

    res.json({
      success: true,
      eligible,
      activity: activityLog,
    });
  } catch (error: any) {
    logger.error('检查邀请资格失败:', error);
    res.status(500).json({ error: error.message || '检查邀请资格失败' });
  }
});

// ==================== 定时任务API（内部调用） ====================

/**
 * POST /api/v1/invitation/cron/expire-invitations
 * 自动过期邀请（定时任务）
 */
router.post('/cron/expire-invitations', async (req: Request, res: Response) => {
  try {
    const count = await invitationTaskService.expireInvitations();

    res.json({
      success: true,
      message: `已过期${count}个邀请`,
      count,
    });
  } catch (error: any) {
    logger.error('过期邀请失败:', error);
    res.status(500).json({ error: error.message || '过期邀请失败' });
  }
});

/**
 * POST /api/v1/invitation/cron/detect-inactive
 * 检测不活跃学生（定时任务）
 */
router.post('/cron/detect-inactive', async (req: Request, res: Response) => {
  try {
    const count = await activityService.detectInactiveStudents();

    res.json({
      success: true,
      message: `已标记${count}个不活跃学生`,
      count,
    });
  } catch (error: any) {
    logger.error('检测不活跃学生失败:', error);
    res.status(500).json({ error: error.message || '检测不活跃学生失败' });
  }
});

export default router;
