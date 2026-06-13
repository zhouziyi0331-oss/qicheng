import { Request, Response } from 'express';
import logger from '../utils/logger';
import { query, queryOne } from '../utils/db';

/**
 * 第2单完成触发器
 * POST /api/milestone/second-task-complete
 */
export const handleSecondTaskComplete = async (req: Request, res: Response) => {
  const { userId } = req.body;

  try {
    // 1. 检查是否是第2单
    const taskCount = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM task_applications
       WHERE student_id = $1 AND status = 'completed'`,
      [userId]
    );

    const count = parseInt(taskCount[0].count) || 0;

    if (count !== 2) {
      return res.json({ success: true, message: '不是第2单，无需推送' });
    }

    // 2. 检查是否已推送过
    const notificationCheck = await query<{ id: string }>(
      `SELECT id FROM notifications
       WHERE user_id = $1 AND type = 'second_task_milestone'`,
      [userId]
    );

    if (notificationCheck.length > 0) {
      return res.json({ success: true, message: '已推送过，跳过' });
    }

    // 3. 创建推送通知
    const message = '你现在可以独立接单了。平台不锁住你，但你的成长报告永远在这里，随时回来更新。';

    await query(
      `INSERT INTO notifications (user_id, type, title, content, created_at)
       VALUES ($1, 'second_task_milestone', '恭喜完成第2单', $2, NOW())`,
      [userId, message]
    );

    res.json({
      success: true,
      message: message
    });
  } catch (error) {
    logger.error('处理第2单完成失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

/**
 * 获取OPC故事墙
 * GET /api/story-wall
 */
export const getStoryWall = async (req: Request, res: Response) => {
  try {
    // 查询已经独立接单或创建OPC的学生
    const result = await query<{
      id: string;
      username: string;
      avatar: string;
      opc_personality_tag: string;
      level: number;
      completed_tasks: number;
      story_text: string;
      current_status: string;
      created_at: Date;
    }>(
      `SELECT
        u.id,
        u.username,
        u.avatar,
        u.opc_personality_tag,
        u.level,
        COUNT(ta.id) as completed_tasks,
        sw.story_text,
        sw.current_status,
        sw.created_at
       FROM users u
       LEFT JOIN task_applications ta ON ta.student_id = u.id AND ta.status = 'completed'
       LEFT JOIN story_wall sw ON sw.student_id = u.id
       WHERE u.role = 'student'
         AND u.level >= 4
         AND sw.story_text IS NOT NULL
       GROUP BY u.id, u.username, u.avatar, u.opc_personality_tag, u.level, sw.story_text, sw.current_status, sw.created_at
       ORDER BY sw.created_at DESC
       LIMIT 50`
    );

    const stories = result.map(row => ({
      studentId: row.id,
      username: row.username,
      avatar: row.avatar,
      opcTag: row.opc_personality_tag,
      level: row.level,
      completedTasks: row.completed_tasks,
      storyText: row.story_text,
      currentStatus: row.current_status
    }));

    res.json({
      success: true,
      stories: stories
    });
  } catch (error) {
    logger.error('获取故事墙失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

/**
 * 提交故事到故事墙
 * POST /api/story-wall/submit
 */
export const submitStory = async (req: Request, res: Response) => {
  const { userId, storyText, currentStatus } = req.body;

  if (!userId || !storyText || !currentStatus) {
    return res.status(400).json({ error: '参数错误' });
  }

  try {
    // 检查用户等级是否≥Lv.4
    const userResult = await query<{ level: number }>(
      `SELECT level FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const level = userResult[0].level;

    if (level < 4) {
      return res.status(400).json({ error: '需要达到Lv.4（自流者）才能提交故事' });
    }

    // 插入或更新故事
    await query(
      `INSERT INTO story_wall (student_id, story_text, current_status)
       VALUES ($1, $2, $3)
       ON CONFLICT (student_id)
       DO UPDATE SET story_text = $2, current_status = $3, updated_at = NOW()`,
      [userId, storyText, currentStatus]
    );

    res.json({
      success: true,
      message: '故事提交成功'
    });
  } catch (error) {
    logger.error('提交故事失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};
