/**
 * 创业孵化系统
 * GET  /incubation/projects/:userId        — 获取用户的孵化项目
 * POST /incubation/project/create          — 创建孵化项目
 * POST /incubation/project/update          — 更新项目进度
 * GET  /incubation/milestones/:projectId   — 获取项目里程碑
 * POST /incubation/milestone/create        — 创建里程碑
 * POST /incubation/milestone/complete      — 完成里程碑
 * GET  /incubation/resources               — 获取孵化资源
 */
import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as controller from './controller';

const router = Router();

// 所有路由都需要认证
router.use(authenticate);

router.get('/projects/:userId', controller.getProjects);
router.post('/project/create', controller.createProject);
router.post('/project/update', controller.updateProject);
router.get('/milestones/:projectId', controller.getMilestones);
router.post('/milestone/create', controller.createMilestone);
router.post('/milestone/complete', controller.completeMilestone);
router.get('/resources', controller.getResources);

export default router;
