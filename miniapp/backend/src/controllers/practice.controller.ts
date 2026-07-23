import { Request, Response } from 'express'
import { PracticeProject } from '../models/PracticeProject'
import { PracticeReport } from '../models/PracticeReport'
import { DecompositionReport } from '../models/DecompositionReport'
import { aiDecompositionService } from '../services/aiDecomposition.service'
import { paymentService } from '../services/payment.service'

export class PracticeController {
  /**
   * GET /api/practice/projects
   * 获取实践项目列表
   */
  async getProjects(req: Request, res: Response) {
    try {
      const { status, track, page = 1, limit = 20 } = req.query
      const userId = req.userId // 从JWT中间件获取

      const query: any = { userId }
      if (status) query.status = status
      if (track) query.track = track

      const skip = (Number(page) - 1) * Number(limit)

      const [projects, total] = await Promise.all([
        PracticeProject.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        PracticeProject.countDocuments(query)
      ])

      // 转换为前端需要的格式
      const formattedProjects = projects.map(p => ({
        id: p._id.toString(),
        title: p.title,
        company: p.company,
        track: p.track,
        status: p.status,
        tags: p.tags,
        insight: this.generateInsight(p),
        progress: p.progress,
        startDate: this.formatDate(p.startDate),
        endDate: p.endDate ? this.formatDate(p.endDate) : undefined,
        expectedEndDate: p.expectedEndDate ? this.formatDate(p.expectedEndDate) : undefined,
        budget: p.budget,
        icon: this.getIcon(p.track)
      }))

      res.json({
        projects: formattedProjects,
        total,
        page: Number(page),
        limit: Number(limit)
      })
    } catch (error) {
      console.error('获取项目列表失败:', error)
      res.status(500).json({ error: '获取项目列表失败' })
    }
  }

  /**
   * GET /api/practice/projects/:id/report
   * 获取项目详细报告
   */
  async getReport(req: Request, res: Response) {
    try {
      const { id } = req.params
      const userId = req.userId

      const project = await PracticeProject.findById(id)
      if (!project) {
        return res.status(404).json({ error: '项目不存在' })
      }

      if (project.userId !== userId) {
        return res.status(403).json({ error: '无权访问此项目' })
      }

      const report = await PracticeReport.findOne({ projectId: id })
      if (!report) {
        return res.status(404).json({ error: '报告不存在' })
      }

      // 格式化报告数据
      const formattedReport = {
        id: report._id.toString(),
        title: project.title,
        company: project.company,
        track: project.track,
        tags: project.tags,
        status: project.status,
        dateRange: this.getDateRange(project.startDate, project.endDate),
        duration: this.getDuration(project.startDate, project.endDate),
        budget: project.budget,
        scores: project.scores || { execution: 0, problemSolving: 0, replicability: 0 },
        whatDid: report.whatDid,
        problemSolved: report.problemSolved,
        replicability: report.replicability,
        learned: report.learned,
        rewards: report.rewards
      }

      res.json(formattedReport)
    } catch (error) {
      console.error('获取报告失败:', error)
      res.status(500).json({ error: '获取报告失败' })
    }
  }

  /**
   * GET /api/practice/stats
   * 获取统计数据
   */
  async getStats(req: Request, res: Response) {
    try {
      const userId = req.userId

      const [completed, ongoing, projects] = await Promise.all([
        PracticeProject.countDocuments({ userId, status: 'completed' }),
        PracticeProject.countDocuments({ userId, status: 'ongoing' }),
        PracticeProject.find({ userId, status: 'completed' }).select('budget scores').lean()
      ])

      const totalIncome = projects.reduce((sum, p) => sum + p.budget, 0)
      const avgRating = projects.length > 0
        ? projects.reduce((sum, p) => {
            const avg = p.scores ? (p.scores.execution + p.scores.problemSolving + p.scores.replicability) / 3 : 0
            return sum + avg
          }, 0) / projects.length
        : 0

      res.json({
        completed,
        ongoing,
        totalIncome,
        avgRating: Math.round(avgRating * 10) / 10
      })
    } catch (error) {
      console.error('获取统计数据失败:', error)
      res.status(500).json({ error: '获取统计数据失败' })
    }
  }

