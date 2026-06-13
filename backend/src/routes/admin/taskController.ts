import { Request, Response } from 'express';
import { query } from '../../utils/db';

/**
 * 获取项目库列表
 */
export async function getTaskList(req: Request, res: Response) {
  try {
    const {
      page = 1,
      pageSize = 20,
      keyword,
      status,
      track,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (Number(page) - 1) * Number(pageSize);
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // 关键词搜索
    if (keyword) {
      conditions.push(`(t.title LIKE $${paramIndex} OR t.description LIKE $${paramIndex})`);
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    // 状态筛选
    if (status) {
      conditions.push(`t.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    // 赛道筛选
    if (track) {
      conditions.push(`t.track = $${paramIndex}`);
      params.push(track);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 获取总数
    const countResult = await query<any>(
      `SELECT COUNT(*) as total
       FROM tasks t
       ${whereClause}`,
      params
    );

    const total = parseInt(countResult[0].total);

    // 获取列表数据
    params.push(Number(pageSize), offset);
    const tasks = await query<any>(
      `SELECT
        t.id,
        t.title,
        t.description,
        t.status,
        t.track,
        t.company_price,
        t.student_price,
        t.deadline,
        t.created_at,
        c.company_name as company_name
       FROM tasks t
       LEFT JOIN company_profiles c ON t.company_id = c.id
       ${whereClause}
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    res.json({
      list: tasks,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize))
      }
    });
  } catch (error) {
    logger.error('获取项目列表失败:', error);
    res.status(500).json({ error: '获取项目列表失败' });
  }
}

/**
 * 获取项目详情
 */
export async function getTaskDetail(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const taskInfo = await query<any>(
      `SELECT
        t.*,
        c.company_name as company_name,
        c.logo_url as company_logo,
        c.verified_at as company_verified
       FROM tasks t
       LEFT JOIN company_profiles c ON t.company_id = c.id
       WHERE t.id = $1`,
      [id]
    );

    if (taskInfo.length === 0) {
      return res.status(404).json({ error: '项目不存在' });
    }

    res.json(taskInfo[0]);
  } catch (error) {
    logger.error('获取项目详情失败:', error);
    res.status(500).json({ error: '获取项目详情失败' });
  }
}

/**
 * 获取待审核项目列表
 */
export async function getPendingReviewTasks(req: Request, res: Response) {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);

    // 获取总数
    const countResult = await query<any>(
      `SELECT COUNT(*) as total
       FROM tasks
       WHERE status = 'pending_review'`
    );

    const total = parseInt(countResult[0].total);

    // 获取列表
    const tasks = await query<any>(
      `SELECT
        t.id,
        t.title,
        t.description,
        t.track,
        t.company_price,
        t.student_price,
        t.deadline,
        t.created_at,
        c.company_name as company_name
       FROM tasks t
       LEFT JOIN company_profiles c ON t.company_id = c.id
       WHERE t.status = 'pending_review'
       ORDER BY t.created_at ASC
       LIMIT $1 OFFSET $2`,
      [Number(pageSize), offset]
    );

    res.json({
      list: tasks,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize))
      }
    });
  } catch (error) {
    logger.error('获取待审核项目列表失败:', error);
    res.status(500).json({ error: '获取待审核项目列表失败' });
  }
}

/**
 * 审核项目
 */
