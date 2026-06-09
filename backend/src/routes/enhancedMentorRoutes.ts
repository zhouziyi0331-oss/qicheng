import { Router } from 'express';
import multer from 'multer';
import enhancedMentorController from '../controllers/enhancedMentorController';
import { authenticate } from '../middleware/auth';

const router = Router();

// 配置文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

/**
 * 增强版导师路由
 * 统一的API路由，整合情感陪伴和项目实战功能
 */

// ==================== 核心对话 ====================

/**
 * 统一对话接口
 * POST /api/v1/mentor/chat
 *
 * Body:
 * - message: string (必需) - 用户消息
 * - sessionId?: string - 会话ID（继续对话）
 * - taskId?: string - 任务ID（任务相关对话）
 * - projectId?: string - 项目ID（项目相关对话）
 * - forceMode?: 'emotional' | 'project' - 强制使用某种模式
 */
router.post('/chat', authenticate, enhancedMentorController.chat);

/**
 * 切换导师模式
 * POST /api/v1/mentor/switch-mode
 *
 * Body:
 * - mode: 'emotional' | 'project' | 'auto'
 */
router.post('/switch-mode', authenticate, enhancedMentorController.switchMode);

/**
 * 获取导师使用统计
 * GET /api/v1/mentor/stats
 */
router.get('/stats', authenticate, enhancedMentorController.getStats);

// ==================== 项目管理 ====================

/**
 * 初始化新项目
 * POST /api/v1/mentor/projects/init
 *
 * Body:
 * - initialProblem: string (必需) - 初始问题描述
 * - title?: string - 项目标题
 * - domain?: string - 项目领域
 * - learningGoals?: string[] - 学习目标
 */
router.post('/projects/init', authenticate, enhancedMentorController.initProject);

/**
 * 获取用户的项目列表
 * GET /api/v1/mentor/projects
 *
 * Query:
 * - status?: string - 项目状态筛选
 */
router.get('/projects', authenticate, enhancedMentorController.getProjects);

/**
 * 获取项目详情
 * GET /api/v1/mentor/projects/:projectId
 */
router.get('/projects/:projectId', authenticate, enhancedMentorController.getProjectDetail);

// ==================== 任务拆解 ====================

/**
 * 任务拆解引导
 * POST /api/v1/mentor/projects/:projectId/decompose
 *
 * Body:
 * - taskDescription: string (必需) - 任务描述
 */
router.post(
  '/projects/:projectId/decompose',
  authenticate,
  enhancedMentorController.guideDecomposition
);

/**
 * 评估任务拆解
 * POST /api/v1/mentor/projects/:projectId/evaluate-decomposition
 *
 * Body:
 * - tasks: Array<{title: string, description: string}> (必需)
 */
router.post(
  '/projects/:projectId/evaluate-decomposition',
  authenticate,
  enhancedMentorController.evaluateDecomposition
);

// ==================== 代码执行 ====================

/**
 * 执行代码
 * POST /api/v1/mentor/projects/:projectId/execute-code
 *
 * Body:
 * - language: string (必需) - 编程语言
 * - code: string (必需) - 代码内容
 * - timeout?: number - 超时时间（毫秒）
 */
router.post(
  '/projects/:projectId/execute-code',
  authenticate,
  enhancedMentorController.executeCode
);

/**
 * 获取代码执行历史
 * GET /api/v1/mentor/projects/:projectId/execution-history
 *
 * Query:
 * - limit?: number - 返回数量限制
 */
router.get(
  '/projects/:projectId/execution-history',
  authenticate,
  enhancedMentorController.getExecutionHistory
);

// ==================== 文件管理 ====================

/**
 * 上传文件
 * POST /api/v1/mentor/projects/:projectId/upload
 *
 * Form Data:
 * - file: File (必需) - 文件
 * - purpose?: string - 文件用途
 * - aiAnalyze?: boolean - 是否AI分析（默认true）
 */
router.post(
  '/projects/:projectId/upload',
  authenticate,
  upload.single('file'),
  enhancedMentorController.uploadFile
);

/**
 * 获取项目文件列表
 * GET /api/v1/mentor/projects/:projectId/files
 *
 * Query:
 * - fileType?: string - 文件类型筛选
 */
router.get(
  '/projects/:projectId/files',
  authenticate,
  enhancedMentorController.getProjectFiles
);

/**
 * 删除文件
 * DELETE /api/v1/mentor/files/:fileId
 */
router.delete(
  '/files/:fileId',
  authenticate,
  enhancedMentorController.deleteFile
);

// ==================== 反思引导 ====================

/**
 * 引导反思
 * POST /api/v1/mentor/projects/:projectId/reflect
 *
 * Body:
 * - reflectionType: 'daily' | 'phase_end' | 'project_end' | 'breakthrough' | 'stuck'
 */
router.post(
  '/projects/:projectId/reflect',
  authenticate,
  enhancedMentorController.guideReflection
);

/**
 * 保存反思日志
 * POST /api/v1/mentor/projects/:projectId/reflection-log
 *
 * Body:
 * - reflectionType: string (必需)
 * - whatLearned?: string
 * - whatWorked?: string
 * - whatDidntWork?: string
 * - whatSurprised?: string
 * - nextSteps?: string
 * - emotionalState?: string
 */
router.post(
  '/projects/:projectId/reflection-log',
  authenticate,
  enhancedMentorController.saveReflectionLog
);

export default router;
