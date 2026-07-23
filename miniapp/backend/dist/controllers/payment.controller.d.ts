import { Request, Response } from 'express';
export declare class PaymentController {
    /**
     * POST /api/payment/create-order
     * 创建支付订单
     */
    createOrder(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/payment/mock-pay
     * 模拟支付成功（仅开发/测试环境）
     */
    mockPayment(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/payment/notify
     * 微信支付回调通知
     */
    wechatNotify(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/payment/check-status
     * 查询支付状态
     */
    checkPaymentStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/payment/history
     * 获取用户支付历史
     */
    getPaymentHistory(req: Request, res: Response): Promise<void>;
    /**
     * 调用微信支付统一下单API
     */
    private requestWechatPayment;
    /**
     * 验证微信签名
     */
    private verifyWechatSignature;
}
export declare const paymentController: PaymentController;
//# sourceMappingURL=payment.controller.d.ts.map