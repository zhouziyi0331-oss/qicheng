import Anthropic from '@anthropic-ai/sdk';
import { config } from '../../config';
import logger from '../utils/logger';

/**
 * AI Embedding 服务
 * 使用 Anthropic Claude 生成文本的向量表示
 */
export class EmbeddingService {
  private readonly anthropic: Anthropic;
  private readonly dimensions: number = 1536;

  constructor() {
    const apiKey = config.ai.anthropicApiKey || process.env.ANTHROPIC_API_KEY || '';
    if (!apiKey) {
      logger.warn('No Anthropic API key configured, embedding generation will fail');
    }
    this.anthropic = new Anthropic({ apiKey });
  }

  /**
   * 使用Claude生成文本的语义向量表示
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // 使用Claude分析文本并生成结构化的语义特征
      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `分析以下文本的语义特征，为每个维度打分(0-1)：
技术复杂度、创意程度、商业价值、时间紧迫度、协作需求、学习成长、行业相关性、用户影响。
只返回8个数字，用逗号分隔，不要其他内容。

文本：${text.substring(0, 500)}`
        }]
      });

      const content = message.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      // 解析Claude返回的分数
      const scores = content.text.trim().split(',').map(s => parseFloat(s.trim()));

      if (scores.length !== 8 || scores.some(isNaN)) {
        logger.warn('Invalid scores from Claude, using fallback', { scores, text: text.substring(0, 100) });
        return this.generateSimpleEmbedding(text);
      }

      // 扩展到1536维
      const embedding: number[] = [];
      for (let i = 0; i < this.dimensions; i++) {
        const baseScore = scores[i % 8];
        const noise = (Math.random() - 0.5) * 0.1;
        embedding.push(Math.max(0, Math.min(1, baseScore + noise)));
      }

      return this.normalizeVector(embedding);
    } catch (error) {
      logger.error('Error generating embedding with Claude', { error, text: text.substring(0, 100) });
      return this.generateSimpleEmbedding(text);
    }
  }

  /**
   * 批量生成 embeddings
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    for (const text of texts) {
      results.push(await this.generateEmbedding(text));
    }
    return results;
  }

  /**
   * 为任务生成 embedding
   */
  async generateTaskEmbedding(title: string, description: string): Promise<{
    titleEmbedding: number[];
    descriptionEmbedding: number[];
    combinedEmbedding: number[];
  }> {
    const combined = `任务标题：${title}\n任务描述：${description}`;
    const [titleEmbedding, descriptionEmbedding, combinedEmbedding] = await Promise.all([
      this.generateEmbedding(title),
      this.generateEmbedding(description),
      this.generateEmbedding(combined),
    ]);

    return { titleEmbedding, descriptionEmbedding, combinedEmbedding };
  }

  /**
   * 为学生生成 embedding
   */
  async generateStudentEmbedding(profile: {
    skills?: string[];
    interests?: string[];
    bio?: string;
    completedTasks?: string[];
  }): Promise<{
    skillsEmbedding: number[];
    interestsEmbedding: number[];
    profileEmbedding: number[];
  }> {
    const skillsText = profile.skills?.join(', ') || '暂无技能信息';
    const interestsText = profile.interests?.join(', ') || '暂无兴趣信息';
    const profileText = `
      技能：${skillsText}
      兴趣：${interestsText}
      简介：${profile.bio || '暂无'}
      完成任务：${profile.completedTasks?.join(', ') || '暂无'}
    `.trim();

    const [skillsEmbedding, interestsEmbedding, profileEmbedding] = await Promise.all([
      this.generateEmbedding(skillsText),
      this.generateEmbedding(interestsText),
      this.generateEmbedding(profileText),
    ]);

    return { skillsEmbedding, interestsEmbedding, profileEmbedding };
  }

  /**
   * 计算两个向量的余弦相似度
   */
  calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * 简单的基于文本特征的embedding生成（降级方案）
   */
  private generateSimpleEmbedding(text: string): number[] {
    const embedding: number[] = [];
    const normalized = text.toLowerCase();

    for (let i = 0; i < this.dimensions; i++) {
      const charCode = normalized.charCodeAt(i % normalized.length) || 0;
      const value = (charCode / 255) * Math.sin(i * 0.1) * Math.cos(text.length * 0.01);
      embedding.push(value);
    }

    return this.normalizeVector(embedding);
  }

  /**
   * 归一化向量
   */
  private normalizeVector(vec: number[]): number[] {
    const magnitude = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? vec.map(val => val / magnitude) : vec;
  }
}

export const embeddingService = new EmbeddingService();
