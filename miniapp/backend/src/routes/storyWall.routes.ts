import { Router } from 'express'
import { storyWallController } from '../controllers/storyWall.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

// 公开路由
router.get('/stories', storyWallController.getPublicStories.bind(storyWallController))
router.get('/stories/:storyId', storyWallController.getStoryDetail.bind(storyWallController))
router.get('/stats', storyWallController.getStoryWallStats.bind(storyWallController))

// 需要认证的路由
router.post('/stories', authMiddleware, storyWallController.createStory.bind(storyWallController))
router.post('/stories/:storyId/like', authMiddleware, storyWallController.likeStory.bind(storyWallController))
router.get('/my-stories', authMiddleware, storyWallController.getUserStories.bind(storyWallController))
router.get('/my-stats', authMiddleware, storyWallController.getUserStoryStats.bind(storyWallController))

// 热情火花
router.post('/passion-sparks', authMiddleware, storyWallController.recordPassionSpark.bind(storyWallController))
router.get('/passion-sparks', authMiddleware, storyWallController.getUserPassionSparks.bind(storyWallController))

export default router
