import { pool } from '../config/database';
import logger from '../utils/logger';
import { claudeService } from './claudeService';

interface GrowthState {
  technicalSkills?: { [key: string]: number };
  softSkills?: { [key: string]: number };
  confidence?: number;
  emotionalState?: string;
  strugglingAreas?: string[];
  strengths?: string[];
}

interface Milestone {
  id: number;
  type: string;
  title: string;
  description: string;
  beforeState: GrowthState;
  afterState: GrowthState;
  growthIndicators: any;
  celebrated: boolean;
  createdAt: Date;
}

interface GrowthAnalysis {
  shouldCreateMilestone: boolean;
  milestoneType?: string;
  milestoneTitle?: string;
  milestoneDescription?: string;
  beforeState?: GrowthState;
  afterState?: GrowthState;
  growthIndicators?: any;
}

class GrowthTrackingService {
  // 里程碑类型定义
  private milestoneTypes = {
    first_question: '第一次主动提问',
    first_breakthrough: '第一次突破困难',
    overcame_fear: '克服恐惧',
    independent_solution: '独立解决问题',
    quality_improvement: '质量显著提升',
    confidence_boost: '信心提升',
    skill_mastery: '技能掌握',
    persistence_victory: '坚持的胜利',
    creative_solution: '创造性解决方案',
    helping_others: '帮助他人'
  };

  /**
   * 检测并记录成长里程碑
   */
  async detectAndRecordMilestone(
    studentId: number,
    taskId: number,
    sessionId: number,
    context: {
      currentMessage: string;
      previousMessages: Array<{ role: string; content: string }>;
      currentEmotion?: string;
      previousEmotions?: Array<{ emotion: string; intensity: number }>;
      taskProgress?: number;
    }
  ): Promise<Milestone | null> {
    try {
      // 1. 分析是否达成里程碑
      const analysis = await this.analyzePotentialMilestone(studentId, context);

      if (!analysis.shouldCreateMilestone) {
        return null;
      }

      // 2. 创建里程碑记录
      const milestone = await this.createMilestone(
        studentId,
        taskId,
        sessionId,
        analysis
      );

      // 3. 更新学生档案
      await this.updateStudentProfile(studentId, analysis);

      // 4. 生成庆祝消息（异步，不阻塞）
      this.generateCelebrationMessage(milestone.id, studentId).catch(err => {
        logger.error('生成庆祝消息失败', { error: err, milestoneId: milestone.id });
      });

      return milestone;
    } catch (error: any) {
      logger.error('检测里程碑失败', { error, studentId, sessionId });
      return null;
    }
  }

  /**
   * 分析是否达成里程碑
   */
  private async analyzePotentialMilestone(
    studentId: number,
    context: any
  ): Promise<GrowthAnalysis> {
    // 1. 获取学生历史数据
    const profile = await this.getStudentProfile(studentId);
    const recentMilestones = await this.getRecentMilestones(studentId, 5);

    // 2. 规则检测（快速判断）
    const ruleBasedAnalysis = this.detectMilestoneByRules(context, profile, recentMilestones);
    if (ruleBasedAnalysis.shouldCreateMilestone) {
      return ruleBasedAnalysis;
    }

    // 3. AI深度分析（用于复杂情况）
    return await this.detectMilestoneByAI(context, profile, recentMilestones);
  }

