/**
 * 语义匹配API路由
 * 提供任务-学生匹配相关的API端点
 */

import { Router, Request, Response } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import semanticMatchingEngine from '../../services/semanticMatchingEngine';
import qichengTeacherService from '../../services/qichengTeacherService';
import vectorGenerationService from '../../services/vectorGenerationService';
import studentCapabilityService from '../../services/studentCapabilityService';
import { pool } from '../../utils/db';
import logger from '../../utils/logger';

const router = Router();

/**
 * POST /api/matching/tasks/:taskId/trigger
 * 企业发布任务后，触发AI匹配
 */
router.post('/tasks/:taskId/trigger', authenticate, requireRole('company'), async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { limit = 100 } = req.body;

    logger.info(`Triggering matching for task: ${taskId}`);

    // 1. 更新任务向量
    await vectorGenerationService.updateTaskEmbedding(taskId);

    // 2. 生成任务翻译
    await qichengTeacherService.translateTask(taskId);

    // 3. 执行匹配
    const matchResults = await semanticMatchingEngine.findBestStudentsForTask(taskId, limit);

    // 4. 保存匹配结果
    await semanticMatchingEngine.saveMatchResults(taskId, matchResults);

    res.json({
      success: true,
      data: {
        matchedCount: matchResults.length,
        topMatchScore: matchResults[0]?.match_score.overall_score || 0,
        completedAt: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    logger.error('Error triggering matching:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to trigger matching',
    });
  }
});

/**
 * GET /api/matching/tasks/:taskId/students
 * 企业查看匹配的学生列表
 */
router.get('/tasks/:taskId/students', authenticate, requireRole('company'), async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { limit = 10 } = req.query;

    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT
          tsm.student_id,
          u.name as student_name,
          u.avatar,
          u.level,
          tsm.overall_score,
          tsm.skill_match_score,
          tsm.difficulty_match_score,
          tsm.domain_match_score,
          tsm.growth_potential_score,
          tsm.reliability_score,
          tsm.preference_score,
          tsm.match_breakdown,
          tsm.rank_in_task,
          sc.tasks_completed,
          sc.avg_task_quality,
          sc.avg_client_satisfaction,
          sc.on_time_delivery_rate
        FROM task_student_matches tsm
        JOIN users u ON tsm.student_id = u.id
        LEFT JOIN student_capabilities sc ON tsm.student_id = sc.student_id
        WHERE tsm.task_id = $1
        ORDER BY tsm.overall_score DESC
        LIMIT $2`,
        [taskId, limit]
      );

      res.json({
        success: true,
        data: {
          students: result.rows,
          total: result.rows.length,
        },
      });
    } finally {
      client.release();
    }
  } catch (error: unknown) {
    logger.error('Error getting matched students:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get matched students',
    });
  }
});

/**
 * POST /api/matching/tasks/:taskId/push
 * 企业选择学生推送任务
 */
router.post('/tasks/:taskId/push', authenticate, requireRole('company'), async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { studentIds } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'studentIds must be a non-empty array',
      });
    }

    if (studentIds.length > 5) {
      return res.status(400).json({
        success: false,
        error: 'Cannot push to more than 5 students',
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 更新推送状态
      for (const studentId of studentIds) {
        await client.query(
          `UPDATE task_student_matches SET
            is_pushed = true,
            pushed_at = NOW()
          WHERE task_id = $1 AND student_id = $2`,
          [taskId, studentId]
        );

        // 创建通知（假设有notifications表）
        await client.query(
          `INSERT INTO notifications (user_id, type, title, content, related_task_id)
           VALUES ($1, 'task_recommendation', '为你推荐了一个任务', '根据你的能力匹配，我们为你推荐了一个任务', $2)`,
          [studentId, taskId]
        ).catch(() => {
          // 如果notifications表不存在，忽略错误
          logger.warn('Notifications table may not exist');
        });
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        data: {
          pushedCount: studentIds.length,
          pushedAt: new Date().toISOString(),
        },
      });
    } catch (error: unknown) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: unknown) {
    logger.error('Error pushing task to students:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to push task',
    });
  }
});

/**
 * GET /api/matching/students/recommended-tasks
 * 学生查看推荐任务
 */
router.get('/students/recommended-tasks', authenticate, requireRole('student'), async (req: Request, res: Response) => {
  try {
    const studentId = req.user?.userId;
    if (!studentId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT
          t.id as task_id,
          t.title,
          t.description,
          t.budget,
          t.duration,
          t.level,
          t.track,
          tsm.overall_score,
          tsm.match_breakdown,
          tsm.pushed_at,
          tt.student_friendly_title,
          tt.student_friendly_description,
          tt.what_you_will_do,
          tt.what_you_will_learn,
          tt.estimated_hours,
          tt.difficulty_overall
        FROM task_student_matches tsm
        JOIN tasks t ON tsm.task_id = t.id
        LEFT JOIN task_translations tt ON t.id = tt.task_id
        WHERE tsm.student_id = $1 AND tsm.is_pushed = true
        ORDER BY tsm.pushed_at DESC
        LIMIT 20`,
        [studentId]
      );

      // 标记为已查看
      await client.query(
        `UPDATE task_student_matches SET
          student_viewed = true,
          viewed_at = NOW()
        WHERE student_id = $1 AND is_pushed = true AND student_viewed = false`,
        [studentId]
      );

      res.json({
        success: true,
        data: {
          tasks: result.rows,
          total: result.rows.length,
        },
      });
    } finally {
      client.release();
    }
  } catch (error: unknown) {
    logger.error('Error getting recommended tasks:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get recommended tasks',
    });
  }
});

/**
 * GET /api/matching/tasks/:taskId/translation
 * 学生查看任务翻译（启程老师的解读）
 */
router.get('/tasks/:taskId/translation', authenticate, async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;

    const translation = await qichengTeacherService.getTranslation(taskId);

    if (!translation) {
      // 如果不存在，实时生成
      const newTranslation = await qichengTeacherService.translateTask(taskId);
      return res.json({
        success: true,
        data: newTranslation,
      });
    }

    res.json({
      success: true,
      data: translation,
    });
  } catch (error: unknown) {
    logger.error('Error getting task translation:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get task translation',
    });
  }
});

/**
 * POST /api/matching/students/:studentId/initialize
 * 初始化学生能力画像（管理员或注册时调用）
 */
router.post('/students/:studentId/initialize', authenticate, async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { opcResults } = req.body;

    // 验证权限：只能初始化自己的或管理员
    if (req.user?.userId !== studentId && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
      });
    }

    await studentCapabilityService.initializeCapability(studentId, opcResults);

    res.json({
      success: true,
      message: 'Student capability initialized',
    });
  } catch (error: unknown) {
    logger.error('Error initializing student capability:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initialize capability',
    });
  }
});

/**
 * GET /api/matching/students/:studentId/capability
 * 获取学生能力画像
 */
router.get('/students/:studentId/capability', authenticate, async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    const capability = await studentCapabilityService.getCapability(studentId);

    if (!capability) {
      return res.status(404).json({
        success: false,
        error: 'Capability not found',
      });
    }

    res.json({
      success: true,
      data: capability,
    });
  } catch (error: unknown) {
    logger.error('Error getting student capability:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get capability',
    });
  }
});

export default router;
