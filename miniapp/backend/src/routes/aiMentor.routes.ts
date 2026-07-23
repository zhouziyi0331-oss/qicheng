import { Router } from 'express'
import { authMiddleware as authenticate } from '../middleware/auth'
import * as aiMentorController from '../controllers/aiMentor.controller'

const router = Router()

router.use(authenticate)

/**
 * 获取AI导师指导
 * GET /api/ai-mentor/guidance
 */
router.get('/guidance', aiMentorController.getMentorGuidance)

export default router
