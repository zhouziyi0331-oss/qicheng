import { Router } from 'express'
import { authMiddleware as authenticate } from '../middleware/auth'
import * as vectorMatchController from '../controllers/vectorMatch.controller'

const router = Router()

// 所有路由都需要认证
router.use(authenticate)

// ========== 智能推荐 ==========

/**
 * 获取智能推荐项目（基于向量匹配）
 * GET /api/vector-match/recommendations?limit=20
 */
router.get('/recommendations', vectorMatchController.getRecommendedProjects)

// ========== 学生标签画像 ==========

/**
 * 初始化学生标签画像（基于OPC测评）
 * POST /api/vector-match/student/profile/initialize
 */
router.post('/student/profile/initialize', vectorMatchController.initializeProfile)

/**
 * 获取学生标签画像
 * GET /api/vector-match/student/profile
 */
router.get('/student/profile', vectorMatchController.getStudentProfile)

/**
 * 添加学生标签
 * POST /api/vector-match/student/tag
 * Body: { tagId, weight, source }
 */
router.post('/student/tag', vectorMatchController.addStudentTag)

// ========== 项目标签画像 ==========

/**
 * 创建项目标签画像
 * POST /api/vector-match/project/profile
 * Body: { projectId, projectType, tags, industries, requiredSkills, suitablePersonalities }
 */
router.post('/project/profile', vectorMatchController.createProjectProfile)

/**
 * 获取项目标签画像
 * GET /api/vector-match/project/:projectId/profile?projectType=real
 */
router.get('/project/:projectId/profile', vectorMatchController.getProjectProfile)

// ========== 标签管理 ==========

/**
 * 搜索标签
 * GET /api/vector-match/tags/search?keyword=设计&category=skill&limit=20
 */
router.get('/tags/search', vectorMatchController.searchTags)

/**
 * 获取所有标签分类
 * GET /api/vector-match/tags/categories
 */
router.get('/tags/categories', vectorMatchController.getTagCategories)

/**
 * 批量创建标签
 * POST /api/vector-match/tags/batch
 * Body: { tags: [{name, category, description, weight}] }
 */
router.post('/tags/batch', vectorMatchController.batchCreateTags)

export default router
