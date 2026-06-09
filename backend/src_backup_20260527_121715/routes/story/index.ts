/**
 * 指令6: OPC故事墙 + 同类人信息流
 * RULE: NO LEADERBOARD — 永远不按 likes 排序 (PRD Ch.09 & Ch.24)
 *
 * GET  /story/feed           — 故事墙信息流 (按相似度+时间, 非点赞数)
 * POST /story/posts          — 发布故事
 * POST /story/posts/:id/like — 点赞 (仅存储, 不用于排序)
 * POST /story/:id/comment    — 评论故事
 * GET  /story/peers          — 同类人信息流
 * GET  /story-wall           — 故事墙列表（兼容路由）
 * POST /story-wall/submit    — 提交故事（兼容路由）
 */
import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import * as controller from './controller';

const router = Router();
router.use(authenticate, requireRole('student'));

// RULE: NO LEADERBOARD — See PRD Ch.09
router.get('/feed', controller.getFeed);
router.post('/posts', controller.createPost);
router.post('/posts/:id/like', controller.likePost);
router.post('/:id/comment', controller.commentOnStory);
router.get('/peers', controller.getPeersFeed);

// 兼容前端路由
router.get('/story-wall', controller.getStoryWall);
router.post('/story-wall/submit', controller.submitStory);

export default router;
