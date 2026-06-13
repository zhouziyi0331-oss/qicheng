import express from 'express';
import studentGrowthService from '../../services/studentGrowthService';
import { authenticate } from '../../middleware/auth';

const router = express.Router();

/**
 * GET /api/students/:id/growth-timeline
 * 获取学生成长时间轴
 */
router.get('/:id/growth-timeline', authenticate, async (req, res) => {
  try {
    const { id: studentId } = req.params;
    const { startDate, endDate, eventTypes, limit } = req.query;

    // 权限检查：企业用户或学生本人
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company' && userId !== studentId) {
      return res.status(403).json({
        success: false,
        message: '无权查看该学生的成长轨迹',
      });
    }

    const options: any = {};

    if (startDate) {
      options.startDate = new Date(startDate as string);
    }

    if (endDate) {
      options.endDate = new Date(endDate as string);
    }

    if (eventTypes) {
      options.eventTypes = Array.isArray(eventTypes)
        ? eventTypes
        : [eventTypes];
    }

    if (limit) {
      options.limit = parseInt(limit as string, 10);
    }

    const timeline = await studentGrowthService.getGrowthTimeline(
      studentId,
      options
    );

    res.json({
      success: true,
      data: timeline,
    });
  } catch (error: any) {
    logger.error('获取成长时间轴失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取成长时间轴失败',
    });
  }
});

/**
 * GET /api/students/:id/milestones
 * 获取学生里程碑列表
 */
router.get('/:id/milestones', authenticate, async (req, res) => {
  try {
    const { id: studentId } = req.params;

    // 权限检查
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company' && userId !== studentId) {
      return res.status(403).json({
        success: false,
        message: '无权查看该学生的里程碑',
      });
    }

    const timeline = await studentGrowthService.getGrowthTimeline(studentId, {
      limit: 0, // 只获取里程碑
    });

    res.json({
      success: true,
      data: {
        milestones: timeline.milestones,
        total: timeline.summary.total_milestones,
      },
    });
  } catch (error: any) {
    logger.error('获取里程碑失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取里程碑失败',
    });
  }
});

/**
 * GET /api/students/:id/skill-evolution
 * 获取学生技能进化轨迹
 */
router.get('/:id/skill-evolution', authenticate, async (req, res) => {
  try {
    const { id: studentId } = req.params;

    // 权限检查
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company' && userId !== studentId) {
      return res.status(403).json({
        success: false,
        message: '无权查看该学生的技能进化',
      });
    }

    const timeline = await studentGrowthService.getGrowthTimeline(studentId, {
      limit: 0,
    });

    res.json({
      success: true,
      data: {
        skills: timeline.skill_evolution,
        summary: {
          total_skills: timeline.skill_evolution.length,
          skills_mastered: timeline.summary.skills_mastered,
        },
      },
    });
  } catch (error: any) {
    logger.error('获取技能进化失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取技能进化失败',
    });
  }
});

/**
 * POST /api/students/:id/growth-events
 * 记录成长事件（内部使用）
 */
router.post('/:id/growth-events', authenticate, async (req, res) => {
  try {
    const { id: studentId } = req.params;
    const {
      eventType,
      title,
      description,
      impactScore,
      relatedTaskId,
      relatedSkill,
      metricChange,
      eventDate,
    } = req.body;

    // 权限检查：只有系统管理员可以手动添加
    const userRole = (req as any).user.role;
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权添加成长事件',
      });
    }

    // 验证必填字段
    if (!eventType || !title || impactScore === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: eventType, title, impactScore',
      });
    }

    const event = await studentGrowthService.recordGrowthEvent({
      studentId,
      eventType,
      title,
      description,
      impactScore,
      relatedTaskId,
      relatedSkill,
      metricChange,
      eventDate: eventDate ? new Date(eventDate) : undefined,
    });

    res.json({
      success: true,
      data: event,
    });
  } catch (error: any) {
    logger.error('记录成长事件失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '记录成长事件失败',
    });
  }
});

/**
 * GET /api/students/:id/growth-summary
 * 获取学生成长概览
 */
router.get('/:id/growth-summary', authenticate, async (req, res) => {
  try {
    const { id: studentId } = req.params;

    // 权限检查
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company' && userId !== studentId) {
      return res.status(403).json({
        success: false,
        message: '无权查看该学生的成长概览',
      });
    }

    const timeline = await studentGrowthService.getGrowthTimeline(studentId, {
      limit: 100,
    });

    // 构建概览数据
    const summary = {
      overview: timeline.summary,
      recent_events: timeline.events.slice(0, 5),
      featured_milestones: timeline.milestones
        .filter((m) => m.is_featured)
        .slice(0, 3),
      top_skills: timeline.skill_evolution.slice(0, 5),
    };

    res.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    logger.error('获取成长概览失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取成长概览失败',
    });
  }
});

export default router;
