interface TaskVectors {
    titleEmbedding: number[];
    descriptionEmbedding: number[];
    combinedEmbedding: number[];
}
interface StudentVectors {
    skillVector: number[];
    trajectoryVector: number[];
    qualityVector: number[];
    preferenceVector: number[];
    combinedVector: number[];
}
/**
 * 向量生成服务
 * 使用Claude API生成任务和学生的embedding向量
 */
declare class VectorGenerationService {
    private embeddingCache;
    private readonly CACHE_TTL;
    /**
     * 生成文本的embedding向量
     * 使用BGE-large-zh-v1.5模型（1024维中文语义向量）
     */
    private generateEmbedding;
    /**
     * Fallback方法：简化的TF-IDF向量化（当Embedding API不可用时）
     */
    private textToVectorFallback;
    /**
     * 简单的字符串哈希函数
     */
    private simpleHash;
    /**
     * 生成任务向量
     */
    generateTaskVectors(taskId: string): Promise<TaskVectors>;
    /**
     * 生成学生能力画像摘要（自然语言描述，不是标签）
     */
    generateStudentProfileSummary(studentId: string): Promise<string>;
    /**
     * 生成学生向量（旧方法，保留用于兼容）
     */
    generateStudentVectors(studentId: string): Promise<StudentVectors>;
    /**
     * 更新任务embedding到数据库
     */
    /**
     * 更新任务向量到数据库
     * 使用结构化的项目需求摘要生成向量，确保与学生画像摘要在同一语义空间
     */
    updateTaskEmbedding(taskId: string): Promise<void>;
    /**
     * 更新学生向量到数据库
     * 使用结构化的能力画像摘要生成向量，确保与项目需求摘要在同一语义空间
     */
    updateStudentEmbedding(studentId: string): Promise<void>;
    /**
     * 批量更新所有任务的embedding
     */
    updateAllTaskEmbeddings(): Promise<void>;
    /**
     * 批量更新所有学生的embedding
     */
    updateAllStudentEmbeddings(): Promise<void>;
    /**
     * 计算两个向量的余弦相似度
     */
    cosineSimilarity(vecA: number[], vecB: number[]): number;
}
declare const _default: VectorGenerationService;
export default _default;
//# sourceMappingURL=vectorGenerationService.d.ts.map