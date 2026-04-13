"use strict";
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
const opcController = __importStar(require("../controllers/opcController"));
const matchController = __importStar(require("../controllers/matchController"));
const mentorController = __importStar(require("../controllers/mentorController"));
const levelController = __importStar(require("../controllers/levelController"));
const milestoneController = __importStar(require("../controllers/milestoneController"));
const router = express_1.default.Router();
// ==================== OPC测试相关 ====================
/**
 * 提交OPC测试结果
 * POST /api/opc/submit
 * Body: { userId, answers: [{questionId, answer, score}] }
 */
router.post('/opc/submit', opcController.submitOPCTest);
/**
 * 获取用户OPC测试结果
 * GET /api/opc/result/:userId
 */
router.get('/opc/result/:userId', opcController.getOPCResult);
// ==================== 项目匹配相关 ====================
/**
 * 智能项目匹配（升级版）
 * GET /api/tasks/match/:userId?limit=20
 */
router.get('/tasks/match/:userId', matchController.matchTasksForStudent);
/**
 * 获取任务详情（包含匹配理由）
 * GET /api/tasks/:taskId/detail/:userId
 */
router.get('/tasks/:taskId/detail/:userId', matchController.getTaskDetailWithMatch);
// ==================== AI导师相关 ====================
/**
 * AI导师对话接口
 * POST /api/mentor/chat
 * Body: { studentId, taskId, message, conversationHistory }
 */
router.post('/mentor/chat', mentorController.mentorChat);
/**
 * 记录导师观察
 * POST /api/mentor/observe
 * Body: { studentId, taskId, observationType, observationContent, observationData }
 */
router.post('/mentor/observe', mentorController.recordObservation);
/**
 * 检测学生卡点（定时任务调用）
 * POST /api/mentor/detect-stuck
 */
router.post('/mentor/detect-stuck', mentorController.detectStuckPoints);
/**
 * 生成AI导师欢迎消息
 * POST /api/mentor/welcome-message
 * Body: { studentId, taskId }
 */
router.post('/mentor/welcome-message', mentorController.generateWelcomeMessage);
/**
 * 生成里程碑夸奖消息
 * POST /api/mentor/milestone-message
 * Body: { studentId, taskId, milestoneType }
 */
router.post('/mentor/milestone-message', mentorController.generateMilestoneMessage);
/**
 * 生成打回修改消息
 * POST /api/mentor/rejection-message
 * Body: { studentId, taskId, rejectionReason, goodPoints }
 */
router.post('/mentor/rejection-message', mentorController.generateRejectionMessage);
/**
 * 检测习惯形成（定时任务调用）
 * POST /api/mentor/detect-habits
 */
router.post('/mentor/detect-habits', mentorController.detectHabits);
// ==================== 等级体系相关 ====================
/**
 * 获取用户等级信息
 * GET /api/level/:userId
 */
router.get('/level/:userId', levelController.getUserLevel);
/**
 * 检查升级条件
 * GET /api/level/check-upgrade/:userId
 */
router.get('/level/check-upgrade/:userId', levelController.checkUpgradeConditions);
/**
 * 执行升级
 * POST /api/level/upgrade
 * Body: { userId }
 */
router.post('/level/upgrade', levelController.upgradeLevel);
/**
 * 申请跳级挑战
 * POST /api/level/challenge
 * Body: { userId, taskId }
 */
router.post('/level/challenge', levelController.applyStretchChallenge);
/**
 * 完成跳级挑战
 * POST /api/level/challenge/complete
 * Body: { challengeId, success }
 */
router.post('/level/challenge/complete', levelController.completeStretchChallenge);
// ==================== 里程碑相关 ====================
/**
 * 第2单完成触发器
 * POST /api/milestone/second-task-complete
 * Body: { userId }
 */
router.post('/milestone/second-task-complete', milestoneController.handleSecondTaskComplete);
/**
 * 获取OPC故事墙
 * GET /api/story-wall
 */
router.get('/story-wall', milestoneController.getStoryWall);
/**
 * 提交故事到故事墙
 * POST /api/story-wall/submit
 * Body: { userId, storyText, currentStatus }
 */
router.post('/story-wall/submit', milestoneController.submitStory);
exports.default = router;
//# sourceMappingURL=opcRoutes.js.map