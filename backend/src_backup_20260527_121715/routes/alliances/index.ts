/**
 * 联合体系统
 * POST /alliances/create                    — 创建联合体
 * POST /alliances/invite                    — 邀请成员加入联合体
 * POST /alliances/respond                   — 响应联合体邀请
 * GET  /alliances/student/:studentId        — 获取学生的联合体信息
 * GET  /alliances/:allianceId               — 获取联合体详情
 * POST /alliances/project                   — 创建联合体项目
 * GET  /alliances/invitations/:studentId    — 获取学生收到的联合体邀请
 */
import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as controller from './controller';

const router = Router();

// 所有路由都需要认证
router.use(authenticate);

// 创建联合体
router.post('/create', controller.createAlliance);

// 邀请成员
router.post('/invite', controller.inviteMember);

// 响应邀请
router.post('/respond', controller.respondToInvitation);

// 获取学生的联合体
router.get('/student/:studentId', controller.getStudentAlliances);

// 获取联合体详情
router.get('/:allianceId', controller.getAllianceDetail);

// 创建项目
router.post('/project', controller.createProject);

// 获取邀请列表
router.get('/invitations/:studentId', controller.getInvitations);

export default router;
