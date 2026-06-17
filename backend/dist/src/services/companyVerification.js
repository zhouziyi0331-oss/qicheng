"use strict";
/**
 * P2安全功能：企业资质验证
 *
 * 功能：
 * 1. 营业执照OCR识别
 * 2. 企业信息API验证
 * 3. 人工审核流程
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ocrBusinessLicense = ocrBusinessLicense;
exports.verifyCompanyInfo = verifyCompanyInfo;
exports.auditCompanyQualification = auditCompanyQualification;
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * OCR识别营业执照
 * 使用阿里云OCR或腾讯云OCR
 */
async function ocrBusinessLicense(imageUrl) {
    logger_1.default.info('OCR识别营业执照:', imageUrl);
    // TODO: 集成阿里云OCR API
    // 示例代码：
    // const client = new OCRClient({...});
    // const result = await client.recognizeBusinessLicense(imageUrl);
    // 模拟返回
    return {
        companyName: '示例科技有限公司',
        creditCode: '91110000000000000X',
        legalPerson: '张三',
        registeredCapital: '100万',
        establishDate: '2020-01-01',
        businessScope: '技术开发、技术服务',
        licenseImageUrl: imageUrl,
    };
}
/**
 * 验证企业信息真实性
 * 使用天眼查/企查查API
 */
async function verifyCompanyInfo(creditCode) {
    logger_1.default.info('验证企业信息:', creditCode);
    // TODO: 集成企业信息API
    // 示例：天眼查API
    // const apiKey = process.env.TIANYANCHA_API_KEY;
    // const response = await fetch(`https://open.api.tianyancha.com/services/v4/company/baseinfo?name=${creditCode}`, {
    //   headers: { 'Authorization': apiKey }
    // });
    // 模拟返回
    return {
        valid: true,
        message: '企业信息验证通过',
        companyInfo: {
            name: '示例科技有限公司',
            status: '存续',
            creditCode,
        },
    };
}
/**
 * 企业资质审核流程
 */
async function auditCompanyQualification(companyId, licenseImageUrl) {
    try {
        // 1. OCR识别营业执照
        const license = await ocrBusinessLicense(licenseImageUrl);
        logger_1.default.info('OCR识别结果:', license);
        // 2. 验证企业信息
        const verification = await verifyCompanyInfo(license.creditCode);
        if (!verification.valid) {
            return {
                status: 'rejected',
                reason: verification.message,
            };
        }
        // 3. 保存审核结果
        const { query } = await Promise.resolve().then(() => __importStar(require('../utils/db')));
        await query(`UPDATE companies
       SET
         verification_status = 'verified',
         credit_code = $1,
         legal_person = $2,
         verified_at = NOW()
       WHERE id = $3`, [license.creditCode, license.legalPerson, companyId]);
        return {
            status: 'approved',
            license,
            verification,
        };
    }
    catch (error) {
        logger_1.default.error('企业资质审核失败:', error);
        throw error;
    }
}
//# sourceMappingURL=companyVerification.js.map