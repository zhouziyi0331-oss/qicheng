import { Request, Response } from 'express';
/**
 * 成就系统控制器
 */
export declare class AchievementController {
    /**
     * 获取用户成就列表
     * GET /api/achievements
     */
    getUserAchievements(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 获取成就统计
     * GET /api/achievements/stats
     */
    getAchievementStats(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 检查并更新所有成就
     * POST /api/achievements/check
     */
    checkAllAchievements(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 切换成就展示状态
     * PUT /api/achievements/:achievementId/display
     */
    toggleAchievementDisplay(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
export declare const achievementController: AchievementController;
//# sourceMappingURL=achievement.controller.d.ts.map