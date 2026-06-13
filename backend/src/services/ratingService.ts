/**
 * 评价系统服务
 *
 * 处理双向评价、标签、有用性投票、举报等功能
 */

import { pool, QueryResult } from '../utils/db';
import logger from '../utils/logger';

// =====================================================
// 类型定义
// =====================================================

export interface Rating {
  id: string;
  task_id: string;
  rater_id: string;
  rater_type: string;
  ratee_id: string;
  ratee_type: string;
  rating: number;
  comment?: string;
  detailed_scores?: {
    quality?: number;
    communication?: number;
    timeliness?: number;
  };
  is_anonymous: boolean;
  is_edited: boolean;
  edit_count: number;
  last_edited_at?: Date;
  helpful_count: number;
  report_count: number;
  is_verified: boolean;
  response?: string;
  response_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateRatingParams {
  task_id: string;
  rater_id: string;
  ratee_id: string;
  rating: number;
  comment?: string;
  detailed_scores?: {
    quality?: number;
    communication?: number;
    timeliness?: number;
  };
  tag_ids?: string[];
  is_anonymous?: boolean;
}

export interface RatingTag {
  id: string;
  tag_name: string;
  tag_category: string;
  applicable_to: string;
  display_name: string;
  description?: string;
  icon?: string;
  usage_count: number;
}

export interface UserRatingStats {
  user_id: string;
  user_type: string;
  total_ratings_received: number;
  avg_rating: number;
  rating_5_count: number;
  rating_4_count: number;
  rating_3_count: number;
  rating_2_count: number;
  rating_1_count: number;
  avg_quality_score?: number;
  avg_communication_score?: number;
  avg_timeliness_score?: number;
  top_positive_tags: any[];
  top_negative_tags: any[];
  last_rating_received_at?: Date;
}

// =====================================================
// 评价服务类
// =====================================================

class RatingService {
  /**
   * 创建评价
   */
  async createRating(params: CreateRatingParams): Promise<Rating> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. 检查是否可以评价
      const canRate = await client.query(
        `SELECT can_rate_task($1, $2, $3) as can_rate`,
        [params.task_id, params.rater_id, params.ratee_id]
      );

      if (!canRate.rows[0].can_rate) {
        throw new Error('Cannot rate this task or already rated');
      }

      // 2. 获取评价方和被评价方的类型
      const taskResult = await client.query(
        `SELECT company_id, accepted_student_id FROM tasks WHERE id = $1`,
        [params.task_id]
      );

      if (taskResult.rows.length === 0) {
        throw new Error('Task not found');
      }

      const task = taskResult.rows[0];
      const raterType = params.rater_id === task.company_id ? 'company' : 'student';
      const rateeType = params.ratee_id === task.company_id ? 'company' : 'student';

      // 3. 创建评价
      const ratingResult = await client.query(
        `INSERT INTO ratings (
          task_id, rater_id, rater_type, ratee_id, ratee_type,
          rating, comment, detailed_scores, is_anonymous, is_verified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
        RETURNING *`,
        [
          params.task_id,
          params.rater_id,
          raterType,
          params.ratee_id,
          rateeType,
          params.rating,
          params.comment,
          params.detailed_scores ? JSON.stringify(params.detailed_scores) : null,
          params.is_anonymous || false,
        ]
      );

      const rating = ratingResult.rows[0];

      // 4. 添加标签
      if (params.tag_ids && params.tag_ids.length > 0) {
        for (const tagId of params.tag_ids) {
          await client.query(
            `INSERT INTO rating_tag_relations (rating_id, tag_id) VALUES ($1, $2)`,
            [rating.id, tagId]
          );
        }
      }

      // 5. 发送通知给被评价方
      await client.query(
        `INSERT INTO notifications (
          user_id, user_type, type, title, content, related_task_id
        ) VALUES ($1, $2, 'rating_received', '收到新评价', $3, $4)`,
        [
          params.ratee_id,
          rateeType,
          `您收到了一条${params.rating}星评价`,
          params.task_id,
        ]
      );

      await client.query('COMMIT');

      logger.info('Rating created', {
        ratingId: rating.id,
        taskId: params.task_id,
        rating: params.rating,
      });

