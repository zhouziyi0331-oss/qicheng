import { Request, Response } from 'express';
/**
 * 管理员财务管理控制器
 */
export declare class AdminFinancialController {
    /**
     * POST /api/admin/financial/recalculate/:userId
     * 重新计算用户余额（对账）
     */
    recalculateBalance(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/admin/financial/recalculate-all
     * 批量重新计算所有用户余额
     */
    recalculateAllBalances(req: Request, res: Response): Promise<void>;
}
export declare const adminFinancialController: AdminFinancialController;
//# sourceMappingURL=financial.admin.controller.d.ts.map