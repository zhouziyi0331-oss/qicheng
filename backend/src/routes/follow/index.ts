import express from 'express';
import followService from '../../services/followService';
import { authenticateToken } from '../../middleware/auth';

const router = express.Router();

/**
 * POST /api/follow/student
 * 关注学生
 */
router.post('/student', authenticateToken, async (req, res) => {
  try {
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业可以关注学生',
      });
    }

    const { studentId, follow_source, follow_reason, tags, notes } = req.body;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: studentId',
      });
    }

    const follow = await followService.followStudent({
      company_id: companyId,
      student_id: studentId,
      follow_source,
      follow_reason,
      tags,
      notes,
    });

    res.json({
      success: true,
      data: follow,
      message: '关注成功',
    });
  } catch (error: any) {
    console.error('关注学生失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '关注学生失败',
    });
  }
});

/**
 * DELETE /api/follow/student/:studentId
 * 取消关注学生
 */
router.delete('/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const { studentId } = req.params;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业可以取消关注',
      });
    }

    await followService.unfollowStudent(companyId, studentId);

    res.json({
      success: true,
      message: '取消关注成功',
    });
  } catch (error: any) {
    console.error('取消关注失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '取消关注失败',
    });
  }
});

/**
 * GET /api/follow/student/:studentId/status
 * 检查是否关注某学生
 */
router.get('/student/:studentId/status', authenticateToken, async (req, res) => {
  try {
    const companyId = (req as any).user.id;
    const { studentId } = req.params;

    const isFollowing = await followService.isFollowing(companyId, studentId);

    res.json({
      success: true,
      data: { is_following: isFollowing },
    });
  } catch (error: any) {
    console.error('检查关注状态失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '检查关注状态失败',
    });
  }
});

/**
 * GET /api/follow/following
 * 获取企业关注的学生列表
 */
router.get('/following', authenticateToken, async (req, res) => {
  try {
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const { limit, offset } = req.query;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业可以查看关注列表',
      });
    }

    const students = await followService.getFollowingStudents(
      companyId,
      limit ? parseInt(limit as string, 10) : 50,
      offset ? parseInt(offset as string, 10) : 0
    );

    res.json({
      success: true,
      data: {
        students,
        total: students.length,
      },
    });
  } catch (error: any) {
    console.error('获取关注列表失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取关注列表失败',
    });
  }
});

/**
 * GET /api/follow/followers
 * 获取学生的粉丝列表（学生查看谁关注了我）
 */
router.get('/followers', authenticateToken, async (req, res) => {
  try {
    const studentId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const { limit, offset } = req.query;

    if (userRole !== 'student') {
      return res.status(403).json({
        success: false,
        message: '只有学生可以查看粉丝列表',
      });
    }

    const followers = await followService.getFollowers(
      studentId,
      limit ? parseInt(limit as string, 10) : 50,
      offset ? parseInt(offset as string, 10) : 0
    );

    res.json({
      success: true,
      data: {
        followers,
        total: followers.length,
      },
    });
  } catch (error: any) {
    console.error('获取粉丝列表失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取粉丝列表失败',
    });
  }
});

/**
 * PUT /api/follow/student/:studentId/settings
 * 更新关注设置
 */
router.put('/student/:studentId/settings', authenticateToken, async (req, res) => {
  try {
    const companyId = (req as any).user.id;
    const { studentId } = req.params;

    const follow = await followService.updateFollowSettings(companyId, studentId, req.body);

    res.json({
      success: true,
      data: follow,
      message: '设置更新成功',
    });
  } catch (error: any) {
    console.error('更新关注设置失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '更新关注设置失败',
    });
  }
});

/**
 * GET /api/follow/activities/feed
 * 获取关注学生的动态流
 */
router.get('/activities/feed', authenticateToken, async (req, res) => {
  try {
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const { limit } = req.query;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业可以查看动态流',
      });
    }

    const activities = await followService.getFollowingActivitiesFeed(
      companyId,
      limit ? parseInt(limit as string, 10) : 30
    );

    res.json({
      success: true,
      data: {
        activities,
        total: activities.length,
      },
    });
  } catch (error: any) {
    console.error('获取动态流失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取动态流失败',
    });
  }
});

/**
 * GET /api/follow/activities/student/:studentId
 * 获取某学生的动态
 */
router.get('/activities/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { limit, offset } = req.query;

    const activities = await followService.getStudentActivities(
      studentId,
      limit ? parseInt(limit as string, 10) : 20,
      offset ? parseInt(offset as string, 10) : 0
    );

    res.json({
      success: true,
      data: {
        activities,
        total: activities.length,
      },
    });
  } catch (error: any) {
    console.error('获取学生动态失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取学生动态失败',
    });
  }
});

/**
 * GET /api/follow/notifications
 * 获取关注通知
 */
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const { limit, offset } = req.query;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业可以查看通知',
      });
    }

    const notifications = await followService.getFollowNotifications(
      companyId,
      limit ? parseInt(limit as string, 10) : 50,
      offset ? parseInt(offset as string, 10) : 0
    );

    res.json({
      success: true,
      data: {
        notifications,
        total: notifications.length,
      },
    });
  } catch (error: any) {
    console.error('获取通知失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取通知失败',
    });
  }
});

