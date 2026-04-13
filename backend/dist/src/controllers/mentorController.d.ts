import { Request, Response } from 'express';
/**
 * 获取对话历史
 * GET /api/mentor/:taskId/history
 */
export declare const getHistory: (req: Request, res: Response) => Promise<void>;
/**
 * 获取第一步引导（接单后3秒推送）
 * GET /api/mentor/:taskId/first-step
 */
export declare const getFirstStep: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * AI导师对话接口
 * POST /api/mentor/chat
 */
export declare const mentorChat: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 生成接单欢迎消息
 * POST /api/mentor/welcome
 */
export declare const generateWelcomeMessage: (req: Request, res: Response) => Promise<void>;
/**
 * 生成里程碑反馈消息（自我对比式）
 * POST /api/mentor/milestone
 */
export declare const generateMilestoneMessage: (req: Request, res: Response) => Promise<void>;
/**
 * 生成打回修改消息（提问式）
 * POST /api/mentor/rejection
 */
export declare const generateRejectionMessage: (req: Request, res: Response) => Promise<void>;
/**
 * 记录导师观察
 * POST /api/mentor/observe
 */
export declare const recordObservation: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 获取学生的观察记录
 * GET /api/mentor/observations/:studentId
 */
export declare const getStudentObservations: (req: Request, res: Response) => Promise<void>;
/**
 * 检测学生卡点（定时任务调用）
 * POST /api/mentor/detect-stuck
 */
export declare const detectStuckPoints: (req: Request, res: Response) => Promise<void>;
/**
 * 检测习惯形成（定时任务调用）
 * POST /api/mentor/detect-habits
 */
export declare const detectHabits: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=mentorController.d.ts.map