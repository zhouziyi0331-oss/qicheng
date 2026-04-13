import pool from '../config/database';

/**
 * OPC测评服务
 */
export class OPCAssessmentService {
  /**
   * 开始测评
   */
  static async startAssessment(studentId: number, assessmentType: string = 'full') {
    // 获取题目
    const questionsResult = await pool.query(
      `SELECT * FROM opc_assessment_questions WHERE is_active = TRUE ORDER BY RANDOM() LIMIT 20`
    );

    // 创建测评记录
    const result = await pool.query(
      `INSERT INTO opc_assessments (student_id, assessment_type, total_questions)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [studentId, assessmentType, questionsResult.rows.length]
    );

    return {
      assessment: result.rows[0],
      questions: questionsResult.rows
    };
  }

  /**
   * 提交答案
   */
  static async submitAnswer(assessmentId: number, questionId: number, answer: any) {
    // 获取题目和评分规则
    const questionResult = await pool.query(
      `SELECT * FROM opc_assessment_questions WHERE id = $1`,
      [questionId]
    );

    const question = questionResult.rows[0];
    const scoringRule = question.scoring_rule;

    // 计算得分
    let score = 0;
    if (question.question_type === 'single_choice') {
      score = scoringRule[answer] || 0;
    } else if (question.question_type === 'scale') {
      score = eval(scoringRule.formula.replace('score', answer));
    }

    // 保存答案
    await pool.query(
      `INSERT INTO opc_assessment_answers (assessment_id, question_id, answer, score)
       VALUES ($1, $2, $3, $4)`,
      [assessmentId, questionId, JSON.stringify(answer), score]
    );

    // 更新已答题数
    await pool.query(
      `UPDATE opc_assessments SET answered_questions = answered_questions + 1 WHERE id = $1`,
      [assessmentId]
    );
  }

  /**
   * 完成测评并生成结果
   */
  static async completeAssessment(assessmentId: number) {
    // 获取所有答案
    const answersResult = await pool.query(
      `SELECT a.*, q.dimension
       FROM opc_assessment_answers a
       JOIN opc_assessment_questions q ON a.question_id = q.id
       WHERE a.assessment_id = $1`,
      [assessmentId]
    );

    // 计算各维度分数
    const scores: any = { openness: [], persistence: [], creativity: [] };
    for (const answer of answersResult.rows) {
      scores[answer.dimension].push(answer.score);
    }

    const opennessScore = Math.round(scores.openness.reduce((a: number, b: number) => a + b, 0) / scores.openness.length);
    const persistenceScore = Math.round(scores.persistence.reduce((a: number, b: number) => a + b, 0) / scores.persistence.length);
    const creativityScore = Math.round(scores.creativity.reduce((a: number, b: number) => a + b, 0) / scores.creativity.length);

    // 计算综合评级
    const avgScore = (opennessScore + persistenceScore + creativityScore) / 3;
    let overallRating = 'D';
    if (avgScore >= 90) overallRating = 'S';
    else if (avgScore >= 80) overallRating = 'A';
    else if (avgScore >= 70) overallRating = 'B';
    else if (avgScore >= 60) overallRating = 'C';

    // 生成分析
    const strengths = [];
    const weaknesses = [];
    const recommendations = [];

    if (opennessScore >= 80) strengths.push('开放性强，乐于接受新事物');
    else if (opennessScore < 60) weaknesses.push('开放性较弱，建议多尝试新领域');

    if (persistenceScore >= 80) strengths.push('坚持性强，能够持续投入');
    else if (persistenceScore < 60) weaknesses.push('坚持性较弱，建议培养耐心');

    if (creativityScore >= 80) strengths.push('创造力强，善于创新');
    else if (creativityScore < 60) weaknesses.push('创造力较弱，建议多思考多实践');

    recommendations.push('建议从Lv.0入门任务开始，逐步提升能力');
    recommendations.push('多参与社群交流，学习他人经验');

    // 保存结果
    const assessmentResult = await pool.query(
      `SELECT student_id FROM opc_assessments WHERE id = $1`,
      [assessmentId]
    );

    const result = await pool.query(
      `INSERT INTO opc_assessment_results
       (assessment_id, student_id, openness_score, persistence_score, creativity_score,
        overall_rating, strengths, weaknesses, recommendations)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        assessmentId,
        assessmentResult.rows[0].student_id,
        opennessScore,
        persistenceScore,
        creativityScore,
        overallRating,
        JSON.stringify(strengths),
        JSON.stringify(weaknesses),
        JSON.stringify(recommendations)
      ]
    );