      return rating;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to create rating', { error, params });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 更新评价
   */
  async updateRating(
    ratingId: string,
    raterId: string,
    updates: {
      rating?: number;
      comment?: string;
      detailed_scores?: any;
      tag_ids?: string[];
    }
  ): Promise<Rating> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 验证所有权
      const existingRating = await client.query(
        `SELECT * FROM ratings WHERE id = $1 AND rater_id = $2`,
        [ratingId, raterId]
      );

      if (existingRating.rows.length === 0) {
        throw new Error('Rating not found or unauthorized');
      }

      // 更新评价
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.rating !== undefined) {
        updateFields.push(`rating = $${paramIndex}`);
        values.push(updates.rating);
        paramIndex++;
      }

      if (updates.comment !== undefined) {
        updateFields.push(`comment = $${paramIndex}`);
        values.push(updates.comment);
        paramIndex++;
      }

      if (updates.detailed_scores !== undefined) {
        updateFields.push(`detailed_scores = $${paramIndex}`);
        values.push(JSON.stringify(updates.detailed_scores));
        paramIndex++;
      }

      updateFields.push(`is_edited = true`);
      updateFields.push(`edit_count = edit_count + 1`);
      updateFields.push(`last_edited_at = NOW()`);
      updateFields.push(`updated_at = NOW()`);

      values.push(ratingId);

