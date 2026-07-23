import { Router } from 'express'
import { practiceController } from '../controllers/practice.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { aiLimiter } from '../middleware/rateLimiter.middleware'
import { validateBody, validateObjectId, validatePagination } from '../middleware/validation.middleware'

const router = Router()

// 所有路由都需要认证
router.use(authMiddleware)

// 实践项目列表
router.get('/projects', validatePagination, (req, res) => practiceController.getProjects(req, res))

// 项目详细报告
router.get('/projects/:id/report', validateObjectId('id'), (req, res) => practiceController.getReport(req, res))

// 统计数据
router.get('/stats', (req, res) => practiceController.getStats(req, res))

// 更新项目进度
router.put('/projects/:id/progress', (req, res) => practiceController.updateProgress(req, res))

// AI拆解报告 - 生成（限流：1小时10次）
router.post('/decomposition/generate', aiLimiter, validateBody(['projectId']), (req, res) => practiceController.generateDecomposition(req, res))

// AI拆解报告 - 查询状态
router.get('/decomposition/:reportId/status', (req, res) => practiceController.getDecompositionStatus(req, res))

// AI拆解报告 - 解锁（付费）
router.post('/decomposition/:reportId/unlock', (req, res) => practiceController.unlockDecomposition(req, res))

// AI拆解报告 - 获取完整内容
router.get('/decomposition/:reportId', (req, res) => practiceController.getDecomposition(req, res))

export default router
