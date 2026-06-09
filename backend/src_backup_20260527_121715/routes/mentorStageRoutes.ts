import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as controller from '../controllers/mentorStageController';

const router = Router();

/**
 * AI导师阶段路由（完整版 - 所有功能）
 * 所有路由都需要认证
 */

// ========== 基础会话功能 ==========

// 获取任务的导师会话
router.get('/tasks/:taskId/session', authenticate, controller.getCurrentSession);

// 获取会话消息历史
router.get('/sessions/:sessionId/messages', authenticate, controller.getSessionMessages);

// 发送消息给导师（终极版 - 人性化对话）
router.post('/sessions/:sessionId/messages', authenticate, controller.sendMessage);

// 请求质量预审
router.post('/tasks/:taskId/quality-review', authenticate, controller.requestQualityReview);

// 获取会话统计（增强版 - 包含情绪和成长数据）
router.get('/sessions/:sessionId/stats', authenticate, controller.getSessionStats);

// 确认需求理解（完成阶段1）
router.post('/sessions/:sessionId/confirm-requirement', authenticate, controller.confirmRequirementUnderstanding);

// ========== 灵魂系统API ==========

// 获取学生成长仪表板
router.get('/students/growth-dashboard', authenticate, controller.getStudentGrowthDashboard);

// 获取学生最近情绪
router.get('/students/emotions', authenticate, controller.getRecentEmotions);

// 获取学生成长里程碑
router.get('/students/milestones', authenticate, controller.getGrowthMilestones);

// 获取未庆祝的里程碑
router.get('/students/milestones/uncelebrated', authenticate, controller.getUncelebratedMilestones);

// 庆祝里程碑
router.post('/milestones/:milestoneId/celebrate', authenticate, controller.celebrateMilestone);

// 获取导师记忆
router.get('/students/memories', authenticate, controller.getMentorMemories);

// 获取记忆统计
router.get('/students/memories/stats', authenticate, controller.getMemoryStats);

// 获取成长统计
router.get('/students/growth-stats', authenticate, controller.getGrowthStats);

// 获取引导建议
router.get('/sessions/:sessionId/guidance-recommendations', authenticate, controller.getGuidanceRecommendations);

// ========== 工具推荐API ==========

// 获取工具推荐
router.get('/tasks/:taskId/tools', authenticate, controller.getToolRecommendations);

// 反馈工具使用情况
router.post('/tools/:trackingId/feedback', authenticate, controller.feedbackToolUsage);

// 获取热门工具
router.get('/tools/popular', authenticate, controller.getPopularTools);

// ========== 主动跟进API ==========

// 手动触发主动跟进（管理员）
router.post('/admin/trigger-followups', authenticate, controller.triggerFollowUps);

// 获取调度器状态（管理员）
router.get('/admin/scheduler-status', authenticate, controller.getSchedulerStatus);

export default router;

