/**
 * 跳级挑战服务
 */
export declare class ChallengeService {
    /**
     * 获取可用的挑战任务
     */
    static getAvailableChallenges(studentId: string): Promise<any[]>;
    /**
     * 开始挑战
     */
    static startChallenge(studentId: string, challengeTaskId: number): Promise<any>;
    /**
     * 提交挑战作品
     */
    static submitChallenge(challengeId: number, studentId: string, submissionUrl: string, submissionContent: string): Promise<any>;
    /**
     * 评审挑战（管理员）
     */
    static reviewChallenge(challengeId: number, reviewerId: string, score: number, feedback: string): Promise<{
        passed: boolean;
        score: number;
        feedback: string;
    }>;
    /**
     * 获取学生的挑战历史
     */
    static getChallengeHistory(studentId: string): Promise<any[]>;
}
/**
 * 毕业系统服务
 */
export declare class GraduationService {
    /**
     * 检查毕业资格
     */
    static checkEligibility(studentId: string): Promise<{
        eligible: boolean;
        reason: string;
        track?: undefined;
        tasksCompleted?: undefined;
        totalEarnings?: undefined;
    } | {
        eligible: boolean;
        track: any;
        tasksCompleted: number;
        totalEarnings: number;
        reason?: undefined;
    }>;
    /**
     * 提交毕业申请
     */
    static applyForGraduation(studentId: string, portfolioUrl: string, selfIntroduction: string, careerGoals: string): Promise<any>;
    /**
     * 审核毕业申请（管理员）
     */
    static reviewGraduation(applicationId: number, reviewerId: string, approved: boolean, feedback: string): Promise<{
        approved: boolean;
        feedback: string;
    }>;
    /**
     * 获取毕业生权益
     */
    static getGraduateBenefits(studentId: string): Promise<any>;
    /**
     * 获取毕业申请列表（管理员）
     */
    static getApplications(status?: string): Promise<any[]>;
}
//# sourceMappingURL=challengeGraduationService.d.ts.map