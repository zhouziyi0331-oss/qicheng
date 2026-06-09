"use strict";
/**
 * 任务分级和智能匹配路由
 *
 * 定义任务等级、学生等级、智能匹配相关的API路由
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const taskLevelMatchingController = __importStar(require("../controllers/taskLevelMatchingController"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// =====================================================
// 所有路由都需要认证
// =====================================================
router.use(auth_1.authenticate);
// =====================================================
// 任务等级路由
// =====================================================
/**
 * 获取所有任务等级定义
 * GET /api/v1/task-levels
 */
router.get('/', taskLevelMatchingController.getTaskLevels);
/**
 * 计算任务等级
 * POST /api/v1/task-levels/calculate/:taskId
 */
router.post('/calculate/:taskId', taskLevelMatchingController.calculateTaskLevel);
// =====================================================
// 学生等级路由
// =====================================================
/**
 * 获取学生等级信息
 * GET /api/v1/task-levels/student/:studentId
 */
router.get('/student/:studentId', taskLevelMatchingController.getStudentLevel);
/**
 * 更新学生等级（手动触发）
 * POST /api/v1/task-levels/student/:studentId/update
 */
router.post('/student/:studentId/update', taskLevelMatchingController.updateStudentLevel);
// =====================================================
// 智能匹配路由
// =====================================================
/**
 * 为任务匹配学生
 * POST /api/v1/task-levels/matching/task/:taskId/match
 */
router.post('/matching/task/:taskId/match', taskLevelMatchingController.matchTaskWithStudents);
/**
 * 获取任务的匹配学生列表
 * GET /api/v1/task-levels/matching/task/:taskId/matches
 */
router.get('/matching/task/:taskId/matches', taskLevelMatchingController.getTaskMatches);
/**
 * 获取学生的推荐任务
 * GET /api/v1/task-levels/matching/student/:studentId/recommendations
 */
router.get('/matching/student/:studentId/recommendations', taskLevelMatchingController.getStudentRecommendations);
/**
 * 通知匹配的学生
 * POST /api/v1/task-levels/matching/task/:taskId/notify
 */
router.post('/matching/task/:taskId/notify', taskLevelMatchingController.notifyMatchedStudents);
exports.default = router;
//# sourceMappingURL=taskLevelMatchingRoutes.js.map