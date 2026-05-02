import { Request, Response } from 'express';
/**
 * OPC能力画像测试控制器 v2.0
 */
export declare class OPCV2AssessmentController {
    /**
     * 开始测试
     */
    static startAssessment(req: Request, res: Response): Promise<void>;
    /**
     * 提交答案
     */
    static submitAnswer(req: Request, res: Response): Promise<void>;
    /**
     * 完成测试
     */
    static completeAssessment(req: Request, res: Response): Promise<void>;
    /**
     * 获取测试进度
     */
    static getProgress(req: Request, res: Response): Promise<void>;
    /**
     * 获取测试结果
     */
    static getAssessmentResult(req: Request, res: Response): Promise<void>;
    /**
     * 获取最新测试结果
     */
    static getLatestResult(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=opcV2AssessmentController.d.ts.map