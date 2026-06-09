"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    db: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/qicheng',
        pool: {
            min: 2,
            max: 20,
        },
    },
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
    },
    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET || 'change-me-in-production',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'change-me-refresh-in-production',
        accessExpiry: '15m',
        refreshExpiry: '7d',
    },
    ai: {
        serviceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
        timeout: 30000, // 30s for most AI calls
        reportTimeout: 120000, // 2min for report generation
        anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    },
    embedding: {
        apiUrl: process.env.EMBEDDING_API_URL || '',
        apiKey: process.env.EMBEDDING_API_KEY || '',
        model: 'bge-large-zh-v1.5',
        dimension: 1024,
    },
    oss: {
        endpoint: process.env.OSS_ENDPOINT || '',
        bucket: process.env.OSS_BUCKET || '',
        accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
        accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
    },
    payment: {
        wechatAppId: process.env.WECHAT_APP_ID || '',
        wechatMchId: process.env.WECHAT_MCH_ID || '',
        wechatApiKey: process.env.WECHAT_API_KEY || '',
        alipayAppId: process.env.ALIPAY_APP_ID || '',
        alipayPrivateKey: process.env.ALIPAY_PRIVATE_KEY || '',
        notifyBaseUrl: process.env.PAYMENT_NOTIFY_BASE_URL || '',
    },
    push: {
        jpushAppKey: process.env.JPUSH_APP_KEY || '',
        jpushMasterSecret: process.env.JPUSH_MASTER_SECRET || '',
        wechatServiceNotifyUrl: process.env.WECHAT_SERVICE_NOTIFY_URL || '',
    },
    wechat: {
        // 学生端小程序
        studentAppId: process.env.WECHAT_STUDENT_APP_ID || '',
        studentAppSecret: process.env.WECHAT_STUDENT_APP_SECRET || '',
        // 企业端小程序
        companyAppId: process.env.WECHAT_COMPANY_APP_ID || '',
        companyAppSecret: process.env.WECHAT_COMPANY_APP_SECRET || '',
    },
    platform: {
        // 首单结算小时数
        firstTaskSettlementHours: parseInt(process.env.FIRST_TASK_SETTLEMENT_HOURS || '24', 10),
        // 普通任务结算天数
        normalTaskSettlementDays: parseInt(process.env.NORMAL_TASK_SETTLEMENT_DAYS || '7', 10),
        // 最低提现金额
        minWithdrawalAmount: parseFloat(process.env.MIN_WITHDRAWAL_AMOUNT || '10'),
        // 自动处理提现上限
        autoWithdrawalLimit: parseFloat(process.env.AUTO_WITHDRAWAL_LIMIT || '1000'),
        // 每任务最多推送人数
        maxAssignees: parseInt(process.env.MAX_ASSIGNEES || '3', 10),
    },
    // 联系方式过滤正则
    contactFilterPatterns: [
        /1[3-9]\d{9}/g, // 手机号
        /微信[号:：\s]*\S+/g, // 微信号
        /wx[:\s]*\S+/gi, // wx:xxx
        /weixin[:\s]*\S+/gi, // weixin:xxx
        /qq[号:：\s]*\d{5,12}/gi, // QQ号
        /\d{5,12}@qq\.com/g, // QQ邮箱
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // 邮箱
        /\d{3}[-\s]?\d{4}[-\s]?\d{4}/g, // 分隔手机号
    ],
};
exports.default = exports.config;
//# sourceMappingURL=index.js.map