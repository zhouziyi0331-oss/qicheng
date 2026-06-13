import Anthropic from '@anthropic-ai/sdk';
import { queryOne } from '../utils/db';
import logger from '../utils/logger';
import reasoningEngine from './reasoningEngine';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/**
 * 个性化表达服务
 * 基于深度思考结果，生成个性化的、有温度的回复
 */

interface ExpressionContext {
  studentId: string;
  situation: string;
  question: string;
  taskId?: string;
}

interface PersonalizedResponse {
  thinking: any;  // 思考过程
  response: string;  // 最终回复
  tone: string;  // 语气
}

class PersonalizedExpressionService {
  /**
   * 生成个性化回复 - 核心方法
   */
  async generateResponse(context: ExpressionContext): Promise<PersonalizedResponse> {
    try {
      logger.info(`Generating personalized response for student ${context.studentId}`);

      // 第一步：深度思考
      const thinking = await reasoningEngine.think({
        studentId: context.studentId,
        question: context.question,
        currentSituation: context.situation,
        taskId: context.taskId
      });

      // 第二步：获取长期记忆
      const memory = await queryOne(
        `SELECT * FROM teacher_long_term_memory WHERE student_id = $1`,
        [context.studentId]
      );

      // 第三步：基于思考结果生成个性化表达
      const response = await this.express(thinking, memory, context);

      // 第四步：保存到短期记忆
      await this.saveToShortTermMemory(context.studentId, context, response);

      logger.info(`Generated personalized response for student ${context.studentId}`);

      return {
        thinking,
        response,
        tone: this.inferTone(thinking)
      };
    } catch (error: unknown) {
      logger.error('Failed to generate personalized response:', error);
      throw error;
    }
  }

  /**
   * 基于思考结果生成表达
   */
  private async express(thinking: any, memory: any, context: ExpressionContext): Promise<string> {
    try {
      const prompt = `你是启程老师，一位温暖、有洞察力的导师。

## 你刚刚完成的深度思考

**问题**：${thinking.question}

**你的理解**：${thinking.insight.understanding}

**根本原因**：${thinking.insight.rootCause}

**可操作建议**：${thinking.insight.actionable}

**推理过程**：${thinking.reasoning.reasoning}

## 你对这个学生的长期理解

${memory?.deep_understanding || '新学生，正在建立理解'}

**核心优势**：${memory?.core_strengths?.join('、') || '待观察'}
**工作风格**：${memory?.working_style || '待观察'}

## 当前情况

${context.situation}

## 你的任务

基于你的深度思考，用自然、温暖、个性化的语言回复学生。

**要求**：
1. **体现你对这个学生的了解**：不是泛泛的鼓励，而是具体到这个学生的情况
2. **基于你的推理结果**：不要直接给答案，而是引导学生自己思考
3. **语气要符合学生当前的情绪状态**：如果学生挫折，先共情；如果学生困惑，先澄清
4. **长度控制在100-150字**：简洁有力，不啰嗦
5. **用第一人称**："我注意到..."、"我觉得..."

**示例风格**（仅供参考，不要照抄）：
"我注意到你这次主动来问了——这很好，说明你在意这个任务。
你说'不知道客户要什么'，但我觉得你可能不是真的不懂。
你过去3次任务，客户都夸你'理解很准'。这次的区别是...
我猜你不是不懂，而是想确认方向再动手，对吧？"

直接输出你的回复（100-150字），不要其他解释：`;

      const response = await client.messages.create({
        model: 'claude-3-5-sonnet',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      return content.text.trim();
    } catch (error: unknown) {
      logger.error('Failed to express:', error);
      // 返回基于洞察的简单回复
      return `${thinking.insight.understanding}\n\n${thinking.insight.actionable}`;
    }
  }

  /**
   * 推断语气
   */
  private inferTone(thinking: any): string {
    const understanding = thinking.insight.understanding.toLowerCase();

    if (understanding.includes('挫折') || understanding.includes('困难')) {
      return 'empathetic';  // 共情
    } else if (understanding.includes('困惑') || understanding.includes('不确定')) {
      return 'clarifying';  // 澄清
    } else if (understanding.includes('进步') || understanding.includes('成长')) {
      return 'encouraging';  // 鼓励
    } else {
      return 'supportive';  // 支持
    }
  }

  /**
   * 保存到短期记忆
   */
  private async saveToShortTermMemory(
    studentId: string,
    context: ExpressionContext,
    response: string
  ): Promise<void> {
    try {
      await queryOne(
        `INSERT INTO teacher_short_term_memory (
          student_id, context, student_state, teacher_response
        ) VALUES ($1, $2, $3, $4)`,
        [
          studentId,
          JSON.stringify({
            situation: context.situation,
            question: context.question,
            taskId: context.taskId
          }),
          context.situation,
          response
        ]
      );
    } catch (error: unknown) {
      logger.error('Failed to save to short term memory:', error);
    }
  }

  /**
   * 快速回复（不需要深度思考的场景）
   */
  async quickResponse(
    studentId: string,
    situation: string,
    responseType: 'encouragement' | 'clarification' | 'acknowledgment'
  ): Promise<string> {
    try {
      const memory = await queryOne(
        `SELECT * FROM teacher_long_term_memory WHERE student_id = $1`,
        [studentId]
      );

      let prompt = '';

      if (responseType === 'encouragement') {
        prompt = `你是启程老师。学生刚刚完成了一个任务。

学生情况：${situation}
你对学生的了解：${memory?.deep_understanding || '新学生'}

给学生一句简短的鼓励（30字以内），要体现你对他的了解：`;
      } else if (responseType === 'clarification') {
        prompt = `你是启程老师。学生有些困惑。

学生情况：${situation}
你对学生的了解：${memory?.deep_understanding || '新学生'}

给学生一句简短的澄清（30字以内）：`;
      } else {
        prompt = `你是启程老师。学生刚刚做了某事。

学生情况：${situation}

给学生一句简短的回应（30字以内）：`;
      }

      const response = await client.messages.create({
        model: 'claude-3-5-sonnet',
        max_tokens: 150,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        return '收到，继续加油！';
      }

      return content.text.trim();
    } catch (error: unknown) {
      logger.error('Failed to generate quick response:', error);
      return '收到，继续加油！';
    }
  }
}

export default new PersonalizedExpressionService();
