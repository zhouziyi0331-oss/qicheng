export declare class VectorGenerationService {
    /**
     * 生成任务向量 (完全基于特征工程，不调用OpenAI)
     * 向量维度: 64 + 7 + 1 + 1 + 1 + 10 + 1 + 1 = 86维
     */
    generateTaskVector(taskDescription: string, requirements: any): Promise<number[]>;
    /**
     * 生成学生向量 (完全基于特征工程)
     * 向量维度: 64 + 7 + 1 + 1 + 1 + 1 + 1 + 1 = 77维
     */
    generateStudentVector(studentId: string): Promise<number[]>;
    /**
     * 提取技能向量 (64维)
     */
    private extractSkillVector;
    /**
     * 提取领域向量 (7维)
     */
    private extractDomainVector;
    /**
     * 计算难度分数
     */
    private calculateDifficultyScore;
    /**
     * 计算复杂度分数
     */
    private calculateComplexityScore;
    /**
     * 估算时间
     */
    private estimateTime;
    /**
     * 提取交付物类型向量 (10维)
     */
    private extractDeliverableType;
    /**
     * 计算技能熟练度向量 (64维)
     */
    private calculateSkillProficiencyVector;
    /**
     * 计算领域经验向量 (7维)
     */
    private calculateDomainExperienceVector;
    /**
     * 计算学习速度
     */
    private calculateLearningSpeed;
    /**
     * 计算可靠性
     */
    private calculateReliability;
    private countSkills;
    private countTools;
    private countSteps;
    /**
     * 兼容方法：更新任务向量
     * 旧API兼容性
     */
    updateTaskEmbedding(taskId: string): Promise<void>;
    /**
     * 兼容方法：更新学生向量
     * 旧API兼容性
     */
    updateStudentEmbedding(studentId: string): Promise<void>;
}
declare const _default: VectorGenerationService;
export default _default;
//# sourceMappingURL=vectorGenerationService.d.ts.map