import winston from 'winston';
import { config } from '../../config';

/**
 * ✅ P0安全: 敏感字段列表
 */
const SENSITIVE_KEYS = [
  'password', 'pwd', 'passwd',
  'secret', 'key', 'token',
  'phone', 'mobile', 'tel',
  'openid', 'unionid', 'session_key',
  'access_token', 'refresh_token',
  'credit_card', 'card_number', 'cvv',
  'ssn', 'id_card', 'passport',
  'api_key', 'private_key',
];

/**
 * ✅ P0安全: 递归脱敏函数
 */
function sanitize(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map(item => sanitize(item));
  }

  // 处理对象
  const sanitized: any = {};
  for (const key of Object.keys(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_KEYS.some(k => lowerKey.includes(k));

    if (isSensitive) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof obj[key] === 'object') {
      sanitized[key] = sanitize(obj[key]);
    } else {
      sanitized[key] = obj[key];
    }
  }

  return sanitized;
}

const logger = winston.createLogger({
  level: config.env === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    // ✅ P0安全: 添加脱敏格式化
    winston.format((info) => {
      // 脱敏所有字段
      const sanitized = sanitize(info);
      return sanitized;
    })(),
    winston.format.json()
  ),
  defaultMeta: { service: 'qicheng-backend' },
  transports: [
    new winston.transports.Console({
      format: config.env !== 'production'
        ? winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        : winston.format.json(),
    }),
  ],
});

export default logger;
