/**
 * 混合匹配服务：规则匹配 + AI向量匹配
 * 结合传统规则评分和AI语义相似度，提供更智能的匹配
 */
export declare class HybridMatchingService {
    /**
     * 混合匹配：为任务匹配学生
     * @param taskId 任务ID
     * @param topN 返回前N个匹配结果
     * @param useAI 是否启用AI向量匹配（默认true）
     */
    matchStudentsForTask(taskId: string | number, topN?: number, useAI?: boolean): Promise<any[]>;
    /**
     * 混合匹配：为学生推荐任务
     */
    matchTasksForStudent(userId: string | number, topN?: number, useAI?: boolean): Promise<any[]>;
    /**
     * 规则匹配算法（保留原有逻辑）
     */
    private calculateRuleBasedScore;
    /**
     * 计算单项能力匹配分数
     */
    private calculateAbilityScore;
    /**
     * 保存匹配日志
     */
    private saveMatchLogs;
    /**
     * 为任务生成并保存 embedding
     */
    generateTaskEmbedding(taskId: string | number): Promise<void>;
    /**
     * 为学生生成并保存 embedding
     */
    generateStudentEmbedding(userId: string | number): Promise<void>;
}
export declare const hybridMatchingService: HybridMatchingService;
//# sourceMappingURL=hybridMatchingService.d.ts.map