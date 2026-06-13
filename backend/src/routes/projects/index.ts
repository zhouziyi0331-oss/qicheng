import express from 'express';
import projectService from '../../services/projectService';
import { authenticate } from '../../middleware/auth';

const router = express.Router();

/**
 * POST /api/projects
 * 创建项目
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业用户可以创建项目',
      });
    }

    const {
      name,
      description,
      totalBudget,
      estimatedDurationDays,
      estimatedEndDate,
      category,
      tags,
    } = req.body;

    if (!name || !description || !totalBudget) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: name, description, totalBudget',
      });
    }

    const project = await projectService.createProject({
      companyId,
      name,
      description,
      totalBudget,
      estimatedDurationDays,
      estimatedEndDate: estimatedEndDate ? new Date(estimatedEndDate) : undefined,
      category,
      tags,
    });

    res.json({
      success: true,
      data: project,
      message: '项目创建成功',
    });
  } catch (error: any) {
    logger.error('创建项目失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '创建项目失败',
    });
  }
});

/**
 * GET /api/projects
 * 获取企业的项目列表
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业用户可以查看项目',
      });
    }

    const { status, limit, offset } = req.query;

    const result = await projectService.getCompanyProjects(companyId, {
      status: status as string | undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('获取项目列表失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取项目列表失败',
    });
  }
});

/**
 * GET /api/projects/:id
 * 获取项目详情
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业用户可以查看项目',
      });
    }

    const project = await projectService.getProject(projectId, companyId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在',
      });
    }

    res.json({
      success: true,
      data: project,
    });
  } catch (error: any) {
    logger.error('获取项目详情失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取项目详情失败',
    });
  }
});

/**
 * PUT /api/projects/:id
 * 更新项目
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业用户可以更新项目',
      });
    }

    const updates = req.body;

    const project = await projectService.updateProject(projectId, companyId, updates);

    res.json({
      success: true,
      data: project,
      message: '项目更新成功',
    });
  } catch (error: any) {
    logger.error('更新项目失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '更新项目失败',
    });
  }
});

/**
 * POST /api/projects/:id/milestones
 * 添加里程碑
 */
router.post('/:id/milestones', authenticate, async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业用户可以添加里程碑',
      });
    }

    const {
      milestoneOrder,
      title,
      description,
      budgetAllocation,
      estimatedDurationDays,
      dueDate,
      deliverables,
      acceptanceCriteria,
      dependsOnMilestoneId,
    } = req.body;

    if (!milestoneOrder || !title || !budgetAllocation) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: milestoneOrder, title, budgetAllocation',
      });
    }

    const milestone = await projectService.addMilestone({
      projectId,
      companyId,
      milestoneOrder,
      title,
      description,
      budgetAllocation,
      estimatedDurationDays,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      deliverables,
      acceptanceCriteria,
      dependsOnMilestoneId,
    });

    res.json({
      success: true,
      data: milestone,
      message: '里程碑添加成功',
    });
  } catch (error: any) {
    logger.error('添加里程碑失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '添加里程碑失败',
    });
  }
});

/**
 * GET /api/projects/:id/milestones
 * 获取项目的里程碑列表
 */
router.get('/:id/milestones', authenticate, async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业用户可以查看里程碑',
      });
    }

    const milestones = await projectService.getProjectMilestones(projectId, companyId);

    res.json({
      success: true,
      data: {
        milestones,
        total: milestones.length,
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
 * PUT /api/projects/milestones/:milestoneId
 * 更新里程碑
 */
router.put('/milestones/:milestoneId', authenticate, async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业用户可以更新里程碑',
      });
    }

    const updates = req.body;

    const milestone = await projectService.updateMilestone(milestoneId, companyId, updates);

    res.json({
      success: true,
      data: milestone,
      message: '里程碑更新成功',
    });
  } catch (error: any) {
    logger.error('更新里程碑失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '更新里程碑失败',
    });
  }
});

/**
 * POST /api/projects/:id/tasks
 * 关联任务到项目
 */
router.post('/:id/tasks', authenticate, async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业用户可以关联任务',
      });
    }

    const { taskId, milestoneId, taskOrder, isCritical } = req.body;

    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: taskId',
      });
    }

    const link = await projectService.linkTaskToProject(
      projectId,
      milestoneId || null,
      taskId,
      companyId,
      { taskOrder, isCritical }
    );

    res.json({
      success: true,
      data: link,
      message: '任务关联成功',
    });
  } catch (error: any) {
    logger.error('关联任务失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '关联任务失败',
    });
  }
});

/**
 * GET /api/projects/:id/tasks
 * 获取项目的任务列表
 */
router.get('/:id/tasks', authenticate, async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业用户可以查看任务',
      });
    }

    const tasks = await projectService.getProjectTasks(projectId, companyId);

    res.json({
      success: true,
      data: {
        tasks,
        total: tasks.length,
      },
    });
  } catch (error: any) {
    logger.error('获取任务列表失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取任务列表失败',
    });
  }
});

/**
 * POST /api/projects/:id/collaborators
 * 添加协作者到项目
 */
router.post('/:id/collaborators', authenticate, async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业用户可以添加协作者',
      });
    }

    const { studentId, role, responsibilities } = req.body;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: studentId',
      });
    }

    const collaborator = await projectService.addCollaborator(
      projectId,
      studentId,
      companyId,
      { role, responsibilities }
    );

    res.json({
      success: true,
      data: collaborator,
      message: '协作者添加成功',
    });
  } catch (error: any) {
    logger.error('添加协作者失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '添加协作者失败',
    });
  }
});

/**
 * GET /api/projects/:id/collaborators
 * 获取项目协作者
 */
router.get('/:id/collaborators', authenticate, async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业用户可以查看协作者',
      });
    }

    const collaborators = await projectService.getProjectCollaborators(projectId, companyId);

    res.json({
      success: true,
      data: {
        collaborators,
        total: collaborators.length,
      },
    });
  } catch (error: any) {
    logger.error('获取协作者失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取协作者失败',
    });
  }
});

/**
 * POST /api/projects/:id/publish
 * 发布项目
 */
router.post('/:id/publish', authenticate, async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const companyId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'company') {
      return res.status(403).json({
        success: false,
        message: '只有企业用户可以发布项目',
      });
    }

    const project = await projectService.publishProject(projectId, companyId);

    res.json({
      success: true,
      data: project,
      message: '项目发布成功',
    });
  } catch (error: any) {
    logger.error('发布项目失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '发布项目失败',
    });
  }
});

/**
 * GET /api/projects/:id/progress
 * 计算项目进度
 */
router.get('/:id/progress', authenticate, async (req, res) => {
  try {
    const { id: projectId } = req.params;

    const progress = await projectService.calculateProjectProgress(projectId);

    res.json({
      success: true,
      data: {
        progress_percentage: progress,
      },
    });
  } catch (error: any) {
    logger.error('计算项目进度失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '计算进度失败',
    });
  }
});

export default router;
