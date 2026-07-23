import { Router } from 'express'
import { authMiddleware as authenticate } from '../middleware/auth'
import * as opcController from '../controllers/opc.controller'
import * as matchController from '../controllers/match.controller'

const router = Router()

// 获取测试题（不需要认证）
router.get('/questions', opcController.getQuestions)

// 以下路由需要认证
router.use(authenticate)

// 提交OPC测评
router.post('/submit', opcController.submitTest)

// 获取指定用户的测评结果
router.get('/result/:userId', opcController.getResult)

// 获取当前用户最新的测评结果
router.get('/latest', opcController.getLatestResult)

// 获取当前用户所有测评历史
router.get('/history', opcController.getUserResults)

// 生成OPC成长报告
router.get('/report/:userId', opcController.generateReport)

// 项目匹配相关
router.get('/match/projects', matchController.getMatchedProjects)
router.get('/match/project/:projectId', matchController.getProjectMatchInfo)

export default router