export async function reviewTask(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { approved, reason } = req.body;

    // 获取任务信息
    const taskInfo = await query<any>(
      `SELECT company_id, title FROM tasks WHERE id = $1`,
      [id]
    );

    if (taskInfo.length === 0) {
      return res.status(404).json({ error: '任务不存在' });
    }

    const { company_id, title } = taskInfo[0];

    // 获取企业用户ID
    const companyUser = await query<any>(
      `SELECT user_id FROM company_profiles WHERE id = $1`,
      [company_id]
    );

    if (approved) {
      // 审核通过，发布项目
      await query(
        `UPDATE tasks
         SET status = 'published', published_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [id]
      );

      // 发送通知给企业
      if (companyUser.length > 0) {
        await query(
          `INSERT INTO system_notifications (user_id, type, title, content, related_type, related_id)
           VALUES ($1, 'task_approved', '任务审核通过', $2, 'task', $3)`,
          [companyUser[0].user_id, `您的任务"${title}"已通过审核，现已发布。`, id]
        );
      }
    } else {
      // 审核拒绝
      await query(
        `UPDATE tasks
         SET status = 'rejected', reject_reason = $1
         WHERE id = $2`,
        [reason, id]
      );

      // 发送通知给企业
      if (companyUser.length > 0) {
        await query(
          `INSERT INTO system_notifications (user_id, type, title, content, related_type, related_id)
           VALUES ($1, 'task_rejected', '任务审核未通过', $2, 'task', $3)`,
          [companyUser[0].user_id, `您的任务"${title}"未通过审核。原因：${reason || '不符合发布要求'}`, id]
        );
      }
    }

    // 记录操作日志
    const adminId = (req as any).user.userId;
    await query(
      `INSERT INTO admin_operation_logs (admin_id, operation_type, target_type, target_id, details)
       VALUES ($1, 'review_task', 'task', $2, $3)`,
      [adminId, id, JSON.stringify({ approved, reason, taskTitle: title })]
    );

    res.json({ message: approved ? '项目已发布' : '项目已拒绝' });
  } catch (error) {
    logger.error('审核项目失败:', error);
    res.status(500).json({ error: '审核项目失败' });
  }
}

/**
 * 上下架项目
 */
export async function toggleTaskStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { action, reason } = req.body; // action: 'publish' | 'unpublish'

    const newStatus = action === 'publish' ? 'published' : 'unpublished';

    await query(
      `UPDATE tasks
       SET status = $1
       WHERE id = $2`,
      [newStatus, id]
    );

    // 记录操作日志
    const adminId = (req as any).user.userId;
    await query(
      `INSERT INTO admin_operation_logs (admin_id, operation_type, target_type, target_id, details)
       VALUES ($1, 'toggle_task_status', 'task', $2, $3)`,
      [adminId, id, JSON.stringify({ action, reason })]
    );

    res.json({ message: action === 'publish' ? '项目已上架' : '项目已下架' });
  } catch (error) {
    logger.error('更新项目状态失败:', error);
    res.status(500).json({ error: '更新项目状态失败' });
  }
}

/**
 * 获取项目分类标签统计
 */
export async function getTaskCategories(req: Request, res: Response) {
  try {
    // 赛道统计
    const trackStats = await query<any>(
      `SELECT
        track,
        COUNT(*) as count
       FROM tasks
       WHERE track IS NOT NULL
       GROUP BY track
       ORDER BY count DESC`
    );

    // 标签统计
    const tagStats = await query<any>(
      `SELECT
        unnest(tags) as tag,
        COUNT(*) as count
       FROM tasks
       WHERE tags IS NOT NULL
       GROUP BY tag
       ORDER BY count DESC
       LIMIT 50`
    );

    res.json({
      tracks: trackStats,
      tags: tagStats
    });
  } catch (error) {
    logger.error('获取项目分类统计失败:', error);
    res.status(500).json({ error: '获取项目分类统计失败' });
  }
}

/**
 * 更新项目信息
 */
export async function updateTask(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = ['title', 'description', 'track', 'tags', 'deadline', 'company_price', 'student_price'];
    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setClauses.push(`${field} = $${paramIndex}`);
        params.push(updates[field]);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: '没有可更新的字段' });
    }

    params.push(id);
    await query(
      `UPDATE tasks
       SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramIndex}`,
      params
    );

    // 记录操作日志
    const adminId = (req as any).user.userId;
    await query(
      `INSERT INTO admin_operation_logs (admin_id, operation_type, target_type, target_id, details)
       VALUES ($1, 'update_task', 'task', $2, $3)`,
      [adminId, id, JSON.stringify(updates)]
    );

    res.json({ message: '项目更新成功' });
  } catch (error) {
    logger.error('更新项目失败:', error);
    res.status(500).json({ error: '更新项目失败' });
  }
}
