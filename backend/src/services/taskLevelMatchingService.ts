/**
 * 任务分级和智能匹配服务
 *
 * 处理任务等级计算、学生等级管理、智能匹配等功能
 */

import { pool, QueryResult } from '../utils/db';
import logger from '../utils/logger';
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../../config';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

// =====================================================
// 类型定义
// =====================================================

export interface TaskLevel {
  id: string;
  level_code: string;
  level_name: string;
  level_order: number;
  min_complexity_score: number;
  max_complexity_score: number;
  min_price: number;
  max_price: number;
  estimated_hours_range: string;
  min_student_level: number;
  required_completed_tasks: number;
  min_avg_rating: number;
  description: string;
  examples: string;
}

export interface StudentLevel {
  id: string;
  student_id: string;
  current_level: number;
  level_name: string;
  total_exp: number;
  current_level_exp: number;
  next_level_exp: number;
  total_tasks_completed: number;
  total_tasks_failed: number;
  success_rate: number;
  l1_completed: number;
  l2_completed: number;
  l3_completed: number;
  l4_completed: number;
  l5_completed: number;
  avg_rating: number;
  total_ratings: number;
  quality_score: number;
  speed_score: number;
  communication_score: number;
  max_task_level: number;
  last_level_up_at?: Date;
  level_up_count: number;
}

export interface MatchScore {
  task_id: string;
  student_id: string;
  total_score: number;
  level_match_score: number;
  skill_match_score: number;
  experience_match_score: number;
  availability_score: number;
  location_score: number;
  price_match_score: number;
  history_score: number;
  match_reasons: any[];
  mismatch_reasons: any[];
  recommendation_level: string;
  ai_analysis?: string;
}

// =====================================================
// 任务分级和匹配服务类
// =====================================================

