"use strict";
/**
 * 工作条件匹配路由
 * 基于OPC测试结果的工作条件画像进行智能匹配
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
const workConditionMatchingController = __importStar(require("./tasks/workConditionMatchingController"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// =====================================================
// 所有路由都需要认证
// =====================================================
router.use(auth_1.authenticate);
// =====================================================
// 学生工作条件画像路由
// =====================================================
/**
 * 生成学生工作条件画像（基于OPC测试结果）
 * POST /api/v1/work-condition/student/:studentId/generate-profile
 */
router.post('/student/:studentId/generate-profile', workConditionMatchingController.generateStudentProfile);
/**
 * 获取学生工作条件画像
 * GET /api/v1/work-condition/student/:studentId/profile
 */
router.get('/student/:studentId/profile', workConditionMatchingController.getStudentProfile);
/**
 * 学生查看推荐任务（基于工作条件匹配）
 * GET /api/v1/work-condition/student/recommended-tasks
 */
router.get('/student/recommended-tasks', workConditionMatchingController.getRecommendedTasksForStudent);
// =====================================================
// 任务需求条件画像路由
// =====================================================
/**
 * 生成任务需求条件画像
 * POST /api/v1/work-condition/task/:taskId/generate-requirement
 */
router.post('/task/:taskId/generate-requirement', workConditionMatchingController.generateTaskRequirement);
/**
 * 获取任务需求条件画像
 * GET /api/v1/work-condition/task/:taskId/requirement
 */
router.get('/task/:taskId/requirement', workConditionMatchingController.getTaskRequirement);
// =====================================================
// 工作条件匹配路由
// =====================================================
/**
 * 触发工作条件匹配
 * POST /api/v1/work-condition/task/:taskId/match
 */
router.post('/task/:taskId/match', workConditionMatchingController.triggerWorkConditionMatching);
/**
 * 企业查看工作条件匹配结果
 * GET /api/v1/work-condition/task/:taskId/matches
 */
router.get('/task/:taskId/matches', workConditionMatchingController.getWorkConditionMatches);
/**
 * 学生查看具体任务的匹配详情
 * GET /api/v1/work-condition/task/:taskId/match-detail
 */
router.get('/task/:taskId/match-detail', workConditionMatchingController.getMatchDetail);
exports.default = router;
//# sourceMappingURL=workConditionMatchingRoutes.js.map