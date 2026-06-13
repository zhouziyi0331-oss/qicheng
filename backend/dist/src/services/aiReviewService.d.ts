interface QualityScore {
    score: number;
    weight: number;
    feedback: string;
}
interface Issue {
    severity: 'critical' | 'major' | 'minor';
    category: string;
    title: string;
    description: string;
    location?: string;
    suggestion: string;
}
interface AIReviewReport {
    id: string;
    task_id: string;
    review_version: number;
    overall_score: number;
    overall_grade: string;
    quality_scores: Record<string, QualityScore>;
    strengths: string[];
    issues: Issue[];
    recommendations: string[];
    ai_recommendation: 'approve' | 'minor_revisions' | 'major_revisions' | 'reject';
    confidence_level: number;
    ai_analysis: string;
}
interface RevisionStep {
    step: number;
    title: string;
    description: string;
    files_to_modify?: string[];
    estimated_time: string;
    priority: 'high' | 'medium' | 'low';
    examples?: string[];
}
interface RevisionGuide {
    id: string;
    task_id: string;
    review_report_id?: string;
    rejection_reason: string;
    guide_version: number;
    revision_steps: RevisionStep[];
    verification_checklist: Array<{
        item: string;
        category: string;
        required: boolean;
    }>;
    estimated_hours: number;
    difficulty_level: 'easy' | 'medium' | 'hard';
}
/**
 * E-21: AI审核报告透明化服务
 * AI自动审核交付物并生成改进指引
 */
declare class AIReviewService {
    /**
     * AI审核任务交付物
     */
    reviewTaskDeliverable(data: {
        taskId: string;
        taskTitle: string;
        taskDescription: string;
        deliverableDescription: string;
        deliverableFiles?: string[];
        deliverableUrl?: string;
        requirements?: string[];
    }): Promise<AIReviewReport>;
    /**
     * 企业驳回后生成AI改进指引
     */
    generateRevisionGuide(data: {
        taskId: string;
        rejectionReason: string;
        rejectionDetails?: any;
        reviewReportId?: string;
        companyId: string;
    }): Promise<RevisionGuide>;
    /**
     * 获取任务的审核历史
     */
    getReviewHistory(taskId: string): Promise<AIReviewReport[]>;
    /**
     * 获取任务的改进指引
     */
    getRevisionGuides(taskId: string): Promise<RevisionGuide[]>;
    /**
     * 学生标记已查看改进指引
     */
    markGuideAsViewed(guideId: string, studentId: string): Promise<void>;
    /**
     * 学生对改进指引评分
     */
    rateGuideHelpfulness(guideId: string, rating: number, feedback?: string): Promise<void>;
    /**
     * 解析AI审核响应
     */
    private parseAIResponse;
    /**
     * 解析改进指引
     */
    private parseRevisionGuide;
    /**
     * 计算总分
     */
    private calculateOverallScore;
    /**
     * 分数转等级
     */
    private scoreToGrade;
    /**
     * 降级方案：生成基础审核报告
     */
    private generateFallbackReview;
    /**
     * 降级方案：生成基础改进指引
     */
    private generateFallbackGuide;
}
declare const _default: AIReviewService;
export default _default;
//# sourceMappingURL=aiReviewService.d.ts.map