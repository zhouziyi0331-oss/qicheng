/**
 * 报告生成Agent
 * 基于L4成长档案生成学生能力报告
 */
interface StudentReport {
    studentId: string;
    reportId: string;
    generatedAt: Date;
    summary: {
        totalTasks: number;
        completionRate: number;
        averageQuality: number;
        growthTrend: 'improving' | 'stable' | 'declining';
    };
    milestones: Array<{
        date: string;
        type: string;
        description: string;
        impact: string;
    }>;
    skillProfile: {
        strengths: string[];
        weaknesses: string[];
        recommendations: string[];
    };
    taskHistory: Array<{
        taskId: string;
        completedAt: string;
        quality: number;
        feedback: string;
        learnings: string[];
    }>;
    mentorInsights: string;
    nextSteps: string[];
}
declare class ReportGeneratorAgent {
    private anthropic;
    constructor();
    /**
     * 生成学生能力报告
     */
    generateReport(userId: string, options?: {
        reportType?: 'comprehensive' | 'summary' | 'growth';
        timeRange?: number;
    }): Promise<StudentReport>;
    /**
     * 加载学生的完整记忆（L1-L6）
     */
    private loadStudentMemory;
    /**
     * 使用AI生成报告内容
     */
    private generateReportWithAI;
    /**
     * 构建报告生成提示词
     */
    private buildReportPrompt;
    /**
     * 构建结构化报告
     */
    private buildStructuredReport;
    /**
     * 计算完成率
     */
    private calculateCompletionRate;
    /**
     * 计算平均质量
     */
    private calculateAverageQuality;
}
export declare const reportGeneratorAgent: ReportGeneratorAgent;
export default reportGeneratorAgent;
//# sourceMappingURL=reportGeneratorAgent.d.ts.map