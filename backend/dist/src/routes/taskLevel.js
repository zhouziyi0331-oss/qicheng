"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const taskLevelController_1 = require("../controllers/taskLevelController");
const auth_1 = require("../middleware/auth");
const roleCheck_1 = require("../middleware/roleCheck");
const router = express_1.default.Router();
/**
 * 企业端路由
 */
// 发布任务（草稿）
router.post('/publish', auth_1.authenticate, (0, roleCheck_1.requireRole)('company'), taskLevelController_1.publishTask);
// 确认发布任务（触发匹配）
router.post('/:taskId/confirm', auth_1.authenticate, (0, roleCheck_1.requireRole)('company'), taskLevelController_1.confirmPublishTask);
// 获取任务的匹配学生列表（Top 3）
router.get('/:taskId/matched-students', auth_1.authenticate, (0, roleCheck_1.requireRole)('company'), taskLevelController_1.getMatchedStudents);
// 获取企业的任务列表
router.get('/company/list', auth_1.authenticate, (0, roleCheck_1.requireRole)('company'), taskLevelController_1.getCompanyTasks);
/**
 * 学生端路由
 */
// 获取推荐任务列表
router.get('/recommended', auth_1.authenticate, (0, roleCheck_1.requireRole)('student'), taskLevelController_1.getRecommendedTasks);
// 接受任务
router.post('/:taskId/accept', auth_1.authenticate, (0, roleCheck_1.requireRole)('student'), taskLevelController_1.acceptTask);
/**
 * 通用路由
 */
// 获取任务详情（包含匹配信息）
router.get('/:taskId', auth_1.authenticate, taskLevelController_1.getTaskDetail);
exports.default = router;
//# sourceMappingURL=taskLevel.js.map