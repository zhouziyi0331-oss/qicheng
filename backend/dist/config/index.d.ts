export declare const config: {
    env: string;
    port: number;
    db: {
        url: string;
        pool: {
            min: number;
            max: number;
        };
    };
    redis: {
        url: string;
    };
    jwt: {
        accessSecret: string;
        refreshSecret: string;
        accessExpiry: string;
        refreshExpiry: string;
    };
    ai: {
        serviceUrl: string;
        timeout: number;
        reportTimeout: number;
        anthropicApiKey: string;
    };
    oss: {
        endpoint: string;
        bucket: string;
        accessKeyId: string;
        accessKeySecret: string;
    };
    payment: {
        wechatAppId: string;
        wechatMchId: string;
        wechatApiKey: string;
        alipayAppId: string;
        alipayPrivateKey: string;
        notifyBaseUrl: string;
    };
    push: {
        jpushAppKey: string;
        jpushMasterSecret: string;
        wechatServiceNotifyUrl: string;
    };
    wechat: {
        studentAppId: string;
        studentAppSecret: string;
        companyAppId: string;
        companyAppSecret: string;
    };
    platform: {
        firstTaskSettlementHours: number;
        normalTaskSettlementDays: number;
        minWithdrawalAmount: number;
        autoWithdrawalLimit: number;
        maxAssignees: number;
    };
    contactFilterPatterns: RegExp[];
};
export default config;
//# sourceMappingURL=index.d.ts.map