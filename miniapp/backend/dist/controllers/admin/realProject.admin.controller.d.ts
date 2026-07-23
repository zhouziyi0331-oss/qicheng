import { Request, Response } from 'express';
/**
 * 管理员 - 真实项目管理控制器
 */
export declare class AdminRealProjectController {
    /**
     * 创建可接单项目
     * POST /api/admin/real-projects
     */
    createProject(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 批量创建项目
     * POST /api/admin/real-projects/batch
     */
    createProjectsBatch(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 获取所有项目（管理员视图）
     * GET /api/admin/real-projects
     */
    getAllProjects(req: Request, res: Response): Promise<void>;
    /**
     * 更新项目信息
     * PUT /api/admin/real-projects/:projectId
     */
    updateProject(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 删除项目
     * DELETE /api/admin/real-projects/:projectId
     */
    deleteProject(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 上架项目（设为available）
     * POST /api/admin/real-projects/:projectId/publish
     */
    publishProject(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 下架项目（设为cancelled）
     * POST /api/admin/real-projects/:projectId/unpublish
     */
    unpublishProject(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 获取项目统计
     * GET /api/admin/real-projects/stats
     */
    getProjectStats(req: Request, res: Response): Promise<void>;
    /**
     * 为已完成项目添加客户评价
     * POST /api/admin/real-projects/:projectId/rating
     */
    addClientRating(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 获取已完成但未评价的项目列表
     * GET /api/admin/real-projects/pending-rating
     */
    getPendingRatingProjects(req: Request, res: Response): Promise<void>;
}
export declare const adminRealProjectController: AdminRealProjectController;
//# sourceMappingURL=realProject.admin.controller.d.ts.map