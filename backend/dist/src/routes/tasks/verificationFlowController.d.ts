import { Request, Response, NextFunction } from 'express';
/**
 * 企业验收和支付流程API
 *
 * 流程：
 * 1. 企业查看交付物
 * 2. 企业验收通过 → 支付70%尾款
 * 3. 7天内确认或自动确认 → 平台付款给学生
 * 4. 检查连续合作2次 → 交换微信
 */
export declare function getTaskDeliverables(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function approveAndPayFinal(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function rejectDeliverable(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function finalConfirmation(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function autoConfirmTasks(): Promise<void>;
export declare function addRequirementSupplement(req: Request, res: Response, next: NextFunction): Promise<void>;
declare const _default: {
    getTaskDeliverables: typeof getTaskDeliverables;
    approveAndPayFinal: typeof approveAndPayFinal;
    rejectDeliverable: typeof rejectDeliverable;
    finalConfirmation: typeof finalConfirmation;
    autoConfirmTasks: typeof autoConfirmTasks;
    addRequirementSupplement: typeof addRequirementSupplement;
};
export default _default;
//# sourceMappingURL=verificationFlowController.d.ts.map