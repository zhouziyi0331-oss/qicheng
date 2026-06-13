import { Request, Response } from 'express';
import logger from '../../utils/logger';
import pool, { query, queryOne, withTransaction } from '../../utils/db';

/**
 * 评价系统控制器
 */

// 1. 提交评价
export const submitRating = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userType = req.user?.role; // 'student' or 'company'
    const {
      taskId,
      overallRating,
      requirementClarity,
      communicationQuality,
      paymentTimeliness,
      workQuality,
      deliveryTimeliness,
      professionalAttitude,
      comment,
      tags,
      isAnonymous
    } = req.body;

    // 验证必填字段
    if (!taskId || !overallRating) {
      return res.status(400).json({ error: '缺少必填字段' });
    }

    // 验证评分范围
    if (overallRating < 1 || overallRating > 5) {
      return res.status(400).json({ error: '评分必须在1-5之间' });
    }

    const result = await withTransaction(async (client) => {
      // 获取任务信息
      const taskResult = await client.query(
        'SELECT * FROM tasks WHERE id = $1',
        [taskId]
      );

      if (taskResult.rows.length === 0) {
        throw new Error('任务不存在');
      }

      const task = taskResult.rows[0];

      // 验证任务状态（必须是已完成）
      if (task.status !== 'completed') {
        throw new Error('只能评价已完成的任务');
      }

      // 确定被评价者
      let rateeId: number;
      let rateeType: string;

      if (userType === 'student') {
        // 学生评价企业
        rateeId = task.company_id;
        rateeType = 'company';

        // 检查是否已评价
        if (task.student_rated) {
          throw new Error('您已经评价过此任务');
        }
      } else if (userType === 'company') {
        // 企业评价学生
        rateeId = task.student_id;
        rateeType = 'student';

        // 检查是否已评价
        if (task.company_rated) {
          throw new Error('您已经评价过此任务');
        }
      } else {
        throw new Error('无权限评价');
      }

      // 验证是否为任务参与者
      if (userType === 'student' && task.student_id !== userId) {
        throw new Error('您不是此任务的学生');
      }
      if (userType === 'company' && task.company_id !== userId) {
        throw new Error('您不是此任务的企业');
      }

      // 插入评价
      const ratingResult = await client.query(
        `INSERT INTO task_ratings (
          task_id, rater_id, rater_type, ratee_id, ratee_type,
          overall_rating, requirement_clarity, communication_quality, payment_timeliness,
          work_quality, delivery_timeliness, professional_attitude,
          comment, tags, is_anonymous
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *`,
        [
          taskId, userId, userType, rateeId, rateeType,
          overallRating, requirementClarity, communicationQuality, paymentTimeliness,
          workQuality, deliveryTimeliness, professionalAttitude,
          comment, JSON.stringify(tags || []), isAnonymous || false
        ]
      );

      // 更新任务的评价状态
      if (userType === 'student') {
        await client.query(
          'UPDATE tasks SET student_rated = true WHERE id = $1',
          [taskId]
        );
      } else {
        await client.query(
          'UPDATE tasks SET company_rated = true WHERE id = $1',
          [taskId]
        );
      }

      // 标记评价提醒为已完成
      await client.query(
        'UPDATE rating_reminders SET is_completed = true WHERE task_id = $1 AND user_id = $2',
        [taskId, userId]
      );

      return ratingResult.rows[0];
    });

    res.json({
      message: '评价提交成功',
      rating: result
    });
  } catch (error) {
    logger.error('提交评价失败:', error);
    const errorMessage = error instanceof Error ? error.message : '提交评价失败';
    const statusCode = errorMessage.includes('不存在') ? 404 :
                       errorMessage.includes('无权限') || errorMessage.includes('不是此任务') ? 403 : 400;
    res.status(statusCode).json({ error: errorMessage });
  }
};

