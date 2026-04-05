import Anthropic from '@anthropic-ai/sdk';
import logger from './logger';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/**
 * 智能检测任务提交是否合格
 * 根据任务要求、验收标准、提交内容进行AI分析
 */
export async function reviewTaskSubmission(
  taskTitle: string,
  taskDescription: string,
  acceptanceCriteria: string,
  submissionNote: string,
  fileUrls: string[]
): Promise<{
  isQualified: boolean;
  score: number;
  feedback: string;
  issues: string[];
  highlights: string[];
}> {
  // 开发模式或未配置API Key：使用规则引擎
  if (process.env.NODE_ENV === 'development' || !process.env.ANTHROPIC_API_KEY) {
    return reviewSubmissionRuleBased(
      taskDescription,
      acceptanceCriteria,
      submissionNote,
      fileUrls
    );
  }

  try {
    const prompt = `
你是启程平台的任务验收顾问，帮助企业判断学生提交的任务是否合格。

## 任务信息
标题: ${taskTitle}
描述: ${taskDescription}

## 验收标准
${acceptanceCriteria}

## 学生提交
说明: ${submissionNote}
附件数量: ${fileUrls.length}个文件
${fileUrls.length > 0 ? '附件列表:\n' + fileUrls.map((url, i) => `${i + 1}. ${url}`).join('\n') : ''}

## 评估要求
1. 检查是否满足验收标准的所有要点
2. 评估提交内容的完整性和质量
3. 识别明显的问题或不足
4. 发现值得表扬的亮点

请返回JSON格式：
{
  "is_qualified": <true/false，是否合格>,
  "score": <60-100的评分，不合格给60-69>,
  "feedback": "<综合评价，100字以内>",
  "issues": ["<问题1>", "<问题2>", ...],
  "highlights": ["<亮点1>", "<亮点2>", ...]
}

注意：
1. 如果缺少关键交付物，is_qualified应为false
2. 如果只是小瑕疵，可以合格但扣分
3. feedback应该具体、建设性
4. 每项不超过30字
`;

    const response = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
    const result = JSON.parse(text);

    return {
      isQualified: result.is_qualified !== false, // 默认合格
      score: Math.max(60, Math.min(100, result.score || 80)),
      feedback: result.feedback || '提交内容符合基本要求',
      issues: result.issues || [],
      highlights: result.highlights || [],
    };
  } catch (err) {
    logger.error('AI review failed, using rule-based', { error: (err as Error).message });
    return reviewSubmissionRuleBased(
      taskDescription,
      acceptanceCriteria,
      submissionNote,
      fileUrls
    );
  }
}

/**
 * 基于规则的验收检测（降级方案）
 */
function reviewSubmissionRuleBased(
  taskDescription: string,
  acceptanceCriteria: string,
  submissionNote: string,
  fileUrls: string[]
): {
  isQualified: boolean;
  score: number;
  feedback: string;
  issues: string[];
  highlights: string[];
} {
  const issues: string[] = [];
  const highlights: string[] = [];
  let score = 80;

  // 检查提交说明长度
  if (submissionNote.length < 20) {
    issues.push('提交说明过于简短');
    score -= 5;
  } else if (submissionNote.length > 100) {
    highlights.push('提交说明详细');
    score += 5;
  }

  // 检查附件
  if (fileUrls.length === 0) {
    issues.push('未提交任何附件');
    score -= 10;
  } else if (fileUrls.length >= 3) {
    highlights.push('提交了多个附件');
    score += 5;
  }

  // 检查关键词匹配
  const keywords = extractKeywords(acceptanceCriteria);
  const matchedKeywords = keywords.filter(kw =>
    submissionNote.toLowerCase().includes(kw.toLowerCase())
  );

  if (matchedKeywords.length < keywords.length / 2) {
    issues.push('提交内容与要求关联度较低');
    score -= 10;
  } else if (matchedKeywords.length === keywords.length) {
    highlights.push('覆盖了所有关键要求');
    score += 10;
  }

  // 确保分数在合理范围
  score = Math.max(60, Math.min(100, score));

  return {
    isQualified: score >= 70 && issues.length < 3,
    score,
    feedback: issues.length > 0
      ? `发现${issues.length}个问题，建议修改后重新提交`
      : '提交内容基本符合要求，质量良好',
    issues,
    highlights,
  };
}

/**
 * 提取验收标准中的关键词
 */
function extractKeywords(criteria: string): string[] {
  const keywords: string[] = [];

  // 简单的关键词提取
  const commonWords = ['需要', '必须', '应该', '包含', '完成', '提供', '确保'];
  const lines = criteria.split(/[。\n]/);

  for (const line of lines) {
    for (const word of commonWords) {
      const idx = line.indexOf(word);
      if (idx !== -1) {
        // 提取关键词后面的内容
        const after = line.slice(idx + word.length).trim();
        const match = after.match(/^[\u4e00-\u9fa5a-zA-Z0-9]{2,10}/);
        if (match) keywords.push(match[0]);
      }
    }
  }

  return [...new Set(keywords)]; // 去重
}
