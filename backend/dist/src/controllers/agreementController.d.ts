import { Request, Response } from 'express';
/**
 * 协议管理控制器
 */
export declare class AgreementController {
    /**
     * 获取所有有效协议
     */
    static getActiveAgreements(req: Request, res: Response): Promise<void>;
    /**
     * 获取特定类型的协议
     */
    static getAgreementByType(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 签署协议
     */
    static signAgreement(req: Request, res: Response): Promise<void>;
    /**
     * 检查用户协议签署状态
     */
    static checkUserAgreements(req: Request, res: Response): Promise<void>;
    /**
     * 获取用户的协议签署历史
     */
    static getUserSignatures(req: Request, res: Response): Promise<void>;
}
/**
 * 数据授权控制器
 */
export declare class DataAuthorizationController {
    /**
     * 获取用户授权设置
     */
    static getAuthorizationSettings(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 更新单个授权设置
     */
    static updateAuthorization(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 批量更新授权设置
     */
    static batchUpdateAuthorizations(req: Request, res: Response): Promise<void>;
    /**
     * 获取授权变更历史
     */
    static getAuthorizationHistory(req: Request, res: Response): Promise<void>;
}
/**
 * 必读条款控制器
 */
export declare class MandatoryTermsController {
    /**
     * 确认必读条款
     */
    static confirmTerm(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 检查用户条款确认状态
     */
    static checkUserTerms(req: Request, res: Response): Promise<void>;
    /**
     * 获取用户的条款确认记录
     */
    static getUserTerms(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=agreementController.d.ts.map