  /**
   * PUT /api/practice/projects/:id/progress
   * 更新项目进度
   */
  async updateProgress(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { progress } = req.body
      const userId = req.userId

      if (progress < 0 || progress > 100) {
        return res.status(400).json({ error: '进度必须在0-100之间' })
      }

      const project = await PracticeProject.findById(id)
      if (!project) {
        return res.status(404).json({ error: '项目不存在' })
      }

      if (project.userId !== userId) {
        return res.status(403).json({ error: '无权修改此项目' })
      }

      project.progress = progress
      if (progress === 100 && project.status === 'ongoing') {
        project.status = 'completed'
        project.endDate = new Date()
      }

      await project.save()

      res.json({ success: true, progress, status: project.status })
    } catch (error) {
      console.error('更新进度失败:', error)
      res.status(500).json({ error: '更新进度失败' })
    }
  }

  /**
   * POST /api/practice/decomposition/generate
   * 生成AI拆解报告
   */
  async generateDecomposition(req: Request, res: Response) {
    try {
      const { projectId } = req.body
      const userId = req.userId

      if (!projectId) {
        return res.status(400).json({ error: '缺少projectId参数' })
      }

      if (!userId) {
        return res.status(401).json({ error: '未授权' })
      }

      // 异步生成报告（可以改为后台任务队列）
      const preview = await aiDecompositionService.generateDecompositionReport(projectId, userId)

      res.json({
        success: true,
        message: '报告生成中',
        preview
      })
    } catch (error: any) {
      console.error('生成拆解报告失败:', error)
      res.status(500).json({ error: error.message || '生成拆解报告失败' })
    }
  }

  /**
   * GET /api/practice/decomposition/:reportId/status
   * 查询生成状态
   */
  async getDecompositionStatus(req: Request, res: Response) {
    try {
      const { reportId } = req.params
      const userId = req.userId

      const report = await DecompositionReport.findById(reportId)
      if (!report) {
        return res.status(404).json({ error: '报告不存在' })
      }

      if (report.userId !== userId) {
        return res.status(403).json({ error: '无权访问此报告' })
      }

      res.json({
        status: report.status,
        isUnlocked: report.isUnlocked,
        createdAt: report.createdAt
      })
    } catch (error) {
      console.error('查询状态失败:', error)
      res.status(500).json({ error: '查询状态失败' })
    }
  }

  /**
   * POST /api/practice/decomposition/:reportId/unlock
   * 解锁报告（付费）
   */
  async unlockDecomposition(req: Request, res: Response) {
    try {
      const { reportId } = req.params
      const { paymentAmount } = req.body
      const userId = req.userId

      if (!userId) {
        return res.status(401).json({ error: '未授权' })
      }

      // 验证支付
      const hasPaid = await paymentService.verifyPayment(userId, 'decomposition_report', reportId)
      if (!hasPaid) {
        return res.status(403).json({ error: '请先完成支付' })
      }

      const report = await aiDecompositionService.unlockReport(reportId, userId, paymentAmount)

      res.json({
        success: true,
        message: '解锁成功',
        report
      })
    } catch (error: any) {
      console.error('解锁报告失败:', error)
      res.status(500).json({ error: error.message || '解锁报告失败' })
    }
  }

  /**
   * GET /api/practice/decomposition/:reportId
   * 获取完整报告
   */
  async getDecomposition(req: Request, res: Response) {
    try {
      const { reportId } = req.params
      const userId = req.userId

      if (!userId) {
        return res.status(401).json({ error: '未授权' })
      }

      const report = await aiDecompositionService.getFullReport(reportId, userId)

      res.json(report)
    } catch (error: any) {
      console.error('获取报告失败:', error)
      res.status(500).json({ error: error.message || '获取报告失败' })
    }
  }

  // 辅助方法
  private generateInsight(project: any): string {
    // 根据项目数据生成核心洞察
    return `通过${project.description.substring(0, 50)}...帮助企业提升效率`
  }

  private getIcon(track: string): string {
    return track === 'content' ? '◆' : '○'
  }

  private formatDate(date: Date): string {
    const d = new Date(date)
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  }

  private getDateRange(start: Date, end?: Date): string {
    const startStr = this.formatDate(start)
    if (end) {
      const endStr = this.formatDate(end)
      return `${startStr} - ${endStr}`
    }
    return `${startStr} - 进行中`
  }

  private getDuration(start: Date, end?: Date): string {
    const startTime = new Date(start).getTime()
    const endTime = end ? new Date(end).getTime() : Date.now()
    const days = Math.floor((endTime - startTime) / (1000 * 60 * 60 * 24))

    if (days < 30) return `${days}天`
    if (days < 365) return `${Math.floor(days / 30)}个月`
    return `${Math.floor(days / 365)}年`
  }
}

export const practiceController = new PracticeController()
