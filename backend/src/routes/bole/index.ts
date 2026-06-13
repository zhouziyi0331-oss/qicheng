import express from 'express';
import boleService from '../../services/boleService';
import { authenticateToken } from '../../middleware/auth';

const router = express.Router();

/**
 * POST /api/bole/discover
 * 创建伯乐推荐
 */
router.post('/discover', authenticateToken, async (req, res) => {
  try {
    const discovererId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业可以推荐学生',
      });
    }

    const { student_id, discovery_reason, recommended_skills, potential_rating } = req.body;

    if (!student_id || !discovery_reason) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: student_id, discovery_reason',
      });
    }

    const discovery = await boleService.createDiscovery({
      discoverer_id: discovererId,
      student_id,
      discovery_reason,
      recommended_skills,
      potential_rating,
    });

    res.json({
      success: true,
      data: discovery,
      message: '推荐成功，感谢您发现优秀人才！',
    });
  } catch (error: any) {
    console.error('创建推荐失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '创建推荐失败',
    });
  }
});

/**
 * GET /api/bole/discoveries
 * 获取推荐列表
 */
router.get('/discoveries', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    let discoveries;
    if (userRole === 'company') {
      discoveries = await boleService.getCompanyDiscoveries(userId);
    } else if (userRole === 'student') {
      discoveries = await boleService.getStudentDiscoveries(userId);
    } else {
      return res.status(403).json({
        success: false,
        message: '无权查看推荐列表',
      });
    }

    res.json({
      success: true,
      data: {
        discoveries,
        total: discoveries.length,
      },
    });
  } catch (error: any) {
    console.error('获取推荐列表失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取推荐列表失败',
    });
  }
});

/**
 * GET /api/bole/discoveries/:id
 * 获取推荐详情
 */
router.get('/discoveries/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const discovery = await boleService.getDiscoveryById(id);

    res.json({
      success: true,
      data: discovery,
    });
  } catch (error: any) {
    console.error('获取推荐详情失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取推荐详情失败',
    });
  }
});

/**
 * GET /api/bole/badges
 * 获取伯乐标签
 */
router.get('/badges', authenticateToken, async (req, res) => {
  try {
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业可以查看标签',
      });
    }

    const badges = await boleService.getBoleBadges(companyId);

    res.json({
      success: true,
      data: {
        badges,
        total: badges.length,
      },
    });
  } catch (error: any) {
    console.error('获取标签失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取标签失败',
    });
  }
});

/**
 * POST /api/bole/check-badge
 * 检查并授予标签
 */
router.post('/check-badge', authenticateToken, async (req, res) => {
  try {
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业可以检查标签',
      });
    }

    const badge = await boleService.checkAndAwardBadge(companyId);

    if (badge) {
      res.json({
        success: true,
        data: badge,
        message: `恭喜！您获得了「${badge.badge_name}」标签！`,
      });
    } else {
      res.json({
        success: true,
        data: null,
        message: '暂未满足新标签条件',
      });
    }
  } catch (error: any) {
    console.error('检查标签失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '检查标签失败',
    });
  }
});

/**
 * GET /api/bole/leaderboard
 * 获取伯乐排行榜
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const { month } = req.query;

    const leaderboard = await boleService.getLeaderboard(month as string);

    res.json({
      success: true,
      data: {
        leaderboard,
        total: leaderboard.length,
      },
    });
  } catch (error: any) {
    console.error('获取排行榜失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取排行榜失败',
    });
  }
});

/**
 * GET /api/bole/stats
 * 获取伯乐统计
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

    const stats = await boleService.getCompanyBoleStats(companyId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('获取伯乐统计失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取伯乐统计失败',
    });
  }
});

/**
 * GET /api/bole/reward-config
 * 获取奖励配置
 */
router.get('/reward-config', async (req, res) => {
  try {
    const config = await boleService.getRewardConfig();

    res.json({
      success: true,
      data: config,
    });
  } catch (error: any) {
    console.error('获取奖励配置失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取奖励配置失败',
    });
  }
});

/**
 * POST /api/bole/discoveries/:id/validate
 * 手动验证推荐（管理员）
 */
router.post('/discoveries/:id/validate', authenticateToken, async (req, res) => {
  try {
    const adminId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const { id } = req.params;

    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '只有管理员可以验证推荐',
      });
    }

    const discovery = await boleService.validateDiscovery(id, adminId);

    res.json({
      success: true,
      data: discovery,
      message: '验证成功',
    });
  } catch (error: any) {
    console.error('验证推荐失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '验证推荐失败',
    });
  }
});

/**
 * GET /api/bole/student/:studentId/growth
 * 获取学生成长轨迹
 */
router.get('/student/:studentId/growth', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { months } = req.query;

    const growth = await boleService.getStudentGrowthTrack(
      studentId,
      months ? parseInt(months as string, 10) : 12
    );

    res.json({
      success: true,
      data: {
        growth,
        total: growth.length,
      },
    });
  } catch (error: any) {
    console.error('获取成长轨迹失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取成长轨迹失败',
    });
  }
});

/**
 * GET /api/bole/recommended-students
 * 获取推荐候选学生
 */
router.get('/recommended-students', authenticateToken, async (req, res) => {
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

    const students = await boleService.getRecommendedStudents(
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