    // 更新测评状态
    await pool.query(
      `UPDATE opc_assessments SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [assessmentId]
    );

    return result.rows[0];
  }

  /**
   * 获取测评结果
   */
  static async getAssessmentResult(assessmentId: number) {
    const result = await pool.query(
      `SELECT * FROM opc_assessment_results WHERE assessment_id = $1`,
      [assessmentId]
    );

    return result.rows[0];
  }
}

/**
 * 成长报告服务
 */
export class GrowthReportService {
  /**
   * 生成成长报告
   */
  static async generateReport(studentId: number, reportPeriod: string, periodStart: Date, periodEnd: Date) {
    // 获取任务统计
    const tasksResult = await pool.query(
      `SELECT COUNT(*) as completed, SUM(payment) as earnings
       FROM tasks
       WHERE student_id = $1 AND status = 'completed'
       AND completed_at BETWEEN $2 AND $3`,
      [studentId, periodStart, periodEnd]
    );

    const tasksCompleted = parseInt(tasksResult.rows[0].completed);
    const totalEarnings = parseFloat(tasksResult.rows[0].earnings) || 0;

    // 获取能力变化
    const abilityChanges = await this.getAbilityChanges(studentId, periodStart, periodEnd);

    // 获取等级变化
    const levelChanges = await this.getLevelChanges(studentId, periodStart, periodEnd);

    // 获取成长亮点
    const highlights = await this.getHighlights(studentId, periodStart, periodEnd);

    // 获取里程碑
    const milestones = await this.getMilestones(studentId, periodStart, periodEnd);

    // 生成雷达图数据
    const radarChartData = await this.getRadarChartData(studentId);

    // 生成趋势数据
    const trendData = await this.getTrendData(studentId, periodStart, periodEnd);

    // AI分析（模拟）
    const aiInsights = this.generateAIInsights(tasksCompleted, totalEarnings, abilityChanges);
    const aiSuggestions = this.generateAISuggestions(abilityChanges, levelChanges);

    // 保存报告
    const result = await pool.query(
      `INSERT INTO growth_reports
       (student_id, report_period, period_start, period_end, tasks_completed, total_earnings,
        ability_changes, level_changes, highlights, milestones, radar_chart_data, trend_data,
        ai_insights, ai_suggestions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        studentId, reportPeriod, periodStart, periodEnd, tasksCompleted, totalEarnings,
        JSON.stringify(abilityChanges), JSON.stringify(levelChanges),
        JSON.stringify(highlights), JSON.stringify(milestones),
        JSON.stringify(radarChartData), JSON.stringify(trendData),
        aiInsights, aiSuggestions
      ]
    );

