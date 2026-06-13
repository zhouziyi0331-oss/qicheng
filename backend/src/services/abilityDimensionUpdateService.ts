/**
 * 六维能力动态更新服务
 * 模块二：六维能力测评表的动态更新与文字解读
 *
 * 功能：
 * 1. 每次订单完成后，根据任务表现更新六维分数
 * 2. 使用加权滑动平均算法：新分数 = (旧分数 × 0.7) + (本次表现分 × 0.3)
 * 3. 调用AI生成每个维度的文字解读
 * 4. 版本化存储，保留历史记录
 */

import Anthropic from '@anthropic-ai/sdk';
import { pool } from '../config/database';

interface DimensionScores {
  information_processing: number;
  creative_drive: number;
  tool_learning: number;
  task_execution: number;
  collaboration_tendency: number;
  risk_attitude: number;
}

interface TaskPerformance {
  orderId: string;
  studentId: string;
  taskComplexity: number; // 任务拆解完整度 0-10
  creativityMatch: number; // 创作类型匹配度 0-10
  newToolsUsed: string[]; // 新使用的工具
  onTimeDelivery: boolean; // 是否按时交付
  rejectionCount: number; // 被打回次数
  independentCompletion: boolean; // 是否独立完成
  taskDifficulty: number; // 任务难度 1-10
  studentLevel: number; // 学生当前等级
}

interface DimensionUpdate {
  dimension: string;
  old_score: number;
  new_score: number;
  change_reason: string;
  current_description: string;
}

interface AbilityUpdateResult {
  dimension_updates: DimensionUpdate[];
  overall_trend: string;
  personality_label_update: string;
}

