/**
 * P2安全功能：企业资质验证
 *
 * 功能：
 * 1. 营业执照OCR识别
 * 2. 企业信息API验证
 * 3. 人工审核流程
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
 * 使用阿里云OCR或腾讯云OCR
 */
export declare function ocrBusinessLicense(imageUrl: string): Promise<BusinessLicense>;
/**
 * 验证企业信息真实性
 * 使用天眼查/企查查API
 */
export declare function verifyCompanyInfo(creditCode: string): Promise<{
    valid: boolean;
    message: string;
    companyInfo?: any;
}>;
/**
 * 企业资质审核流程
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