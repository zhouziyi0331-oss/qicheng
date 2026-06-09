/**
 * AI导师项目复盘服务
 *
 * 功能：
 * 1. 订单完成后触发复盘引导
 * 2. 生成3个复盘问题
 * 3. 保存学生回答
 * 4. 提取精华复盘进入知识中台
 */
interface RetrospectiveQuestions {
    question1: string;
    question2: string;
    question3: string;
}
interface RetrospectiveAnswers {
    answer1: string;
    answer2: string;
    answer3: string;
}
interface Retrospective {
    id: string;
    student_id: string;
    order_id: string;
    questions: RetrospectiveQuestions;
    answers?: RetrospectiveAnswers;
    status: 'pending' | 'completed' | 'skipped';
    is_featured: boolean;
    sent_at: Date;
    completed_at?: Date;
}
declare class MentorRetrospectiveService {
    private anthropic;
    constructor();
    /**
     * 订单完成后触发复盘（延迟60秒）
     */
    triggerRetrospective(studentId: string, orderId: string): Promise<void>;
    /**
     * 生成个性化的复盘问题
     */
    generateQuestions(studentId: string, orderId: string): Promise<RetrospectiveQuestions>;
    /**
     * 格式化复盘消息
     */
    private formatRetrospectiveMessage;
    /**
     * 保存学生回答
     */
    saveAnswers(retrospectiveId: string, answers: RetrospectiveAnswers): Promise<void>;
    /**
     * 跳过复盘
     */
    skipRetrospective(retrospectiveId: string): Promise<void>;
    /**
     * 提取精华复盘（进入知识中台）
     */
    extractFeaturedInsights(retrospectiveId: string): Promise<void>;
    /**
     * 判断是否应该标记为精华复盘
     */
    private shouldBeFeatured;
    /**
     * 获取待完成的复盘
     */
    getPendingRetrospectives(studentId: string): Promise<Retrospective[]>;
    /**
     * 获取历史复盘
     */
    getRetrospectiveHistory(studentId: string, limit?: number): Promise<Retrospective[]>;
    /**
     * 获取复盘统计
     */
    getRetrospectiveStats(days?: number): Promise<any>;
}
declare const _default: MentorRetrospectiveService;
export default _default;
//# sourceMappingURL=mentorRetrospectiveService.d.ts.map