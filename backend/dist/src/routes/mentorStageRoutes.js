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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const controller = __importStar(require("../controllers/mentorStageController"));
const router = (0, express_1.Router)();
/**
 * AI导师阶段路由（完整版 - 所有功能）
 * 所有路由都需要认证
 */
// ========== 基础会话功能 ==========
// 获取任务的导师会话
router.get('/tasks/:taskId/session', auth_1.authenticate, controller.getCurrentSession);
// 获取会话消息历史
router.get('/sessions/:sessionId/messages', auth_1.authenticate, controller.getSessionMessages);
// 发送消息给导师（终极版 - 人性化对话）
router.post('/sessions/:sessionId/messages', auth_1.authenticate, controller.sendMessage);
// 请求质量预审
router.post('/tasks/:taskId/quality-review', auth_1.authenticate, controller.requestQualityReview);
// 获取会话统计（增强版 - 包含情绪和成长数据）
router.get('/sessions/:sessionId/stats', auth_1.authenticate, controller.getSessionStats);
// 确认需求理解（完成阶段1）
router.post('/sessions/:sessionId/confirm-requirement', auth_1.authenticate, controller.confirmRequirementUnderstanding);
// ========== 灵魂系统API ==========
// 获取学生成长仪表板
router.get('/students/growth-dashboard', auth_1.authenticate, controller.getStudentGrowthDashboard);
// 获取学生最近情绪
router.get('/students/emotions', auth_1.authenticate, controller.getRecentEmotions);
// 获取学生成长里程碑
router.get('/students/milestones', auth_1.authenticate, controller.getGrowthMilestones);
// 获取未庆祝的里程碑
router.get('/students/milestones/uncelebrated', auth_1.authenticate, controller.getUncelebratedMilestones);
// 庆祝里程碑
router.post('/milestones/:milestoneId/celebrate', auth_1.authenticate, controller.celebrateMilestone);
// 获取导师记忆
router.get('/students/memories', auth_1.authenticate, controller.getMentorMemories);
// 获取记忆统计
router.get('/students/memories/stats', auth_1.authenticate, controller.getMemoryStats);
// 获取成长统计
router.get('/students/growth-stats', auth_1.authenticate, controller.getGrowthStats);
// 获取引导建议
router.get('/sessions/:sessionId/guidance-recommendations', auth_1.authenticate, controller.getGuidanceRecommendations);
// ========== 工具推荐API ==========
// 获取工具推荐
router.get('/tasks/:taskId/tools', auth_1.authenticate, controller.getToolRecommendations);
// 反馈工具使用情况
router.post('/tools/:trackingId/feedback', auth_1.authenticate, controller.feedbackToolUsage);
// 获取热门工具
router.get('/tools/popular', auth_1.authenticate, controller.getPopularTools);
// ========== 主动跟进API ==========
// 手动触发主动跟进（管理员）
router.post('/admin/trigger-followups', auth_1.authenticate, controller.triggerFollowUps);
// 获取调度器状态（管理员）
router.get('/admin/scheduler-status', auth_1.authenticate, controller.getSchedulerStatus);
exports.default = router;
//# sourceMappingURL=mentorStageRoutes.js.map