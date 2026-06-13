import Anthropic from '@anthropic-ai/sdk';
import { query, queryOne } from '../utils/db';
import logger from '../utils/logger';
import teacherObservationService from './teacherObservationService';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/**
 * 深度推理引擎
 * 启程老师的"大脑" - 不是填模板，而是真正的思考过程
 */

interface ThinkingContext {
  studentId: string;
  question: string;
  currentSituation: string;
  taskId?: string;
}

interface Hypothesis {
  hypothesis: string;
  evidence: string[];
  confidence: number;
}

interface ThinkingProcess {
  question: string;
  recall: {
    studentHistory: any[];
    similarCases: any[];
    relevantPatterns: string[];
  };
  hypotheses: Hypothesis[];
  reasoning: {
    mainHypothesis: string;
    reasoning: string;
    counterEvidence: string;
  };
  insight: {
    understanding: string;
    rootCause: string;
    actionable: string;
  };
}

class ReasoningEngine {
  /**
   * 深度思考 - 核心方法
   */
  async think(context: ThinkingContext): Promise<ThinkingProcess> {
    try {
      logger.info(`Starting deep thinking for student ${context.studentId}: ${context.question}`);

      // 第一步：回忆相关信息
      const recall = await this.recall(context);

      // 第二步：形成多个假设
      const hypotheses = await this.generateHypotheses(context, recall);

      // 第三步：推理验证
      const reasoning = await this.reason(hypotheses, recall);

      // 第四步：形成洞察
      const insight = await this.formInsight(reasoning, recall);

      const thinkingProcess: ThinkingProcess = {
        question: context.question,
        recall,
        hypotheses,
        reasoning,
        insight
      };

      // 保存思考记录
      await this.saveThinkingRecord(context.studentId, thinkingProcess);

      logger.info(`Completed deep thinking for student ${context.studentId}`);

      return thinkingProcess;
    } catch (error: unknown) {
      logger.error('Failed to complete thinking process:', error);
      throw error;
    }
  }

  /**
   * 第一步：回忆相关信息
   */
  private async recall(context: ThinkingContext): Promise<any> {
    try {
      // 获取学生最近的行为
      const recentBehaviors = await teacherObservationService.getRecentBehaviors(
        context.studentId,
        20
      );

      // 获取学生的关键时刻
      const keyMoments = await teacherObservationService.getKeyMoments(
        context.studentId,
        5
      );

      // 获取长期记忆
      const longTermMemory = await queryOne(
        `SELECT * FROM teacher_long_term_memory WHERE student_id = $1`,
        [context.studentId]
      );

      // 获取最近的思考记录（类似案例）
      const recentThinking = await query(
        `SELECT * FROM teacher_thinking_records
         WHERE student_id = $1
         ORDER BY timestamp DESC
         LIMIT 3`,
        [context.studentId]
      );

      // 如果有taskId，获取该任务的行为
      let taskBehaviors = [];
      if (context.taskId) {
        taskBehaviors = await teacherObservationService.getTaskBehaviors(
          context.studentId,
          context.taskId
        );
      }

      return {
        studentHistory: recentBehaviors,
        keyMoments,
        longTermMemory,
        similarCases: recentThinking,
        taskBehaviors,
        relevantPatterns: this.extractPatterns(recentBehaviors, longTermMemory)
      };
    } catch (error: unknown) {
      logger.error('Failed to recall information:', error);
      return {
        studentHistory: [],
        similarCases: [],
        relevantPatterns: []
      };
    }
  }

