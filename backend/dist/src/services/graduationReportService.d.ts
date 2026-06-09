/**
 * Lv.6毕业报告生成服务
 * 模块三：Lv.6毕业万字报告（付费解锁）
 *
 * 功能：
 * 1. 学生达到Lv.6后自动触发报告生成
 * 2. 调用DeepSeek-V3生成六章完整报告（约10000字）
 * 3. 支持预览（第一章前300字 + 完整目录）
 * 4. 付费解锁完整报告（¥299）
 * 5. 支持PDF下载
 * 6. 报告可持续更新（每完成3个新项目）
 */
interface GraduationReportChapter {
    chapter_number: number;
    chapter_title: string;
    content: string;
    word_count: number;
}
interface GraduationReport {
    chapters: GraduationReportChapter[];
    total_word_count: number;
    generated_at: Date;
    preview_content: string;
    table_of_contents: string[];
}
declare class GraduationReportService {
    private anthropic;
    constructor();
    /**
     * 生成毕业报告（学生达到Lv.6时触发）
     */
    generateGraduationReport(userId: string): Promise<string>;
    /**
     * 检查用户等级
     */
    private checkUserLevel;
    /**
     * 检查是否已有报告
     */
    private getExistingReport;
    /**
     * 收集学生所有数据
     */
    private collectStudentData;
    /**
     * 生成完整的六章报告
     */
    private generateFullReport;
    /**
     * 生成单个章节（严格按照技术规格）
     */
    private generateChapter;
    /**
     * 获取章节配置（包含最低字数要求）
     */
    private getChapterConfig;
    /**
     * 构建章节的System Prompt（严格按照技术规格）
     */
    private buildChapterSystemPrompt;
    /**
     * 构建章节的User Prompt
     */
    private buildChapterUserPrompt;
    /**
     * 保存报告到数据库
     */
    private saveReport;
    /**
     * 获取报告预览
     */
    getReportPreview(userId: string): Promise<any>;
    /**
     * 获取完整报告（需要已付费）
     */
    getFullReport(reportId: string): Promise<GraduationReport | null>;
    /**
     * 处理报告付费
     */
    processPayment(reportId: string, userId: string, paymentMethod: string, transactionId: string, pointsUsed?: number): Promise<void>;
    /**
     * 检查是否需要更新报告（每完成3个新项目）
     */
    checkNeedUpdate(userId: string): Promise<boolean>;
    /**
     * 更新报告（重新生成）
     */
    updateReport(reportId: string, userId: string): Promise<void>;
}
declare const _default: GraduationReportService;
export default _default;
//# sourceMappingURL=graduationReportService.d.ts.map