/**
 * 邀请匹配服务
 * 基于能力、历史表现、标签、活跃度的智能匹配算法
 */
interface MatchConfig {
    ability_weight: number;
    history_weight: number;
    tag_weight: number;
    activity_weight: number;
    preferred_abilities: string[];
    preferred_tags: string[];
    min_match_score: number;
    blacklist_students: string[];
}
interface MatchResult {
    student_id: string;
    match_score: number;
    match_reason: {
        ability_score: number;
        history_score: number;
        tag_score: number;
        activity_score: number;
    };
}
export declare class InvitationMatchService {
    /**
     * 为任务匹配最合适的学生
     */
    matchStudentsForTask(companyId: string, taskRequirements: {
        target_level_min: number;
        target_abilities?: Record<string, number>;
        target_tags?: string[];
        max_invitations: number;
    }): Promise<MatchResult[]>;
    /**
     * 获取商家匹配配置
     */
    private getMatchConfig;
    /**
     * 获取候选学生列表
     */
    private getCandidateStudents;
    /**
     * 计算匹配分数（0-100）
     */
    private calculateMatchScore;
    /**
     * 计算能力匹配分数
     */
    private calculateAbilityScore;
    /**
     * 计算历史表现分数
     */
    private calculateHistoryScore;
    /**
     * 计算标签匹配分数
     */
    private calculateTagScore;
    /**
     * 计算活跃度分数
     */
    private calculateActivityScore;
    /**
     * 更新商家匹配配置
     */
    updateMatchConfig(companyId: string, config: Partial<MatchConfig>): Promise<void>;
}
export declare const invitationMatchService: InvitationMatchService;
export {};
//# sourceMappingURL=matchService.d.ts.map