  /**
   * 基于规则的里程碑检测
   */
  private detectMilestoneByRules(
    context: any,
    profile: any,
    recentMilestones: Milestone[]
  ): GrowthAnalysis {
    const { currentMessage, currentEmotion, previousEmotions, taskProgress } = context;

    // 检测：第一次主动提问
    if (
      profile?.total_mentor_interactions <= 1 &&
      currentMessage.includes('?') &&
      currentMessage.length > 10
    ) {
      return {
        shouldCreateMilestone: true,
        milestoneType: 'first_question',
        milestoneTitle: '迈出第一步：主动提问',
        milestoneDescription: '你勇敢地提出了第一个问题，这是学习的开始！',
        beforeState: { confidence: 0.3, emotionalState: 'uncertain' },
        afterState: { confidence: 0.5, emotionalState: 'curious' },
        growthIndicators: { initiative: 1, curiosity: 1 }
      };
    }

    // 检测：克服恐惧（从焦虑到自信）
    if (
      previousEmotions &&
      previousEmotions.some((e: any) => e.emotion === 'anxious' && e.intensity > 0.6) &&
      currentEmotion === 'confident'
    ) {
      return {
        shouldCreateMilestone: true,
        milestoneType: 'overcame_fear',
        milestoneTitle: '克服恐惧',
        milestoneDescription: '你从焦虑不安到充满信心，这是巨大的进步！',
        beforeState: { confidence: 0.3, emotionalState: 'anxious' },
        afterState: { confidence: 0.7, emotionalState: 'confident' },
        growthIndicators: { emotional_growth: 1, resilience: 1 }
      };
    }

    // 检测：从沮丧到突破
    if (
      previousEmotions &&
      previousEmotions.some(e => e.emotion === 'frustrated') &&
      (currentEmotion === 'excited' || currentEmotion === 'proud')
    ) {
      return {
        shouldCreateMilestone: true,
        milestoneType: 'first_breakthrough',
        milestoneTitle: '突破困境',
        milestoneDescription: '你没有放弃，最终找到了解决方案！',
        beforeState: { confidence: 0.4, emotionalState: 'frustrated' },
        afterState: { confidence: 0.7, emotionalState: currentEmotion },
        growthIndicators: { persistence: 1, problem_solving: 1 }
      };
    }

    // 检测：独立解决问题（消息中包含"我解决了"、"我做到了"等）
    const independentPhrases = ['我解决了', '我做到了', '我完成了', '我搞定了', '我找到方法了'];
    if (independentPhrases.some(phrase => currentMessage.includes(phrase))) {
      return {
        shouldCreateMilestone: true,
        milestoneType: 'independent_solution',
        milestoneTitle: '独立解决问题',
        milestoneDescription: '你靠自己的力量解决了问题，太棒了！',
        beforeState: { confidence: 0.5, softSkills: { problem_solving: 0.5 } },
        afterState: { confidence: 0.8, softSkills: { problem_solving: 0.8 } },
        growthIndicators: { independence: 1, problem_solving: 1 }
      };
    }

    return { shouldCreateMilestone: false };
  }

  /**
   * 使用AI进行深度里程碑分析
   */
  private async detectMilestoneByAI(
    context: any,
    profile: any,
    recentMilestones: Milestone[]
  ): Promise<GrowthAnalysis> {
    const prompt = `分析学生是否达成了成长里程碑。

当前消息：${context.currentMessage}

最近3条消息：
${context.previousMessages.slice(-3).map((m: any) => `${m.role}: ${m.content}`).join('\n')}

当前情绪：${context.currentEmotion || '未知'}

最近情绪变化：
${context.previousEmotions?.map((e: any) => `${e.emotion}(${e.intensity})`).join(' → ') || '无'}

学生档案：
- 完成任务数：${profile?.total_tasks_completed || 0}
- 历史突破次数：${profile?.total_breakthroughs || 0}
- 平均质量分：${profile?.average_task_quality_score || 0}

最近里程碑：
${recentMilestones.map(m => `- ${m.title} (${m.type})`).join('\n') || '无'}

请判断是否达成了以下任一里程碑：
1. first_question - 第一次主动提问
2. first_breakthrough - 第一次突破困难
3. overcame_fear - 克服恐惧（从焦虑到自信）
4. independent_solution - 独立解决问题
5. quality_improvement - 质量显著提升
6. confidence_boost - 信心提升
7. skill_mastery - 掌握某项技能
8. persistence_victory - 坚持的胜利
9. creative_solution - 创造性解决方案

如果达成，返回JSON：
{
  "shouldCreateMilestone": true,
  "milestoneType": "类型",
  "milestoneTitle": "标题",
  "milestoneDescription": "描述",
  "beforeState": { "confidence": 0.0-1.0, "emotionalState": "状态" },
  "afterState": { "confidence": 0.0-1.0, "emotionalState": "状态" },
  "growthIndicators": { "indicator1": 1, "indicator2": 1 }
}

如果未达成，返回：
{ "shouldCreateMilestone": false }`;

    try {
      const response = await claudeService.chat(
        prompt,
        {
          model: 'claude-haiku-4-5',
          maxTokens: 800,
          temperature: 0.3
        }
      );

      return JSON.parse(response);
    } catch (error: any) {
      logger.error('AI里程碑分析失败', { error });
      return { shouldCreateMilestone: false };
    }
  }

