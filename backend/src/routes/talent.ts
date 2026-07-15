import { Router } from 'express';
import { TalentController } from '../controllers/talentController';
import { authenticate } from '../middleware/auth';

const router = Router();

// 所有路由都需要认证
router.use(authenticate);

// 获取学生天赋画像（学生查看自己的，或其他人查看指定学生的）
router.get('/profile/:studentId?', TalentController.getStudentTalentProfile);

// 获取学生成长统计
router.get('/stats/:studentId?', TalentController.getStudentGrowthStats);

// 获取所有天赋标签列表（供企业选择）
router.get('/tags', TalentController.getAllTalentTags);

// 获取所有业务场景标签
router.get('/scenarios', TalentController.getAllBusinessScenarios);

// 为任务匹配学生（使用新的天赋匹配算法）
router.get('/match/task/:taskId', TalentController.matchStudentsForTask);

// 手动触发天赋推断（通常自动触发，此接口用于调试或重新推断）
router.post('/infer/opc', TalentController.inferTalentsFromOPC);

// 手动触发能力提取（通常在任务完成时自动触发）
router.post('/extract/task/:taskId', TalentController.extractCapabilitiesFromTask);

// 创建任务需求拆解
router.post('/breakdown/:taskId', TalentController.createRequirementBreakdown);

// 获取任务需求拆解
router.get('/breakdown/:taskId', TalentController.getRequirementBreakdown);

// 为子需求匹配学生
router.get('/match/requirement/:taskId/:requirementId', TalentController.matchStudentsForRequirement);

export default router;
