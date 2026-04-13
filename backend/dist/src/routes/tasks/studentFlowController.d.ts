import { Request, Response, NextFunction } from 'express';
/**
 * 学生端接单流程API
 *
 * 流程：
 * 1. 学生查看收到的任务邀请（显示85%价格）
 * 2. 学生接受任务（第一个接受的获得任务）
 * 3. 学生更新任务进度
 * 4. 学生提交交付物
 */
export declare function getTaskInvitations(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function acceptTaskInvitation(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function rejectTaskInvitation(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function updateTaskProgress(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function submitDeliverables(req: Request, res: Response, next: NextFunction): Promise<void>;
declare const _default: {
    getTaskInvitations: typeof getTaskInvitations;
    acceptTaskInvitation: typeof acceptTaskInvitation;
    rejectTaskInvitation: typeof rejectTaskInvitation;
    updateTaskProgress: typeof updateTaskProgress;
    submitDeliverables: typeof submitDeliverables;
};
export default _default;
//# sourceMappingURL=studentFlowController.d.ts.map