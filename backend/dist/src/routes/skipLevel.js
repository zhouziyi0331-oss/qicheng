"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const skipLevelController_1 = __importDefault(require("../controllers/skipLevelController"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
/**
 * 跳级系统路由
 * 所有路由都需要认证
 */
// 检查跳级资格
router.get('/eligibility', auth_1.authenticate, skipLevelController_1.default.checkEligibility);
// 申请跳级
router.post('/apply', auth_1.authenticate, skipLevelController_1.default.applySkipLevel);
// 获取任务详情
router.get('/task/:taskId', auth_1.authenticate, skipLevelController_1.default.getTask);
// 领取任务
router.post('/task/:taskId/receive', auth_1.authenticate, skipLevelController_1.default.receiveTask);
// 获取任务进度
router.get('/progress/:taskId', auth_1.authenticate, skipLevelController_1.default.getProgress);
// 更新子任务进度
router.put('/progress/:taskId/subtask/:subTaskId', auth_1.authenticate, skipLevelController_1.default.updateSubTaskProgress);
// 提交作品
router.post('/submit/:taskId', auth_1.authenticate, skipLevelController_1.default.submitWork);
// 申请评分
router.post('/score/:taskId/request', auth_1.authenticate, skipLevelController_1.default.requestScore);
// 获取评分结果
router.get('/score/:taskId', auth_1.authenticate, skipLevelController_1.default.getScore);
// 获取奖励信息
router.get('/rewards/:taskId', auth_1.authenticate, skipLevelController_1.default.getRewards);
// 领取奖励
router.post('/rewards/:taskId/claim', auth_1.authenticate, skipLevelController_1.default.claimRewards);
// 获取改进建议
router.get('/improvement/:taskId', auth_1.authenticate, skipLevelController_1.default.getImprovementGuide);
exports.default = router;
//# sourceMappingURL=skipLevel.js.map