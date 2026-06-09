/**
 * 人生反思问题系统
 * GET  /life-question/questions            — 获取人生反思问题库
 * POST /life-question/answer               — 提交问题答案
 * GET  /life-question/reflections/:userId  — 获取用户的反思记录
 * GET  /life-question/insights/:userId     — 获取反思洞察分析
 */
import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as controller from './controller';

const router = Router();

// 所有路由都需要认证
router.use(authenticate);

router.get('/questions', controller.getQuestions);
router.post('/answer', controller.submitAnswer);
router.get('/reflections/:userId', controller.getReflections);
router.get('/insights/:userId', controller.getInsights);

export default router;
