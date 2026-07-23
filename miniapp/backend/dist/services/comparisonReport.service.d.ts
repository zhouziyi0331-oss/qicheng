import mongoose from 'mongoose';
/**
 * 深度对比报告服务
 * 对比规则：
 * - 第1次：测评 vs 第1次项目
 * - 第2次：第2次项目 vs 第1次项目
 * - 第N次：第N次项目 vs 第(N-1)次项目
 */
export declare class ComparisonReportService {
    /**
     * 生成对比报告
     * 在完成项目后自动触发
     */
    generateComparisonReport(userId: string, triggeredByProjectId?: string): Promise<(mongoose.Document<unknown, {}, import("../models/ComparisonReport").IComparisonReport, {}, {}> & import("../models/ComparisonReport").IComparisonReport & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    /**
     * 获取快照引用信息
     */
    private getSnapshotReference;
    /**
     * AI生成对比分析
     */
    private generateAIAnalysis;
    /**
     * 获取用户的对比报告历史
     */
    getUserComparisonReports(userId: string): Promise<(mongoose.Document<unknown, {}, import("../models/ComparisonReport").IComparisonReport, {}, {}> & import("../models/ComparisonReport").IComparisonReport & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    /**
     * 获取最新对比报告
     */
    getLatestComparisonReport(userId: string): Promise<(mongoose.Document<unknown, {}, import("../models/ComparisonReport").IComparisonReport, {}, {}> & import("../models/ComparisonReport").IComparisonReport & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
}
export declare const comparisonReportService: ComparisonReportService;
//# sourceMappingURL=comparisonReport.service.d.ts.map