import { Router } from 'express'
import { taskProgressController } from '../controllers/taskProgress.controller'
import { authenticateToken } from '../middleware/auth'

const router = Router()

// 所有路由都需要认证
router.use(authenticateToken)

// 生成任务拆解
router.post('/generate', taskProgressController.generateTaskDecomposition.bind(taskProgressController))

// 获取我的任务进度列表
router.get('/my/list', taskProgressController.getMyTaskProgressList.bind(taskProgressController))

// 获取项目的任务进度
router.get('/:projectId', taskProgressController.getTaskProgress.bind(taskProgressController))

// 更新任务状态
router.put('/:progressId/task/:taskNumber', taskProgressController.updateTaskStatus.bind(taskProgressController))

// 记录任务挑战
router.post('/:progressId/task/:taskNumber/challenge', taskProgressController.addChallenge.bind(taskProgressController))

// 添加任务反思
router.post('/:progressId/task/:taskNumber/reflection', taskProgressController.addReflection.bind(taskProgressController))

// 生成项目完成总结
router.post('/:progressId/summary', taskProgressController.generateProjectSummary.bind(taskProgressController))

export default router
