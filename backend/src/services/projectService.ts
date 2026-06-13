import { pool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

interface Project {
  id: string;
  company_id: string;
  name: string;
  description: string;
  project_code: string;
  total_budget: number;
  budget_allocated: number;
  budget_spent: number;
  estimated_duration_days?: number;
  estimated_end_date?: Date;
  status: string;
  total_milestones: number;
  completed_milestones: number;
  total_tasks: number;
  completed_tasks: number;
  progress_percentage: number;
}

interface Milestone {
  id: string;
  project_id: string;
  milestone_order: number;
  title: string;
  description?: string;
  budget_allocation: number;
  budget_spent: number;
  estimated_duration_days?: number;
  due_date?: Date;
  status: string;
  deliverables: any[];
  acceptance_criteria: any[];
  depends_on_milestone_id?: string;
  total_tasks: number;
  completed_tasks: number;
  progress_percentage: number;
}

/**
 * E-14: 项目制发布服务
 * 支持大型项目的里程碑和任务管理
 */
class ProjectService {
  /**
   * 创建项目
   */
  async createProject(data: {
    companyId: string;
    name: string;
    description: string;
    totalBudget: number;
    estimatedDurationDays?: number;
    estimatedEndDate?: Date;
    category?: string;
    tags?: string[];
  }): Promise<Project> {
    const {
      companyId,
      name,
      description,
      totalBudget,
      estimatedDurationDays,
      estimatedEndDate,
      category,
      tags = [],
    } = data;

    const result = await pool.query(
      `INSERT INTO projects
       (id, company_id, name, description, total_budget,
        estimated_duration_days, estimated_end_date, category, tags, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft')
       RETURNING *`,
      [
        uuidv4(),
        companyId,
        name,
        description,
        totalBudget,
        estimatedDurationDays,
        estimatedEndDate,
        category,
        tags,
      ]
    );

    return result.rows[0];
  }

  /**
   * 更新项目
   */
  async updateProject(
    projectId: string,
    companyId: string,
    updates: Partial<{
      name: string;
      description: string;
      totalBudget: number;
      estimatedDurationDays: number;
      estimatedEndDate: Date;
      status: string;
      category: string;
      tags: string[];
    }>
  ): Promise<Project> {
    // 构建更新语句
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        const dbKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
        fields.push(`${dbKey} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push(`updated_at = NOW()`);
    values.push(projectId, companyId);

    const result = await pool.query(
      `UPDATE projects
       SET ${fields.join(', ')}
       WHERE id = $${paramIndex} AND company_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Project not found or access denied');
    }

    return result.rows[0];
  }

  /**
   * 获取项目详情
   */
  async getProject(projectId: string, companyId: string): Promise<Project | null> {
    const result = await pool.query(
      `SELECT * FROM projects WHERE id = $1 AND company_id = $2`,
      [projectId, companyId]
    );

    return result.rows[0] || null;
  }

  /**
   * 获取企业的项目列表
   */
  async getCompanyProjects(
    companyId: string,
    options: {
      status?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ projects: Project[]; total: number }> {
    const { status, limit = 20, offset = 0 } = options;

    let query = `SELECT * FROM projects WHERE company_id = $1`;
    const params: any[] = [companyId];
    let paramIndex = 2;

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // 获取总数
    const countResult = await pool.query(
      query.replace('SELECT *', 'SELECT COUNT(*)'),
      params.slice(0, paramIndex - 1)
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // 获取列表
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    return {
      projects: result.rows,
      total,
    };
  }

  /**
   * 添加里程碑
   */
  async addMilestone(data: {
    projectId: string;
    companyId: string;
    milestoneOrder: number;
    title: string;
    description?: string;
    budgetAllocation: number;
    estimatedDurationDays?: number;
    dueDate?: Date;
    deliverables?: any[];
    acceptanceCriteria?: any[];
    dependsOnMilestoneId?: string;
  }): Promise<Milestone> {
    const {
      projectId,
      companyId,
      milestoneOrder,
      title,
      description,
      budgetAllocation,
      estimatedDurationDays,
      dueDate,
      deliverables = [],
      acceptanceCriteria = [],
      dependsOnMilestoneId,
    } = data;

    // 验证项目归属
    const project = await this.getProject(projectId, companyId);
    if (!project) {
      throw new Error('Project not found or access denied');
    }

    // 检查预算分配是否超出
    const allocatedResult = await pool.query(
      `SELECT COALESCE(SUM(budget_allocation), 0) as total
       FROM project_milestones WHERE project_id = $1`,
      [projectId]
    );
    const currentAllocated = parseFloat(allocatedResult.rows[0].total);

    if (currentAllocated + budgetAllocation > project.total_budget) {
      throw new Error('Milestone budget exceeds project total budget');
    }

    const result = await pool.query(
      `INSERT INTO project_milestones
       (id, project_id, milestone_order, title, description, budget_allocation,
        estimated_duration_days, due_date, deliverables, acceptance_criteria, depends_on_milestone_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        uuidv4(),
        projectId,
        milestoneOrder,
        title,
        description,
        budgetAllocation,
        estimatedDurationDays,
        dueDate,
        JSON.stringify(deliverables),
        JSON.stringify(acceptanceCriteria),
        dependsOnMilestoneId,
      ]
    );

    // 更新项目的已分配预算
    await pool.query(
      `UPDATE projects SET budget_allocated = budget_allocated + $1 WHERE id = $2`,
      [budgetAllocation, projectId]
    );

    return result.rows[0];
  }

  /**
   * 更新里程碑
   */
  async updateMilestone(
    milestoneId: string,
    companyId: string,
    updates: Partial<{
      title: string;
      description: string;
      budgetAllocation: number;
      dueDate: Date;
      status: string;
      deliverables: any[];
      acceptanceCriteria: any[];
    }>
  ): Promise<Milestone> {
    // 验证里程碑归属
    const milestone = await pool.query(
      `SELECT pm.*, p.company_id
       FROM project_milestones pm
       JOIN projects p ON pm.project_id = p.id
       WHERE pm.id = $1`,
      [milestoneId]
    );

    if (milestone.rows.length === 0 || milestone.rows[0].company_id !== companyId) {
      throw new Error('Milestone not found or access denied');
    }

    // 构建更新语句
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        const dbKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
        if (key === 'deliverables' || key === 'acceptanceCriteria') {
          fields.push(`${dbKey} = $${paramIndex}`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${dbKey} = $${paramIndex}`);
          values.push(value);
        }
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push(`updated_at = NOW()`);

    // 如果状态变为completed，设置completed_at
    if (updates.status === 'completed') {
      fields.push(`completed_at = NOW()`);
      fields.push(`progress_percentage = 100`);
    } else if (updates.status === 'in_progress') {
      fields.push(`started_at = COALESCE(started_at, NOW())`);
    }

    values.push(milestoneId);

    const result = await pool.query(
      `UPDATE project_milestones
       SET ${fields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  /**
   * 获取项目的里程碑列表
   */
  async getProjectMilestones(projectId: string, companyId: string): Promise<Milestone[]> {
    // 验证项目归属
    const project = await this.getProject(projectId, companyId);
    if (!project) {
      throw new Error('Project not found or access denied');
    }

    const result = await pool.query(
      `SELECT * FROM project_milestones
       WHERE project_id = $1
       ORDER BY milestone_order ASC`,
      [projectId]
    );

    return result.rows;
  }

  /**
   * 关联任务到项目
   */
  async linkTaskToProject(
    projectId: string,
    milestoneId: string | null,
    taskId: string,
    companyId: string,
    options: {
      taskOrder?: number;
      isCritical?: boolean;
    } = {}
  ): Promise<any> {
    const { taskOrder, isCritical = false } = options;

    // 验证项目归属
    const project = await this.getProject(projectId, companyId);
    if (!project) {
      throw new Error('Project not found or access denied');
    }

    // 验证任务归属
    const taskResult = await pool.query(
      `SELECT company_id FROM tasks WHERE id = $1`,
      [taskId]
    );

    if (taskResult.rows.length === 0 || taskResult.rows[0].company_id !== companyId) {
      throw new Error('Task not found or access denied');
    }

    const result = await pool.query(
      `INSERT INTO project_tasks
       (id, project_id, milestone_id, task_id, task_order, is_critical, linked_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (project_id, task_id) DO UPDATE
       SET milestone_id = EXCLUDED.milestone_id,
           task_order = EXCLUDED.task_order,
           is_critical = EXCLUDED.is_critical
       RETURNING *`,
      [uuidv4(), projectId, milestoneId, taskId, taskOrder, isCritical, companyId]
    );

    return result.rows[0];
  }

  /**
   * 获取项目的任务列表
   */
  async getProjectTasks(projectId: string, companyId: string): Promise<any[]> {
    // 验证项目归属
    const project = await this.getProject(projectId, companyId);
    if (!project) {
      throw new Error('Project not found or access denied');
    }

    const result = await pool.query(
      `SELECT pt.*, t.title as task_title, t.status as task_status,
              t.budget as task_budget, t.student_id, u.name as student_name
       FROM project_tasks pt
       JOIN tasks t ON pt.task_id = t.id
       LEFT JOIN users u ON t.student_id = u.id
       WHERE pt.project_id = $1
       ORDER BY pt.task_order NULLS LAST, pt.linked_at DESC`,
      [projectId]
    );

    return result.rows;
  }

  /**
   * 添加协作者到项目
   */
  async addCollaborator(
    projectId: string,
    studentId: string,
    companyId: string,
    options: {
      role?: string;
      responsibilities?: string[];
    } = {}
  ): Promise<any> {
    const { role, responsibilities = [] } = options;

    // 验证项目归属
    const project = await this.getProject(projectId, companyId);
    if (!project) {
      throw new Error('Project not found or access denied');
    }

    const result = await pool.query(
      `INSERT INTO project_collaborations
       (id, project_id, student_id, role, responsibilities)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (project_id, student_id) DO UPDATE
       SET role = EXCLUDED.role,
           responsibilities = EXCLUDED.responsibilities
       RETURNING *`,
      [uuidv4(), projectId, studentId, role, responsibilities]
    );

    return result.rows[0];
  }

  /**
   * 获取项目协作者
   */
  async getProjectCollaborators(projectId: string, companyId: string): Promise<any[]> {
    // 验证项目归属
    const project = await this.getProject(projectId, companyId);
    if (!project) {
      throw new Error('Project not found or access denied');
    }

    const result = await pool.query(
      `SELECT pc.*, u.name as student_name, u.avatar as student_avatar, u.level as student_level
       FROM project_collaborations pc
       JOIN users u ON pc.student_id = u.id
       WHERE pc.project_id = $1 AND pc.left_at IS NULL
       ORDER BY pc.joined_at DESC`,
      [projectId]
    );

    return result.rows;
  }

  /**
   * 发布项目
   */
  async publishProject(projectId: string, companyId: string): Promise<Project> {
    const project = await this.getProject(projectId, companyId);
    if (!project) {
      throw new Error('Project not found or access denied');
    }

    if (project.status !== 'draft' && project.status !== 'planning') {
      throw new Error('Project cannot be published from current status');
    }

    // 检查是否有里程碑
    const milestones = await this.getProjectMilestones(projectId, companyId);
    if (milestones.length === 0) {
      throw new Error('Project must have at least one milestone');
    }

    const result = await pool.query(
      `UPDATE projects
       SET status = 'published',
           published_at = NOW(),
           updated_at = NOW()
       WHERE id = $1 AND company_id = $2
       RETURNING *`,
      [projectId, companyId]
    );

    return result.rows[0];
  }

  /**
   * 计算项目进度
   */
  async calculateProjectProgress(projectId: string): Promise<number> {
    const result = await pool.query(
      `SELECT
         COUNT(*) as total_milestones,
         SUM(progress_percentage) as total_progress
       FROM project_milestones
       WHERE project_id = $1`,
      [projectId]
    );

    const { total_milestones, total_progress } = result.rows[0];

    if (!total_milestones || total_milestones === 0) {
      return 0;
    }

    const progress = parseFloat(total_progress) / parseInt(total_milestones, 10);

    // 更新项目进度
    await pool.query(
      `UPDATE projects SET progress_percentage = $1, updated_at = NOW() WHERE id = $2`,
      [progress, projectId]
    );

    return progress;
  }
}

export default new ProjectService();
