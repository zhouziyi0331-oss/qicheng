"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const talentController_1 = require("../controllers/talentController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// 所有路由都需要认证
router.use(auth_1.authenticate);
// 获取学生天赋画像（学生查看自己的，或其他人查看指定学生的）
router.get('/profile/:studentId?', talentController_1.TalentController.getStudentTalentProfile);
// 获取学生成长统计
router.get('/stats/:studentId?', talentController_1.TalentController.getStudentGrowthStats);
// 获取所有天赋标签列表（供企业选择）
router.get('/tags', talentController_1.TalentController.getAllTalentTags);
// 获取所有业务场景标签
router.get('/scenarios', talentController_1.TalentController.getAllBusinessScenarios);
// 为任务匹配学生（使用新的天赋匹配算法）
router.get('/match/task/:taskId', talentController_1.TalentController.matchStudentsForTask);
// 手动触发天赋推断（通常自动触发，此接口用于调试或重新推断）
router.post('/infer/opc', talentController_1.TalentController.inferTalentsFromOPC);
// 手动触发能力提取（通常在任务完成时自动触发）
router.post('/extract/task/:taskId', talentController_1.TalentController.extractCapabilitiesFromTask);
// 创建任务需求拆解
router.post('/breakdown/:taskId', talentController_1.TalentController.createRequirementBreakdown);
// 获取任务需求拆解
router.get('/breakdown/:taskId', talentController_1.TalentController.getRequirementBreakdown);
// 为子需求匹配学生
router.get('/match/requirement/:taskId/:requirementId', talentController_1.TalentController.matchStudentsForRequirement);
exports.default = router;
//# sourceMappingURL=talent.js.map