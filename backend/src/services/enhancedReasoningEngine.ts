import { queryOne, query as queryMany } from '../utils/db';
import logger from '../utils/logger';

/**
 * 深度推理引擎 - 增强版
 * 即使没有API，也能基于数据进行真正的推理
 */

interface ThinkingContext {
  studentId: string;
  question: string;
  currentSituation: string;
  taskId?: string;
}

interface StudentProfile {
  // 历史数据
  tasksCompleted: number;
  avgQuality: number;
  helpRequestRate: number;
  revisionRate: number;
  onTimeRate: number;

  // 行为模式
  workStyle: string;  // 'cautious' | 'confident' | 'impulsive'
  learningPattern: string;  // 'fast' | 'steady' | 'struggling'
  communicationStyle: string;  // 'proactive' | 'reactive' | 'silent'

  // 情绪趋势
  recentConfidence: number;
  recentFrustration: number;
  recentEngagement: number;

  // 长期理解
  coreStrengths: string[];
  growthAreas: string[];
  emotionalTriggers: string[];
}

class EnhancedReasoningEngine {
  /**
   * 深度分析学生画像
   */
  private async analyzeStudentProfile(studentId: string): Promise<StudentProfile> {
    // 1. 获取历史任务数据
    const taskStats = await queryOne(
      `SELECT
        COUNT(*) as tasks_completed,
        AVG(CASE WHEN quality_score IS NOT NULL THEN quality_score ELSE 0 END) as avg_quality,
        AVG(CASE WHEN on_time THEN 1 ELSE 0 END) as on_time_rate
       FROM tasks
       WHERE assignee_id = $1 AND status = 'completed'`,
      [studentId]
    );

    // 2. 获取最近的行为模式
    const recentBehaviors = await queryMany(
      `SELECT behavior_type, emotional_state, timestamp
       FROM teacher_observations
       WHERE student_id = $1
         AND timestamp > NOW() - INTERVAL '30 days'
       ORDER BY timestamp DESC
       LIMIT 50`,
      [studentId]
    );

    // 3. 分析求助频率
    const helpRequests = recentBehaviors.filter((b: any) => b.behavior_type === 'seek_help');
    const helpRequestRate = recentBehaviors.length > 0 ?
      helpRequests.length / recentBehaviors.length : 0;

    // 4. 分析修改频率
    const revisions = recentBehaviors.filter((b: any) => b.behavior_type === 'revise_work');
    const revisionRate = recentBehaviors.length > 0 ?
      revisions.length / recentBehaviors.length : 0;

    // 5. 分析情绪趋势
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

    // 6. 推断工作风格
    let workStyle: string;
    if (helpRequestRate > 0.3 && revisionRate < 0.2) {
      workStyle = 'cautious';  // 经常求助，但修改少 = 谨慎型
    } else if (helpRequestRate < 0.1 && revisionRate > 0.3) {
      workStyle = 'impulsive';  // 很少求助，但修改多 = 冲动型
    } else {
      workStyle = 'confident';  // 平衡
    }

    // 7. 推断学习模式
    let learningPattern: string;
    const tasksCompleted = parseInt(String(taskStats?.tasks_completed || '0'));
    const avgQuality = parseFloat(String(taskStats?.avg_quality || '0'));

    if (tasksCompleted < 3) {
      learningPattern = 'new';
    } else if (avgQuality > 4.0 && avgFrustration < 0.4) {
      learningPattern = 'fast';
    } else if (avgQuality > 3.5 && avgFrustration < 0.6) {
      learningPattern = 'steady';
    } else {
      learningPattern = 'struggling';
    }

    // 8. 推断沟通风格
    let communicationStyle: string;
    if (helpRequestRate > 0.4) {
      communicationStyle = 'proactive';
    } else if (helpRequestRate > 0.1) {
      communicationStyle = 'reactive';
    } else {
      communicationStyle = 'silent';
    }

    // 9. 获取长期记忆
    const memory = await queryOne(
      `SELECT core_strengths, growth_areas, emotional_triggers
       FROM teacher_long_term_memory
       WHERE student_id = $1`,
      [studentId]
    );

    return {
      tasksCompleted,
      avgQuality,
      helpRequestRate,
      revisionRate,
      onTimeRate: parseFloat(String(taskStats?.on_time_rate || '0')),
      workStyle,
      learningPattern,
      communicationStyle,
      recentConfidence: avgConfidence,
      recentFrustration: avgFrustration,
      recentEngagement: avgEngagement,
      coreStrengths: (memory?.core_strengths as string[]) || [],
      growthAreas: (memory?.growth_areas as string[]) || [],
      emotionalTriggers: (memory?.emotional_triggers as string[]) || []
    };
  }

