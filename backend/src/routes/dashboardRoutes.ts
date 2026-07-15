import { Router } from 'express';
import { pool } from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();

// 所有路由需要认证
router.use(authenticate);

// Dashboard数据接口
router.get('/dashboard/data', async (req, res) => {
  try {
    const userId = req.user?.userId; // auth中间件设置的是userId不是id
    if (!userId) {
      return res.status(401).json({ success: false, message: '未授权' });
    }

    // 游戏化数据
    const gamificationQuery = await pool.query(
      `SELECT thinking_points, streak, ability_fragments
       FROM user_gamification WHERE user_id = $1`,
      [userId]
    );
    const gamification = gamificationQuery.rows[0] || {
      thinking_points: 0,
      streak: 0,
      ability_fragments: 0
    };

    // 学习统计
    const statsQuery = await pool.query(
      `SELECT
        COUNT(DISTINCT session_id) as total_sessions,
        COUNT(DISTINCT CASE WHEN status = 'completed' THEN session_id END) as completed_projects,
        COALESCE(SUM(duration_hours), 0) as study_hours,
        COUNT(DISTINCT deliverable_id) as deliverables
       FROM user_learning_stats WHERE user_id::text = $1`,
      [userId]
    );
    const stats = statsQuery.rows[0] || {
      total_sessions: 0,
      completed_projects: 0,
      study_hours: 0,
      deliverables: 0
    };

    // 进行中的学习会话
    const activeSessionsQuery = await pool.query(
      `SELECT
        s.id,
        t.title as course_name,
        s.current_stage,
        s.progress,
        t.icon
       FROM mentor_sessions s
       LEFT JOIN tasks t ON (s.task_id IS NOT NULL AND s.task_id != '' AND s.task_id::uuid = t.id)
       WHERE s.student_id::text = $1 AND s.status = 'active'
       ORDER BY s.updated_at DESC
       LIMIT 3`,
      [userId]
    );
    const activeSessions = activeSessionsQuery.rows.map(row => ({
      id: row.id,
      courseName: row.course_name,
      currentStage: row.current_stage || '情境化',
      progress: row.progress || 0,
      icon: row.icon || '📚'
    }));

    // 推荐课程 - 简化查询
    const recommendedCoursesQuery = await pool.query(
      `SELECT
        t.id,
        t.title as name,
        t.level as difficulty
       FROM tasks t
       ORDER BY t.id DESC
       LIMIT 5`,
      []
    );
    const recommendedCourses = recommendedCoursesQuery.rows.map(row => ({
      id: row.id,
      name: row.name,
      difficulty: row.difficulty || 'Lv.1',
      icon: row.icon || '📚'
    }));

    res.json({
      success: true,
      data: {
        gamification: {
          thinkingPoints: gamification.thinking_points,
          streak: gamification.streak,
          abilityFragments: gamification.ability_fragments
        },
        stats: {
          totalSessions: parseInt(stats.total_sessions),
          completedProjects: parseInt(stats.completed_projects),
          studyHours: parseInt(stats.study_hours),
          deliverables: parseInt(stats.deliverables)
        },
        activeSessions,
        recommendedCourses
      }
    });
  } catch (error) {
    console.error('获取dashboard数据失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;