class TaskLevelMatchingService {
  /**
   * 计算任务等级
   */
  async calculateTaskLevel(taskId: string): Promise<string> {
    const client = await pool.connect();

    try {
      const result = await client.query(
        `SELECT calculate_task_level($1) as level`,
        [taskId]
      );

      const level = result.rows[0].level;

      // 更新任务的等级
      await client.query(
        `UPDATE tasks SET task_level = $1 WHERE id = $2`,
        [level, taskId]
      );

      logger.info('Task level calculated', { taskId, level });

      return level;
    } catch (error: unknown) {
      logger.error('Failed to calculate task level', { error, taskId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 获取所有任务等级定义
   */
  async getTaskLevels(): Promise<TaskLevel[]> {
    const client = await pool.connect();

    try {
      const result = await client.query(
        `SELECT * FROM task_levels WHERE is_active = true ORDER BY level_order`
      );

      return result.rows;
    } catch (error: unknown) {
      logger.error('Failed to get task levels', { error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 获取学生等级信息
   */
  async getStudentLevel(studentId: string): Promise<StudentLevel | null> {
    const client = await pool.connect();

    try {
      const result = await client.query(
        `SELECT * FROM student_levels WHERE student_id = $1`,
        [studentId]
      );

      if (result.rows.length === 0) {
        // 如果不存在，创建初始等级
        await this.updateStudentLevel(studentId);
        return await this.getStudentLevel(studentId);
      }

      return result.rows[0];
    } catch (error: unknown) {
      logger.error('Failed to get student level', { error, studentId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 更新学生等级
   */
  async updateStudentLevel(studentId: string): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query(`SELECT update_student_level($1)`, [studentId]);

      logger.info('Student level updated', { studentId });
    } catch (error: unknown) {
      logger.error('Failed to update student level', { error, studentId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 智能匹配：为任务找到合适的学生
   */
  async matchTaskWithStudents(taskId: string, limit: number = 10): Promise<MatchScore[]> {
    const client = await pool.connect();

    try {
      // 1. 获取任务信息
      const taskResult = await client.query(
        `SELECT * FROM tasks WHERE id = $1`,
        [taskId]
      );

      if (taskResult.rows.length === 0) {
        throw new Error('Task not found');
      }

      const task = taskResult.rows[0];

      // 2. 确保任务有等级
      if (!task.task_level) {
        await this.calculateTaskLevel(taskId);
        task.task_level = await client.query(
          `SELECT task_level FROM tasks WHERE id = $1`,
          [taskId]
        ).then(r => r.rows[0].task_level);
      }

      // 3. 获取符合条件的学生
      const studentsResult = await client.query(
        `SELECT u.id, u.username, sl.*
         FROM users u
         LEFT JOIN student_levels sl ON u.id = sl.student_id
         WHERE u.role = 'student'
           AND u.is_active = true
           AND (sl.max_task_level >= $1 OR sl.max_task_level IS NULL)`,
        [parseInt(task.task_level.substring(1))] // L3 -> 3
      );

      const students = studentsResult.rows;

      // 4. 计算每个学生的匹配分数
      const matchScores: MatchScore[] = [];

      for (const student of students) {
        const score = await this.calculateMatchScore(task, student);
        matchScores.push(score);

        // 保存到数据库
        await this.saveMatchScore(score);
      }

      // 5. 按分数排序并返回前N个
      matchScores.sort((a, b) => b.total_score - a.total_score);

      // 6. 更新任务的最佳匹配
      if (matchScores.length > 0) {
        await client.query(
          `UPDATE tasks
           SET best_match_student_id = $1,
               best_match_score = $2,
               match_count = $3,
               auto_matched = true
           WHERE id = $4`,
          [
            matchScores[0].student_id,
            matchScores[0].total_score,
            matchScores.length,
            taskId,
          ]
        );
      }

      logger.info('Task matched with students', {
        taskId,
        matchCount: matchScores.length,
        bestScore: matchScores[0]?.total_score,
      });

      return matchScores.slice(0, limit);
    } catch (error: unknown) {
      logger.error('Failed to match task with students', { error, taskId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 计算单个学生与任务的匹配分数
   */
  private async calculateMatchScore(task: any, student: any): Promise<MatchScore> {
    const client = await pool.connect();

    try {
      // 获取匹配规则权重
      const rulesResult = await client.query(
        `SELECT * FROM matching_rules WHERE is_active = true`
      );

      const rules = rulesResult.rows;
      const weights: { [key: string]: number } = {};
      rules.forEach(rule => {
        weights[rule.rule_type] = rule.weight;
      });

      // 1. 等级匹配分数
      const levelMatchScore = this.calculateLevelMatch(task, student);

      // 2. 技能匹配分数
      const skillMatchScore = await this.calculateSkillMatch(client, task, student);

      // 3. 经验匹配分数
      const experienceMatchScore = this.calculateExperienceMatch(task, student);

      // 4. 可用性分数
      const availabilityScore = await this.calculateAvailability(client, student.id);

      // 5. 地理位置分数（暂时给固定分）
      const locationScore = 80;

      // 6. 价格匹配分数
      const priceMatchScore = await this.calculatePriceMatch(client, task, student);

      // 7. 历史合作分数
      const historyScore = await this.calculateHistoryScore(client, task.company_id, student.id);

      // 计算总分
      const totalScore =
        levelMatchScore * weights.level +
        skillMatchScore * weights.skill +
        experienceMatchScore * weights.experience +
        availabilityScore * weights.availability +
        priceMatchScore * weights.price +
        historyScore * weights.history;

      // 确定推荐等级
      let recommendationLevel = 'not_recommended';
      if (totalScore >= 85) {
        recommendationLevel = 'highly_recommended';
      } else if (totalScore >= 70) {
        recommendationLevel = 'recommended';
      } else if (totalScore >= 60) {
        recommendationLevel = 'suitable';
      }

      // 生成匹配原因
      const matchReasons = [];
      const mismatchReasons = [];

      if (levelMatchScore >= 80) {
        matchReasons.push({ reason: '等级完全匹配', weight: weights.level });
      } else if (levelMatchScore < 50) {
        mismatchReasons.push({ reason: '等级不匹配', impact: 'high' });
      }

      if (skillMatchScore >= 80) {
        matchReasons.push({ reason: '技能高度匹配', weight: weights.skill });
      } else if (skillMatchScore < 50) {
        mismatchReasons.push({ reason: '技能匹配度低', impact: 'high' });
      }

      if (historyScore >= 80) {
        matchReasons.push({ reason: '有良好合作历史', weight: weights.history });
      }

      return {
        task_id: task.id,
        student_id: student.id,
        total_score: Math.round(totalScore * 100) / 100,
        level_match_score: levelMatchScore,
        skill_match_score: skillMatchScore,
        experience_match_score: experienceMatchScore,
        availability_score: availabilityScore,
        location_score: locationScore,
        price_match_score: priceMatchScore,
        history_score: historyScore,
        match_reasons: matchReasons,
        mismatch_reasons: mismatchReasons,
        recommendation_level: recommendationLevel,
      };
    } catch (error: unknown) {
      logger.error('Failed to calculate match score', { error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 计算等级匹配分数
   */
  private calculateLevelMatch(task: any, student: any): number {
    const taskLevel = parseInt(task.task_level?.substring(1) || '2');
    const studentMaxLevel = student.max_task_level || 1;

    if (studentMaxLevel >= taskLevel) {
      // 学生等级高于或等于任务等级
      const diff = studentMaxLevel - taskLevel;
      if (diff === 0) return 100; // 完全匹配
      if (diff === 1) return 90; // 略高
      return 80; // 高很多
    } else {
      // 学生等级低于任务等级
      return Math.max(0, 50 - (taskLevel - studentMaxLevel) * 20);
    }
  }

  /**
   * 计算技能匹配分数
   */
  private async calculateSkillMatch(client: any, task: any, student: any): Promise<number> {
    // 获取任务所需技能
    const requiredAbilities = task.required_abilities || [];
    if (requiredAbilities.length === 0) return 70; // 没有特定要求，给中等分

    // 获取学生的技能
    const studentAbilitiesResult = await client.query(
      `SELECT ability_name FROM student_abilities WHERE student_id = $1`,
      [student.id]
    );

    const studentAbilities = studentAbilitiesResult.rows.map((r: any) => r.ability_name);

    if (studentAbilities.length === 0) return 30; // 学生没有技能记录

    // 计算匹配度
    const matchedCount = requiredAbilities.filter((ability: string) =>
      studentAbilities.includes(ability)
    ).length;

    return Math.min(100, (matchedCount / requiredAbilities.length) * 100 + 20);
  }

  /**
   * 计算经验匹配分数
   */
  private calculateExperienceMatch(task: any, student: any): number {
    const totalCompleted = student.total_tasks_completed || 0;
    const avgRating = student.avg_rating || 0;
    const successRate = student.success_rate || 100;

    // 基于完成任务数
    let expScore = Math.min(totalCompleted * 5, 50);

    // 基于评分
    expScore += (avgRating / 5) * 30;

    // 基于成功率
    expScore += (successRate / 100) * 20;

    return Math.min(100, expScore);
  }

  /**
   * 计算可用性分数
   */
  private async calculateAvailability(client: any, studentId: string): Promise<number> {
    // 检查学生当前是否有进行中的任务
    const activeTasksResult = await client.query(
      `SELECT COUNT(*) as count
       FROM tasks
       WHERE accepted_student_id = $1
         AND status IN ('in_progress', 'submitted', 'revision_requested')`,
      [studentId]
    );

    const activeTasksCount = parseInt(activeTasksResult.rows[0].count);

    // 活跃任务越少，可用性越高
    if (activeTasksCount === 0) return 100;
    if (activeTasksCount === 1) return 80;
    if (activeTasksCount === 2) return 60;
    return 40;
  }

  /**
   * 计算价格匹配分数
   */
  private async calculatePriceMatch(client: any, task: any, student: any): Promise<number> {
    // 获取学生过去接受的任务价格范围
    const priceResult = await client.query(
      `SELECT AVG(budget_max) as avg_price
       FROM tasks
       WHERE accepted_student_id = $1 AND status = 'completed'`,
      [student.id]
    );

    const avgPrice = priceResult.rows[0]?.avg_price;

    if (!avgPrice) return 70; // 没有历史数据，给中等分

    const taskPrice = task.budget_max || 0;
    const priceDiff = Math.abs(taskPrice - avgPrice);
    const priceRatio = priceDiff / avgPrice;

    // 价格差异越小，匹配度越高
    if (priceRatio <= 0.2) return 100;
    if (priceRatio <= 0.5) return 80;
    if (priceRatio <= 1.0) return 60;
    return 40;
  }

  /**
   * 计算历史合作分数
   */
  private async calculateHistoryScore(
    client: any,
    companyId: string,
    studentId: string
  ): Promise<number> {
    // 检查是否有历史合作
    const historyResult = await client.query(
      `SELECT COUNT(*) as count, AVG(rating) as avg_rating
       FROM tasks t
       LEFT JOIN ratings r ON t.id = r.task_id AND r.ratee_id = $2
       WHERE t.company_id = $1
         AND t.accepted_student_id = $2
         AND t.status = 'completed'`,
      [companyId, studentId]
    );

    const history = historyResult.rows[0];
    const collaborationCount = parseInt(history.count);

    if (collaborationCount === 0) return 50; // 没有历史，给中等分

    const avgRating = history.avg_rating || 4.0;

    // 基于合作次数和评分
    let score = Math.min(collaborationCount * 10, 50);
    score += (avgRating / 5) * 50;

    return Math.min(100, score);
  }

  /**
   * 保存匹配分数到数据库
   */
  private async saveMatchScore(score: MatchScore): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query(
        `INSERT INTO task_match_scores (
          task_id, student_id, total_score,
          level_match_score, skill_match_score, experience_match_score,
          availability_score, location_score, price_match_score, history_score,
          match_reasons, mismatch_reasons, recommendation_level
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (task_id, student_id)
        DO UPDATE SET
          total_score = $3,
          level_match_score = $4,
          skill_match_score = $5,
          experience_match_score = $6,
          availability_score = $7,
          location_score = $8,
          price_match_score = $9,
          history_score = $10,
          match_reasons = $11,
          mismatch_reasons = $12,
          recommendation_level = $13,
          updated_at = NOW()`,
        [
          score.task_id,
          score.student_id,
          score.total_score,
          score.level_match_score,
          score.skill_match_score,
          score.experience_match_score,
          score.availability_score,
          score.location_score,
          score.price_match_score,
          score.history_score,
          JSON.stringify(score.match_reasons),
          JSON.stringify(score.mismatch_reasons),
          score.recommendation_level,
        ]
      );
    } catch (error: unknown) {
      logger.error('Failed to save match score', { error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 获取任务的匹配学生列表
   */
  async getTaskMatches(taskId: string, limit: number = 10): Promise<any[]> {
    const client = await pool.connect();

    try {
      const result = await client.query(
        `SELECT * FROM student_match_recommendations
         WHERE task_id = $1
         ORDER BY total_score DESC
         LIMIT $2`,
        [taskId, limit]
      );

      return result.rows;
    } catch (error: unknown) {
      logger.error('Failed to get task matches', { error, taskId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 获取学生的推荐任务
   */
  async getStudentRecommendedTasks(studentId: string, limit: number = 10): Promise<any[]> {
    const client = await pool.connect();

    try {
      const result = await client.query(
        `SELECT * FROM student_match_recommendations
         WHERE student_id = $1
         ORDER BY total_score DESC
         LIMIT $2`,
        [studentId, limit]
      );

      return result.rows;
    } catch (error: unknown) {
      logger.error('Failed to get student recommended tasks', { error, studentId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 通知匹配的学生
   */
  async notifyMatchedStudents(taskId: string, topN: number = 5): Promise<void> {
    const client = await pool.connect();

    try {
      // 获取前N个匹配的学生
      const matches = await this.getTaskMatches(taskId, topN);

      for (const match of matches) {
        // 发送通知
        await client.query(
          `INSERT INTO notifications (
            user_id, user_type, type, title, content, related_task_id
          ) VALUES ($1, 'student', 'task_recommendation', '为您推荐新任务', $2, $3)`,
          [
            match.student_id,
            `系统为您推荐了一个匹配度${Math.round(match.total_score)}%的任务：${match.task_title}`,
            taskId,
          ]
        );

        // 标记为已通知
        await client.query(
          `UPDATE task_match_scores
           SET is_notified = true, notified_at = NOW()
           WHERE task_id = $1 AND student_id = $2`,
          [taskId, match.student_id]
        );
      }

      logger.info('Matched students notified', { taskId, count: matches.length });
    } catch (error: unknown) {
      logger.error('Failed to notify matched students', { error, taskId });
      throw error;
    } finally {
      client.release();
    }
  }
}

export const taskLevelMatchingService = new TaskLevelMatchingService();
