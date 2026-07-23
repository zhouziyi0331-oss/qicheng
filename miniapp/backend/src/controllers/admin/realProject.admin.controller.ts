import { Request, Response } from 'express'
import { RealProject } from '../../models/RealProject'

/**
 * 管理员 - 真实项目管理控制器
 */
export class AdminRealProjectController {

  /**
   * 创建可接单项目
   * POST /api/admin/real-projects
   */
  async createProject(req: Request, res: Response) {
    try {
      const {
        title,
        description,
        company,
        category,
        difficulty,
        requiredAbilities,
        estimatedDays,
        budget
      } = req.body

      if (!title || !description || !company || !budget) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数：title, description, company, budget'
        })
      }

      const project = await RealProject.create({
        title,
        description,
        company,
        category,
        difficulty: difficulty || 'medium',
        requiredAbilities: requiredAbilities || [],
        estimatedDays: estimatedDays || 7,
        budget,
        status: 'available'
      })

      res.status(201).json({
        success: true,
        data: project,
        message: '项目创建成功'
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '创建项目失败'
      })
    }
  }

  /**
   * 批量创建项目
   * POST /api/admin/real-projects/batch
   */
  async createProjectsBatch(req: Request, res: Response) {
    try {
      const { projects } = req.body

      if (!Array.isArray(projects) || projects.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'projects必须是非空数组'
        })
      }

      const createdProjects = await RealProject.insertMany(
        projects.map(p => ({
          ...p,
          status: 'available',
          difficulty: p.difficulty || 'medium',
          estimatedDays: p.estimatedDays || 7,
          requiredAbilities: p.requiredAbilities || []
        }))
      )

      res.status(201).json({
        success: true,
        data: createdProjects,
        count: createdProjects.length,
        message: `成功创建${createdProjects.length}个项目`
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '批量创建项目失败'
      })
    }
  }

  /**
   * 获取所有项目（管理员视图）
   * GET /api/admin/real-projects
   */
  async getAllProjects(req: Request, res: Response) {
    try {
      const { status, difficulty, category, page = 1, limit = 20 } = req.query

      const filter: any = {}
      if (status) filter.status = status
      if (difficulty) filter.difficulty = difficulty
      if (category) filter.category = category

      const skip = (Number(page) - 1) * Number(limit)

      const [projects, total] = await Promise.all([
        RealProject.find(filter)
          .populate('userId', 'nickname avatar')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        RealProject.countDocuments(filter)
      ])

      res.json({
        success: true,
        data: projects,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit))
        }
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '获取项目列表失败'
      })
    }
  }

  /**
   * 更新项目信息
   * PUT /api/admin/real-projects/:projectId
   */
  async updateProject(req: Request, res: Response) {
    try {
      const { projectId } = req.params
      const updates = req.body

      // 不允许通过此接口修改某些字段
      delete updates.userId
      delete updates.projectNumber
      delete updates.actualEarnings
      delete updates.platformCommission
      delete updates.netIncome
      delete updates.clientRating

      const project = await RealProject.findByIdAndUpdate(
        projectId,
        updates,
        { new: true }
      )

      if (!project) {
        return res.status(404).json({
          success: false,
          message: '项目不存在'
        })
      }

      res.json({
        success: true,
        data: project,
        message: '项目更新成功'
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '更新项目失败'
      })
    }
  }

  /**
   * 删除项目
   * DELETE /api/admin/real-projects/:projectId
   */
  async deleteProject(req: Request, res: Response) {
    try {
      const { projectId } = req.params

      const project = await RealProject.findById(projectId)

      if (!project) {
        return res.status(404).json({
          success: false,
          message: '项目不存在'
        })
      }

      // 只能删除available状态的项目
      if (project.status !== 'available') {
        return res.status(400).json({
          success: false,
          message: '只能删除"可接单"状态的项目'
        })
      }

      await RealProject.findByIdAndDelete(projectId)

      res.json({
        success: true,
        message: '项目删除成功'
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '删除项目失败'
      })
    }
  }

  /**
   * 上架项目（设为available）
   * POST /api/admin/real-projects/:projectId/publish
   */
  async publishProject(req: Request, res: Response) {
    try {
      const { projectId } = req.params

      const project = await RealProject.findByIdAndUpdate(
        projectId,
        { status: 'available' },
        { new: true }
      )

      if (!project) {
        return res.status(404).json({
          success: false,
          message: '项目不存在'
        })
      }

      res.json({
        success: true,
        data: project,
        message: '项目已上架'
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '上架项目失败'
      })
    }
  }

  /**
   * 下架项目（设为cancelled）
   * POST /api/admin/real-projects/:projectId/unpublish
   */
  async unpublishProject(req: Request, res: Response) {
    try {
      const { projectId } = req.params

      const project = await RealProject.findById(projectId)

      if (!project) {
        return res.status(404).json({
          success: false,
          message: '项目不存在'
        })
      }

      if (project.status !== 'available') {
        return res.status(400).json({
          success: false,
          message: '只能下架"可接单"状态的项目'
        })
      }

      project.status = 'cancelled'
      await project.save()

      res.json({
        success: true,
        data: project,
        message: '项目已下架'
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '下架项目失败'
      })
    }
  }

  /**
   * 获取项目统计
   * GET /api/admin/real-projects/stats
   */
  async getProjectStats(req: Request, res: Response) {
    try {
      const [
        totalProjects,
        availableProjects,
        inProgressProjects,
        completedProjects,
        totalBudget
      ] = await Promise.all([
        RealProject.countDocuments(),
        RealProject.countDocuments({ status: 'available' }),
        RealProject.countDocuments({ status: 'in_progress' }),
        RealProject.countDocuments({ status: 'completed' }),
        RealProject.aggregate([
          { $match: { status: 'available' } },
          { $group: { _id: null, total: { $sum: '$budget' } } }
        ])
      ])

      res.json({
        success: true,
        data: {
          totalProjects,
          availableProjects,
          inProgressProjects,
          completedProjects,
          totalAvailableBudget: totalBudget[0]?.total || 0
        }
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '获取统计数据失败'
      })
    }
  }

  /**
   * 为已完成项目添加客户评价
   * POST /api/admin/real-projects/:projectId/rating
   */
  async addClientRating(req: Request, res: Response) {
    try {
      const { projectId } = req.params
      const { score, comment, tags } = req.body

      if (!score || score < 1 || score > 5) {
        return res.status(400).json({
          success: false,
          message: '评分必须在1-5之间'
        })
      }

      const project = await RealProject.findById(projectId)

      if (!project) {
        return res.status(404).json({
          success: false,
          message: '项目不存在'
        })
      }

      if (project.status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: '只能为已完成的项目添加评价'
        })
      }

      project.clientRating = {
        score,
        comment: comment || '',
        tags: tags || []
      }

      await project.save()

      res.json({
        success: true,
        data: project,
        message: '客户评价添加成功'
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '添加客户评价失败'
      })
    }
  }

  /**
   * 获取已完成但未评价的项目列表
   * GET /api/admin/real-projects/pending-rating
   */
  async getPendingRatingProjects(req: Request, res: Response) {
    try {
      const projects = await RealProject.find({
        status: 'completed',
        'clientRating.score': { $exists: false }
      })
        .populate('userId', 'nickname avatar')
        .sort({ completedAt: -1 })

      res.json({
        success: true,
        data: projects,
        count: projects.length
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '获取待评价项目失败'
      })
    }
  }
}

export const adminRealProjectController = new AdminRealProjectController()
