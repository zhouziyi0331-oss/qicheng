/**
 * 协议管理服务
 */
export declare class AgreementService {
    /**
     * 获取当前有效的协议
     */
    static getActiveAgreements(): Promise<any[]>;
    /**
     * 获取特定类型的协议
     */
    static getAgreementByType(agreementType: string): Promise<any>;
    /**
     * 签署协议
     */
    static signAgreement(userId: string, agreementId: number, ipAddress?: string, deviceInfo?: string): Promise<any>;
    /**
     * 检查用户是否已签署所有必要协议
     */
    static checkUserAgreements(userId: string): Promise<{
        allSigned: boolean;
        signedTypes: any[];
        missingTypes: string[];
    }>;
    /**
     * 获取用户的协议签署历史
     */
    static getUserSignatures(userId: string): Promise<any[]>;
}
/**
 * 数据授权服务
 */
export declare class DataAuthorizationService {
    /**
     * 初始化用户数据授权设置（注册时调用）
     */
    static initializeAuthorization(userId: string): Promise<any>;
    /**
     * 获取用户授权设置
     */
    static getAuthorizationSettings(userId: string): Promise<any>;
    /**
     * 更新商业化授权设置
     */
    static updateCommercialAuthorization(userId: string, authorizationType: string, authorized: boolean, changeReason?: string, ipAddress?: string): Promise<any>;
    /**
     * 获取授权变更历史
     */
    static getAuthorizationHistory(userId: string): Promise<any[]>;
    /**
     * 批量更新商业化授权
     */
    static batchUpdateAuthorizations(userId: string, authorizations: {
        commercial_use_authorized?: boolean;
        marketing_authorized?: boolean;
        third_party_share_authorized?: boolean;
        ai_training_authorized?: boolean;
    }, ipAddress?: string): Promise<any>;
}
/**
 * 必读条款服务
 */
export declare class MandatoryTermsService {
    /**
     * 确认必读条款
     */
    static confirmTerm(userId: string, termType: string, ipAddress?: string): Promise<any>;
    /**
     * 检查用户是否已确认所有必读条款
     */
    static checkUserTerms(userId: string): Promise<{
        allConfirmed: boolean;
        confirmedTerms: any[];
        missingTerms: string[];
    }>;
    /**
     * 获取用户的条款确认记录
     */
    static getUserTerms(userId: string): Promise<any[]>;
}
//# sourceMappingURL=agreementService.d.ts.map