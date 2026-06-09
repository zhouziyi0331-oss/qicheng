/**
 * 模式探索系统
 * GET  /exploration/patterns/:userId       — 获取用户的模式探索记录
 * POST /exploration/pattern/apply          — 应用某个模式
 * POST /exploration/pattern/mark-life      — 标记为人生模式
 * POST /exploration/reflection             — 提交反思记录
 * GET  /exploration/reflections/:userId    — 获取反思记录
 * GET  /exploration/suggestions            — 获取探索建议
 * POST /exploration/tag                    — 为探索记录添加标签
 * GET  /exploration/tags/:userId           — 获取用户的所有标签
 */
import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as controller from './controller';

const router = Router();

// 所有路由都需要认证
router.use(authenticate);

router.get('/patterns/:userId', controller.getPatterns);
router.post('/pattern/apply', controller.applyPattern);
router.post('/pattern/mark-life', controller.markAsLifePattern);
router.post('/reflection', controller.submitReflection);
router.get('/reflections/:userId', controller.getReflections);
router.get('/suggestions', controller.getSuggestions);
router.post('/tag', controller.addTag);
router.get('/tags/:userId', controller.getTags);

export default router;
