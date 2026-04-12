import { Request, Response } from 'express';
import pool from '../../../config/database';

/**
 * 聊天系统控制器
 * 功能：学生和企业之间的实时聊天
 */

// 获取或创建聊天会话
export const getOrCreateSession = async (req: Request, res: Response) => {
  try {
    const { taskId, studentId, companyId } = req.body;
    const userId = req.user?.id;

    // 验证权限：只有参与者才能创建会话
    if (userId !== studentId && userId !== companyId) {
      return res.status(403).json({
        success: false,
        message: '无权限创建此会话'
      });
    }

    // 验证任务是否存在且学生已接单
    const taskCheck = await pool.query(
      `SELECT t.id, t.company_id, tm.student_id, tm.status
       FROM tasks t
       LEFT JOIN task_matches tm ON t.id = tm.task_id AND tm.student_id = $1
       WHERE t.id = $2 AND t.company_id = $3`,
      [studentId, taskId, companyId]
    );

    if (taskCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '任务不存在或学生未接单'
      });
    }

    const match = taskCheck.rows[0];
    if (match.status !== 'accepted' && match.status !== 'in_progress' && match.status !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: '只有接单后才能开启聊天'
      });
    }

    // 查找或创建会话
    let session = await pool.query(
      `SELECT * FROM chat_sessions
       WHERE task_id = $1 AND student_id = $2 AND company_id = $3`,
      [taskId, studentId, companyId]
    );

    if (session.rows.length === 0) {
      // 创建新会话
      session = await pool.query(
        `INSERT INTO chat_sessions (task_id, student_id, company_id)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [taskId, studentId, companyId]
      );

      // 发送系统消息
      await pool.query(
        `INSERT INTO chat_messages (session_id, sender_id, sender_type, message_type, content)
         VALUES ($1, $2, 'system', 'system', '聊天已开启，请保持友好沟通')`,
        [session.rows[0].id, userId]
      );
    }

    res.json({
      success: true,
      data: session.rows[0]
    });
  } catch (error) {
    console.error('获取或创建会话失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 获取用户的所有聊天会话列表
export const getChatSessions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.role; // 'student' or 'company'

    const sessions = await pool.query(
      `SELECT
         cs.*,
         t.title as task_title,
         t.status as task_status,
         CASE
           WHEN cs.student_id = $1 THEN u_company.nickname
           ELSE u_student.nickname
         END as other_user_name,
         CASE
           WHEN cs.student_id = $1 THEN u_company.avatar
           ELSE u_student.avatar
         END as other_user_avatar,
         CASE
           WHEN cs.student_id = $1 THEN cs.student_unread_count
           ELSE cs.company_unread_count
         END as my_unread_count,
         (SELECT content FROM chat_messages WHERE session_id = cs.id ORDER BY created_at DESC LIMIT 1) as last_message
       FROM chat_sessions cs
       JOIN tasks t ON cs.task_id = t.id
       JOIN users u_student ON cs.student_id = u_student.id
       JOIN users u_company ON cs.company_id = u_company.id
       WHERE (cs.student_id = $1 OR cs.company_id = $1)
         AND cs.status = 'active'
       ORDER BY cs.last_message_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: sessions.rows
    });
  } catch (error) {
    console.error('获取会话列表失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 获取会话的聊天记录
export const getChatMessages = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;
    const { page = 1, limit = 50 } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // 验证权限：只有参与者才能查看消息
    const sessionCheck = await pool.query(
      `SELECT * FROM chat_sessions
       WHERE id = $1 AND (student_id = $2 OR company_id = $2)`,
      [sessionId, userId]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: '无权限查看此会话'
      });
    }

    // 获取消息列表
    const messages = await pool.query(
      `SELECT
         cm.*,
         u.nickname as sender_name,
         u.avatar as sender_avatar
       FROM chat_messages cm
       JOIN users u ON cm.sender_id = u.id
       WHERE cm.session_id = $1
       ORDER BY cm.created_at DESC
       LIMIT $2 OFFSET $3`,
      [sessionId, limit, offset]
    );

    // 获取总数
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM chat_messages WHERE session_id = $1`,
      [sessionId]
    );

    res.json({
      success: true,
      data: {
        messages: messages.rows.reverse(), // 反转顺序，最新的在最后
        total: parseInt(countResult.rows[0].total),
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('获取聊天记录失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 发送消息
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { content, messageType = 'text', fileUrl, fileName, fileSize } = req.body;
    const userId = req.user?.id;

    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '消息内容不能为空'
      });
    }

    // 验证权限并获取会话信息
    const sessionCheck = await pool.query(
      `SELECT * FROM chat_sessions
       WHERE id = $1 AND (student_id = $2 OR company_id = $2) AND status = 'active'`,
      [sessionId, userId]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: '无权限发送消息或会话已关闭'
      });
    }

    const session = sessionCheck.rows[0];
    const senderType = session.student_id === userId ? 'student' : 'company';

    // 插入消息
    const message = await pool.query(
      `INSERT INTO chat_messages
       (session_id, sender_id, sender_type, message_type, content, file_url, file_name, file_size)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [sessionId, userId, senderType, messageType, content, fileUrl, fileName, fileSize]
    );

    // 获取发送者信息
    const sender = await pool.query(
      `SELECT nickname, avatar FROM users WHERE id = $1`,
      [userId]
    );

    const result = {
      ...message.rows[0],
      sender_name: sender.rows[0].nickname,
      sender_avatar: sender.rows[0].avatar
    };

    // TODO: 这里应该通过WebSocket推送消息给对方
    // 或者通过消息队列发送推送通知

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('发送消息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 标记消息为已读
export const markMessagesAsRead = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    // 验证权限
    const sessionCheck = await pool.query(
      `SELECT * FROM chat_sessions
       WHERE id = $1 AND (student_id = $2 OR company_id = $2)`,
      [sessionId, userId]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: '无权限操作此会话'
      });
    }

    const session = sessionCheck.rows[0];
    const isStudent = session.student_id === userId;

    // 获取所有未读消息
    const unreadMessages = await pool.query(
      `SELECT id FROM chat_messages
       WHERE session_id = $1
         AND sender_id != $2
         AND is_read = FALSE`,
      [sessionId, userId]
    );

    // 批量标记为已读
    if (unreadMessages.rows.length > 0) {
      const messageIds = unreadMessages.rows.map(m => m.id);

      await pool.query(
        `UPDATE chat_messages
         SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
         WHERE id = ANY($1)`,
        [messageIds]
      );

      // 插入已读记录
      for (const msg of unreadMessages.rows) {
        await pool.query(
          `INSERT INTO message_read_status (message_id, user_id)
           VALUES ($1, $2)
           ON CONFLICT (message_id, user_id) DO NOTHING`,
          [msg.id, userId]
        );
      }

      // 重置未读计数
      if (isStudent) {
        await pool.query(
          `UPDATE chat_sessions SET student_unread_count = 0 WHERE id = $1`,
          [sessionId]
        );
      } else {
        await pool.query(
          `UPDATE chat_sessions SET company_unread_count = 0 WHERE id = $1`,
          [sessionId]
        );
      }
    }

    res.json({
      success: true,
      data: {
        markedCount: unreadMessages.rows.length
      }
    });
  } catch (error) {
    console.error('标记已读失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 获取未读消息总数
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const result = await pool.query(
      `SELECT
         SUM(CASE WHEN student_id = $1 THEN student_unread_count ELSE company_unread_count END) as total_unread
       FROM chat_sessions
       WHERE (student_id = $1 OR company_id = $1) AND status = 'active'`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        totalUnread: parseInt(result.rows[0].total_unread || 0)
      }
    });
  } catch (error) {
    console.error('获取未读数失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 归档会话
export const archiveSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    // 验证权限
    const sessionCheck = await pool.query(
      `SELECT * FROM chat_sessions
       WHERE id = $1 AND (student_id = $2 OR company_id = $2)`,
      [sessionId, userId]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: '无权限操作此会话'
      });
    }

    await pool.query(
      `UPDATE chat_sessions SET status = 'archived' WHERE id = $1`,
      [sessionId]
    );

    res.json({
      success: true,
      message: '会话已归档'
    });
  } catch (error) {
    console.error('归档会话失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};
