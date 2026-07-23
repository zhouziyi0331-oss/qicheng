import { Router } from 'express'
import { secretSpaceController } from '../controllers/secretSpace.controller'
import { authenticateToken } from '../middleware/auth'

const router = Router()

// 所有路由都需要认证
router.use(authenticateToken)

// 获取空间统计
router.get('/stats', secretSpaceController.getSpaceStats.bind(secretSpaceController))

// 获取心情记录
router.get('/mood', secretSpaceController.getMoodRecords.bind(secretSpaceController))

// 获取秘密空间
router.get('/', secretSpaceController.getSecretSpace.bind(secretSpaceController))

// 签到
router.post('/check-in', secretSpaceController.checkIn.bind(secretSpaceController))

// 记录心情
router.post('/mood', secretSpaceController.recordMood.bind(secretSpaceController))

// 添加私密笔记
router.post('/notes', secretSpaceController.addPrivateNote.bind(secretSpaceController))

// 更新私密笔记
router.put('/notes/:noteId', secretSpaceController.updatePrivateNote.bind(secretSpaceController))

// 删除私密笔记
router.delete('/notes/:noteId', secretSpaceController.deletePrivateNote.bind(secretSpaceController))

// 添加个人里程碑
router.post('/milestones', secretSpaceController.addPersonalMilestone.bind(secretSpaceController))

// 完成个人里程碑
router.put('/milestones/:milestoneId/complete', secretSpaceController.completeMilestone.bind(secretSpaceController))

// 添加名言收藏
router.post('/quotes', secretSpaceController.addFavoriteQuote.bind(secretSpaceController))

// 更新空间设置
router.put('/settings', secretSpaceController.updateSettings.bind(secretSpaceController))

export default router
