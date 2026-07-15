/**
 * Phase R5.4: 报告历史增强服务
 * 报告历史对比、数据可视化、版本管理
 */
interface ReportVersion {
    id: string;
    student_id: string;
    report_type: string;
    report_data: any;
    generated_at: Date;
    generated_for_company_id?: string;
    version_label?: string;
}
interface ReportComparison {
    studentId: string;
    olderReport: {
        id: string;
        generatedAt: Date;
        data: any;
    };
    newerReport: {
        id: string;
        generatedAt: Date;
        data: any;
    };
    changes: {
        skillImprovements: Array<{
            skill: string;
            oldLevel: string;
            newLevel: string;
            improvement: string;
        }>;
        newMilestones: number;
        taskCountIncrease: number;
        qualityChange: number;
        growthTrendChange?: string;
    };
    summary: string;
}
interface GrowthCurveData {
    studentId: string;
    timeRange: number;
    dataPoints: Array<{
        date: string;
        tasksCompleted: number;
        averageQuality: number;
        confidenceScore: number;
        level: number;
    }>;
    trends: {
        taskCompletionTrend: 'increasing' | 'stable' | 'decreasing';
        qualityTrend: 'improving' | 'stable' | 'declining';
        overallGrowth: number;
    };
}
declare class ReportHistoryService {
    /**
     * 获取学生的报告历史
     */
    getReportHistory(studentId: string, options?: {
        reportType?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        reports: ReportVersion[];
        total: number;
    }>;
    /**
     * 对比两个报告
     */
    compareReports(studentId: string, olderReportId: string, newerReportId: string): Promise<ReportComparison>;
    /**
     * 分析报告变化
     */
    private analyzeChanges;
    /**
     * 生成对比总结
     */
    private generateComparisonSummary;
    /**
     * 获取成长曲线数据
     */
    getGrowthCurve(studentId: string, timeRange?: number): Promise<GrowthCurveData>;
    /**
     * 计算趋势
     */
    private calculateTrends;
    /**
     * 获取技能雷达图数据
     */
    getSkillRadarData(studentId: string): Promise<any>;
    /**
     * 计算维度得分
     */
    private calculateDimensionScore;
    /**
     * 获取里程碑时间轴
     */
    getMilestoneTimeline(studentId: string): Promise<any[]>;
    /**
     * 去重里程碑
     */
    private deduplicateMilestones;
}
export declare const reportHistoryService: ReportHistoryService;
export default reportHistoryService;
//# sourceMappingURL=reportHistoryService.d.ts.map