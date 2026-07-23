import { Request, Response } from 'express';
/**
 * 管理员支付管理控制器
 */
export declare class AdminPaymentController {
    /**
     * POST /api/admin/payments/grant
     * 管理员赠送支付权限（免费解锁内容）
     */
    grantPayment(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/admin/payments
     * 获取所有支付记录
     */
    getAllPayments(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/admin/payments/stats
     * 获取支付统计
     */
    getPaymentStats(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/admin/payments/:orderId
     * 获取支付详情
     */
    getPaymentDetail(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
export declare const adminPaymentController: AdminPaymentController;
//# sourceMappingURL=payment.admin.controller.d.ts.map