/**
 * 真正基于向量的匹配引擎
 * 直接使用向量计算，不依赖中间对象
 *
 * 适配版：使用qicheng的PostgreSQL pool
 */
interface MatchResult {
    taskId: string;
    studentId: string;
    overallScore: number;
    skillMatch: number;
    difficultyMatch: number;
    domainMatch: number;
    growthPotential: number;
    reliability: number;
    preferenceAlignment: number;
    recommendation: string;
    reasoning: string[];
    concerns: string[];
}
declare class SemanticMatchingEngine {
    /**
     * 为任务生成并存储向量
     */
    indexTask(taskId: string, description: string, requirements: any): Promise<void>;
    /**
     * 为学生生成并存储向量
     */
    indexStudent(studentId: string): Promise<void>;
    /**
     * 核心匹配函数：基于向量计算匹配度
     */
    matchTaskWithStudent(taskId: string, studentId: string): Promise<MatchResult>;
    /**
     * 维度1：技能匹配 (35%)
     */
    private calculateSkillMatchFromVectors;
    /**
     * 维度2：难度匹配 (20%) - 最近发展区理论
     */
    private calculateDifficultyMatchFromVectors;
    /**
     * 维度3：领域匹配 (15%) - 余弦相似度
     */
    private calculateDomainMatchFromVectors;
    /**
     * 维度4：成长潜力 (15%)
     */
    private calculateGrowthPotentialFromVectors;
    /**
     * 维度5：可靠性 (10%)
     */
    private extractReliabilityFromVector;
    /**
     * 维度6：偏好对齐 (5%)
     */
    private calculatePreferenceAlignment;
    /**
     * 余弦相似度
     */
    private cosineSimilarity;
    /**
     * 生成推荐
     */
    private generateRecommendation;
    /**
     * 批量匹配：为任务找到最合适的学生
     */
    findBestStudentsForTask(taskId: string, limit?: number): Promise<MatchResult[]>;
    /**
     * 批量匹配：为学生找到最合适的任务
     */
    findBestTasksForStudent(studentId: string, limit?: number): Promise<MatchResult[]>;
    /**
     * 批量索引所有任务
     */
    indexAllTasks(): Promise<void>;
    /**
     * 批量索引所有学生
     */
    indexAllStudents(): Promise<void>;
    /**
     * 兼容方法：保存匹配结果
     * 旧API兼容性
     */
    saveMatchResults(taskId: string, matchResults: MatchResult[]): Promise<void>;
}
declare const _default: SemanticMatchingEngine;
export default _default;
//# sourceMappingURL=semanticMatchingEngine.d.ts.map