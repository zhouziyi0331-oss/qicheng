/**
 * Claude API 服务
 * 提供统一的Claude API调用接口
 */

import Anthropic from '@anthropic-ai/sdk';
import logger from '../utils/logger';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeResponse {
  content: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

class ClaudeService {
  /**
   * 调用Claude API生成文本
   */
  async generateText(
    messages: ClaudeMessage[],
    options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      system?: string;
    }
  ): Promise<ClaudeResponse> {
    try {
      const response = await anthropic.messages.create({
        model: options?.model || 'claude-3-5-sonnet-20241022',
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature || 1.0,
        system: options?.system,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
      });

      const content = response.content[0].type === 'text'
        ? response.content[0].text
        : '';

      return {
        content,
        usage: {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens,
        },
      };
    } catch (error) {
      logger.error('Claude API调用失败:', error);
      throw error;
    }
  }

  /**
   * 简化的单次对话接口
   */
  async chat(
    prompt: string,
    options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      system?: string;
    }
  ): Promise<string> {
    const response = await this.generateText(
      [{ role: 'user', content: prompt }],
      options
    );
    return response.content;
  }
}

export const claudeService = new ClaudeService();
