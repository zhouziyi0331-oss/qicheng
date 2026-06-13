import { Request, Response } from 'express';
/**
 * 统计API控制器
 *
 * 核心原则：所有展示给用户的统计数字，必须来自数据库实时查询
 * 禁止：在前端写死任何数字
 */
/**
 * 获取人格标签统计
 * GET /api/v1/stats/personality/:tag
 *
 * 返回该人格标签的真实统计数据，用于消除"12,843个和你一样"的固定文案
 */
export declare const getPersonalityStats: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 获取赛道统计
 * GET /api/v1/stats/track/:track
 *
 * 返回该赛道的市场数据，用于能力估值
 */
export declare const getTrackStats: (req: Request, res: Response) => Promise<void>;
/**
 * 获取学生的能力估值
 * GET /api/v1/stats/student-valuation
 *
 * 基于学生的真实订单历史计算市场估值
 */
export declare const getStudentValuation: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=statsController.d.ts.map