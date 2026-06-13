import { Request, Response, NextFunction } from 'express';
import { query } from '../../utils/db';

// GET /student/timeline
export async function getTimeline(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const timeline = await query(
      `SELECT id, event_type as "eventType", event_title as "eventTitle",
              event_desc as "eventDesc", is_milestone as "isMilestone",
              event_data as "eventData", created_at as "createdAt"
       FROM growth_timeline
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({ success: true, data: timeline });
  } catch (err: unknown) { next(err); }
}
