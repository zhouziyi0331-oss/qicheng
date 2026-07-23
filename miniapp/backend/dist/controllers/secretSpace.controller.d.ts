import { Request, Response } from 'express';
/**
 * 小猫的秘密空间控制器
 */
export declare class SecretSpaceController {
    /**
     * 获取秘密空间
     * GET /api/secret-space
     */
    getSecretSpace(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 签到
     * POST /api/secret-space/check-in
     */
    checkIn(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 记录心情
     * POST /api/secret-space/mood
     */
    recordMood(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 获取心情记录
     * GET /api/secret-space/mood
     */
    getMoodRecords(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 添加私密笔记
     * POST /api/secret-space/notes
     */
    addPrivateNote(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 更新私密笔记
     * PUT /api/secret-space/notes/:noteId
     */
    updatePrivateNote(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 删除私密笔记
     * DELETE /api/secret-space/notes/:noteId
     */
    deletePrivateNote(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 添加个人里程碑
     * POST /api/secret-space/milestones
     */
    addPersonalMilestone(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 完成个人里程碑
     * PUT /api/secret-space/milestones/:milestoneId/complete
     */
    completeMilestone(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 添加名言收藏
     * POST /api/secret-space/quotes
     */
    addFavoriteQuote(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 更新空间设置
     * PUT /api/secret-space/settings
     */
    updateSettings(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 获取空间统计
     * GET /api/secret-space/stats
     */
    getSpaceStats(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
export declare const secretSpaceController: SecretSpaceController;
//# sourceMappingURL=secretSpace.controller.d.ts.map