  /**
   * 创建里程碑记录
   */
  private async createMilestone(
    studentId: number,
    taskId: number,
    sessionId: number,
    analysis: GrowthAnalysis
  ): Promise<Milestone> {
    const query = `
      INSERT INTO student_growth_milestones (
        student_id, task_id, session_id,
        milestone_type, milestone_title, milestone_description,
        before_state, after_state, growth_indicators
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await pool.query(query, [
      studentId,
      taskId,
      sessionId,
      analysis.milestoneType,
      analysis.milestoneTitle,
      analysis.milestoneDescription,
      JSON.stringify(analysis.beforeState),
      JSON.stringify(analysis.afterState),
      JSON.stringify(analysis.growthIndicators)
    ]);

    return result.rows[0];
  }

  /**
   * 生成庆祝消息
   */
  private async generateCelebrationMessage(
    milestoneId: number,
    studentId: number
  ): Promise<void> {
    try {
      // 获取里程碑信息
      const milestone = await this.getMilestone(milestoneId);
      if (!milestone) return;

      // 使用AI生成个性化庆祝消息
      const prompt = `为学生生成一条温暖、鼓励的庆祝消息。

里程碑：${milestone.title}
描述：${milestone.description}

要求：
1. 真诚、温暖、具体
2. 肯定学生的努力和进步
3. 鼓励继续前进
4. 50字以内

直接返回庆祝消息文本，不要JSON格式。`;

      const response = await claudeService.chat(
        prompt,
        {
          model: 'claude-haiku-4-5',
          maxTokens: 200,
          temperature: 0.8
        }
      );

      // 更新里程碑的庆祝消息
      await pool.query(
        `UPDATE student_growth_milestones
         SET celebration_message = $1, celebrated = true, celebration_at = NOW()
         WHERE id = $2`,
        [response, milestoneId]
      );
    } catch (error: any) {
      logger.error('生成庆祝消息失败', { error, milestoneId });
    }
  }

  /**
   * 更新学生档案
   */
  private async updateStudentProfile(
    studentId: number,
    analysis: GrowthAnalysis
  ): Promise<void> {
    // 更新技能和信心趋势
    const query = `
      UPDATE student_learning_profiles
      SET
        confidence_trend = COALESCE(confidence_trend, '[]'::jsonb) ||
          jsonb_build_object('date', NOW(), 'score', $1)::jsonb,
        updated_at = NOW()
      WHERE student_id = $2
    `;

    await pool.query(query, [
      analysis.afterState?.confidence || 0.5,
      studentId
    ]);
  }

  /**
   * 获取学生档案
   */
  private async getStudentProfile(studentId: number): Promise<any> {
    const query = `SELECT * FROM student_learning_profiles WHERE student_id = $1`;
    const result = await pool.query(query, [studentId]);
    return result.rows[0] || null;
  }

  /**
   * 获取最近的里程碑
   */
  async getRecentMilestones(
    studentId: number,
    limit: number = 5
  ): Promise<Milestone[]> {
    const query = `
      SELECT *
      FROM student_growth_milestones
      WHERE student_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [studentId, limit]);
    return result.rows;
  }

  /**
   * 获取单个里程碑
   */
  private async getMilestone(milestoneId: number): Promise<Milestone | null> {
    const query = `SELECT * FROM student_growth_milestones WHERE id = $1`;
    const result = await pool.query(query, [milestoneId]);
    return result.rows[0] || null;
  }

  /**
   * 获取未庆祝的里程碑
   */
  async getUncelebratedMilestones(studentId: number): Promise<Milestone[]> {
    const query = `
      SELECT *
      FROM student_growth_milestones
      WHERE student_id = $1 AND celebrated = false
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [studentId]);
    return result.rows;
  }

  /**
   * 标记里程碑为已庆祝
   */
  async markAsCelebrated(milestoneId: number): Promise<void> {
    await pool.query(
      `UPDATE student_growth_milestones
       SET celebrated = true, celebration_at = NOW()
       WHERE id = $1`,
      [milestoneId]
    );
  }

  /**
   * 获取成长统计
   */
  async getGrowthStats(studentId: number): Promise<{
    totalMilestones: number;
    milestonesByType: { [key: string]: number };
    confidenceTrend: Array<{ date: Date; score: number }>;
    recentGrowth: Milestone[];
  }> {
    try {
      // 总里程碑数
      const totalResult = await pool.query(
        `SELECT COUNT(*) as count FROM student_growth_milestones WHERE student_id = $1`,
        [studentId]
      );

      // 按类型统计
      const typeResult = await pool.query(
        `SELECT milestone_type, COUNT(*) as count
         FROM student_growth_milestones
         WHERE student_id = $1
         GROUP BY milestone_type`,
        [studentId]
      );

      // 信心趋势
      const profileResult = await pool.query(
        `SELECT confidence_trend FROM student_learning_profiles WHERE student_id = $1`,
        [studentId]
      );

      // 最近成长
      const recentMilestones = await this.getRecentMilestones(studentId, 5);

      return {
        totalMilestones: parseInt(totalResult.rows[0]?.count || '0'),
        milestonesByType: typeResult.rows.reduce((acc, row) => {
          acc[row.milestone_type] = parseInt(row.count);
          return acc;
        }, {}),
        confidenceTrend: profileResult.rows[0]?.confidence_trend || [],
        recentGrowth: recentMilestones
      };
    } catch (error: any) {
      logger.error('获取成长统计失败', { error, studentId });
      return {
        totalMilestones: 0,
        milestonesByType: {},
        confidenceTrend: [],
        recentGrowth: []
      };
    }
  }
}

export const growthTrackingService = new GrowthTrackingService();
