import { pool } from '../utils/db';
import logger from '../utils/logger';
import vectorGenerationService from './vectorGenerationService';

/**
 * 真正基于向量的匹配引擎
 * 直接使用向量计算，不依赖中间对象
 *
 * 适配版：使用qicheng的PostgreSQL pool
 */

interface MatchResult {
  taskId: string;
  studentId: string;
  overallScore: number;
  skillMatch: number;
  difficultyMatch: number;
  domainMatch: number;
  growthPotential: number;
  reliability: number;
  preferenceAlignment: number;
  recommendation: string;
  reasoning: string[];
  concerns: string[];
}

class SemanticMatchingEngine {

  /**
   * 为任务生成并存储向量
   */
  async indexTask(taskId: string, description: string, requirements: any): Promise<void> {
    logger.info(`[Matching] Indexing task: ${taskId}`);

    // 生成向量（86维）
    const taskVector = await vectorGenerationService.generateTaskVector(description, requirements);

    // 存储到数据库
    const client = await pool.connect();
    try {
      await client.query(`
        UPDATE atomic_courses
        SET metadata = jsonb_set(
          COALESCE(metadata, '{}'::jsonb),
          '{taskVector}',
          $1::jsonb
        ),
        metadata = jsonb_set(
          metadata,
          '{lastIndexed}',
          $2::jsonb
        )
        WHERE id = $3
      `, [JSON.stringify(taskVector), JSON.stringify(new Date().toISOString()), taskId]);

      logger.info(`[Matching] Task indexed: ${taskVector.length} dimensions`);
    } finally {
      client.release();
    }
  }

  /**
   * 为学生生成并存储向量
   */
  async indexStudent(studentId: string): Promise<void> {
    logger.info(`[Matching] Indexing student: ${studentId}`);

    // 生成向量（77维）
    const studentVector = await vectorGenerationService.generateStudentVector(studentId);

    // 存储到数据库
    const client = await pool.connect();
    try {
      await client.query(`
        UPDATE users
        SET metadata = jsonb_set(
          COALESCE(metadata, '{}'::jsonb),
          '{studentVector}',
          $1::jsonb
        ),
        metadata = jsonb_set(
          metadata,
          '{lastIndexed}',
          $2::jsonb
        )
        WHERE id = $3
      `, [JSON.stringify(studentVector), JSON.stringify(new Date().toISOString()), studentId]);

      logger.info(`[Matching] Student indexed: ${studentVector.length} dimensions`);
    } finally {
      client.release();
    }
  }

  /**
   * 核心匹配函数：基于向量计算匹配度
   */
  async matchTaskWithStudent(taskId: string, studentId: string): Promise<MatchResult> {
    logger.info(`[Matching] Matching task ${taskId} with student ${studentId}`);

    const client = await pool.connect();
    try {
      // 1. 获取任务向量
      const taskResult = await client.query(
        'SELECT id, name, scenario, stages, metadata FROM atomic_courses WHERE id = $1',
        [taskId]
      );

      if (taskResult.rows.length === 0) {
        throw new Error(`Task ${taskId} not found`);
      }

      const task = taskResult.rows[0];
      let taskVector = task.metadata?.taskVector;

      // 如果向量不存在，生成它
      if (!taskVector) {
        await this.indexTask(taskId, task.scenario, task.stages);
        const updatedTaskResult = await client.query(
          'SELECT metadata FROM atomic_courses WHERE id = $1',
          [taskId]
        );
        taskVector = updatedTaskResult.rows[0].metadata.taskVector;
      }

      // 2. 获取学生向量
      const studentResult = await client.query(
        'SELECT id, name, metadata FROM users WHERE id = $1',
        [studentId]
      );

      if (studentResult.rows.length === 0) {
        throw new Error(`Student ${studentId} not found`);
      }

      const student = studentResult.rows[0];
      let studentVector = student.metadata?.studentVector;

      // 如果向量不存在，生成它
      if (!studentVector) {
        await this.indexStudent(studentId);
        const updatedStudentResult = await client.query(
          'SELECT metadata FROM users WHERE id = $1',
          [studentId]
        );
        studentVector = updatedStudentResult.rows[0].metadata.studentVector;
      }

      // 3. 基于向量计算6个维度的匹配分数
      const skillMatch = this.calculateSkillMatchFromVectors(taskVector, studentVector);
      const difficultyMatch = this.calculateDifficultyMatchFromVectors(taskVector, studentVector);
      const domainMatch = this.calculateDomainMatchFromVectors(taskVector, studentVector);
      const growthPotential = this.calculateGrowthPotentialFromVectors(taskVector, studentVector);
      const reliability = this.extractReliabilityFromVector(studentVector);
      const preferenceAlignment = this.calculatePreferenceAlignment(taskVector, studentVector);

      // 4. 加权求和
      const overallScore =
        skillMatch * 0.35 +
        difficultyMatch * 0.20 +
        domainMatch * 0.15 +
        growthPotential * 0.15 +
        reliability * 0.10 +
        preferenceAlignment * 0.05;

      // 5. 生成推荐
      const { recommendation, reasoning, concerns } = this.generateRecommendation(
        overallScore,
        { skillMatch, difficultyMatch, domainMatch, growthPotential, reliability, preferenceAlignment }
      );

      return {
        taskId,
        studentId,
        overallScore,
        skillMatch,
        difficultyMatch,
        domainMatch,
        growthPotential,
        reliability,
        preferenceAlignment,
        recommendation,
        reasoning,
        concerns
      };
    } finally {
      client.release();
    }
  }

