import axios from 'axios';
import crypto from 'crypto';
import logger from './logger';

/**
 * 发送短信验证码 (阿里云短信服务)
 * 文档: https://help.aliyun.com/document_detail/101414.html
 */
export async function sendSMS(phone: string, code: string): Promise<boolean> {
  const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID;
  const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET;
  const signName = process.env.ALIYUN_SMS_SIGN_NAME || '启程';
  const templateCode = process.env.ALIYUN_SMS_TEMPLATE_CODE || 'SMS_123456789';

  // 开发模式：跳过真实发送
  if (process.env.NODE_ENV === 'development' || !accessKeyId || !accessKeySecret) {
    logger.info('SMS dev mode', { phone: phone.slice(0, 3) + '****' + phone.slice(-4), code });
    return true;
  }

  try {
    const params: Record<string, string> = {
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
      SignatureNonce: crypto.randomBytes(16).toString('hex'),
    };

    // 签名
    const sortedKeys = Object.keys(params).sort();
    const canonicalString = sortedKeys
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
      .join('&');

    const stringToSign = `GET&${encodeURIComponent('/')}&${encodeURIComponent(canonicalString)}`;
    const signature = crypto
      .createHmac('sha1', accessKeySecret + '&')
      .update(stringToSign)
      .digest('base64');

    params.Signature = signature;

    // 发送请求
    const response = await axios.get('https://dysmsapi.aliyuncs.com/', { params });

    if (response.data.Code === 'OK') {
      logger.info('SMS sent successfully', { phone: phone.slice(0, 3) + '****' + phone.slice(-4) });
      return true;
    } else {
      logger.error('SMS send failed', { code: response.data.Code, message: response.data.Message });
      return false;
    }
  } catch (err: unknown) {
    logger.error('SMS service error', { error: (err as Error).message });
    return false;
  }
}
