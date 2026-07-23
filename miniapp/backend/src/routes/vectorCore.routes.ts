import { Router } from 'express'
import { authMiddleware as authenticate } from '../middleware/auth'
import * as vectorCoreController from '../controllers/vectorCore.controller'

const router = Router()

// 所有路由都需要认证
router.use(authenticate)

/**
 * 项目完成 - 触发向量更新，返回所有功能响应
 * POST /api/vector-core/project-complete
 *
 * Body: {
 *   projectId: string,
 *   newTags?: Array<{ tagId: string, weight: number, source: string }>
 * }
 *
 * 返回：
 * - 成长分析
 * - 项目推荐
 * - 成就解锁
 * - 职业路径
 * - 技能建议
 * - 导师建议
 */
router.post('/project-complete', vectorCoreController.onProjectComplete)

/**
 * OPC测评完成 - 触发向量更新
 * POST /api/vector-core/assessment-complete
 */
router.post('/assessment-complete', vectorCoreController.onAssessmentComplete)

/**
 * 获取学生当前状态 - 统一查询所有功能
 * GET /api/vector-core/student-state
 *
 * 返回：
 * - 当前向量位置
 * - 项目推荐
 * - 成就状态
 * - 职业路径
 * - 技能建议
 * - 导师建议
 */
router.get('/student-state', vectorCoreController.getStudentState)

/**
 * 手动更新学生向量
 * POST /api/vector-core/update-vector
 */
router.post('/update-vector', vectorCoreController.updateVector)

export default router
