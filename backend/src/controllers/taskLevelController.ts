import { Request, Response } from 'express';
import { query, queryOne, withTransaction } from '../utils/db';
import { hybridMatchingService } from '../services/hybridMatchingService';
import { embeddingService } from '../services/embeddingService';
import logger from '../utils/logger';

/**
 * 企业发布任务（增强版，包含赛道和等级）
 */
export const publishTask = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      track, // 'content' 或 'tool'
      level, // 0-4
      requiredAbilities, // { openness, persistence, creativity }
      budget,
      deadline,
      duration,
      deliverables, // 数组
      tags,
    } = req.body;

    const companyId = req.user?.userId;

    // 验证必填字段
    if (!title || !description || !track || level === undefined || !budget || !deadline) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段',
      });
    }

    // 验证赛道和等级
    if (!['content', 'tool'].includes(track)) {
      return res.status(400).json({
        success: false,
        message: '赛道必须是 content 或 tool',
      });
    }

    if (level < 0 || level > 4) {
      return res.status(400).json({
        success: false,
        message: '等级必须在 0-4 之间',
      });
    }

    const task = await withTransaction(async (client) => {
      // 计算平台抽成（15%）
      const platformFeeRate = 0.15;
      const platformFee = budget * platformFeeRate;
      const studentPrice = budget - platformFee;

      // 生成预算区间显示
      const budgetRange = generateBudgetRange(level);

      // 插入任务
      const taskResult = await client.query(
        `INSERT INTO tasks
         (company_id, title, description, track, level,
          required_openness, required_persistence, required_creativity,
          company_price, student_price, platform_fee, budget_range,
          deadline, duration, deliverables, tags, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'draft')
         RETURNING *`,
        [
          companyId,
          title,
          description,
          track,
          level,
          requiredAbilities?.openness || 50,
          requiredAbilities?.persistence || 50,
          requiredAbilities?.creativity || 50,
          budget,
          studentPrice,
          platformFee,
          budgetRange,
          deadline,
          duration,
          JSON.stringify(deliverables || []),
          JSON.stringify(tags || []),
        ]
      );

      return taskResult.rows[0];
    });

    // 异步生成任务embedding（不阻塞响应）
    hybridMatchingService.generateTaskEmbedding(task.id).catch((error: Error) => {
      logger.error('Failed to generate task embedding', { taskId: task.id, error });
    });

    res.json({
      success: true,
      message: '任务创建成功',
      data: {
        taskId: task.id,
        task: {
          ...task,
          deliverables: JSON.parse(task.deliverables || '[]'),
          tags: JSON.parse(task.tags || '[]'),
        },
      },
    });
  } catch (error: unknown) {
    logger.error('Error publishing task', { error });
    res.status(500).json({
      success: false,
      message: '发布任务失败',
    });
  }
};

/**
 * 生成预算区间显示
 */
function generateBudgetRange(level: number): string {
  const ranges = {
    0: '50-200元',
    1: '200-800元',
    2: '800-2000元',
    3: '2000-5000元',
    4: '5000-20000元',
  };
  return ranges[level as keyof typeof ranges] || '未知';
}

/**
 * 企业确认发布任务（从草稿到已发布）
 */
