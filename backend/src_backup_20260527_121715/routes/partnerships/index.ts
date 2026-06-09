/**
 * 合伙人关系系统
 * GET  /partnerships/:companyId/:studentId      — 获取企业与学生的合伙关系
 * POST /partnerships/update-count               — 更新合作次数
 * POST /partnerships/invite                     — 企业邀请学生成为合伙人
 * POST /partnerships/respond                    — 学生响应合伙邀请
 * GET  /partnerships/student/:studentId         — 获取学生的所有合伙关系
 * GET  /partnerships/company/:companyId         — 获取企业的所有合伙关系
 * POST /partnerships/interaction                — 记录合伙人互动
 */
import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as controller from './controller';

const router = Router();

// 所有路由都需要认证
router.use(authenticate);

// 获取特定合伙关系
router.get('/:companyId/:studentId', controller.getPartnership);

// 更新合作次数
router.post('/update-count', controller.updateCollaborationCount);

// 企业邀请学生成为合伙人
router.post('/invite', controller.invitePartner);

// 学生响应合伙邀请
router.post('/respond', controller.respondToInvitation);

// 获取学生的所有合伙关系
router.get('/student/:studentId', controller.getStudentPartnerships);

// 获取企业的所有合伙关系
router.get('/company/:companyId', controller.getCompanyPartnerships);

// 记录合伙人互动
router.post('/interaction', controller.recordInteraction);

export default router;