// 2. 获取任务的评价
export const getTaskRatings = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.userId;

    const result = await query(
      `SELECT
        tr.*,
        rater.nickname as rater_nickname,
        rater.avatar_url as rater_avatar,
        ratee.nickname as ratee_nickname,
        ratee.avatar_url as ratee_avatar
      FROM task_ratings tr
      LEFT JOIN users rater ON tr.rater_id = rater.id
      LEFT JOIN users ratee ON tr.ratee_id = ratee.id
      WHERE tr.task_id = $1 AND (tr.is_public = true OR tr.rater_id = $2 OR tr.ratee_id = $2)
      ORDER BY tr.created_at DESC`,
      [taskId, userId]
    );

    // 如果是匿名评价，隐藏评价者信息
    const ratings = result.map((rating: any) => {
      if (rating.is_anonymous && rating.rater_id !== userId) {
        return {
          ...rating,
          rater_nickname: '匿名用户',
          rater_avatar: null
        };
      }
      return rating;
    });

    res.json({ ratings });
  } catch (error) {
    logger.error('获取任务评价失败:', error);
    res.status(500).json({ error: '获取任务评价失败' });
  }
};

// 3. 获取用户的评分统计
export const getUserRatingStats = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await query(
      'SELECT * FROM user_rating_stats WHERE user_id = $1',
      [userId]
    );

    if (result.length === 0) {
      return res.json({
        stats: {
          total_ratings: 0,
          average_rating: 0,
          five_star_count: 0,
          four_star_count: 0,
          three_star_count: 0,
          two_star_count: 0,
          one_star_count: 0
        }
      });
    }

    res.json({ stats: result[0] });
  } catch (error) {
    logger.error('获取用户评分统计失败:', error);
    res.status(500).json({ error: '获取用户评分统计失败' });
  }
};

// 4. 获取用户收到的评价列表
export const getUserReceivedRatings = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT
        tr.*,
        rater.nickname as rater_nickname,
        rater.avatar_url as rater_avatar,
        t.title as task_title,
        t.status as task_status
      FROM task_ratings tr
      LEFT JOIN users rater ON tr.rater_id = rater.id
      LEFT JOIN tasks t ON tr.task_id = t.id
      WHERE tr.ratee_id = $1 AND tr.is_public = true
      ORDER BY tr.created_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await query(
      'SELECT COUNT(*) FROM task_ratings WHERE ratee_id = $1 AND is_public = true',
      [userId]
    );

    // 处理匿名评价
    const ratings = result.map((rating: any) => {
      if (rating.is_anonymous) {
        return {
          ...rating,
          rater_nickname: '匿名用户',
          rater_avatar: null
        };
      }
      return rating;
    });

    res.json({
      ratings,
      pagination: {
        page,
        limit,
        total: parseInt(countResult[0].count as string)
      }
    });
  } catch (error) {
    logger.error('获取用户评价列表失败:', error);
    res.status(500).json({ error: '获取用户评价列表失败' });
  }
};

// 5. 获取用户发出的评价列表
export const getUserGivenRatings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT
        tr.*,
        ratee.nickname as ratee_nickname,
        ratee.avatar_url as ratee_avatar,
        t.title as task_title,
        t.status as task_status
      FROM task_ratings tr
      LEFT JOIN users ratee ON tr.ratee_id = ratee.id
      LEFT JOIN tasks t ON tr.task_id = t.id
      WHERE tr.rater_id = $1
      ORDER BY tr.created_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await query(
      'SELECT COUNT(*) FROM task_ratings WHERE rater_id = $1',
      [userId]
    );

    res.json({
      ratings: result,
      pagination: {
        page,
        limit,
        total: parseInt(countResult[0].count as string)
      }
    });
  } catch (error) {
    logger.error('获取用户发出的评价失败:', error);
    res.status(500).json({ error: '获取用户发出的评价失败' });
  }
};

