import { Request, Response } from 'express';
export declare class PracticeController {
    /**
     * GET /api/practice/projects
     * 获取实践项目列表
     */
    getProjects(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/practice/projects/:id/report
     * 获取项目详细报告
     */
    getReport(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/practice/stats
     * 获取统计数据
     */
    getStats(req: Request, res: Response): Promise<void>;
    /**
     * PUT /api/practice/projects/:id/progress
     * 更新项目进度
     */
    updateProgress(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/practice/decomposition/generate
     * 生成AI拆解报告
     */
    generateDecomposition(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/practice/decomposition/:reportId/status
     * 查询生成状态
     */
    getDecompositionStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/practice/decomposition/:reportId/unlock
     * 解锁报告（付费）
     */
    unlockDecomposition(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/practice/decomposition/:reportId
     * 获取完整报告
     */
    getDecomposition(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    private generateInsight;
    private getIcon;
    private formatDate;
    private getDateRange;
    private getDuration;
}
export declare const practiceController: PracticeController;
//# sourceMappingURL=practice.controller.d.ts.map