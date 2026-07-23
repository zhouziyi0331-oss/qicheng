import mongoose from 'mongoose';
/**
 * 毕业报告服务
 * 生成用户完整学习历程的综合报告
 */
export declare class GraduationReportService {
    /**
     * 生成毕业报告
     */
    generateGraduationReport(userId: string): Promise<{
        reportId: mongoose.Types.ObjectId;
        status: string;
        message: string;
    }>;
    /**
     * 收集用户所有数据
     */
    private collectAllUserData;
    /**
     * 生成完整报告
     */
    private generateFullReport;
    /**
     * 计算学习历程总结
     */
    private calculateJourneySummary;
    /**
     * 计算项目成果
     */
    private calculateProjectAchievements;
    /**
     * 计算能力成长
     */
    private calculateAbilityGrowth;
    /**
     * 计算升级次数
     */
    private calculateLevelUps;
    /**
     * 计算财务成果
     */
    private calculateFinancialSummary;
    /**
     * 准备可视化数据
     */
    private prepareVisualData;
    /**
     * AI生成个性化评价
     */
    private generateAIEvaluation;
    /**
     * 生成证书
     */
    private generateCertificate;
    /**
     * 获取毕业报告
     */
    getGraduationReport(userId: string): Promise<(mongoose.Document<unknown, {}, import("../models/GraduationReport").IGraduationReport, {}, {}> & import("../models/GraduationReport").IGraduationReport & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    /**
     * 解锁毕业报告
     */
    unlockGraduationReport(userId: string): Promise<mongoose.Document<unknown, {}, import("../models/GraduationReport").IGraduationReport, {}, {}> & import("../models/GraduationReport").IGraduationReport & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }>;
}
export declare const graduationReportService: GraduationReportService;
//# sourceMappingURL=graduationReport.service.d.ts.map