    return result.rows[0];
  }

  /**
   * 获取能力变化
   */
  private static async getAbilityChanges(studentId: number, periodStart: Date, periodEnd: Date) {
    const startSnapshot = await pool.query(
      `SELECT * FROM ability_snapshots WHERE student_id = $1 AND snapshot_date <= $2 ORDER BY snapshot_date DESC LIMIT 1`,
      [studentId, periodStart]
    );

    const endSnapshot = await pool.query(
      `SELECT * FROM ability_snapshots WHERE student_id = $1 AND snapshot_date <= $2 ORDER BY snapshot_date DESC LIMIT 1`,
      [studentId, periodEnd]
    );

    if (startSnapshot.rows.length === 0 || endSnapshot.rows.length === 0) {
      return {};
    }

    const start = startSnapshot.rows[0];
    const end = endSnapshot.rows[0];

    return {
      technical_ability: end.technical_ability - start.technical_ability,
      creative_ability: end.creative_ability - start.creative_ability,
      communication_ability: end.communication_ability - start.communication_ability,
      execution_ability: end.execution_ability - start.execution_ability,
      learning_ability: end.learning_ability - start.learning_ability,
      responsibility: end.responsibility - start.responsibility
    };
  }

  /**
   * 获取等级变化
   */
  private static async getLevelChanges(studentId: number, periodStart: Date, periodEnd: Date) {
    const result = await pool.query(
      `SELECT * FROM growth_history WHERE student_id = $1 AND created_at BETWEEN $2 AND $3 ORDER BY created_at`,
      [studentId, periodStart, periodEnd]
    );

    return result.rows;
  }

  /**
   * 获取成长亮点
   */
  private static async getHighlights(studentId: number, periodStart: Date, periodEnd: Date) {
    return [
      '完成首个AI视频任务',
      '技术能力提升20分',
      '获得"快速学习者"标签'
    ];
  }

  /**
   * 获取里程碑
   */
  private static async getMilestones(studentId: number, periodStart: Date, periodEnd: Date) {
    const result = await pool.query(
      `SELECT * FROM growth_milestones WHERE student_id = $1 AND achieved_at BETWEEN $2 AND $3`,
      [studentId, periodStart, periodEnd]
    );

    return result.rows;
  }

  /**
   * 获取雷达图数据
   */
  private static async getRadarChartData(studentId: number) {
    const result = await pool.query(
      `SELECT * FROM student_abilities WHERE student_id = $1`,
      [studentId]
    );

    if (result.rows.length === 0) {
      return {};
    }

    const ability = result.rows[0];
    return {
      technical_ability: ability.technical_ability,
      creative_ability: ability.creative_ability,
      communication_ability: ability.communication_ability,
      execution_ability: ability.execution_ability,
      learning_ability: ability.learning_ability,
      responsibility: ability.responsibility
    };
  }

  /**
   * 获取趋势数据
   */
  private static async getTrendData(studentId: number, periodStart: Date, periodEnd: Date) {
    const result = await pool.query(
      `SELECT * FROM ability_snapshots WHERE student_id = $1 AND snapshot_date BETWEEN $2 AND $3 ORDER BY snapshot_date`,
      [studentId, periodStart, periodEnd]
    );

    return result.rows;
  }

  /**
   * 生成AI洞察
   */
  private static generateAIInsights(tasksCompleted: number, totalEarnings: number, abilityChanges: any) {
    return `本期完成${tasksCompleted}个任务，累计收入${totalEarnings}元。技术能力提升明显，建议继续保持学习节奏。`;
  }

  /**
   * 生成AI建议
   */
  private static generateAISuggestions(abilityChanges: any, levelChanges: any) {
    return '建议多尝试创意类任务，提升创造力维度。可以考虑挑战更高难度的任务。';
  }

  /**
   * 创建能力快照
   */
  static async createAbilitySnapshot(studentId: number) {
    const abilityResult = await pool.query(
      `SELECT * FROM student_abilities WHERE student_id = $1`,
      [studentId]
    );

    if (abilityResult.rows.length === 0) {
      return;
    }

    const ability = abilityResult.rows[0];

    await pool.query(
      `INSERT INTO ability_snapshots
       (student_id, technical_ability, creative_ability, communication_ability,
        execution_ability, learning_ability, responsibility, current_level, track)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (student_id, snapshot_date) DO UPDATE SET
       technical_ability = EXCLUDED.technical_ability,
       creative_ability = EXCLUDED.creative_ability,
       communication_ability = EXCLUDED.communication_ability,
       execution_ability = EXCLUDED.execution_ability,
       learning_ability = EXCLUDED.learning_ability,
       responsibility = EXCLUDED.responsibility,
       current_level = EXCLUDED.current_level,
       track = EXCLUDED.track`,
      [
        studentId,
        ability.technical_ability,
        ability.creative_ability,
        ability.communication_ability,
        ability.execution_ability,
        ability.learning_ability,
        ability.responsibility,
        ability.current_level,
        ability.track
      ]
    );
  }
}
