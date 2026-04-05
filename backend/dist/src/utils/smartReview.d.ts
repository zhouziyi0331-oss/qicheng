/**
 * 智能检测任务提交是否合格
 * 根据任务要求、验收标准、提交内容进行AI分析
 */
export declare function reviewTaskSubmission(taskTitle: string, taskDescription: string, acceptanceCriteria: string, submissionNote: string, fileUrls: string[]): Promise<{
    isQualified: boolean;
    score: number;
    feedback: string;
    issues: string[];
    highlights: string[];
}>;
//# sourceMappingURL=smartReview.d.ts.map