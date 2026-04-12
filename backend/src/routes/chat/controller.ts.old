import { Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../../utils/db';
import { AppError } from '../../middleware/errorHandler';

// GET /chat/:taskId/messages
export async function getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { taskId } = req.params;

    // 验证用户有权查看此任务的沟通
    const access = await queryOne(
      `SELECT 1 FROM tasks t
       WHERE t.id = $1 AND (
         t.company_id = $2 OR
         EXISTS (SELECT 1 FROM task_assignments ta WHERE ta.task_id = t.id AND ta.student_id = $2)
       )`,
      [taskId, userId]
    );
    if (!access) throw new AppError(403, '无权查看此任务', 'FORBIDDEN');

    // 检查联系方式解锁状态
    const unlock = await queryOne(
      `SELECT cu.id FROM contact_unlocks cu
       JOIN tasks t ON t.id = $1
       WHERE cu.student_id = $2 AND cu.company_id = t.company_id`,
      [taskId, userId]
    );

    const messages = await query(
      `SELECT id, sender_type, content, is_filtered, created_at
       FROM chat_messages
       WHERE task_id = $1 AND deleted_at IS NULL
       ORDER BY created_at ASC`,
      [taskId]
    );

    res.json({
      success: true,
      data: messages,
      meta: { contactUnlocked: !!unlock },
    });
  } catch (err) { next(err); }
}

// POST /chat/:taskId/messages
// contactFilterMiddleware 已在路由层处理联系方式过滤
export async function sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { taskId } = req.params;
    const { content, originalContent, isFiltered } = req.body;

    if (!content?.trim()) throw new AppError(400, '消息内容不能为空', 'EMPTY_CONTENT');

    const [msg] = await query<{ id: string }>(
      `INSERT INTO chat_messages
        (task_id, sender_id, sender_type, content, is_filtered, original_content)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        taskId, userId, req.user!.role,
        content.trim(), isFiltered || false,
        isFiltered ? (originalContent || null) : null,
      ]
    );

    res.status(201).json({
      success: true,
      data: {
        messageId: msg.id,
        wasFiltered: isFiltered || false,
        filterNotice: isFiltered
          ? '消息中的联系方式已被屏蔽。完成2单合作后可解锁直接联系。'
          : null,
      },
    });
  } catch (err) { next(err); }
}
