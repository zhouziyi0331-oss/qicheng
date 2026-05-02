/**
 * AI Embedding 服务
 * 使用 Anthropic Claude 生成文本的向量表示
 */
export declare class EmbeddingService {
    private readonly anthropic;
    private readonly dimensions;
    constructor();
    /**
     * 使用Claude生成文本的语义向量表示
     */
    generateEmbedding(text: string): Promise<number[]>;
    /**
     * 批量生成 embeddings
     */
    generateEmbeddings(texts: string[]): Promise<number[][]>;
    /**
     * 为任务生成 embedding
     */
    generateTaskEmbedding(title: string, description: string): Promise<{
        titleEmbedding: number[];
        descriptionEmbedding: number[];
        combinedEmbedding: number[];
    }>;
    /**
     * 为学生生成 embedding
     */
    generateStudentEmbedding(profile: {
        skills?: string[];
        interests?: string[];
        bio?: string;
        completedTasks?: string[];
    }): Promise<{
        skillsEmbedding: number[];
        interestsEmbedding: number[];
        profileEmbedding: number[];
    }>;
    /**
     * 计算两个向量的余弦相似度
     */
    calculateCosineSimilarity(vec1: number[], vec2: number[]): number;
    /**
     * 简单的基于文本特征的embedding生成（降级方案）
     */
    private generateSimpleEmbedding;
    /**
     * 归一化向量
     */
    private normalizeVector;
}
export declare const embeddingService: EmbeddingService;
//# sourceMappingURL=embeddingService.d.ts.map