import { Router } from 'express'
import { getStats } from '../middleware/monitor.middleware'
import { Response, Request } from 'express'
import { authMiddleware, requireAdmin } from '../middleware/auth.middleware'
import { adminRealProjectController } from '../controllers/admin/realProject.admin.controller'
import { adminPaymentController } from '../controllers/admin/payment.admin.controller'
import { adminFinancialController } from '../controllers/admin/financial.admin.controller'

const router = Router()

/**
 * 财务管理路由（需要管理员权限）
 */
router.post('/financial/recalculate/:userId', authMiddleware, requireAdmin, adminFinancialController.recalculateBalance.bind(adminFinancialController))
router.post('/financial/recalculate-all', authMiddleware, requireAdmin, adminFinancialController.recalculateAllBalances.bind(adminFinancialController))

/**
 * 支付管理路由（需要管理员权限）
 */
router.post('/payments/grant', authMiddleware, requireAdmin, adminPaymentController.grantPayment.bind(adminPaymentController))
router.get('/payments/stats', authMiddleware, requireAdmin, adminPaymentController.getPaymentStats.bind(adminPaymentController))
router.get('/payments/:orderId', authMiddleware, requireAdmin, adminPaymentController.getPaymentDetail.bind(adminPaymentController))
router.get('/payments', authMiddleware, requireAdmin, adminPaymentController.getAllPayments.bind(adminPaymentController))

/**
 * 真实项目管理路由（需要管理员权限）
 */
router.get('/real-projects/stats', authMiddleware, requireAdmin, adminRealProjectController.getProjectStats.bind(adminRealProjectController))
router.get('/real-projects/pending-rating', authMiddleware, requireAdmin, adminRealProjectController.getPendingRatingProjects.bind(adminRealProjectController))
router.post('/real-projects/batch', authMiddleware, requireAdmin, adminRealProjectController.createProjectsBatch.bind(adminRealProjectController))
router.post('/real-projects', authMiddleware, requireAdmin, adminRealProjectController.createProject.bind(adminRealProjectController))
router.get('/real-projects', authMiddleware, requireAdmin, adminRealProjectController.getAllProjects.bind(adminRealProjectController))
router.put('/real-projects/:projectId', authMiddleware, requireAdmin, adminRealProjectController.updateProject.bind(adminRealProjectController))
router.delete('/real-projects/:projectId', authMiddleware, requireAdmin, adminRealProjectController.deleteProject.bind(adminRealProjectController))
router.post('/real-projects/:projectId/publish', authMiddleware, requireAdmin, adminRealProjectController.publishProject.bind(adminRealProjectController))
router.post('/real-projects/:projectId/unpublish', authMiddleware, requireAdmin, adminRealProjectController.unpublishProject.bind(adminRealProjectController))
router.post('/real-projects/:projectId/rating', authMiddleware, requireAdmin, adminRealProjectController.addClientRating.bind(adminRealProjectController))

/**
 * 系统监控路由
 */
router.get('/stats', (req: Request, res: Response) => {
  const stats = getStats()

  // 计算总体统计
  let totalRequests = 0
  let totalSuccess = 0
  let totalError = 0
  let totalAvgDuration = 0

  Object.values(stats).forEach(stat => {
    totalRequests += stat.total
    totalSuccess += stat.success
    totalError += stat.error
    totalAvgDuration += stat.avgDuration
  })

  const avgDuration = totalRequests > 0 ? totalAvgDuration / Object.keys(stats).length : 0

  res.json({
    overall: {
      totalRequests,
      successRate: totalRequests > 0 ? ((totalSuccess / totalRequests) * 100).toFixed(2) + '%' : '0%',
      errorRate: totalRequests > 0 ? ((totalError / totalRequests) * 100).toFixed(2) + '%' : '0%',
      avgDuration: avgDuration.toFixed(2) + 'ms'
    },
    byEndpoint: stats,
    timestamp: new Date().toISOString()
  })
})

/**
 * GET /api/admin/health-check
 * 详细的健康检查
 */
router.get('/health-check', async (req: Request, res: Response) => {
  const mongoose = require('mongoose')

  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      host: process.env.MONGODB_URI?.split('@')[1]?.split('/')[0] || 'unknown'
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB'
    },
    env: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  }

  res.json(health)
})

/**
 * POST /api/admin/clear-stats
 * 清除统计数据
 */
router.post('/clear-stats', (req: Request, res: Response) => {
  const stats = getStats()
  Object.keys(stats).forEach(key => delete stats[key])

  res.json({
    success: true,
    message: '统计数据已清除'
  })
})

export default router
