import { Request, Response } from 'express';
/**
 * AI需求确认控制器
 */
export declare class AIRequirementController {
    /**
     * 开始需求确认对话
     */
    static startDialogue(req: Request, res: Response): Promise<void>;
    /**
     * 发送消息
     */
    static sendMessage(req: Request, res: Response): Promise<void>;
    /**
     * 获取对话历史
     */
    static getDialogueHistory(req: Request, res: Response): Promise<void>;
}
/**
 * AI任务拆解控制器
 */
export declare class AITaskDecompositionController {
    /**
     * 拆解任务
     */
    static decomposeTask(req: Request, res: Response): Promise<void>;
    /**
     * 创建子任务
     */
    static createSubtasks(req: Request, res: Response): Promise<void>;
    /**
     * 获取子任务列表
     */
    static getSubtasks(req: Request, res: Response): Promise<void>;
}
/**
 * AI任务审核控制器
 */
export declare class AITaskReviewController {
    /**
     * AI审核任务
     */
    static reviewTask(req: Request, res: Response): Promise<void>;
    /**
     * 人工审核
     */
    static humanReview(req: Request, res: Response): Promise<void>;
}
/**
 * AI问答控制器
 */
export declare class AIQAController {
    /**
     * 提问
     */
    static askQuestion(req: Request, res: Response): Promise<void>;
    /**
     * 标记答案是否有帮助
     */
    static markHelpful(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=aiEngineController.d.ts.map