/**
 * POST /api/follow/notifications/:id/read
 * 标记通知已读
 */
router.post('/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const companyId = (req as any).user.id;
    const { id } = req.params;

    await followService.markNotificationAsRead(id, companyId);

    res.json({
      success: true,
      message: '已标记为已读',
    });
  } catch (error: any) {
    console.error('标记已读失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '标记已读失败',
    });
  }
});

/**
 * POST /api/follow/notifications/read-all
 * 标记所有通知已读
 */
router.post('/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    const companyId = (req as any).user.id;

    await followService.markAllNotificationsAsRead(companyId);

    res.json({
      success: true,
      message: '所有通知已标记为已读',
    });
  } catch (error: any) {
    console.error('标记所有已读失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '标记所有已读失败',
    });
  }
});

/**
 * GET /api/follow/notifications/unread-count
 * 获取未读通知数
 */
router.get('/notifications/unread-count', authenticateToken, async (req, res) => {
  try {
    const companyId = (req as any).user.id;

    const count = await followService.getUnreadNotificationCount(companyId);

    res.json({
      success: true,
      data: { unread_count: count },
    });
  } catch (error: any) {
    console.error('获取未读数失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取未读数失败',
    });
  }
});

/**
 * POST /api/follow/collections
 * 创建收藏夹
 */
router.post('/collections', authenticateToken, async (req, res) => {
  try {
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const { name, description, color } = req.body;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业可以创建收藏夹',
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: name',
      });
    }

    const collection = await followService.createCollection({
      company_id: companyId,
      name,
      description,
      color,
    });

    res.json({
      success: true,
      data: collection,
      message: '收藏夹创建成功',
    });
  } catch (error: any) {
    console.error('创建收藏夹失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '创建收藏夹失败',
    });
  }
});

/**
 * GET /api/follow/collections
 * 获取收藏夹列表
 */
router.get('/collections', authenticateToken, async (req, res) => {
  try {
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业可以查看收藏夹',
      });
    }

    const collections = await followService.getCollections(companyId);

    res.json({
      success: true,
      data: {
        collections,
        total: collections.length,
      },
    });
  } catch (error: any) {
    console.error('获取收藏夹列表失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取收藏夹列表失败',
    });
  }
});

/**
 * PUT /api/follow/collections/:id
 * 更新收藏夹
 */
router.put('/collections/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const collection = await followService.updateCollection(id, req.body);

    res.json({
      success: true,
      data: collection,
      message: '收藏夹更新成功',
    });
  } catch (error: any) {
    console.error('更新收藏夹失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '更新收藏夹失败',
    });
  }
});

/**
 * DELETE /api/follow/collections/:id
 * 删除收藏夹
 */
router.delete('/collections/:id', authenticateToken, async (req, res) => {
  try {
    const companyId = (req as any).user.id;
    const { id } = req.params;

    await followService.deleteCollection(id, companyId);

    res.json({
      success: true,
      message: '收藏夹删除成功',
    });
  } catch (error: any) {
    console.error('删除收藏夹失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '删除收藏夹失败',
    });
  }
});

/**
 * POST /api/follow/collections/:id/students
 * 将学生添加到收藏夹
 */
router.post('/collections/:id/students', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: studentId',
      });
    }

    await followService.addStudentToCollection(id, studentId);

    res.json({
      success: true,
      message: '学生添加成功',
    });
  } catch (error: any) {
    console.error('添加学生到收藏夹失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '添加学生到收藏夹失败',
    });
  }
});

/**
 * DELETE /api/follow/collections/:id/students/:studentId
 * 从收藏夹移除学生
 */
router.delete('/collections/:id/students/:studentId', authenticateToken, async (req, res) => {
  try {
    const { id, studentId } = req.params;

    await followService.removeStudentFromCollection(id, studentId);

    res.json({
      success: true,
      message: '学生移除成功',
    });
  } catch (error: any) {
    console.error('移除学生失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '移除学生失败',
    });
  }
});

/**
 * GET /api/follow/collections/:id/students
 * 获取收藏夹中的学生
 */
router.get('/collections/:id/students', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const students = await followService.getCollectionStudents(id);

    res.json({
      success: true,
      data: {
        students,
        total: students.length,
      },
    });
  } catch (error: any) {
    console.error('获取收藏夹学生失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取收藏夹学生失败',
    });
  }
});

/**
 * GET /api/follow/stats
 * 获取关注统计
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业可以查看统计',
      });
    }

    const stats = await followService.getFollowStats(companyId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('获取关注统计失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取关注统计失败',
    });
  }
});

/**
 * GET /api/follow/recommended
 * 获取推荐关注的学生
 */
router.get('/recommended', authenticateToken, async (req, res) => {
  try {
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const { limit } = req.query;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业可以查看推荐',
      });
    }

    const students = await followService.getRecommendedStudents(
      companyId,
      limit ? parseInt(limit as string, 10) : 10
    );

    res.json({
      success: true,
      data: {
        students,
        total: students.length,
      },
    });
  } catch (error: any) {
    console.error('获取推荐学生失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取推荐学生失败',
    });
  }
});

export default router;
