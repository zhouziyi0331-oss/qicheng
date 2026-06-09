/**
 * 组队系统路由
 */
import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import * as teamCtrl from './teamController';

const router = Router();

// 队伍管理
router.post('/', authenticate, requireRole('student'), teamCtrl.createTeam);
router.get('/my-teams', authenticate, requireRole('student'), teamCtrl.getMyTeams);
router.get('/:teamId', authenticate, teamCtrl.getTeamInfo);

// 队伍申请
router.post('/:teamId/apply', authenticate, requireRole('student'), teamCtrl.applyToJoinTeam);
router.post('/:teamId/review-application', authenticate, requireRole('student'), teamCtrl.reviewApplication);

// 任务分配
router.post('/:teamId/assign-module', authenticate, requireRole('student'), teamCtrl.assignModule);

// 邀请链接
router.post('/:teamId/generate-invite', authenticate, requireRole('student'), teamCtrl.generateInviteLink);
router.post('/join-by-code', authenticate, requireRole('student'), teamCtrl.joinByInviteCode);

// 队伍操作
router.post('/:teamId/leave', authenticate, requireRole('student'), teamCtrl.leaveTeam);
router.post('/:teamId/disband', authenticate, requireRole('student'), teamCtrl.disbandTeam);

export default router;
