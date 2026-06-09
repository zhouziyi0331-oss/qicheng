/**
 * 交付物预检服务
 * 在学生提交前提供AI预检，降低被打回率
 */
export declare class SubmissionPreCheckService {
    /**
     * 预检学生提交内容
     *
     * @param taskId 任务ID
     * @param studentId 学生ID
     * @param submissionContent 提交内容描述
     * @returns 预检结果
     */
    preCheckSubmission(taskId: string, studentId: string, submissionContent: string): Promise<{
        passLikelihood: number;
        criticalIssues: Array<{
            description: string;
            suggestion: string;
        }>;
        warnings: Array<{
            description: string;
            suggestion: string;
        }>;
        highlights: string[];
        overallFeedback: string;
        shouldSubmit: boolean;
    }>;
    /**
     * 格式化预检结果为用户友好的文本
     */
    formatPreCheckResult(result: Awaited<ReturnType<typeof this.preCheckSubmission>>): string;
}
export declare const submissionPreCheckService: SubmissionPreCheckService;
//# sourceMappingURL=submissionPreCheckService.d.ts.map