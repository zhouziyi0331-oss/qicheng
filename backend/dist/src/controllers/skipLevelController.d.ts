import { Request, Response, NextFunction } from 'express';
/**
 * 跳级系统控制器
 */
declare class SkipLevelController {
    /**
     * 检查跳级资格
     */
    checkEligibility(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 申请跳级
     */
    applySkipLevel(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 获取任务详情
     */
    getTask(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 领取任务
     */
    receiveTask(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 获取任务进度
     */
    getProgress(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 更新子任务进度
     */
    updateSubTaskProgress(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 提交作品
     */
    submitWork(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 申请评分
     */
    requestScore(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 获取评分结果
     */
    getScore(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 获取奖励信息
     */
    getRewards(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 领取奖励
     */
    claimRewards(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 获取改进建议
     */
    getImprovementGuide(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
declare const _default: SkipLevelController;
export default _default;
//# sourceMappingURL=skipLevelController.d.ts.map