"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSMS = sendSMS;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = __importDefault(require("./logger"));
/**
 * 发送短信验证码 (阿里云短信服务)
 * 文档: https://help.aliyun.com/document_detail/101414.html
 */
async function sendSMS(phone, code) {
    const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID;
    const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET;
    const signName = process.env.ALIYUN_SMS_SIGN_NAME || '启程';
    const templateCode = process.env.ALIYUN_SMS_TEMPLATE_CODE || 'SMS_123456789';
    // 开发模式：跳过真实发送
    if (process.env.NODE_ENV === 'development' || !accessKeyId || !accessKeySecret) {
        logger_1.default.info('SMS dev mode', { phone: phone.slice(0, 3) + '****' + phone.slice(-4), code });
        return true;
    }
    try {
        const params = {
            AccessKeyId: accessKeyId,
            Action: 'SendSms',
            Format: 'JSON',
            PhoneNumbers: phone,
            SignName: signName,
            TemplateCode: templateCode,
            TemplateParam: JSON.stringify({ code }),
            Timestamp: new Date().toISOString(),
            SignatureMethod: 'HMAC-SHA1',
            SignatureVersion: '1.0',
            SignatureNonce: crypto_1.default.randomBytes(16).toString('hex'),
        };
        // 签名
        const sortedKeys = Object.keys(params).sort();
        const canonicalString = sortedKeys
            .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
            .join('&');
        const stringToSign = `GET&${encodeURIComponent('/')}&${encodeURIComponent(canonicalString)}`;
        const signature = crypto_1.default
            .createHmac('sha1', accessKeySecret + '&')
            .update(stringToSign)
            .digest('base64');
        params.Signature = signature;
        // 发送请求
        const response = await axios_1.default.get('https://dysmsapi.aliyuncs.com/', { params });
        if (response.data.Code === 'OK') {
            logger_1.default.info('SMS sent successfully', { phone: phone.slice(0, 3) + '****' + phone.slice(-4) });
            return true;
        }
        else {
            logger_1.default.error('SMS send failed', { code: response.data.Code, message: response.data.Message });
            return false;
        }
    }
    catch (err) {
        logger_1.default.error('SMS service error', { error: err.message });
        return false;
    }
}
//# sourceMappingURL=sms.js.map