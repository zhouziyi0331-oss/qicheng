import { Request, Response } from 'express';
/**
 * AI导师阶段控制器（终极版 - 完整功能）
 */
/**
 * 获取当前会话信息
 */
export declare function getCurrentSession(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 获取会话消息历史
 */
export declare function getSessionMessages(req: Request, res: Response): Promise<void>;
/**
 * 发送消息给导师（增强版 - 使用自适应引导）
 */
export declare function sendMessage(req: Request, res: Response): Promise<void>;
/**
 * 请求质量预审
 */
export declare function requestQualityReview(req: Request, res: Response): Promise<void>;
/**
 * 获取会话统计
 */
export declare function getSessionStats(req: Request, res: Response): Promise<void>;
/**
 * 确认需求理解（阶段1完成）
 */
export declare function confirmRequirementUnderstanding(req: Request, res: Response): Promise<void>;
/**
 * 获取学生成长仪表板
 */
export declare function getStudentGrowthDashboard(req: Request, res: Response): Promise<void>;
/**
 * 获取学生最近情绪
 */
export declare function getRecentEmotions(req: Request, res: Response): Promise<void>;
/**
 * 获取学生成长里程碑
 */
export declare function getGrowthMilestones(req: Request, res: Response): Promise<void>;
/**
 * 获取未庆祝的里程碑
 */
export declare function getUncelebratedMilestones(req: Request, res: Response): Promise<void>;
/**
 * 庆祝里程碑
 */
export declare function celebrateMilestone(req: Request, res: Response): Promise<void>;
/**
 * 获取导师记忆
 */
export declare function getMentorMemories(req: Request, res: Response): Promise<void>;
/**
 * 获取记忆统计
 */
export declare function getMemoryStats(req: Request, res: Response): Promise<void>;
/**
 * 获取成长统计
 */
export declare function getGrowthStats(req: Request, res: Response): Promise<void>;
/**
 * 获取引导建议
 */
export declare function getGuidanceRecommendations(req: Request, res: Response): Promise<void>;
/**
 * 获取工具推荐
 */
export declare function getToolRecommendations(req: Request, res: Response): Promise<void>;
/**
 * 反馈工具使用情况
 */
export declare function feedbackToolUsage(req: Request, res: Response): Promise<void>;
/**
 * 获取热门工具
 */
export declare function getPopularTools(req: Request, res: Response): Promise<void>;
/**
 * 手动触发主动跟进（管理员功能）
 */
export declare function triggerFollowUps(req: Request, res: Response): Promise<void>;
/**
 * 获取调度器状态（管理员功能）
 */
export declare function getSchedulerStatus(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=mentorStageController.d.ts.map