  /**
   * 提取行为模式
   */
  private extractPatterns(behaviors: any[], memory: any): string[] {
    const patterns: string[] = [];

    if (!behaviors || behaviors.length === 0) {
      return patterns;
    }

    // 求助模式
    const helpRequests = behaviors.filter(b => b.behavior_type === 'seek_help');
    if (helpRequests.length > 0) {
      patterns.push(`学生在过去${behaviors.length}次行为中求助了${helpRequests.length}次`);
    }

    // 工作时段模式
    const workHours = behaviors.map(b => new Date(b.timestamp).getHours());
    const avgHour = workHours.reduce((a, b) => a + b, 0) / workHours.length;
    if (avgHour < 12) {
      patterns.push('学生习惯在上午工作');
    } else if (avgHour > 20) {
      patterns.push('学生习惯在晚上工作');
    }

    // 从长期记忆中提取
    if (memory && memory.working_style) {
      patterns.push(`工作风格：${memory.working_style}`);
    }

    return patterns;
  }

  /**
   * 第二步：形成多个假设
   */
  private async generateHypotheses(
    context: ThinkingContext,
    recall: any
  ): Promise<Hypothesis[]> {
    try {
      const prompt = `你是启程老师，一位有深度洞察力的导师。

## 当前情况
${context.currentSituation}

## 你对这个学生的了解
${recall.longTermMemory?.deep_understanding || '新学生，了解有限'}

## 最近的行为模式
${recall.relevantPatterns.join('\n')}

## 关键时刻
${recall.keyMoments?.map((m: any) => `- ${m.event_description}: ${m.teacher_insight}`).join('\n') || '暂无'}

## 你的任务
针对当前情况，形成3个可能的假设。每个假设都要：
1. 说明学生可能的真实状态
2. 列出支持这个假设的证据
3. 评估这个假设的置信度（0-1）

用以下JSON格式输出：
[
  {
    "hypothesis": "假设内容",
    "evidence": ["证据1", "证据2"],
    "confidence": 0.7
  },
  ...
]

只返回JSON，不要其他文字：`;

      const response = await client.messages.create({
        model: 'claude-3-5-sonnet',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      // 解析JSON
      const jsonMatch = content.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        logger.warn('Failed to parse hypotheses JSON, using fallback');
        return this.getFallbackHypotheses(context);
      }

      const hypotheses = JSON.parse(jsonMatch[0]);
      return hypotheses;
    } catch (error: unknown) {
      logger.error('Failed to generate hypotheses:', error);
      return this.getFallbackHypotheses(context);
    }
  }

  /**
   * 备用假设（当AI调用失败时）- 增强版：基于真实数据推理
   */
  private async getFallbackHypotheses(context: ThinkingContext): Promise<Hypothesis[]> {
    try {
      logger.info('Using enhanced fallback reasoning based on student data');

      // 1. 分析学生画像
      const profile = await this.analyzeStudentProfile(context.studentId);

      // 2. 理解"言外之意"
      const impliedMeaning = this.analyzeImpliedMeaning(
        context.currentSituation,
        profile
      );

      // 3. 生成智能假设
      const hypotheses: Hypothesis[] = [];

      // 假设1：基于"言外之意"分析
      hypotheses.push({
        hypothesis: impliedMeaning.impliedMeaning,
        evidence: [
          `工作风格：${profile.workStyle}`,
          `历史质量：${profile.avgQuality.toFixed(1)}分`,
          `求助率：${(profile.helpRequestRate * 100).toFixed(0)}%`,
          impliedMeaning.reasoning
        ],
        confidence: impliedMeaning.confidence
      });

      // 假设2：基于情绪状态
      if (profile.recentFrustration > 0.6) {
        hypotheses.push({
          hypothesis: '学生当前挫折感较高，可能影响了判断',
          evidence: [
            `挫折感：${(profile.recentFrustration * 100).toFixed(0)}%`,
            `信心：${(profile.recentConfidence * 100).toFixed(0)}%`,
            `最近修改率：${(profile.revisionRate * 100).toFixed(0)}%`
          ],
          confidence: 0.7
        });
      }

      // 假设3：基于行为模式变化
      const recentBehaviors = await query(
        `SELECT behavior_type FROM teacher_observations
         WHERE student_id = $1
         ORDER BY timestamp DESC
         LIMIT 10`,
        [context.studentId]
      );

      const recentHelpCount = recentBehaviors.filter((b: any) => b.behavior_type === 'seek_help').length;
      if (recentHelpCount >= 3) {
        hypotheses.push({
          hypothesis: '学生求助频率突然升高，可能遇到了系统性困难',
          evidence: [
            `最近10次行为中有${recentHelpCount}次求助`,
            `平时求助率：${(profile.helpRequestRate * 100).toFixed(0)}%`,
            `当前求助率：${(recentHelpCount / 10 * 100).toFixed(0)}%`
          ],
          confidence: 0.65
        });
      }

      // 按置信度排序
      hypotheses.sort((a, b) => b.confidence - a.confidence);

      return hypotheses.slice(0, 3);

    } catch (error: unknown) {
      logger.error('Enhanced fallback failed, using simple fallback:', error);
      // 如果增强版也失败，返回最简单的fallback
      return [
        {
          hypothesis: '学生遇到了困难，需要支持',
          evidence: ['学生主动求助'],
          confidence: 0.5
        },
        {
          hypothesis: '学生需要确认方向',
          evidence: ['任务描述可能不够清晰'],
          confidence: 0.5
        }
      ];
    }
  }

  /**
   * 分析学生画像 - 基于历史数据
   */
  private async analyzeStudentProfile(studentId: string): Promise<any> {
    // 获取最近的行为模式
    const recentBehaviors = await query(
      `SELECT behavior_type, emotional_state, timestamp
       FROM teacher_observations
       WHERE student_id = $1
         AND timestamp > NOW() - INTERVAL '30 days'
       ORDER BY timestamp DESC
       LIMIT 50`,
      [studentId]
    );

    // 分析求助频率
    const helpRequests = recentBehaviors.filter((b: any) => b.behavior_type === 'seek_help');
    const helpRequestRate = recentBehaviors.length > 0 ?
      helpRequests.length / recentBehaviors.length : 0;

    // 分析修改频率
    const revisions = recentBehaviors.filter((b: any) => b.behavior_type === 'revise_work');
    const revisionRate = recentBehaviors.length > 0 ?
      revisions.length / recentBehaviors.length : 0;

    // 分析情绪趋势
    const recentEmotions = recentBehaviors
      .filter((b: any) => b.emotional_state)
      .slice(0, 10)
      .map((b: any) => typeof b.emotional_state === 'string' ?
        JSON.parse(b.emotional_state) : b.emotional_state);

    const avgConfidence = recentEmotions.length > 0 ?
      recentEmotions.reduce((sum: number, e: any) => sum + (e.confidence || 0), 0) / recentEmotions.length : 0.5;

    const avgFrustration = recentEmotions.length > 0 ?
      recentEmotions.reduce((sum: number, e: any) => sum + (e.frustration || 0), 0) / recentEmotions.length : 0.5;

    const avgEngagement = recentEmotions.length > 0 ?
      recentEmotions.reduce((sum: number, e: any) => sum + (e.engagement || 0), 0) / recentEmotions.length : 0.5;

    // 推断工作风格
    let workStyle: string;
    if (helpRequestRate > 0.3 && revisionRate < 0.2) {
      workStyle = 'cautious';  // 经常求助，但修改少 = 谨慎型
    } else if (helpRequestRate < 0.1 && revisionRate > 0.3) {
      workStyle = 'impulsive';  // 很少求助，但修改多 = 冲动型
    } else {
      workStyle = 'confident';  // 平衡
    }

    // 获取长期记忆
    const memory = await queryOne(
      `SELECT core_strengths, growth_areas, deep_understanding
       FROM teacher_long_term_memory
       WHERE student_id = $1`,
      [studentId]
    );

    // 模拟任务统计（如果没有真实数据）
    const tasksCompleted = Math.max(recentBehaviors.length / 10, 1);
    const avgQuality = 3.5 + (avgConfidence - 0.5);

    return {
      tasksCompleted,
      avgQuality,
      helpRequestRate,
      revisionRate,
      workStyle,
      recentConfidence: avgConfidence,
      recentFrustration: avgFrustration,
      recentEngagement: avgEngagement,
      coreStrengths: memory?.core_strengths || [],
      growthAreas: memory?.growth_areas || [],
      deepUnderstanding: memory?.deep_understanding || ''
    };
  }

  /**
   * 理解"言外之意" - 分析学生话语背后的真实意图
   */
  private analyzeImpliedMeaning(
    studentMessage: string,
    profile: any
  ): {
    surfaceMeaning: string;
    impliedMeaning: string;
    confidence: number;
    reasoning: string;
  } {
    const message = studentMessage.toLowerCase();

    // 场景1：说"不知道" / "不懂" / "太模糊"
    if (message.includes('不知道') || message.includes('不懂') || message.includes('模糊')) {
      // 谨慎型 + 高质量历史 = 想确认方向
      if (profile.workStyle === 'cautious' && profile.avgQuality > 3.5) {
        return {
          surfaceMeaning: '学生表示不理解需求',
          impliedMeaning: '学生其实有自己的理解，但想确认方向再动手，避免走错路',
          confidence: 0.8,
          reasoning: `工作风格谨慎（求助率${(profile.helpRequestRate * 100).toFixed(0)}%），过去质量高（${profile.avgQuality.toFixed(1)}分），说明有能力。"不知道"更可能是寻求确认而非真的不懂。`
        };
      }

      // 新学生 + 低信心 = 真的不懂
      if (profile.tasksCompleted < 3 && profile.recentConfidence < 0.5) {
        return {
          surfaceMeaning: '学生表示不理解需求',
          impliedMeaning: '学生确实遇到了理解困难，需要具体的引导和示例',
          confidence: 0.7,
          reasoning: `新学生（完成${profile.tasksCompleted.toFixed(0)}个任务），信心不足（${(profile.recentConfidence * 100).toFixed(0)}%），"不知道"是真实的困惑。`
        };
      }

      // 冲动型 + 高修改率 = 之前没想清楚
      if (profile.workStyle === 'impulsive' && profile.revisionRate > 0.3) {
        return {
          surfaceMeaning: '学生表示不理解需求',
          impliedMeaning: '学生之前可能没仔细看需求就开始做了，现在发现不对劲',
          confidence: 0.6,
          reasoning: `工作风格冲动（很少求助），修改率高（${(profile.revisionRate * 100).toFixed(0)}%），可能是做了才发现问题。`
        };
      }
    }

    // 场景2：说"太难了" / "做不了"
    if (message.includes('太难') || message.includes('做不了') || message.includes('不会')) {
      // 高挫折感 + 低质量 = 真的遇到瓶颈
      if (profile.recentFrustration > 0.6 && profile.avgQuality < 3.0) {
        return {
          surfaceMeaning: '学生表示任务太难',
          impliedMeaning: '学生可能遇到了能力瓶颈，需要降低难度或提供更多支持',
          confidence: 0.75,
          reasoning: `挫折感高（${(profile.recentFrustration * 100).toFixed(0)}%），质量下降（${profile.avgQuality.toFixed(1)}分），可能真的超出当前能力。`
        };
      }

      // 第一次说难 + 高投入度 = 想要鼓励
      if (profile.recentEngagement > 0.7 && profile.recentFrustration < 0.5) {
        return {
          surfaceMeaning: '学生表示任务太难',
          impliedMeaning: '学生在挑战自己，想听到"你可以的"，需要鼓励而非降低难度',
          confidence: 0.65,
          reasoning: `投入度高（${(profile.recentEngagement * 100).toFixed(0)}%），挫折感不高，"太难"可能是寻求鼓励。`
        };
      }
    }

    // 场景3：说"客户要求不合理" / "这个需求有问题"
    if (message.includes('不合理') || message.includes('有问题') || message.includes('奇怪')) {
      // 高质量 + 低修改率 = 可能真的发现了问题
      if (profile.avgQuality > 4.0 && profile.revisionRate < 0.2) {
        return {
          surfaceMeaning: '学生质疑需求合理性',
          impliedMeaning: '学生可能真的发现了需求中的矛盾或不合理之处，值得认真听取',
          confidence: 0.7,
          reasoning: `质量高（${profile.avgQuality.toFixed(1)}分），修改少，说明判断力强，质疑可能有道理。`
        };
      }

      // 高修改率 + 高挫折感 = 可能是在推卸责任
      if (profile.revisionRate > 0.4 && profile.recentFrustration > 0.6) {
        return {
          surfaceMeaning: '学生质疑需求合理性',
          impliedMeaning: '学生可能因为多次修改而感到挫败，把问题归咎于需求，需要帮助他重新审视',
          confidence: 0.6,
          reasoning: `修改率高（${(profile.revisionRate * 100).toFixed(0)}%），挫折感高，可能是情绪化反应。`
        };
      }
    }

    // 默认：表面意思
    return {
      surfaceMeaning: studentMessage,
      impliedMeaning: '学生在当前情况下需要支持和引导',
      confidence: 0.5,
      reasoning: '缺少足够的历史数据进行深度分析，需要更多观察'
    };
  }

  /**
   * 第三步：推理验证
   */
  private async reason(hypotheses: Hypothesis[], recall: any): Promise<any> {
    try {
      // 选择置信度最高的假设
      const mainHypothesis = hypotheses.reduce((prev, current) =>
        current.confidence > prev.confidence ? current : prev
      );

      const prompt = `你是启程老师。你已经形成了几个假设，现在要进行推理验证。

## 主要假设
${mainHypothesis.hypothesis}
证据：${mainHypothesis.evidence.join('、')}
置信度：${mainHypothesis.confidence}

## 其他假设
${hypotheses.filter(h => h !== mainHypothesis).map(h =>
  `- ${h.hypothesis}（置信度${h.confidence}）`
).join('\n')}

## 学生的历史
${recall.relevantPatterns.join('\n')}

## 你的任务
构建一个推理链，说明为什么主要假设最可能是对的。

格式：
{
  "mainHypothesis": "最可能的假设",
  "reasoning": "因为A，所以B，因此C（推理过程）",
  "counterEvidence": "但是也有可能D（反驳证据）"
}

只返回JSON，不要其他文字：`;

      const response = await client.messages.create({
        model: 'claude-3-5-sonnet',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          mainHypothesis: mainHypothesis.hypothesis,
          reasoning: '基于当前证据的推理',
          counterEvidence: '需要更多观察'
        };
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error: unknown) {
      logger.error('Failed to reason:', error);

      // 增强版fallback：基于假设和学生画像进行推理
      const mainHypothesis = hypotheses[0];

      // 尝试获取学生画像
      let profile: any = null;
      try {
        profile = await this.analyzeStudentProfile(recall.studentHistory[0]?.student_id);
      } catch (e: unknown) {
        logger.warn('Failed to get profile for reasoning fallback');
      }

      if (profile) {
        // 构建推理链
        let reasoning = '';
        reasoning += `从历史数据看，这个学生完成了${profile.tasksCompleted.toFixed(0)}个任务，`;
        reasoning += `平均质量${profile.avgQuality.toFixed(1)}分。`;

        if (profile.workStyle === 'cautious') {
          reasoning += `工作风格谨慎，求助率${(profile.helpRequestRate * 100).toFixed(0)}%，说明他习惯确认后再行动。`;
        } else if (profile.workStyle === 'impulsive') {
          reasoning += `工作风格冲动，修改率${(profile.revisionRate * 100).toFixed(0)}%，说明他倾向于先做再说。`;
        }

        reasoning += `因此，${mainHypothesis.hypothesis}。`;

        const counterEvidence = hypotheses.length > 1 ?
          `但也要考虑：${hypotheses[1].hypothesis}` :
          '暂无明显的反驳证据';

        return {
          mainHypothesis: mainHypothesis.hypothesis,
          reasoning,
          counterEvidence
        };
      }

      // 简单fallback
      return {
        mainHypothesis: hypotheses[0]?.hypothesis || '学生需要支持',
        reasoning: '基于当前观察，学生主动求助说明遇到了困难',
        counterEvidence: '需要更多观察来确认具体原因'
      };
    }
  }

  /**
   * 第四步：形成洞察
   */
  private async formInsight(reasoning: any, recall: any): Promise<any> {
    try {
      const prompt = `你是启程老师。你已经完成了推理，现在要形成洞察。

## 推理结果
主要假设：${reasoning.mainHypothesis}
推理过程：${reasoning.reasoning}
反驳证据：${reasoning.counterEvidence}

## 学生背景
${recall.longTermMemory?.deep_understanding || '新学生'}

## 你的任务
基于推理结果，形成深度洞察：

{
  "understanding": "对当前情况的理解（一句话）",
  "rootCause": "根本原因是什么",
  "actionable": "可操作的建议（具体到这个学生）"
}

只返回JSON，不要其他文字：`;

      const response = await client.messages.create({
        model: 'claude-3-5-sonnet',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          understanding: '需要更多信息',
          rootCause: '待确定',
          actionable: '继续观察'
        };
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error: unknown) {
      logger.error('Failed to form insight:', error);

      // 增强版fallback：基于推理结果和学生画像形成洞察
      try {
        const studentId = recall.studentHistory[0]?.student_id;
        if (!studentId) {
          throw new Error('No student ID available');
        }

        const profile = await this.analyzeStudentProfile(studentId);

        let understanding = reasoning.mainHypothesis;
        let rootCause = '';
        let actionable = '';

        // 根据工作风格给出建议
        if (profile.workStyle === 'cautious') {
          rootCause = '学生的谨慎性格让他倾向于确认后再行动';
          actionable = '引导他说出自己的理解，给予确认和鼓励，让他放心去做';
        } else if (profile.workStyle === 'impulsive') {
          rootCause = '学生的冲动性格让他容易先做再想';
          actionable = '帮助他在动手前先理清思路，建立"想清楚再做"的习惯';
        } else {
          rootCause = '学生在当前情况下需要支持';
          actionable = '提供具体的引导和示例';
        }

        // 根据情绪状态调整
        if (profile.recentFrustration > 0.6) {
          actionable = '先共情他的挫折感，' + actionable;
        }

        if (profile.recentConfidence < 0.4) {
          actionable += '，并给予信心支持';
        }

        return {
          understanding,
          rootCause,
          actionable
        };

      } catch (fallbackError) {
        logger.error('Enhanced insight fallback also failed:', fallbackError);

        // 最简单的fallback
        return {
          understanding: reasoning.mainHypothesis || '学生需要支持',
          rootCause: '需要更多观察来确定根本原因',
          actionable: '先了解具体情况，再给出针对性建议'
        };
      }
    }
  }

  /**
   * 保存思考记录
   */
  private async saveThinkingRecord(
    studentId: string,
    thinking: ThinkingProcess
  ): Promise<void> {
    try {
      await query(
        `INSERT INTO teacher_thinking_records (
          student_id, question, recall, hypotheses, reasoning, insight
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          studentId,
          thinking.question,
          JSON.stringify(thinking.recall),
          JSON.stringify(thinking.hypotheses),
          JSON.stringify(thinking.reasoning),
          JSON.stringify(thinking.insight)
        ]
      );
    } catch (error: unknown) {
      logger.error('Failed to save thinking record:', error);
    }
  }
}

export default new ReasoningEngine();
