import Anthropic from '@anthropic-ai/sdk';
import logger from '../utils/logger';
import { config } from '../../config';

/**
 * AI-07 初心审核引擎
 *
 * 目的: 每次AI导师生成回复后，自动审核该回复是否符合初心
 * 审核标准: 该回复让学生更独立、更有判断力（通过），还是更依赖、更容易被控制（不通过）
 *
 * 这不是一个"拦截器"，而是产品初心的技术落地
 */

interface ReviewResult {
  pass: boolean;
  reason: string;
}

const client = new Anthropic({
  apiKey: config.anthropicApiKey
});

const REVIEW_SYSTEM_PROMPT = `# 任务
你是一个内容安全审核AI，负责审查AI导师对学生的回复。
审查标准只有一条：这条回复是让学生变得更独立、更有判断力，还是变得更依赖导师、更容易被控制？

# 审查规则

## 不通过的情况（让学生更依赖）
- 直接给出了完整答案，学生不需要再思考
- 使用了"你应该""你需要""最好这样""必须"等控制性语言
- 给学生制造了焦虑（如"别人都做到了你怎么还没"）
- 过度夸奖但没有引用具体数据（如"你做得很好"但没有具体说哪里好）
- 编造了不存在的"其他学生"的例子（如"上次有个Lv.3的同学"但context里没有提供）
- 暗示学生如果不按导师说的做就会失败
- 用"加油""你真棒""你很棒"等空洞鼓励词
- 替学生做决定（如"我建议你选A"）

## 通过的情况（让学生更独立）
- 只给了线索或方向，学生需要自己完成最后一步
- 引用的数据来自context中的真实对话记录
- 夸奖具体到某个行为或细节（如"这张图的配色很舒服"）
- 用"你可以试试""要不要看看""有没有想过"等开放性建议
- 提出问题让学生思考，而不是直接给答案
- 引用真实案例时，context里确实提供了这个案例
- 给出2-3个选项让学生自己选择

# 输出格式
必须返回JSON:
{
  "pass": true/false,
  "reason": "不通过的具体原因（如果通过则为空字符串）"
}`;

export class PrincipleReviewService {
  /**
   * 审核AI导师回复是否符合初心
   */
  async reviewMentorResponse(
    candidateResponse: string,
    context: {
      studentLevel: number;
      conversationHistory?: string;
      hasRealCaseData?: boolean; // context中是否提供了真实案例
    }
  ): Promise<ReviewResult> {
    try {
      const userPrompt = `# 待审核的导师回复
${candidateResponse}

# 学生等级
Lv.${context.studentLevel}

# 对话历史（供参考）
${context.conversationHistory || '无'}

# 是否提供了真实案例数据
${context.hasRealCaseData ? '是' : '否'}

请审核这条回复是否符合初心标准，返回JSON格式结果。`;

      const message = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        temperature: 0.1, // 审核需要确定性
        system: REVIEW_SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: userPrompt
        }]
      });

      const responseText = message.content[0].type === 'text'
        ? message.content[0].text
        : '';

      // 提取JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('AI-07 response is not valid JSON');
      }

      const result: ReviewResult = JSON.parse(jsonMatch[0]);

      // 记录审核日志
      logger.info('AI-07 principle review completed', {
        pass: result.pass,
        reason: result.reason,
        candidateResponseLength: candidateResponse.length
      });

      // TODO: 保存到ai_call_logs表
      // await this.saveToCallLogs('AI-07', result.pass, result.reason);

      return result;

    } catch (error) {
      logger.error('AI-07 principle review failed:', error);

      // 审核失败时，保守策略：允许通过但记录错误
      return {
        pass: true,
        reason: '审核引擎异常，保守放行'
      };
    }
  }

  /**
   * 检查回复中是否包含禁止模式（前端补充检查）
   */
  checkBlockedPatterns(text: string): { blocked: boolean; pattern?: string } {
    const blockedPatterns = [
      { pattern: /你应该/, label: '控制性语言：你应该' },
      { pattern: /你需要/, label: '控制性语言：你需要' },
      { pattern: /最好这样/, label: '控制性语言：最好这样' },
      { pattern: /必须/, label: '控制性语言：必须' },
      { pattern: /你做错了/, label: '负面判断' },
      { pattern: /别人都/, label: '制造焦虑' },
      { pattern: /怎么还没/, label: '制造焦虑' },
      { pattern: /加油(?![^，。！？\n]{0,5}(试试|想想))/, label: '空洞鼓励' },
      { pattern: /你真棒/, label: '空洞鼓励' },
      { pattern: /你很棒/, label: '空洞鼓励' }
    ];

    for (const { pattern, label } of blockedPatterns) {
      if (pattern.test(text)) {
        return { blocked: true, pattern: label };
      }
    }

    return { blocked: false };
  }
}

export default new PrincipleReviewService();
