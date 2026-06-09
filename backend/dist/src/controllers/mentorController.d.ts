import { Request, Response } from 'express';
/**
 * AI导师控制器 - 使用新的MentorCoreService
 */
/**
 * AI导师聊天接口
 * POST /api/v1/mentor/chat
 */
export declare const mentorChat: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * 获取对话历史
 * GET /api/v1/mentor/sessions/:sessionId/messages
 */
export declare const getConversationHistory: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * 获取学生的所有会话
 * GET /api/v1/mentor/sessions
 */
export declare const getStudentSessions: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * 获取会话统计
 * GET /api/v1/mentor/sessions/:sessionId/stats
 */
export declare const getSessionStats: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * 获取学生的对话统计
 * GET /api/v1/mentor/students/:studentId/stats
 */
export declare const getStudentStats: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * 获取欢迎消息（兼容旧接口）
 * POST /api/v1/mentor/welcome-message
 */
export declare const getWelcomeMessage: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * 获取对话历史（兼容旧接口）
 * GET /api/v1/mentor/:taskId/history
 */
export declare const getHistory: (req: Request, res: Response) => Promise<void>;
/**
 * 获取第一步引导（兼容旧接口）
 * GET /api/v1/mentor/:taskId/first-step
 */
export declare const getFirstStep: (req: Request, res: Response) => Promise<void>;
/**
 * 记录导师观察（兼容旧接口）
 */
export declare const recordObservation: (req: Request, res: Response) => Promise<void>;
/**
 * 检测学生卡点（兼容旧接口）
 */
export declare const detectStuckPoints: (req: Request, res: Response) => Promise<void>;
/**
 * 生成欢迎消息（兼容旧接口）
 */
export declare const generateWelcomeMessage: (req: Request, res: Response) => Promise<void>;
/**
 * 生成里程碑消息（兼容旧接口）
 */
export declare const generateMilestoneMessage: (req: Request, res: Response) => Promise<void>;
/**
 * 生成拒绝消息（兼容旧接口）
 */
export declare const generateRejectionMessage: (req: Request, res: Response) => Promise<void>;
/**
 * 检测习惯（兼容旧接口）
 */
export declare const detectHabits: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=mentorController.d.ts.map