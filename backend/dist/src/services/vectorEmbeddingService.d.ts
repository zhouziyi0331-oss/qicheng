declare class VectorEmbeddingService {
    private embeddingApiUrl;
    private embeddingApiKey;
    private model;
    constructor();
    /**
     * 生成文本的向量表示
     */
    generateEmbedding(text: string): Promise<number[] | null>;
    /**
     * 批量生成向量
     */
    generateEmbeddings(texts: string[]): Promise<(number[] | null)[]>;
    /**
     * 生成学生工作条件画像的向量
     */
    generateStudentProfileVector(profileText: string): Promise<number[] | null>;
    /**
     * 生成项目需求条件画像的向量
     */
    generateProjectRequirementVector(requirementText: string): Promise<number[] | null>;
    /**
     * 计算两个向量的余弦相似度
     * 注意：这是在应用层计算，实际使用时应该用数据库的向量运算
     */
    calculateCosineSimilarity(vec1: number[], vec2: number[]): number;
    /**
     * 检查Embedding API是否可用
     */
    checkApiHealth(): Promise<boolean>;
    /**
     * 辅助方法：延迟
     */
    private sleep;
    /**
     * 获取配置状态
     */
    getConfigStatus(): {
        configured: boolean;
        apiUrl: string;
        model: string;
    };
}
declare const _default: VectorEmbeddingService;
export default _default;
//# sourceMappingURL=vectorEmbeddingService.d.ts.map