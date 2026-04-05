import { Request, Response, NextFunction } from 'express';
import { query } from '../../utils/db';

// GET /notification
export async function listNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const notifications = await query(
      `SELECT id, type, title, body, is_read as "isRead",
              created_at as "createdAt", meta
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({ success: true, data: notifications });
  } catch (err) { next(err); }
}

// POST /notification/:id/read
export async function markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    await query(
      `UPDATE notifications
       SET is_read = true
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    res.json({ success: true });
  } catch (err) { next(err); }
}

// GET /notification/unread-count
export async function getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;

    const result = await query(
      `SELECT COUNT(*) as count
       FROM notifications
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );

    res.json({ success: true, data: { count: parseInt(String(result[0]?.count || '0')) } });
  } catch (err) { next(err); }
}
