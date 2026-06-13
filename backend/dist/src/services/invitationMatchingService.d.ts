interface StudentMatch {
    student_id: string;
    match_score: number;
    score_breakdown: {
        opc_match: number;
        capability_complement: number;
        task_experience: number;
        activity: number;
    };
    reasoning: string;
    recommended_role?: string;
}
interface TaskMatch {
    task_id: string;
    match_score: number;
    score_breakdown: {
        capability_match: number;
        growth_potential: number;
        interest_alignment: number;
        difficulty_fit: number;
    };
    reasoning: string;
    estimated_success_rate: number;
}
interface MatchStudentsResponse {
    task_id: string;
    matches: StudentMatch[];
    created_at: string;
}
interface MatchTasksResponse {
    student_id: string;
    matches: TaskMatch[];
    created_at: string;
}
declare class InvitationMatchingService {
    /**
     * 为任务匹配合适的学生
     */
    matchStudentsForTask(taskId: string, limit?: number): Promise<MatchStudentsResponse>;
    /**
     * 为学生匹配合适的任务
     */
    matchTasksForStudent(studentId: string, limit?: number): Promise<MatchTasksResponse>;
    /**
     * 格式化学生匹配结果为前端友好的格式
     */
    formatStudentMatchesForFrontend(response: MatchStudentsResponse): {
        taskId: string;
        matches: {
            studentId: string;
            match_score: number;
            scoreBreakdown: {
                opcMatch: number;
                capabilityComplement: number;
                taskExperience: number;
                activity: number;
            };
            reasoning: string;
            recommendedRole: string | undefined;
        }[];
        createdAt: string;
    };
    /**
     * 格式化任务匹配结果为前端友好的格式
     */
    formatTaskMatchesForFrontend(response: MatchTasksResponse): {
        studentId: string;
        matches: {
            taskId: string;
            match_score: number;
            scoreBreakdown: {
                capabilityMatch: number;
                growthPotential: number;
                interestAlignment: number;
                difficultyFit: number;
            };
            reasoning: string;
            estimatedSuccessRate: number;
        }[];
        createdAt: string;
    };
    /**
     * 根据匹配分数获取推荐等级
     */
    getRecommendationLevel(score: number): 'highly_recommended' | 'recommended' | 'suitable' | 'not_recommended';
    /**
     * 发送任务邀请
     */
    sendInvitation(taskId: string, studentId: string, companyId: string, match_score: number, customMessage?: string): Promise<any>;
    /**
     * 获取学生收到的邀请列表
     */
    getStudentInvitations(studentId: string, status?: string): Promise<any[]>;
    /**
     * 更新邀请状态
     */
    updateInvitationStatus(invitationId: string, status: 'accepted' | 'declined', studentId: string): Promise<any>;
}
export declare const invitationMatchingService: InvitationMatchingService;
export {};
//# sourceMappingURL=invitationMatchingService.d.ts.map