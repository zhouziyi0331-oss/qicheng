import { Request, Response } from 'express';
export declare class ContactExchangeController {
    /**
     * GET /api/contact-exchange/partners
     * 获取合作伙伴列表
     */
    getPartners(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/contact-exchange/request
     * 请求交换联系方式
     */
    requestExchange(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/contact-exchange/confirm
     * 确认交换（与request相同逻辑）
     */
    confirmExchange(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/contact-exchange/status/:partnerId
     * 查询交换状态
     */
    getExchangeStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/contact-exchange/contact/:partnerId
     * 获取已交换的联系方式
     */
    getExchangedContact(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    private getExchangeStatusHelper;
    private isMyConfirmed;
    private isPartnerConfirmed;
}
export declare const contactExchangeController: ContactExchangeController;
//# sourceMappingURL=contactExchange.controller.d.ts.map