// 6. 企业回复评价
export const replyToRating = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userType = req.user?.role;
    const { ratingId } = req.params;
    const { reply } = req.body;

    if (userType !== 'company') {
      return res.status(403).json({ error: '只有企业可以回复评价' });
    }

    if (!reply || reply.trim().length === 0) {
      return res.status(400).json({ error: '回复内容不能为空' });
    }

    // 验证评价是否存在且是评价该企业的
    const ratingResult = await query(
      'SELECT * FROM task_ratings WHERE id = $1 AND ratee_id = $2 AND ratee_type = $3',
      [ratingId, userId, 'company']
    );

    if (ratingResult.length === 0) {
      return res.status(404).json({ error: '评价不存在或无权限回复' });
    }

    // 更新回复
    const result = await query(
      `UPDATE task_ratings
       SET company_reply = $1, company_reply_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [reply, ratingId]
    );

    res.json({
      message: '回复成功',
      rating: result[0]
    });
  } catch (error) {
    logger.error('回复评价失败:', error);
    res.status(500).json({ error: '回复评价失败' });
  }
};

// 7. 获取评价标签预设
export const getRatingTagPresets = async (req: Request, res: Response) => {
  try {
    const { tagType } = req.query;

    let queryStr = 'SELECT * FROM rating_tag_presets WHERE is_active = true';
    const params: any[] = [];

    if (tagType) {
      queryStr += ' AND tag_type = $1';
      params.push(tagType);
    }

    queryStr += ' ORDER BY display_order ASC';

    const result = await query(queryStr, params);

    res.json({ tags: result });
  } catch (error) {
    logger.error('获取评价标签失败:', error);
    res.status(500).json({ error: '获取评价标签失败' });
  }
};

// 8. 检查任务是否可以评价
export const checkRatingEligibility = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userType = req.user?.role;
    const { taskId } = req.params;

    // 获取任务信息
    const taskResult = await query(
      'SELECT * FROM tasks WHERE id = $1',
      [taskId]
    );

    if (taskResult.length === 0) {
      return res.status(404).json({ error: '任务不存在' });
    }

    const task = taskResult[0];

    // 验证是否为任务参与者
    if (userType === 'student' && task.student_id !== userId) {
      return res.status(403).json({ error: '您不是此任务的学生' });
    }
    if (userType === 'company' && task.company_id !== userId) {
      return res.status(403).json({ error: '您不是此任务的企业' });
    }

    // 检查任务状态
    if (task.status !== 'completed') {
      return res.json({
        canRate: false,
        reason: '任务尚未完成'
      });
    }

    // 检查是否已评价
    const hasRated = userType === 'student' ? task.student_rated : task.company_rated;
    if (hasRated) {
      return res.json({
        canRate: false,
        reason: '您已经评价过此任务'
      });
    }

    res.json({
      canRate: true,
      task: {
        id: task.id,
        title: task.title,
        status: task.status
      }
    });
  } catch (error) {
    logger.error('检查评价资格失败:', error);
    res.status(500).json({ error: '检查评价资格失败' });
  }
};

// 9. 获取待评价任务列表
export const getPendingRatingTasks = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userType = req.user?.role;

    let queryStr = `
      SELECT t.*,
        u.nickname as other_party_nickname,
        u.avatar_url as other_party_avatar
      FROM tasks t
    `;

    if (userType === 'student') {
      queryStr += `
        LEFT JOIN users u ON t.company_id = u.id
        WHERE t.student_id = $1 AND t.status = 'completed' AND t.student_rated = false
      `;
    } else if (userType === 'company') {
      queryStr += `
        LEFT JOIN users u ON t.student_id = u.id
        WHERE t.company_id = $1 AND t.status = 'completed' AND t.company_rated = false
      `;
    } else {
      return res.status(403).json({ error: '无权限' });
    }

    queryStr += ' ORDER BY t.completed_at DESC';

    const result = await query(queryStr, [userId]);

    res.json({ tasks: result });
  } catch (error) {
    logger.error('获取待评价任务失败:', error);
    res.status(500).json({ error: '获取待评价任务失败' });
  }
};

export default {
  submitRating,
  getTaskRatings,
  getUserRatingStats,
  getUserReceivedRatings,
  getUserGivenRatings,
  replyToRating,
  getRatingTagPresets,
  checkRatingEligibility,
  getPendingRatingTasks
};
