/**
 * AI导师范例展示服务
 *
 * 功能：
 * 1. 检索相似项目案例
 * 2. 格式化案例展示
 * 3. 集成到T-02场景（学生连续求助时）
 */
interface SimilarCase {
    order_id: string;
    project_title: string;
    project_type: string;
    student_level: number;
    client_rating: number;
    retrospective_content: string;
    approach_summary: string;
    tools_used: string[];
    key_learnings: string[];
    similarity_score: number;
}
interface FormattedCase {
    title: string;
    metadata: string;
    approach: string;
    tools: string;
    learnings: string;
    full_text: string;
}
declare class MentorExampleService {
    /**
     * 检索相似项目案例
     *
     * @param currentProjectId 当前项目ID
     * @param studentLevel 学生等级
     * @param limit 返回案例数量
     */
    findSimilarCase(currentProjectId: string, studentLevel: number, limit?: number): Promise<SimilarCase | null>;
    /**
     * 格式化案例展示
     */
    formatCaseForDisplay(similarCase: SimilarCase): FormattedCase;
    /**
     * 从复盘内容中提取关键学习点
     */
    private extractKeyLearnings;
    /**
     * 检测是否应该展示范例
     *
     * @param conversationHistory 对话历史
     * @returns 是否应该展示范例
     */
    shouldShowExample(conversationHistory: any[]): boolean;
    /**
     * 记录范例展示
     */
    recordExampleShown(studentId: string, orderId: string, exampleOrderId: string, similarityScore: number): Promise<void>;
    /**
     * 获取范例展示统计
     */
    getExampleStats(days?: number): Promise<any>;
}
declare const _default: MentorExampleService;
export default _default;
//# sourceMappingURL=mentorExampleService.d.ts.map