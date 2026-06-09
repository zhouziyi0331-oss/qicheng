"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../../config");
const logger_1 = __importDefault(require("../utils/logger"));
class VectorEmbeddingService {
    constructor() {
        this.model = 'bge-large-zh-v1.5';
        // 从配置中读取Embedding API配置
        this.embeddingApiUrl = config_1.config.embedding?.apiUrl || process.env.EMBEDDING_API_URL || '';
        this.embeddingApiKey = config_1.config.embedding?.apiKey || process.env.EMBEDDING_API_KEY || '';
        if (!this.embeddingApiUrl) {
            logger_1.default.warn('Embedding API URL not configured, vector generation will be skipped');
        }
    }
    /**
     * 生成文本的向量表示
     */
    async generateEmbedding(text) {
        if (!this.embeddingApiUrl || !text) {
            logger_1.default.warn('Embedding API not configured or text is empty');
            return null;
        }
        try {
            logger_1.default.info(`Generating embedding for text (${text.length} chars)`);
            const response = await axios_1.default.post(this.embeddingApiUrl, {
                model: this.model,
                input: text
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.embeddingApiKey}`
                },
                timeout: 30000 // 30秒超时
            });
            if (response.data && response.data.embedding) {
                logger_1.default.info(`Embedding generated successfully, dimension: ${response.data.embedding.length}`);
                return response.data.embedding;
            }
            logger_1.default.error('Invalid embedding response format');
            return null;
        }
        catch (error) {
            logger_1.default.error('Failed to generate embedding:', {
                error: error.message,
                status: error.response?.status,
                data: error.response?.data
            });
            return null;
        }
    }
    /**
     * 批量生成向量
     */
    async generateEmbeddings(texts) {
        if (!this.embeddingApiUrl || texts.length === 0) {
            return texts.map(() => null);
        }
        try {
            logger_1.default.info(`Generating embeddings for ${texts.length} texts`);
            // 如果API支持批量，可以一次性发送
            // 这里为了稳定性，逐个生成
            const embeddings = [];
            for (const text of texts) {
                const embedding = await this.generateEmbedding(text);
                embeddings.push(embedding);
                // 避免请求过快
                await this.sleep(100);
            }
            return embeddings;
        }
        catch (error) {
            logger_1.default.error('Failed to generate embeddings:', error);
            return texts.map(() => null);
        }
    }
    /**
     * 生成学生工作条件画像的向量
     */
    async generateStudentProfileVector(profileText) {
        logger_1.default.info('Generating vector for student work condition profile');
        return this.generateEmbedding(profileText);
    }
    /**
     * 生成项目需求条件画像的向量
     */
    async generateProjectRequirementVector(requirementText) {
        logger_1.default.info('Generating vector for project requirement profile');
        return this.generateEmbedding(requirementText);
    }
    /**
     * 计算两个向量的余弦相似度
     * 注意：这是在应用层计算，实际使用时应该用数据库的向量运算
     */
    calculateCosineSimilarity(vec1, vec2) {
        if (vec1.length !== vec2.length) {
            throw new Error('Vectors must have the same dimension');
        }
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;
        for (let i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            norm1 += vec1[i] * vec1[i];
            norm2 += vec2[i] * vec2[i];
        }
        norm1 = Math.sqrt(norm1);
        norm2 = Math.sqrt(norm2);
        if (norm1 === 0 || norm2 === 0) {
            return 0;
        }
        return dotProduct / (norm1 * norm2);
    }
    /**
     * 检查Embedding API是否可用
     */
    async checkApiHealth() {
        if (!this.embeddingApiUrl) {
            return false;
        }
        try {
            // 尝试生成一个简单的向量
            const testEmbedding = await this.generateEmbedding('测试');
            return testEmbedding !== null && testEmbedding.length > 0;
        }
        catch (error) {
            logger_1.default.error('Embedding API health check failed:', error);
            return false;
        }
    }
    /**
     * 辅助方法：延迟
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * 获取配置状态
     */
    getConfigStatus() {
        return {
            configured: !!this.embeddingApiUrl,
            apiUrl: this.embeddingApiUrl ? '***configured***' : 'not configured',
            model: this.model
        };
    }
}
exports.default = new VectorEmbeddingService();
//# sourceMappingURL=vectorEmbeddingService.js.map