  /**
   * 理解"言外之意" - 分析学生话语背后的真实意图
   */
  private analyzeImpliedMeaning(
    studentMessage: string,
    profile: StudentProfile,
    context: any
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
          reasoning: `新学生（完成${profile.tasksCompleted}个任务），信心不足（${(profile.recentConfidence * 100).toFixed(0)}%），"不知道"是真实的困惑。`
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
      // 高挫折感 + 连续失败 = 真的遇到瓶颈
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
      impliedMeaning: studentMessage,
      confidence: 0.3,
      reasoning: '缺少足够的历史数据进行深度分析'
    };
  }

  /**
   * 生成真正的假设 - 基于数据而非模板
   */
  private async generateIntelligentHypotheses(
    context: ThinkingContext,
    profile: StudentProfile,
    impliedMeaning: any
  ): Promise<any[]> {
    const hypotheses: any[] = [];

    // 假设1：基于"言外之意"分析
    hypotheses.push({
      hypothesis: impliedMeaning.impliedMeaning,
      evidence: [
        `工作风格：${profile.workStyle}`,
        `学习模式：${profile.learningPattern}`,
        `历史质量：${profile.avgQuality.toFixed(1)}分`,
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
    const recentBehaviors = await queryMany(
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

    return hypotheses.slice(0, 3);  // 返回Top 3
  }

  /**
   * 深度推理 - 选择最可能的假设并构建推理链
   */
  private deepReasoning(
    hypotheses: any[],
    profile: StudentProfile,
    context: ThinkingContext
  ): any {
    const mainHypothesis = hypotheses[0];

    // 构建推理链
    let reasoning = '';

    // 第一步：从历史数据出发
    reasoning += `从历史数据看，这个学生完成了${profile.tasksCompleted}个任务，平均质量${profile.avgQuality.toFixed(1)}分。`;

    // 第二步：分析工作风格
    if (profile.workStyle === 'cautious') {
      reasoning += `工作风格谨慎，求助率${(profile.helpRequestRate * 100).toFixed(0)}%，说明他习惯确认后再行动。`;
    } else if (profile.workStyle === 'impulsive') {
      reasoning += `工作风格冲动，修改率${(profile.revisionRate * 100).toFixed(0)}%，说明他倾向于先做再说。`;
    }

    // 第三步：分析当前情绪
    reasoning += `当前情绪状态：信心${(profile.recentConfidence * 100).toFixed(0)}%，挫折感${(profile.recentFrustration * 100).toFixed(0)}%。`;

    // 第四步：得出结论
    reasoning += `因此，${mainHypothesis.hypothesis}`;

    // 反驳证据
    const counterEvidence = hypotheses.length > 1 ?
      `但也要考虑：${hypotheses[1].hypothesis}` :
      '暂无明显的反驳证据';

    return {
      mainHypothesis: mainHypothesis.hypothesis,
      reasoning,
      counterEvidence,
      confidence: mainHypothesis.confidence
    };
  }

  /**
   * 形成可操作的洞察
   */
  private formActionableInsight(
    reasoning: any,
    profile: StudentProfile,
    impliedMeaning: any
  ): any {
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
      actionable,
      impliedMeaning: impliedMeaning.impliedMeaning,
      confidence: reasoning.confidence
    };
  }

  /**
   * 主思考方法 - 整合所有分析
   */
  async think(context: ThinkingContext): Promise<any> {
    try {
      logger.info(`Enhanced reasoning for student ${context.studentId}: ${context.question}`);

      // 1. 深度分析学生画像
      const profile = await this.analyzeStudentProfile(context.studentId);

      // 2. 理解"言外之意"
      const impliedMeaning = this.analyzeImpliedMeaning(
        context.currentSituation,
        profile,
        context
      );

      logger.info(`Implied meaning: ${impliedMeaning.impliedMeaning} (confidence: ${impliedMeaning.confidence})`);

      // 3. 生成智能假设
      const hypotheses = await this.generateIntelligentHypotheses(
        context,
        profile,
        impliedMeaning
      );

      // 4. 深度推理
      const reasoning = this.deepReasoning(hypotheses, profile, context);

      // 5. 形成洞察
      const insight = this.formActionableInsight(reasoning, profile, impliedMeaning);

      return {
        question: context.question,
        profile,
        impliedMeaning,
        hypotheses,
        reasoning,
        insight
      };

    } catch (error: any) {
      logger.error('Enhanced reasoning failed:', error);
      throw error;
    }
  }
}

export default new EnhancedReasoningEngine();
