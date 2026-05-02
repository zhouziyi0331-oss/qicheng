import { Request, Response } from 'express';
/**
 * 跳级挑战控制器
 */
export declare class ChallengeController {
    /**
     * 获取可用的挑战任务
     */
    static getAvailableChallenges(req: Request, res: Response): Promise<void>;
    /**
     * 开始挑战
     */
    static startChallenge(req: Request, res: Response): Promise<void>;
    /**
     * 提交挑战作品
     */
    static submitChallenge(req: Request, res: Response): Promise<void>;
    /**
     * 评审挑战（管理员）
     */
    static reviewChallenge(req: Request, res: Response): Promise<void>;
    /**
     * 获取挑战历史
     */
    static getChallengeHistory(req: Request, res: Response): Promise<void>;
}
/**
 * 毕业系统控制器
 */
export declare class GraduationController {
    /**
     * 检查毕业资格
     */
    static checkEligibility(req: Request, res: Response): Promise<void>;
    /**
     * 提交毕业申请
     */
    static applyForGraduation(req: Request, res: Response): Promise<void>;
    /**
     * 审核毕业申请（管理员）
     */
    static reviewGraduation(req: Request, res: Response): Promise<void>;
    /**
     * 获取毕业生权益
     */
    static getGraduateBenefits(req: Request, res: Response): Promise<void>;
    /**
     * 获取毕业申请列表（管理员）
     */
    static getApplications(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=challengeGraduationController.d.ts.map