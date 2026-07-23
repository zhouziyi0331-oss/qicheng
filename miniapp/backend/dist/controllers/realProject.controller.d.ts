import { Request, Response } from 'express';
/**
 * 真实项目控制器
 */
/**
 * GET /api/real-projects/available
 * 获取可接单的项目列表
 */
export declare const getAvailableProjects: (req: Request, res: Response) => Promise<void>;
/**
 * POST /api/real-projects/:id/apply
 * 申请项目
 */
export declare const applyForProject: (req: Request, res: Response) => Promise<void>;
/**
 * POST /api/real-projects/:id/accept
 * 接受项目（开始工作）
 */
export declare const acceptProject: (req: Request, res: Response) => Promise<void>;
/**
 * POST /api/real-projects/:id/complete
 * 完成项目
 */
export declare const completeProject: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * GET /api/real-projects/my-projects
 * 获取用户的项目列表
 */
export declare const getMyProjects: (req: Request, res: Response) => Promise<void>;
/**
 * GET /api/real-projects/stats
 * 获取项目统计
 */
export declare const getProjectStats: (req: Request, res: Response) => Promise<void>;
/**
 * GET /api/real-projects/:id
 * 获取项目详情
 */
export declare const getProjectDetail: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=realProject.controller.d.ts.map