  /**
   * 维度1：技能匹配 (35%)
   */
  private calculateSkillMatchFromVectors(taskVector: number[], studentVector: number[]): number {
    const taskSkills = taskVector.slice(0, 64);
    const studentSkills = studentVector.slice(0, 64);

    let totalScore = 0;
    let totalWeight = 0;

    for (let i = 0; i < 64; i++) {
      const required = taskSkills[i];
      const studentProf = studentSkills[i];

      if (required > 0.1) {
        const weight = required;
        const gap = required - studentProf;
        let skillScore: number;

        if (gap <= 0) skillScore = 1.0;
        else if (gap <= 0.1) skillScore = 0.9;
        else if (gap <= 0.2) skillScore = 0.7;
        else if (gap <= 0.3) skillScore = 0.5;
        else skillScore = 0.3;

        totalScore += skillScore * weight;
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0.8;
  }

  /**
   * 维度2：难度匹配 (20%) - 最近发展区理论
   */
  private calculateDifficultyMatchFromVectors(taskVector: number[], studentVector: number[]): number {
    const taskDifficulty = taskVector[71];
    const studentSkills = studentVector.slice(0, 64);
    const avgSkill = studentSkills.reduce((a, b) => a + b, 0) / 64;
    const coursesCompleted = studentVector[76];
    const studentLevel = avgSkill * 0.7 + coursesCompleted * 0.3;

    const optimalMin = studentLevel + 0.1;
    const optimalMax = studentLevel + 0.2;

    if (taskDifficulty >= optimalMin && taskDifficulty <= optimalMax) {
      return 1.0;
    }

    const distance = Math.min(
      Math.abs(taskDifficulty - optimalMin),
      Math.abs(taskDifficulty - optimalMax)
    );

    if (distance <= 0.1) return 0.9;
    else if (distance <= 0.2) return 0.7;
    else if (taskDifficulty < optimalMin) return 0.5;
    else return 0.3;
  }

  /**
   * 维度3：领域匹配 (15%) - 余弦相似度
   */
  private calculateDomainMatchFromVectors(taskVector: number[], studentVector: number[]): number {
    const taskDomain = taskVector.slice(64, 71);
    const studentDomain = studentVector.slice(64, 71);
    return this.cosineSimilarity(taskDomain, studentDomain);
  }

  /**
   * 维度4：成长潜力 (15%)
   */
  private calculateGrowthPotentialFromVectors(taskVector: number[], studentVector: number[]): number {
    const taskSkills = taskVector.slice(0, 64);
    const studentSkills = studentVector.slice(0, 64);

    let newSkillsCount = 0;
    let improvableSkillsCount = 0;

    for (let i = 0; i < 64; i++) {
      const required = taskSkills[i];
      const studentProf = studentSkills[i];

      if (required > 0.1) {
        if (studentProf < 0.2) newSkillsCount++;
        else if (studentProf < 0.7) improvableSkillsCount++;
      }
    }

    const newSkillValue = Math.min(newSkillsCount * 0.05, 0.6);
    const improveValue = Math.min(improvableSkillsCount * 0.03, 0.4);
    const learningSpeed = studentVector[71];
    const speedBonus = learningSpeed * 0.2;

    return Math.min(newSkillValue + improveValue + speedBonus + 0.2, 1.0);
  }

  /**
   * 维度5：可靠性 (10%)
   */
  private extractReliabilityFromVector(studentVector: number[]): number {
    return studentVector[72];
  }

  /**
   * 维度6：偏好对齐 (5%)
   */
  private calculatePreferenceAlignment(taskVector: number[], studentVector: number[]): number {
    const domainMatch = this.calculateDomainMatchFromVectors(taskVector, studentVector);
    return domainMatch * 0.5 + 0.5;
  }

  /**
   * 余弦相似度
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (normA * normB);
  }

  /**
   * 生成推荐
   */
  private generateRecommendation(
    overallScore: number,
    scores: any
  ): { recommendation: string; reasoning: string[]; concerns: string[] } {
    const reasoning: string[] = [];
    const concerns: string[] = [];

    let recommendation: string;
    if (overallScore >= 0.8) {
      recommendation = 'highly_recommended';
      reasoning.push('整体匹配度非常高，强烈推荐');
    } else if (overallScore >= 0.7) {
      recommendation = 'recommended';
      reasoning.push('整体匹配度良好，推荐尝试');
    } else if (overallScore >= 0.6) {
      recommendation = 'acceptable';
      reasoning.push('基本匹配，可以尝试但需要额外努力');
    } else {
      recommendation = 'not_recommended';
      reasoning.push('匹配度较低，不建议此时尝试');
    }

    if (scores.skillMatch >= 0.8) {
      reasoning.push('技能匹配度高，具备完成任务的核心能力');
    } else if (scores.skillMatch < 0.6) {
      concerns.push('缺少关键技能，需要大量学习');
    }

    if (scores.difficultyMatch >= 0.9) {
      reasoning.push('难度适中，处于最近发展区，学习效果最佳');
    } else if (scores.difficultyMatch < 0.5) {
      concerns.push('任务难度不太合适');
    }

    if (scores.growthPotential >= 0.7) {
      reasoning.push('成长潜力大，能学到新技能');
    }

    if (scores.reliability < 0.6) {
      concerns.push('历史完成率较低，建议提高学习稳定性');
    }

    return { recommendation, reasoning, concerns };
  }

  /**
   * 批量匹配：为任务找到最合适的学生
   */
  async findBestStudentsForTask(taskId: string, limit: number = 10): Promise<MatchResult[]> {
    const client = await pool.connect();
    try {
      const studentsResult = await client.query(
        "SELECT id FROM users WHERE role = 'student'"
      );

      const students = studentsResult.rows;

      const results = await Promise.all(
        students.map(student => this.matchTaskWithStudent(taskId, student.id))
      );

      results.sort((a, b) => b.overallScore - a.overallScore);
      return results.slice(0, limit);
    } finally {
      client.release();
    }
  }

  /**
   * 批量匹配：为学生找到最合适的任务
   */
  async findBestTasksForStudent(studentId: string, limit: number = 10): Promise<MatchResult[]> {
    const client = await pool.connect();
    try {
      const tasksResult = await client.query('SELECT id FROM atomic_courses');
      const tasks = tasksResult.rows;

      const results = await Promise.all(
        tasks.map(task => this.matchTaskWithStudent(task.id, studentId))
      );

      results.sort((a, b) => b.overallScore - a.overallScore);
      return results.slice(0, limit);
    } finally {
      client.release();
    }
  }

  /**
   * 批量索引所有任务
   */
  async indexAllTasks(): Promise<void> {
    logger.info('[Matching] Indexing all tasks...');

    const client = await pool.connect();
    try {
      const coursesResult = await client.query(
        'SELECT id, name, scenario, stages FROM atomic_courses'
      );

      const courses = coursesResult.rows;

      for (const course of courses) {
        try {
          await this.indexTask(course.id, course.scenario, course.stages);
          logger.info(`✓ Indexed: ${course.name}`);
        } catch (error) {
          logger.error(`✗ Failed: ${course.id}`, error);
        }
      }

      logger.info('[Matching] All tasks indexed');
    } finally {
      client.release();
    }
  }

  /**
   * 批量索引所有学生
   */
  async indexAllStudents(): Promise<void> {
    logger.info('[Matching] Indexing all students...');

    const client = await pool.connect();
    try {
      const studentsResult = await client.query(
        "SELECT id, name FROM users WHERE role = 'student'"
      );

      const students = studentsResult.rows;

      for (const student of students) {
        try {
          await this.indexStudent(student.id);
          logger.info(`✓ Indexed: ${student.id}`);
        } catch (error) {
          logger.error(`✗ Failed: ${student.id}`, error);
        }
      }

      logger.info('[Matching] All students indexed');
    } finally {
      client.release();
    }
  }

  /**
   * 兼容方法：保存匹配结果
   * 旧API兼容性
   */
  async saveMatchResults(taskId: string, matchResults: MatchResult[]): Promise<void> {
    logger.info(`[Matching] Saving ${matchResults.length} match results for task ${taskId}`);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 删除旧的匹配结果
      await client.query(
        'DELETE FROM task_matches WHERE task_id = $1',
        [taskId]
      );

      // 插入新的匹配结果
      for (const result of matchResults) {
        await client.query(`
          INSERT INTO task_matches (
            task_id, student_id, overall_score,
            skill_match, difficulty_match, domain_match,
            growth_potential, reliability, preference_alignment,
            recommendation, reasoning, concerns,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
          ON CONFLICT (task_id, student_id) DO UPDATE SET
            overall_score = EXCLUDED.overall_score,
            skill_match = EXCLUDED.skill_match,
            difficulty_match = EXCLUDED.difficulty_match,
            domain_match = EXCLUDED.domain_match,
            growth_potential = EXCLUDED.growth_potential,
            reliability = EXCLUDED.reliability,
            preference_alignment = EXCLUDED.preference_alignment,
            recommendation = EXCLUDED.recommendation,
            reasoning = EXCLUDED.reasoning,
            concerns = EXCLUDED.concerns,
            updated_at = NOW()
        `, [
          taskId,
          result.studentId,
          result.overallScore,
          result.skillMatch,
          result.difficultyMatch,
          result.domainMatch,
          result.growthPotential,
          result.reliability,
          result.preferenceAlignment,
          result.recommendation,
          JSON.stringify(result.reasoning),
          JSON.stringify(result.concerns)
        ]);
      }

      await client.query('COMMIT');
      logger.info(`[Matching] Saved ${matchResults.length} match results`);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('[Matching] Error saving match results:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

// 导出单例
export default new SemanticMatchingEngine();
