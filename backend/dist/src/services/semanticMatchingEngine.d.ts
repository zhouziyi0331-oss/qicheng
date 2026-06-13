/**
 * 语义匹配引擎
 * 6维度匹配算法：技能、难度、领域、成长潜力、可靠性、偏好
 * 用于精准匹配任务和学生
 */
interface MatchScore {
    overall_score: number;
    skill_match_score: number;
    difficulty_match_score: number;
    domain_match_score: number;
    growth_potential_score: number;
    reliability_score: number;
    preference_score: number;
    match_breakdown: any;
}
interface MatchResult {
    student_id: string;
    student_name: string;
    match_score: MatchScore;
    rank: number;
}
declare class SemanticMatchingEngine {
    private weights;
    /**
     * 计算余弦相似度
     */
    private cosineSimilarity;
    /**
     * 维度1：技能匹配
     */
    private calculateSkillMatch;
    /**
     * 维度2：难度匹配
     */
    private calculateDifficultyMatch;
    /**
     * 维度3：领域匹配
     */
    private calculateDomainMatch;
    /**
     * 维度4：成长潜力
     */
    private calculateGrowthPotential;
    /**
     * 维度5：可靠性
     */
    private calculateReliability;
    /**
     * 维度6：偏好匹配
     */
    private calculatePreferenceAlignment;
    /**
     * 计算单个任务与学生的匹配度
     */
    matchTaskWithStudent(taskId: string, studentId: string): Promise<MatchScore>;
    /**
     * 找出最适合任务的学生（Top K）
     */
    findBestStudentsForTask(taskId: string, limit?: number): Promise<MatchResult[]>;
    /**
     * 找出最适合学生的任务
     */
    findBestTasksForStudent(studentId: string, limit?: number): Promise<any[]>;
    /**
     * 保存匹配结果到数据库
     */
    saveMatchResults(taskId: string, matchResults: MatchResult[]): Promise<void>;
}
declare const _default: SemanticMatchingEngine;
export default _default;
//# sourceMappingURL=semanticMatchingEngine.d.ts.map