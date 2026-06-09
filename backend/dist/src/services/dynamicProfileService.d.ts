interface ProfileUpdateResponse {
    student_id: string;
    previous_profile: {
        opc_tag: string;
        capability_scores: {
            technical_depth: number;
            problem_solving: number;
            communication: number;
            collaboration: number;
            learning_agility: number;
            delivery_quality: number;
        };
    };
    updated_profile: {
        opc_tag: string;
        capability_scores: {
            technical_depth: number;
            problem_solving: number;
            communication: number;
            collaboration: number;
            learning_agility: number;
            delivery_quality: number;
        };
    };
    changes: {
        opc_tag_changed: boolean;
        significant_score_changes: Array<{
            dimension: string;
            old_score: number;
            new_score: number;
            change: number;
        }>;
    };
    insights: {
        strengths: string[];
        areas_for_improvement: string[];
        growth_trajectory: string;
        recommended_next_tasks: string[];
    };
    notification_sent: boolean;
    updated_at: string;
}
declare class DynamicProfileService {
    /**
     * 任务完成后更新学生能力画像
     */
    updateAfterTaskCompletion(studentId: string, taskId: string, assignmentId: string): Promise<ProfileUpdateResponse>;
    /**
     * 任务完成后更新学生能力画像
     */
    updateStudentProfile(studentId: string, taskId: string, submissionId: string): Promise<ProfileUpdateResponse>;
    /**
     * 格式化画像更新结果为前端友好的格式
     */
    formatProfileUpdateForFrontend(response: ProfileUpdateResponse): {
        studentId: string;
        previousProfile: {
            opcTag: string;
            capabilityScores: {
                technical_depth: number;
                problem_solving: number;
                communication: number;
                collaboration: number;
                learning_agility: number;
                delivery_quality: number;
            };
        };
        updatedProfile: {
            opcTag: string;
            capabilityScores: {
                technical_depth: number;
                problem_solving: number;
                communication: number;
                collaboration: number;
                learning_agility: number;
                delivery_quality: number;
            };
        };
        changes: {
            opcTagChanged: boolean;
            significantScoreChanges: {
                dimension: string;
                oldScore: number;
                newScore: number;
                change: number;
            }[];
        };
        insights: {
            strengths: string[];
            areasForImprovement: string[];
            growthTrajectory: string;
            recommendedNextTasks: string[];
        };
        notificationSent: boolean;
        updatedAt: string;
    };
    /**
     * 判断是否有显著变化需要通知学生
     */
    hasSignificantChanges(response: ProfileUpdateResponse): boolean;
    /**
     * 生成变化摘要文本
     */
    generateChangeSummary(response: ProfileUpdateResponse): string;
    /**
     * 翻译能力维度名称
     */
    private translateDimension;
    /**
     * 批量更新多个学生的能力画像
     */
    batchUpdate(updates: Array<{
        studentId: string;
        taskId: string;
        submissionId: string;
    }>): Promise<ProfileUpdateResponse[]>;
    /**
     * 获取学生的能力画像历史记录
     */
    getProfileHistory(studentId: string, limit?: number): Promise<any[]>;
}
export declare const dynamicProfileService: DynamicProfileService;
export {};
//# sourceMappingURL=dynamicProfileService.d.ts.map