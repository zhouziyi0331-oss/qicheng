import { Request, Response, NextFunction } from 'express';
/**
 * 完整业务流程API
 *
 * 流程：
 * 1. 企业发布任务 → AI价格建议 → 企业定价 → 支付30%定金
 * 2. AI匹配10个学生 → 企业选5个 → 发送邀请
 * 3. 学生接单（看到85%价格）→ 第一个接受的学生获得任务
 * 4. 学生执行任务 → 更新进度 → 提交交付物
 * 5. AI审核 → 企业验收 → 支付70%尾款
 * 6. 7天内确认或自动确认 → 平台付款给学生
 * 7. 连续合作2次 → 交换微信
 */
export declare function getAIPriceSuggestion(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function publishTaskWithDeposit(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function triggerAIMatching(taskId: string): Promise<void>;
export declare function getMatchedStudents(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function selectStudentsForInvitation(req: Request, res: Response, next: NextFunction): Promise<void>;
declare const _default: {
    getAIPriceSuggestion: typeof getAIPriceSuggestion;
    publishTaskWithDeposit: typeof publishTaskWithDeposit;
    triggerAIMatching: typeof triggerAIMatching;
    getMatchedStudents: typeof getMatchedStudents;
    selectStudentsForInvitation: typeof selectStudentsForInvitation;
};
export default _default;
//# sourceMappingURL=businessFlowController.d.ts.map