      const result = await client.query(
        `UPDATE ratings SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );

      // 更新标签
      if (updates.tag_ids !== undefined) {
        // 删除旧标签
        await client.query(`DELETE FROM rating_tag_relations WHERE rating_id = $1`, [ratingId]);

        // 添加新标签
        for (const tagId of updates.tag_ids) {
          await client.query(
            `INSERT INTO rating_tag_relations (rating_id, tag_id) VALUES ($1, $2)`,
            [ratingId, tagId]
          );
        }
      }

      await client.query('COMMIT');

      logger.info('Rating updated', { ratingId });

      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to update rating', { error, ratingId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 回复评价（被评价方）
   */
  async respondToRating(ratingId: string, rateeId: string, response: string): Promise<void> {
    const client = await pool.connect();

    try {
      const result = await client.query(
        `UPDATE ratings
         SET response = $1, response_at = NOW()
         WHERE id = $2 AND ratee_id = $3
         RETURNING rater_id`,
        [response, ratingId, rateeId]
      );

      if (result.rows.length === 0) {
        throw new Error('Rating not found or unauthorized');
      }

      // 通知评价方
      await client.query(
        `INSERT INTO notifications (
          user_id, type, title, content
        ) VALUES ($1, 'rating_response', '评价收到回复', $2)`,
        [result.rows[0].rater_id, `对方回复了您的评价：${response.substring(0, 50)}...`]
      );

      logger.info('Rating response added', { ratingId });
    } catch (error) {
      logger.error('Failed to respond to rating', { error, ratingId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 标记评价有用/无用
   */
  async markHelpfulness(ratingId: string, userId: string, isHelpful: boolean): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 插入或更新有用性记录
      await client.query(
        `INSERT INTO rating_helpfulness (rating_id, user_id, is_helpful)
         VALUES ($1, $2, $3)
         ON CONFLICT (rating_id, user_id)
         DO UPDATE SET is_helpful = $3`,
        [ratingId, userId, isHelpful]
      );

      // 更新评价的有用计数
      const helpfulCount = await client.query(
        `SELECT COUNT(*) FILTER (WHERE is_helpful = true) as count
         FROM rating_helpfulness
         WHERE rating_id = $1`,
        [ratingId]
      );

      await client.query(
        `UPDATE ratings SET helpful_count = $1 WHERE id = $2`,
        [helpfulCount.rows[0].count, ratingId]
      );

      await client.query('COMMIT');

      logger.info('Rating helpfulness marked', { ratingId, isHelpful });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to mark helpfulness', { error, ratingId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 举报评价
   */
  async reportRating(
    ratingId: string,
    reporterId: string,
    reason: string,
    description?: string
  ): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 创建举报记录
      await client.query(
        `INSERT INTO rating_reports (rating_id, reporter_id, reason, description)
         VALUES ($1, $2, $3, $4)`,
        [ratingId, reporterId, reason, description]
      );

      // 更新评价的举报计数
      await client.query(
        `UPDATE ratings
         SET report_count = report_count + 1
         WHERE id = $1`,
        [ratingId]
      );

      await client.query('COMMIT');

      logger.info('Rating reported', { ratingId, reason });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to report rating', { error, ratingId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 获取任务的评价
   */
  async getTaskRatings(taskId: string, userId?: string): Promise<any[]> {
    const client = await pool.connect();

    try {
      const result = await client.query(
        `SELECT * FROM rating_details WHERE task_id = $1 ORDER BY created_at DESC`,
        [taskId]
      );

      // 如果是匿名评价且不是评价方本人，隐藏评价方信息
      return result.rows.map((rating) => {
        if (rating.is_anonymous && rating.rater_id !== userId) {
          rating.rater_username = '匿名用户';
          rating.rater_id = null;
        }
        return rating;
      });
    } catch (error) {
      logger.error('Failed to get task ratings', { error, taskId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 获取用户收到的评价
   */
  async getUserRatings(
    userId: string,
    filters?: {
      rating?: number;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ ratings: any[]; total: number }> {
    const client = await pool.connect();

    try {
      const limit = filters?.limit || 20;
      const offset = filters?.offset || 0;

      let whereClause = 'WHERE ratee_id = $1';
      const params: any[] = [userId];
      let paramIndex = 2;

      if (filters?.rating) {
        whereClause += ` AND rating = $${paramIndex}`;
        params.push(filters.rating);
        paramIndex++;
      }

      // 获取总数
      const countResult = await client.query(
        `SELECT COUNT(*) FROM rating_details ${whereClause}`,
        params
      );

      // 获取评价列表
      const result = await client.query(
        `SELECT * FROM rating_details
         ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limit, offset]
      );

      return {
        ratings: result.rows,
        total: parseInt(countResult.rows[0].count),
      };
    } catch (error) {
      logger.error('Failed to get user ratings', { error, userId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 获取用户评价统计
   */
  async getUserRatingStats(userId: string): Promise<UserRatingStats | null> {
    const client = await pool.connect();

    try {
      const result = await client.query(
        `SELECT * FROM user_rating_stats WHERE user_id = $1`,
        [userId]
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to get user rating stats', { error, userId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 获取所有可用标签
   */
  async getAvailableTags(applicableTo?: string): Promise<RatingTag[]> {
    const client = await pool.connect();

    try {
      let query = 'SELECT * FROM rating_tags WHERE is_active = true';
      const params: any[] = [];

      if (applicableTo) {
        query += ` AND (applicable_to = $1 OR applicable_to = 'both')`;
        params.push(applicableTo);
      }

      query += ' ORDER BY tag_category, usage_count DESC';

      const result = await client.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get available tags', { error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 删除评价（仅管理员）
   */
  async deleteRating(ratingId: string, adminId: string, reason: string): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 获取评价信息
      const ratingResult = await client.query(`SELECT * FROM ratings WHERE id = $1`, [ratingId]);

      if (ratingResult.rows.length === 0) {
        throw new Error('Rating not found');
      }

      const rating = ratingResult.rows[0];

      // 删除评价
      await client.query(`DELETE FROM ratings WHERE id = $1`, [ratingId]);

      // 记录删除操作
      await client.query(
        `INSERT INTO rating_reports (rating_id, reporter_id, reason, description, status, handled_by, handled_at)
         VALUES ($1, $2, 'admin_deleted', $3, 'resolved', $4, NOW())
         ON CONFLICT (rating_id, reporter_id) DO NOTHING`,
        [ratingId, adminId, reason, adminId]
      );

      // 通知被删除评价的评价方
      await client.query(
        `INSERT INTO notifications (user_id, type, title, content)
         VALUES ($1, 'rating_deleted', '评价已被删除', $2)`,
        [rating.rater_id, `您的评价因违规被删除：${reason}`]
      );

      await client.query('COMMIT');

      logger.info('Rating deleted by admin', { ratingId, adminId, reason });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to delete rating', { error, ratingId });
      throw error;
    } finally {
      client.release();
    }
  }
}

export const ratingService = new RatingService();
