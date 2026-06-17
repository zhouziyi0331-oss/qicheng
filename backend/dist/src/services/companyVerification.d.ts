/**
 * P2安全功能：企业资质验证
 * 真实实现 - 支持真实API调用和开发环境降级
 */
export interface BusinessLicense {
    companyName: string;
    creditCode: string;
    legalPerson: string;
    registeredCapital: string;
    establishDate: string;
    businessScope: string;
    licenseImageUrl: string;
}
/**
 * OCR识别营业执照
 * 真实调用阿里云OCR（如果配置了API Key）
 */
export declare function ocrBusinessLicense(imageUrl: string): Promise<BusinessLicense>;
/**
 * 验证企业信息真实性
 * 真实调用天眼查API（如果配置了API Key）
 */
export declare function verifyCompanyInfo(creditCode: string): Promise<{
    valid: boolean;
    message: string;
    companyInfo?: any;
}>;
/**
 * 企业资质审核流程
 * 真实保存到数据库
 */
export declare function auditCompanyQualification(companyId: string, licenseImageUrl: string): Promise<{
    status: string;
    reason: string;
    license?: undefined;
    verification?: undefined;
} | {
    status: string;
    license: BusinessLicense;
    verification: {
        valid: boolean;
        message: string;
        companyInfo?: any;
    };
    reason?: undefined;
}>;
//# sourceMappingURL=companyVerification.d.ts.map