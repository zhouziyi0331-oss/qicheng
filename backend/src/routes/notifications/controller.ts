import { Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../../utils/db';
import { AppError } from '../../middleware/errorHandler';

// GET /notifications
export async function listNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = (page - 1) * limit;

    const notifications = await query(
      `SELECT id, type, title, content AS body, is_read, action_url, created_at
       FROM notifications
       WHERE user_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({ success: true, data: notifications, meta: { page, limit } });
  } catch (err) { next(err); }
}

// PATCH /notifications/:id/read
export async function markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const n = await queryOne(
      'SELECT id FROM notifications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (!n) throw new AppError(404, '通知不存在', 'NOT_FOUND');

    await query(
      'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = $1',
      [id]
    );

    res.json({ success: true });
  } catch (err) { next(err); }
}

// PATCH /notifications/read-all
export async function markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    await query(
      'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = $1 AND is_read = FALSE',
      [userId]
    );
    res.json({ success: true });
  } catch (err) { next(err); }
}
