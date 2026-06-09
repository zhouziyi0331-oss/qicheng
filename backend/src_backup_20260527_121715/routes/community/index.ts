/**
 * 社区板块路由
 */
import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import * as communityCtrl from './communityController';

const router = Router();

// 帖子管理
router.post('/posts', authenticate, requireRole('student'), communityCtrl.createPost);
router.get('/posts', authenticate, communityCtrl.getPosts);
router.get('/posts/:postId', authenticate, communityCtrl.getPostDetail);

// 申请加入
router.post('/posts/:postId/apply', authenticate, requireRole('student'), communityCtrl.applyToPost);
router.post('/posts/:postId/review-application', authenticate, requireRole('student'), communityCtrl.reviewApplication);
router.get('/posts/:postId/applications', authenticate, requireRole('student'), communityCtrl.getPostApplications);

// 帖子操作
router.post('/posts/:postId/close', authenticate, requireRole('student'), communityCtrl.closePost);
router.delete('/posts/:postId', authenticate, requireRole('student'), communityCtrl.deletePost);

// 个人相关
router.get('/my-posts', authenticate, requireRole('student'), communityCtrl.getMyPosts);
router.get('/my-applications', authenticate, requireRole('student'), communityCtrl.getMyApplications);

export default router;
