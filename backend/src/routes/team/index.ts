import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate } from '../../middleware/auth';
import * as controller from './controller';

const router = Router();

// 所有路由都需要认证
router.use(authenticate);

// ============================================================
// 创建团队任务
// ============================================================
router.post(
  '/create',
  [
    body('taskId').isUUID().withMessage('任务ID格式错误'),
    body('maxMembers').optional().isInt({ min: 2, max: 10 }).withMessage('团队人数必须在2-10人之间'),
  ],
  controller.createTeam
);

// ============================================================
// 邀请成员加入团队
// ============================================================
router.post(
  '/:id/invite',
  [
    param('id').isUUID().withMessage('团队ID格式错误'),
    body('studentId').isUUID().withMessage('学生ID格式错误'),
  ],
  controller.inviteMember
);

// ============================================================
// 获取团队详情
// ============================================================
router.get(
  '/:id',
  [param('id').isUUID().withMessage('团队ID格式错误')],
  controller.getTeamDetail
);

// ============================================================
// 开始团队任务
// ============================================================
router.post(
  '/:id/start',
  [param('id').isUUID().withMessage('团队ID格式错误')],
  controller.startTeamTask
);

// ============================================================
// 完成团队任务并分配收益
// ============================================================
router.post(
  '/:id/complete',
  [
    param('id').isUUID().withMessage('团队ID格式错误'),
    body('contributions').isObject().withMessage('贡献度必须是对象'),
  ],
  controller.completeTeamTask
);

// ============================================================
// 获取我的团队列表
// ============================================================
router.get('/my', controller.getMyTeams);

export default router;
