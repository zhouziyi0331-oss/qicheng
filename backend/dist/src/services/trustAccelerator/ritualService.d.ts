/**
 * RitualService - 仪式感服务
 *
 * 核心功能：
 * 1. 生成启程证书图片
 * 2. 上传到OSS
 */
export declare class RitualService {
    /**
     * 生成启程证书
     */
    static generateCertificate(unlockRecordId: string): Promise<string>;
    /**
     * 生成证书HTML模板
     */
    private static generateCertificateHtml;
}
//# sourceMappingURL=ritualService.d.ts.map