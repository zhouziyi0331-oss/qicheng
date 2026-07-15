import { Request, Response, NextFunction } from 'express';
import pool from '../../config/database';
import { nanoid } from 'nanoid';

export async function canBeMentor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.id;

    const result = await pool.query(
      `SELECT COUNT(*) as count
       FROM task_assignments
       WHERE student_id = $1 AND status = 'completed'`,
      [studentId]
    );

    const currentOrders = parseInt(result.rows[0].count);
    const requiredOrders = 5;
    const canBeMentor = currentOrders >= requiredOrders;

    res.json({
      success: true,
      data: {
        canBeMentor,
        currentOrders,
        requiredOrders
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function becomeMentor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.id;

    const orderCheck = await pool.query(
      `SELECT COUNT(*) as count
       FROM task_assignments
       WHERE student_id = $1 AND status = 'completed'`,
      [studentId]
    );

    const currentOrders = parseInt(orderCheck.rows[0].count);
    if (currentOrders < 5) {
      res.status(400).json({
        success: false,
        message: '需完成至少5个项目才能成为引路人'
      });
      return;
    }

    const existingCode = await pool.query(
      'SELECT code FROM invite_codes WHERE mentor_id = $1',
      [studentId]
    );

    if (existingCode.rows.length > 0) {
      const inviteCode = existingCode.rows[0].code;
      res.json({
        success: true,
        data: {
          inviteCode,
          inviteUrl: `https://qicheng.ai/invite/${inviteCode}`
        }
      });
      return;
    }

    const inviteCode = `QICHENG${nanoid(6).toUpperCase()}`;

    await pool.query(
      `INSERT INTO invite_codes (code, mentor_id, created_at)
       VALUES ($1, $2, NOW())`,
      [inviteCode, studentId]
    );

    res.json({
      success: true,
      data: {
        inviteCode,
        inviteUrl: `https://qicheng.ai/invite/${inviteCode}`
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyMentees(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.id;

    const menteesResult = await pool.query(
      `SELECT
        u.id,
        u.name,
        sp.level,
        COUNT(ta.id) as orders_completed,
        mr.mentee_first_order_completed,
        mr.reward_paid,
        mr.reward_amount,
        mr.created_at as joined_at
       FROM mentor_relationships mr
       JOIN users u ON mr.mentee_id = u.id
       LEFT JOIN student_profiles sp ON u.id = sp.student_id
       LEFT JOIN task_assignments ta ON u.id = ta.student_id AND ta.status = 'completed'
       WHERE mr.mentor_id = $1
       GROUP BY u.id, u.name, sp.level, mr.mentee_first_order_completed, mr.reward_paid, mr.reward_amount, mr.created_at
       ORDER BY mr.created_at DESC`,
      [studentId]
    );

    const mentees = menteesResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      level: row.level || 0,
      ordersCompleted: parseInt(row.orders_completed),
      firstOrderCompleted: row.mentee_first_order_completed,
      rewardReceived: row.reward_paid,
      rewardAmount: parseFloat(row.reward_amount),
      joinedAt: row.joined_at
    }));

    const totalRewards = mentees
      .filter(m => m.rewardReceived)
      .reduce((sum, m) => sum + m.rewardAmount, 0);

    res.json({
      success: true,
      data: {
        mentees,
        totalMentees: mentees.length,
        totalRewards
      }
    });
  } catch (err) {
    next(err);
  }
}
