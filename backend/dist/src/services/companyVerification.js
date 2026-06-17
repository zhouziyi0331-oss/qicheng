"use strict";
/**
 * P2安全功能：企业资质验证
 * 真实实现 - 强制调用真实API，没有降级
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ocrBusinessLicense = ocrBusinessLicense;
exports.verifyCompanyInfo = verifyCompanyInfo;
exports.auditCompanyQualification = auditCompanyQualification;
const logger_1 = __importDefault(require("../utils/logger"));
const db_1 = require("../utils/db");
const axios_1 = __importDefault(require("axios"));
/**
 * OCR识别营业执照
 * 强制调用阿里云OCR - 必须配置API Key
 */
async function ocrBusinessLicense(imageUrl) {
    logger_1.default.info('OCR识别营业执照:', imageUrl);
    const ocrApiKey = process.env.ALIYUN_OCR_KEY;
    // 强制要求配置API Key
    if (!ocrApiKey || ocrApiKey === 'your-key') {
        throw new Error('未配置ALIYUN_OCR_KEY，请在.env中配置阿里云OCR密钥');
    }
    try {
        // 真实调用阿里云OCR
        const response = await axios_1.default.post('https://ocr.cn-shanghai.aliyuncs.com', { image: imageUrl, configure: JSON.stringify({ side: 'face' }) }, {
            headers: {
                Authorization: `APPCODE ${ocrApiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: 10000,
        });
        if (response.data && response.data.success) {
            const data = response.data.data;
            return {
                companyName: data.company_name || '',
                creditCode: data.credit_code || '',
                legalPerson: data.legal_person || '',
                registeredCapital: data.registered_capital || '',
                establishDate: data.establish_date || '',
                businessScope: data.business_scope || '',
                licenseImageUrl: imageUrl,
            };
        }
        else {
            throw new Error('OCR识别失败：' + (response.data?.message || '未知错误'));
        }
    }
    catch (error) {
        logger_1.default.error('OCR API调用失败:', error);
        if (error.response) {
            throw new Error(`OCR识别失败: ${error.response.status} - ${error.response.data?.message || '请求失败'}`);
        }
        throw new Error('OCR识别失败，请检查网络连接或API配置');
    }
}
/**
 * 验证企业信息真实性
 * 强制调用天眼查API - 必须配置API Key
 */
async function verifyCompanyInfo(creditCode) {
    logger_1.default.info('验证企业信息:', creditCode);
    const apiKey = process.env.TIANYANCHA_API_KEY;
    // 强制要求配置API Key
    if (!apiKey || apiKey === 'your-key') {
        throw new Error('未配置TIANYANCHA_API_KEY，请在.env中配置天眼查API密钥');
    }
    try {
        // 真实调用天眼查API
        const response = await axios_1.default.get(`https://open.api.tianyancha.com/services/open/ic/baseinfoV2/${creditCode}`, {
            headers: { Authorization: apiKey },
            timeout: 10000,
        });
        if (response.data && response.data.error_code === 0) {
            const result = response.data.result;
            return {
                valid: true,
                message: '企业信息验证通过',
                companyInfo: {
                    name: result.name,
                    status: result.regStatus,
                    creditCode: result.creditCode,
                    legalPerson: result.legalPersonName,
                },
            };
        }
        else {
            return {
                valid: false,
                message: '企业信息验证失败：' + (response.data?.reason || '未找到该企业'),
            };
        }
    }
    catch (error) {
        logger_1.default.error('天眼查API调用失败:', error);
        if (error.response) {
            return {
                valid: false,
                message: `企业信息验证失败: ${error.response.status} - ${error.response.data?.reason || '请求失败'}`,
            };
        }
        throw new Error('企业信息验证服务不可用，请检查网络连接');
    }
}
/**
 * 企业资质审核流程
 * 真实保存到数据库
 */
async function auditCompanyQualification(companyId, licenseImageUrl) {
    try {
        logger_1.default.info(`开始审核企业资质: ${companyId}`);
        const license = await ocrBusinessLicense(licenseImageUrl);
        logger_1.default.info('OCR识别结果:', license);
        const verification = await verifyCompanyInfo(license.creditCode);
        logger_1.default.info('企业验证结果:', verification);
        if (!verification.valid) {
            await (0, db_1.query)(`UPDATE companies
         SET verification_status = 'rejected', verification_message = $1, updated_at = NOW()
         WHERE id = $2`, [verification.message, companyId]);
            return { status: 'rejected', reason: verification.message };
        }
        await (0, db_1.query)(`UPDATE companies
       SET verification_status = 'verified', company_name = $1, credit_code = $2,
           legal_person = $3, registered_capital = $4, business_scope = $5,
           license_image_url = $6, verified_at = NOW(), updated_at = NOW()
       WHERE id = $7`, [
            license.companyName,
            license.creditCode,
            license.legalPerson,
            license.registeredCapital,
            license.businessScope,
            licenseImageUrl,
            companyId,
        ]);
        logger_1.default.info(`企业资质审核通过: ${companyId}`);
        return { status: 'approved', license, verification };
    }
    catch (error) {
        logger_1.default.error('企业资质审核失败:', error);
        await (0, db_1.query)(`UPDATE companies
       SET verification_status = 'error', verification_message = $1, updated_at = NOW()
       WHERE id = $2`, [error.message, companyId]);
        throw error;
    }
}
//# sourceMappingURL=companyVerification.js.map