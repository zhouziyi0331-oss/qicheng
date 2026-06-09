import { Router } from 'express';
import { pblAgentController } from '../controllers/pblAgentController';
import { authenticate } from '../middleware/auth';

const router = Router();

// 所有路由都需要认证
router.use(authenticate);

// 初始化项目
router.post('/projects/init', pblAgentController.initializeProject.bind(pblAgentController));

// 苏格拉底式对话
router.post('/chat', pblAgentController.chat.bind(pblAgentController));

// 任务拆解
router.post('/tasks/decompose', pblAgentController.guideTaskDecomposition.bind(pblAgentController));
router.post('/tasks/evaluate', pblAgentController.evaluateDecomposition.bind(pblAgentController));

// MVP方案
router.post('/mvp/suggest', pblAgentController.suggestMVP.bind(pblAgentController));

// 代码执行
router.post('/code/execute', pblAgentController.executeCode.bind(pblAgentController));

// 反思
router.post('/reflection/guide', pblAgentController.guideReflection.bind(pblAgentController));
router.post('/reflection/save', pblAgentController.saveReflection.bind(pblAgentController));

export default router;
