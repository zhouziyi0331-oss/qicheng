import axios from 'axios';
import { config } from '../../config';
import logger from '../utils/logger';

/**
 * 向量生成服务
 * 调用 BGE-large-zh-v1.5 Embedding API 生成1024维向量
 */

interface EmbeddingResponse {
  embedding: number[];
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

class VectorEmbeddingService {
  private embeddingApiUrl: string;
  private embeddingApiKey: string;
  private model: string = 'bge-large-zh-v1.5';

  constructor() {
    // 从配置中读取Embedding API配置
    this.embeddingApiUrl = config.embedding?.apiUrl || process.env.EMBEDDING_API_URL || '';
    this.embeddingApiKey = config.embedding?.apiKey || process.env.EMBEDDING_API_KEY || '';

    if (!this.embeddingApiUrl) {
      logger.warn('Embedding API URL not configured, vector generation will be skipped');
    }
  }

  /**
   * 生成文本的向量表示
   */
  async generateEmbedding(text: string): Promise<number[] | null> {
    if (!this.embeddingApiUrl || !text) {
      logger.warn('Embedding API not configured or text is empty');
      return null;
    }

    try {
      logger.info(`Generating embedding for text (${text.length} chars)`);

      const response = await axios.post<EmbeddingResponse>(
        this.embeddingApiUrl,
        {
          model: this.model,
          input: text
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.embeddingApiKey}`
          },
          timeout: 30000 // 30秒超时
        }
      );

      if (response.data && response.data.embedding) {
        logger.info(`Embedding generated successfully, dimension: ${response.data.embedding.length}`);
        return response.data.embedding;
      }

      logger.error('Invalid embedding response format');
      return null;

    } catch (error: any) {
      logger.error('Failed to generate embedding:', {
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
  async generateEmbeddings(texts: string[]): Promise<(number[] | null)[]> {
    if (!this.embeddingApiUrl || texts.length === 0) {
      return texts.map(() => null);
    }

    try {
      logger.info(`Generating embeddings for ${texts.length} texts`);

      // 如果API支持批量，可以一次性发送
      // 这里为了稳定性，逐个生成
      const embeddings: (number[] | null)[] = [];

      for (const text of texts) {
        const embedding = await this.generateEmbedding(text);
        embeddings.push(embedding);

        // 避免请求过快
        await this.sleep(100);
      }

      return embeddings;

    } catch (error: any) {
      logger.error('Failed to generate embeddings:', error);
      return texts.map(() => null);
    }
  }

  /**
   * 生成学生工作条件画像的向量
   */
  async generateStudentProfileVector(profileText: string): Promise<number[] | null> {
    logger.info('Generating vector for student work condition profile');
    return this.generateEmbedding(profileText);
  }

  /**
   * 生成项目需求条件画像的向量
   */
  async generateProjectRequirementVector(requirementText: string): Promise<number[] | null> {
    logger.info('Generating vector for project requirement profile');
    return this.generateEmbedding(requirementText);
  }

  /**
   * 计算两个向量的余弦相似度
   * 注意：这是在应用层计算，实际使用时应该用数据库的向量运算
   */
  calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
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
  async checkApiHealth(): Promise<boolean> {
    if (!this.embeddingApiUrl) {
      return false;
    }

    try {
      // 尝试生成一个简单的向量
      const testEmbedding = await this.generateEmbedding('测试');
      return testEmbedding !== null && testEmbedding.length > 0;
    } catch (error: unknown) {
      logger.error('Embedding API health check failed:', error);
      return false;
    }
  }

  /**
   * 辅助方法：延迟
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取配置状态
   */
  getConfigStatus(): {
    configured: boolean;
    apiUrl: string;
    model: string;
  } {
    return {
      configured: !!this.embeddingApiUrl,
      apiUrl: this.embeddingApiUrl ? '***configured***' : 'not configured',
      model: this.model
    };
  }
}

export default new VectorEmbeddingService();