export const confirmPublishTask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const companyId = req.user?.userId;

    const result = await withTransaction(async (client) => {
      // 验证任务所有权
      const taskResult = await client.query(
        'SELECT * FROM tasks WHERE id = $1 AND company_id = $2',
        [taskId, companyId]
      );

      if (taskResult.rows.length === 0) {
        throw new Error('任务不存在或无权限');
      }

      const task = taskResult.rows[0];

      // 更新任务状态为已发布
      await client.query(
        `UPDATE tasks SET status = 'published', published_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [taskId]
      );

      // 触发智能匹配（混合算法：规则 + AI向量）
      const matches = await hybridMatchingService.matchStudentsForTask(parseInt(taskId), 10);

      return {
        taskId: task.id,
        matchedStudentsCount: matches.length,
      };
    });

    res.json({
      success: true,
      message: '任务已发布，正在匹配合适的学生',
      data: result,
    });
  } catch (error: unknown) {
    logger.error('Error confirming task publication', { error });
    const errorMessage = error instanceof Error ? error.message : '发布任务失败';
    const statusCode = errorMessage === '任务不存在或无权限' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: errorMessage,
    });
  }
};

/**
 * 获取任务的匹配学生列表（Top 3）
 */
export const getMatchedStudents = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const companyId = req.user?.userId;

    // 验证任务所有权
    const taskResult = await query(
      'SELECT * FROM tasks WHERE id = $1 AND company_id = $2',
      [taskId, companyId]
    );

    if (taskResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: '任务不存在或无权限',
      });
    }

    // 获取匹配的学生（Top 3）
    const matchedStudents = await hybridMatchingService.matchStudentsForTask(
      parseInt(taskId),
      3
    );

    res.json({
      success: true,
      data: {
        students: matchedStudents,
      },
    });
  } catch (error: unknown) {
    logger.error('Error getting matched students', { error });
    res.status(500).json({
      success: false,
      message: '获取匹配学生失败',
    });
  }
};

/**
 * 学生获取推荐任务列表
 */
export const getRecommendedTasks = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { limit = 20 } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未登录',
      });
    }

    const userIdNum = parseInt(userId);

    // 检查是否已有匹配结果，如果没有则触发匹配
    const existingMatches = await query<{ count: string }>(
      'SELECT COUNT(*) FROM ai_matches WHERE student_id = $1',
      [userIdNum]
    );

    if (parseInt(existingMatches[0].count) === 0) {
      // 首次访问，触发匹配
      const limitNum = typeof limit === 'string' ? parseInt(limit) : 20;
      const matches = await hybridMatchingService.matchTasksForStudent(userIdNum, limitNum);
    }

    // 获取推荐任务
    const limitNum = typeof limit === 'string' ? parseInt(limit) : 20;
    const recommendedTasks = await hybridMatchingService.matchTasksForStudent(
      userIdNum,
      limitNum
    );

    res.json({
      success: true,
      data: {
        tasks: recommendedTasks,
      },
    });
  } catch (error: unknown) {
    logger.error('Error getting recommended tasks', { error });
    res.status(500).json({
      success: false,
      message: '获取推荐任务失败',
    });
  }
};

/**
 * 学生接受任务
 */
export const acceptTask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const studentId = req.user?.userId;

    const result = await withTransaction(async (client) => {
      // 检查任务是否可接
      const taskResult = await client.query(
        `SELECT * FROM tasks
         WHERE id = $1 AND status = 'published' AND accepted_student_id IS NULL`,
        [taskId]
      );

      if (taskResult.rows.length === 0) {
        throw new Error('任务不可接取');
      }

      const task = taskResult.rows[0];

      // 检查学生等级是否符合
      const studentResult = await client.query(
        'SELECT current_level FROM student_abilities WHERE user_id = $1',
        [studentId]
      );

      if (studentResult.rows.length === 0) {
        throw new Error('学生能力画像不存在');
      }

      const studentLevel = studentResult.rows[0].current_level;
      const levelDiff = Math.abs(task.level - studentLevel);

      if (levelDiff > 1) {
        throw new Error('任务等级与您的等级差距过大');
      }

      // 更新任务状态
      await client.query(
        `UPDATE tasks
         SET accepted_student_id = $1, status = 'in_progress', accepted_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [studentId, taskId]
      );

      // 更新匹配记录
      await client.query(
        `UPDATE ai_matches
         SET invitation_status = 'accepted', responded_at = CURRENT_TIMESTAMP
         WHERE task_id = $1 AND student_id = $2`,
        [taskId, studentId]
      );

      return { taskId: task.id };
    });

    res.json({
      success: true,
      message: '任务接取成功',
      data: result,
    });
  } catch (error: unknown) {
    logger.error('Error accepting task', { error });
    const errorMessage = error instanceof Error ? error.message : '接取任务失败';
    const statusCode = errorMessage === '任务不可接取' || errorMessage === '学生能力画像不存在' || errorMessage === '任务等级与您的等级差距过大' ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: errorMessage,
    });
  }
};

/**
 * 获取任务详情（包含匹配信息）
 */
export const getTaskDetail = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    // 获取任务基本信息
    const taskResult = await query(
      `SELECT t.*, c.company_name, c.rating as company_rating
       FROM tasks t
       JOIN companies c ON t.company_id = c.id
       WHERE t.id = $1`,
      [taskId]
    );

    if (taskResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: '任务不存在',
      });
    }

    const task = taskResult[0];

    // 如果是学生，获取匹配信息
    let matchInfo = null;
    if (userRole === 'student') {
      const matchResult = await query(
        `SELECT match_score, difficulty_level, match_reasons,
                estimated_growth_openness, estimated_growth_persistence, estimated_growth_creativity
         FROM ai_matches
         WHERE task_id = $1 AND student_id = $2`,
        [taskId, userId]
      );

      if (matchResult.length > 0) {
        const match = matchResult[0];
        matchInfo = {
          match_score: match.match_score,
          difficultyLevel: match.difficulty_level,
          matchReasons: match.match_reasons,
          estimatedGrowth: {
            openness: match.estimated_growth_openness,
            persistence: match.estimated_growth_persistence,
            creativity: match.estimated_growth_creativity,
          },
        };
      }
    }

    res.json({
      success: true,
      data: {
        task: {
          ...task,
          deliverables: JSON.parse((task.deliverables as string) || '[]'),
          tags: JSON.parse((task.tags as string) || '[]'),
        },
        matchInfo,
      },
    });
  } catch (error: unknown) {
    logger.error('Error getting task detail', { error });
    res.status(500).json({
      success: false,
      message: '获取任务详情失败',
    });
  }
};

/**
 * 企业获取任务列表
 */
export const getCompanyTasks = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.userId;
    const { status, page = 1, limit = 20 } = req.query;

    let queryStr = `
      SELECT t.*, COUNT(am.id) as matched_students_count
      FROM tasks t
      LEFT JOIN ai_matches am ON t.id = am.task_id
      WHERE t.company_id = $1
    `;

    const params: any[] = [companyId];

    if (status) {
      queryStr += ` AND t.status = $${params.length + 1}`;
      params.push(status);
    }

    queryStr += `
      GROUP BY t.id
      ORDER BY t.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(parseInt(limit as string));
    params.push((parseInt(page as string) - 1) * parseInt(limit as string));

    const result = await query(queryStr, params);

    res.json({
      success: true,
      data: {
        tasks: result.map((task) => ({
          ...task,
          deliverables: JSON.parse((task.deliverables as string) || '[]'),
          tags: JSON.parse((task.tags as string) || '[]'),
        })),
      },
    });
  } catch (error: unknown) {
    logger.error('Error getting company tasks', { error });
    res.status(500).json({
      success: false,
      message: '获取任务列表失败',
    });
  }
};
