import { Request, Response } from 'express';
/**
 * AI导师控制器
 */
/**
 * AI对话
 */
export declare const chat: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 获取对话历史
 */
export declare const getHistory: (req: Request, res: Response) => Promise<void>;
/**
 * 获取接单第一步引导
 */
export declare const getFirstStep: (req: Request, res: Response) => Promise<void>;
/**
 * 学生说"我卡住了"
 */
export declare const reportStuck: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 完成里程碑时的见证
 */
export declare const celebrateMilestone: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 获取热情火花列表
 */
export declare const getPassionSparks: (req: Request, res: Response) => Promise<void>;
/**
 * 获取穿越感时刻列表
 */
export declare const getFlowMoments: (req: Request, res: Response) => Promise<void>;
/**
 * 获取成长统计
 */
export declare const getGrowthStats: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=mentor.controller.d.ts.map