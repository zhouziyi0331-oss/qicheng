interface DimensionScore {
    score: number;
    weight: number;
    details: string;
}
interface MatchScore {
    overallScore: number;
    skillMatch: DimensionScore;
    difficultyMatch: DimensionScore;
    domainMatch: DimensionScore;
    growthPotential: DimensionScore;
    reliability: DimensionScore;
    preferenceAlignment: DimensionScore;
    breakdown: any;
}
interface MatchResult {
    taskId: string;
    studentId: string;
    matchScore: MatchScore;
    rank?: number;
}
/**
 * 语义匹配引擎
 * 实现6维度匹配算法：技能、难度、领域、成长潜力、可靠性、偏好
 */
declare class SemanticMatchingEngine {
    private readonly WEIGHTS;
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
    findBestTasksForStudent(studentId: string, limit?: number): Promise<MatchResult[]>;
    /**
     * 维度1: 技能匹配 (35%)
     * 基于技能向量相似度 + 技能熟练度匹配
     */
    private calculateSkillMatch;
    /**
     * 维度2: 难度匹配 (20%)
     * 任务难度与学生能力水平的匹配度
     */
    private calculateDifficultyMatch;
    /**
     * 维度3: 领域匹配 (15%)
     * 任务类型与学生偏好领域的匹配
     */
    private calculateDomainMatch;
    /**
     * 维度4: 成长潜力 (15%)
     * 任务对学生的成长价值
     */
    private calculateGrowthPotential;
    /**
     * 维度5: 可靠性 (10%)
     * 学生的历史表现和可靠性
     */
    private calculateReliability;
    /**
     * 维度6: 偏好对齐 (5%)
     * 学生的工作偏好与任务特征的匹配
     */
    private calculatePreferenceAlignment;
    /**
     * 使用向量相似度快速筛选候选学生
     * 这是真正的语义匹配：理解"言外之意"
     */
    private findCandidateStudents;
    /**
     * 使用两阶段检索筛选候选任务
     * 阶段一：结构化过滤（状态、等级、预算、赛道）
     * 阶段二：语义相似度排序
     */
    private findCandidateTasks;
    /**
     * 获取任务信息
     */
    private getTaskInfo;
    /**
     * 获取学生能力信息
     */
    private getStudentCapability;
}
declare const _default: SemanticMatchingEngine;
export default _default;
//# sourceMappingURL=semanticMatchingEngine.d.ts.map