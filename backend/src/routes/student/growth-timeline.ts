import { Request, Response, NextFunction } from 'express';
import pool from '../../config/database';

interface TimelineEvent {
  date: string;
  type: string;
  icon: string;
  title: string;
  description: string;
}

export async function getGrowthTimeline(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.id;

    const events: TimelineEvent[] = [];

    // 1. 加入启程
    const userResult = await pool.query(
      'SELECT created_at FROM users WHERE id = $1',
      [studentId]
    );

    if (userResult.rows.length > 0) {
      events.push({
        date: userResult.rows[0].created_at,
        type: 'join',
        icon: '🎯',
        title: '加入启程',
        description: '开始你的创作者之旅'
      });
    }

    // 2. 完成OPC测评
    const testResult = await pool.query(
      `SELECT updated_at, personality_label
       FROM student_profiles
       WHERE student_id = $1 AND test_completed = TRUE`,
      [studentId]
    );

    if (testResult.rows.length > 0) {
      events.push({
        date: testResult.rows[0].updated_at,
        type: 'test',
        icon: '✨',
        title: '完成OPC测评',
        description: `成为「${testResult.rows[0].personality_label}」`
      });
    }

    // 3. 首单完成
    const firstOrderResult = await pool.query(
      `SELECT ta.completed_at, t.budget_net
       FROM task_assignments ta
       JOIN tasks t ON ta.task_id = t.id
       WHERE ta.student_id = $1 AND ta.status = 'completed'
       ORDER BY ta.completed_at ASC
       LIMIT 1`,
      [studentId]
    );

    if (firstOrderResult.rows.length > 0) {
      const amount = Math.floor(parseFloat(firstOrderResult.rows[0].budget_net));
      events.push({
        date: firstOrderResult.rows[0].completed_at,
        type: 'first_order',
        icon: '💰',
        title: '完成首单',
        description: `收入 ¥${amount}`
      });
    }

    // 4. 等级升级记录
    const levelUpResult = await pool.query(
      `SELECT level_upgraded_at, level_a, level_b
       FROM student_level_history
       WHERE student_id = $1
       ORDER BY level_upgraded_at ASC`,
      [studentId]
    );

    levelUpResult.rows.forEach(row => {
      const level = `${row.level_a}.${row.level_b}`;
      events.push({
        date: row.level_upgraded_at,
        type: 'level_up',
        icon: '📈',
        title: `升级到 Lv.${level}`,
        description: '解锁新能力等级'
      });
    });

    // 5. 第5单完成（解锁引路人）
    const fifthOrderResult = await pool.query(
      `SELECT completed_at
       FROM task_assignments
       WHERE student_id = $1 AND status = 'completed'
       ORDER BY completed_at ASC
       LIMIT 1 OFFSET 4`,
      [studentId]
    );

    if (fifthOrderResult.rows.length > 0) {
      events.push({
        date: fifthOrderResult.rows[0].completed_at,
        type: 'milestone',
        icon: '🎉',
        title: '完成第5单',
        description: '解锁引路人资格'
      });
    }

    // 6. 成为引路人
    const mentorResult = await pool.query(
      'SELECT created_at FROM invite_codes WHERE mentor_id = $1',
      [studentId]
    );

    if (mentorResult.rows.length > 0) {
      events.push({
        date: mentorResult.rows[0].created_at,
        type: 'mentor',
        icon: '🌟',
        title: '成为引路人',
        description: '获得专属邀请码'
      });
    }

    // 7. 第10单完成
    const tenthOrderResult = await pool.query(
      `SELECT completed_at
       FROM task_assignments
       WHERE student_id = $1 AND status = 'completed'
       ORDER BY completed_at ASC
       LIMIT 1 OFFSET 9`,
      [studentId]
    );

    if (tenthOrderResult.rows.length > 0) {
      events.push({
        date: tenthOrderResult.rows[0].completed_at,
        type: 'milestone',
        icon: '🚀',
        title: '完成第10单',
        description: '成为资深创作者'
      });
    }

    // 按时间排序
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    res.json({
      success: true,
      data: { events }
    });
  } catch (err) {
    next(err);
  }
}
