import { Request, Response } from 'express';
/**
 * 个人成长控制器
 * 处理OC测评、能力雷达图、对比报告、成长路径、毕业报告
 */
/**
 * POST /api/growth/assessment
 * 提交测评并生成结果
 */
export declare const submitAssessment: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * GET /api/growth/assessments
 * 获取测评历史
 */
export declare const getAssessments: (req: Request, res: Response) => Promise<void>;
/**
 * GET /api/growth/assessment/latest
 * 获取最新测评
 */
export declare const getLatestAssessment: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * GET /api/growth/ability-radar
 * 获取能力雷达图历史
 */
export declare const getAbilityRadarHistory: (req: Request, res: Response) => Promise<void>;
/**
 * GET /api/growth/ability-radar/latest
 * 获取最新雷达图
 */
export declare const getLatestAbilityRadar: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * GET /api/growth/ability-radar/compare
 * 对比两个雷达图
 */
export declare const compareRadars: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * GET /api/growth/comparison-reports
 * 获取对比报告历史
 */
export declare const getComparisonReports: (req: Request, res: Response) => Promise<void>;
/**
 * GET /api/growth/comparison-reports/latest
 * 获取最新对比报告
 */
export declare const getLatestComparisonReport: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * POST /api/growth/growth-path/generate
 * 生成/更新成长路径
 */
export declare const generateGrowthPath: (req: Request, res: Response) => Promise<void>;
/**
 * GET /api/growth/growth-path/latest
 * 获取最新成长路径
 */
export declare const getLatestGrowthPath: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * GET /api/growth/growth-path/history
 * 获取成长路径历史
 */
export declare const getGrowthPathHistory: (req: Request, res: Response) => Promise<void>;
/**
 * POST /api/growth/growth-path/milestone
 * 更新里程碑状态
 */
export declare const updateMilestone: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * POST /api/growth/graduation-report/generate
 * 生成毕业报告
 */
export declare const generateGraduationReport: (req: Request, res: Response) => Promise<void>;
/**
 * GET /api/growth/graduation-report
 * 获取毕业报告
 */
export declare const getGraduationReport: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * POST /api/growth/graduation-report/unlock
 * 解锁毕业报告
 */
export declare const unlockGraduationReport: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=growth.controller.d.ts.map