class AbilityDimensionUpdateService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
  }

  /**
   * 订单完成后更新六维能力
   */
  async updateAbilityAfterOrder(orderId: string): Promise<AbilityUpdateResult> {
    logger.info(`[六维能力更新] 开始更新订单 ${orderId} 的能力数据`);

    // 1. 获取任务表现数据
    const performance = await this.getTaskPerformance(orderId);

    // 2. 计算本次任务的六维表现分
    const performanceScores = this.calculatePerformanceScores(performance);

    // 3. 获取学生当前的六维分数
    const currentScores = await this.getCurrentScores(performance.studentId);

    // 4. 计算新的六维分数（加权滑动平均）
    const newScores = this.calculateNewScores(currentScores, performanceScores);

    // 5. 保存新版本的能力画像
    const newVersion = await this.saveNewVersion(
      performance.studentId,
      newScores,
      `完成订单#${orderId}`
    );

    // 6. 记录历史变化
    await this.recordHistory(performance.studentId, newVersion, orderId, {
      old_scores: currentScores,
      new_scores: newScores,
      performance_scores: performanceScores,
    });

    // 7. 调用AI生成文字解读
    const aiInterpretation = await this.generateAIInterpretation(
      performance.studentId,
      currentScores,
      newScores,
      orderId
    );

    // 8. 更新维度描述
    await this.updateDimensionDescriptions(
      performance.studentId,
      newVersion,
      aiInterpretation
    );

    logger.info(`[六维能力更新] 更新完成，新版本: ${newVersion}`);
    return aiInterpretation;
  }

  /**
   * 获取任务表现数据
   */
  private async getTaskPerformance(orderId: string): Promise<TaskPerformance> {
    const client = await pool.connect();
    try {
      // 获取订单基本信息
      const orderResult = await client.query(
        `SELECT
           o.id,
           o.student_id,
           o.client_rating,
           o.time_spent_hours,
           o.estimated_hours,
           o.task_type,
           o.difficulty,
           u.current_level
         FROM orders o
         JOIN users u ON o.student_id = u.id
         WHERE o.id = $1`,
        [orderId]
      );

      if (orderResult.rows.length === 0) {
        throw new Error(`订单 ${orderId} 不存在`);
      }

      const order = orderResult.rows[0];

      // 获取AI审核数据（任务拆解完整度）
      const auditResult = await client.query(
        `SELECT audit_result
         FROM order_audits
         WHERE order_id = $1 AND audit_type = 'quality'
         ORDER BY created_at DESC LIMIT 1`,
        [orderId]
      );

      let taskComplexity = 5; // 默认值
      if (auditResult.rows.length > 0 && auditResult.rows[0].audit_result) {
        const auditData = auditResult.rows[0].audit_result;
        taskComplexity = auditData.task_breakdown_score || 5;
      }

      // 获取导师观察数据（工具使用）
      const observationResult = await client.query(
        `SELECT skills_observed
         FROM mentor_growth_observations
         WHERE order_id = $1
         ORDER BY created_at DESC LIMIT 1`,
        [orderId]
      );

      let newToolsUsed: string[] = [];
      if (observationResult.rows.length > 0 && observationResult.rows[0].skills_observed) {
        const skills = observationResult.rows[0].skills_observed;
        newToolsUsed = skills.new_tools || [];
      }

      // 获取打回次数
      const rejectionResult = await client.query(
        `SELECT COUNT(*) as rejection_count
         FROM order_revisions
         WHERE order_id = $1`,
        [orderId]
      );
      const rejectionCount = parseInt(rejectionResult.rows[0].rejection_count);

      // 判断是否按时交付
      const onTimeDelivery =
        order.time_spent_hours <= order.estimated_hours || rejectionCount === 0;

      // 判断是否独立完成（根据导师对话次数）
      const sessionResult = await client.query(
        `SELECT COUNT(*) as session_count
         FROM mentor_sessions
         WHERE order_id = $1`,
        [orderId]
      );
      const sessionCount = parseInt(sessionResult.rows[0].session_count);
      const independentCompletion = sessionCount <= 2; // 少于2次对话视为独立完成

      // 创作类型匹配度（根据任务类型和客户评分）
      const creativityMatch = order.client_rating * 2; // 5分制转10分制

      return {
        orderId,
        studentId: order.student_id,
        taskComplexity,
        creativityMatch,
        newToolsUsed,
        onTimeDelivery,
        rejectionCount,
        independentCompletion,
        taskDifficulty: order.difficulty || 5,
        studentLevel: order.current_level || 0,
      };
    } finally {
      client.release();
    }
  }

  /**
   * 计算本次任务的六维表现分
   */
  private calculatePerformanceScores(performance: TaskPerformance): DimensionScores {
    const scores: DimensionScores = {
      information_processing: 50,
      creative_drive: 50,
      tool_learning: 50,
      task_execution: 50,
      collaboration_tendency: 50,
      risk_attitude: 50,
    };

    // 1. 信息处理：任务拆解完整度
    scores.information_processing = performance.taskComplexity * 10;

    // 2. 创作驱动：创作类型匹配度
    scores.creative_drive = performance.creativityMatch * 10;

    // 3. 工具学习：新工具使用
    if (performance.newToolsUsed.length > 0) {
      scores.tool_learning = 50 + performance.newToolsUsed.length * 5;
    } else {
      scores.tool_learning = 52; // 熟练使用旧工具
    }
    scores.tool_learning = Math.min(scores.tool_learning, 100);

    // 4. 任务执行：按时交付 + 打回次数
    let executionScore = 50;
    if (performance.onTimeDelivery) executionScore += 15;
    if (performance.rejectionCount === 0) executionScore += 15;
    else executionScore -= performance.rejectionCount * 5;
    scores.task_execution = Math.max(0, Math.min(executionScore, 100));

    // 5. 协作倾向：是否独立完成
    if (performance.independentCompletion) {
      scores.collaboration_tendency = 65; // 独立完成
    } else {
      scores.collaboration_tendency = 45; // 需要频繁沟通
    }

    // 6. 风险态度：任务难度 vs 学生等级
    const difficultyGap = performance.taskDifficulty - performance.studentLevel;
    if (difficultyGap > 2) {
      scores.risk_attitude = 65; // 接了高难度任务
    } else if (difficultyGap > 0) {
      scores.risk_attitude = 55; // 接了略高难度任务
    } else {
      scores.risk_attitude = 51; // 接了同级任务
    }

    return scores;
  }

  /**
   * 获取学生当前的六维分数
   */
  private async getCurrentScores(studentId: string): Promise<DimensionScores> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT
           information_processing,
           creative_drive,
           tool_learning,
           task_execution,
           collaboration_tendency,
           risk_attitude
         FROM user_ability_profiles
         WHERE user_id = $1 AND is_current = true
         LIMIT 1`,
        [studentId]
      );

      if (result.rows.length === 0) {
        // 如果没有当前画像，返回默认值
        return {
          information_processing: 50,
          creative_drive: 50,
          tool_learning: 50,
          task_execution: 50,
          collaboration_tendency: 50,
          risk_attitude: 50,
        };
      }

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * 计算新的六维分数（加权滑动平均）
   * 新分数 = (旧分数 × 0.7) + (本次表现分 × 0.3)
   */
  private calculateNewScores(
    currentScores: DimensionScores,
    performanceScores: DimensionScores
  ): DimensionScores {
    const newScores: DimensionScores = {
      information_processing: 0,
      creative_drive: 0,
      tool_learning: 0,
      task_execution: 0,
      collaboration_tendency: 0,
      risk_attitude: 0,
    };

    const dimensions: (keyof DimensionScores)[] = [
      'information_processing',
      'creative_drive',
      'tool_learning',
      'task_execution',
      'collaboration_tendency',
      'risk_attitude',
    ];

    dimensions.forEach((dim) => {
      const oldScore = currentScores[dim] || 50;
      const perfScore = performanceScores[dim] || 50;
      const newScore = Math.round(oldScore * 0.7 + perfScore * 0.3);
      newScores[dim] = Math.max(0, Math.min(newScore, 100));
    });

    return newScores;
  }

  /**
   * 保存新版本的能力画像
   */
  private async saveNewVersion(
    studentId: string,
    newScores: DimensionScores,
    updateReason: string
  ): Promise<number> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. 将当前版本标记为非当前
      await client.query(
        `UPDATE user_ability_profiles
         SET is_current = false
         WHERE user_id = $1 AND is_current = true`,
        [studentId]
      );

      // 2. 获取下一个版本号
      const versionResult = await client.query(
        `SELECT COALESCE(MAX(version), 0) + 1 as next_version
         FROM user_ability_profiles
         WHERE user_id = $1`,
        [studentId]
      );
      const nextVersion = versionResult.rows[0].next_version;

      // 3. 插入新版本
      await client.query(
        `INSERT INTO user_ability_profiles
         (user_id, version, is_current, updated_reason,
          information_processing, creative_drive, tool_learning,
          task_execution, collaboration_tendency, risk_attitude)
         VALUES ($1, $2, true, $3, $4, $5, $6, $7, $8, $9)`,
        [
          studentId,
          nextVersion,
          updateReason,
          newScores.information_processing,
          newScores.creative_drive,
          newScores.tool_learning,
          newScores.task_execution,
          newScores.collaboration_tendency,
          newScores.risk_attitude,
        ]
      );

      await client.query('COMMIT');
      return nextVersion;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 记录历史变化
   */
  private async recordHistory(
    studentId: string,
    version: number,
    orderId: string,
    changeDetails: any
  ): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query(
        `INSERT INTO ability_dimension_history
         (user_id, profile_version, change_trigger, related_order_id,
          information_processing, creative_drive, tool_learning,
          task_execution, collaboration_tendency, risk_attitude,
          change_details)
         VALUES ($1, $2, 'order_completed', $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          studentId,
          version,
          orderId,
          changeDetails.new_scores.information_processing,
          changeDetails.new_scores.creative_drive,
          changeDetails.new_scores.tool_learning,
          changeDetails.new_scores.task_execution,
          changeDetails.new_scores.collaboration_tendency,
          changeDetails.new_scores.risk_attitude,
          JSON.stringify(changeDetails),
        ]
      );
    } finally {
      client.release();
    }
  }

  /**
   * 调用AI生成文字解读（严格按照技术规格）
   */
  private async generateAIInterpretation(
    studentId: string,
    oldScores: DimensionScores,
    newScores: DimensionScores,
    orderId: string
  ): Promise<AbilityUpdateResult> {
    // 获取学生初始画像和导师观察数据
    const data = await this.getInterpretationData(studentId, orderId);

    const systemPrompt = `你是启程平台的AI成长导师，负责解读学生的六维能力变化。

【硬性要求】
1. 每个维度的解读必须达到100-150字
2. 必须引用本次任务的真实数据（AI审核、导师观察、任务表现）
3. 必须说明分数变化的具体原因
4. 禁止使用"你做得很好""继续努力"等空话

【六个维度的数据来源】
- 信息处理：引用AI-03审核中对任务拆解的评价
- 创作驱动：引用交付物类型、客户评价中关于创意的反馈
- 工具学习：引用导师观察中的新工具使用记录
- 任务执行：引用是否按时、是否被打回的数据
- 协作倾向：引用导师对话中的求助次数
- 风险态度：引用任务难度 vs 学生等级的对比

【输出格式】
{
  "dimension_updates": [
    {
      "dimension": "信息处理",
      "old_score": 65,
      "new_score": 70,
      "reason": "本次任务中的具体表现（30-50字）",
      "description": "深度解读，包含具体例子和能力分析（100-150字）",
      "description_word_count": 实际字数
    }
    // ... 其他五个维度
  ],
  "overall_trend": "整体趋势分析（50字）",
  "personality_label_update": "人格标签变化说明（50字）",
  "total_word_count": 总字数
}`;

    const userPrompt = this.buildInterpretationPrompt(
      oldScores,
      newScores,
      data
    );

    // 【关键】每个维度需要200 tokens，6个维度=1200 tokens，加上其他内容=1500 tokens
    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      temperature: 0.5,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('AI返回的内容类型不正确');
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI返回的内容中没有找到JSON');
    }

    const result = JSON.parse(jsonMatch[0]);

    // 【关键】字数验证
    let totalWordCount = 0;
    result.dimension_updates.forEach((dim: any) => {
      const wordCount = dim.description.length;
      totalWordCount += wordCount;

      if (wordCount < 100) {
        logger.warn(`[六维能力更新] ${dim.dimension}解读字数不足: ${wordCount}字`);
      }
    });

    logger.info(`[六维能力更新] 总字数: ${totalWordCount}`);

    // 如果总字数不足600字，记录警告
    if (totalWordCount < 600) {
      logger.error(`[六维能力更新] 总字数不足: ${totalWordCount}字，要求≥600字`);
    }

    return result;
  }

  /**
   * 获取AI解读所需的数据
   */
  private async getInterpretationData(studentId: string, orderId: string) {
    const client = await pool.connect();
    try {
      // 获取初始画像
      const initialProfile = await client.query(
        `SELECT * FROM user_ability_profiles
         WHERE user_id = $1 AND version = 1 LIMIT 1`,
        [studentId]
      );

      // 获取导师观察
      const observations = await client.query(
        `SELECT * FROM mentor_growth_observations
         WHERE order_id = $1`,
        [orderId]
      );

      return {
        initialProfile: initialProfile.rows[0],
        observations: observations.rows,
      };
    } finally {
      client.release();
    }
  }

  /**
   * 构建AI解读的提示词
   */
  private buildInterpretationPrompt(
    oldScores: DimensionScores,
    newScores: DimensionScores,
    data: any
  ): string {
    let prompt = `# 学生六维能力变化数据\n\n## 六维分数变化\n`;

    const dimensions = [
      { key: 'information_processing', name: '信息处理' },
      { key: 'creative_drive', name: '创作驱动' },
      { key: 'tool_learning', name: '工具学习' },
      { key: 'task_execution', name: '任务执行' },
      { key: 'collaboration_tendency', name: '协作倾向' },
      { key: 'risk_attitude', name: '风险态度' },
    ];

    dimensions.forEach((dim) => {
      const oldScore = oldScores[dim.key] || 0;
      const newScore = newScores[dim.key] || 0;
      const change = newScore - oldScore;
      prompt += `- ${dim.name}：${oldScore} → ${newScore} (${change >= 0 ? '+' : ''}${change})\n`;
    });

    if (data.initialProfile) {
      prompt += `\n## 初始画像（入驻时）\n`;
      prompt += `人格标签：${data.initialProfile.personality_label || '未设置'}\n`;
    }

    if (data.observations && data.observations.length > 0) {
      prompt += `\n## 本次任务的导师观察\n`;
      data.observations.forEach((obs: any, index: number) => {
        prompt += `\n### 观察 ${index + 1}\n`;
        prompt += `${obs.observation_content}\n`;
      });
    }

    prompt += `\n---\n请基于以上数据，生成六维能力变化的文字解读。`;

    return prompt;
  }

  /**
   * 更新维度描述
   */
  private async updateDimensionDescriptions(
    studentId: string,
    version: number,
    interpretation: AbilityUpdateResult
  ): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query(
        `UPDATE user_ability_profiles
         SET dimension_descriptions = $1
         WHERE user_id = $2 AND version = $3`,
        [JSON.stringify(interpretation.dimension_updates), studentId, version]
      );
    } finally {
      client.release();
    }
  }

  /**
   * 获取学生的能力变化历史
   */
  async getAbilityHistory(studentId: string): Promise<any[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM ability_dimension_history
         WHERE user_id = $1
         ORDER BY created_at ASC`,
        [studentId]
      );
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * 获取学生的所有画像版本
   */
  async getProfileVersions(studentId: string): Promise<any[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM user_ability_profiles
         WHERE user_id = $1
         ORDER BY version ASC`,
        [studentId]
      );
      return result.rows;
    } finally {
      client.release();
    }
  }
}

export default new AbilityDimensionUpdateService();
