import { Request, Response, NextFunction } from 'express';
import { query, queryOne, withTransaction } from '../../utils/db';
import { AppError } from '../../middleware/errorHandler';

// GET /incubation/projects/:userId — 获取用户的孵化项目
export async function getProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.params;
    const projects = await query(
      `SELECT id, project_name, description, stage, progress_percentage,
              team_members, funding_goal, funding_raised, created_at, updated_at
       FROM incubation_projects
       WHERE creator_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [userId]
    );
    res.json({ success: true, data: projects });
  } catch (err) { next(err); }
}

// POST /incubation/project/create — 创建孵化项目
export async function createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { projectName, description, fundingGoal, teamMembers } = req.body;

    if (!projectName || projectName.trim().length === 0) {
      throw new AppError(400, '项目名称不能为空', 'EMPTY_PROJECT_NAME');
    }

    // 检查用户是否有孵化计划资格
    const profile = await queryOne<{ incubation_eligible: boolean }>(
      'SELECT incubation_eligible FROM student_profiles WHERE user_id = $1',
      [userId]
    );

    if (!profile || !profile.incubation_eligible) {
      throw new AppError(403, '您尚未获得孵化计划资格', 'NOT_ELIGIBLE');
    }

    const result = await query(
      `INSERT INTO incubation_projects
       (creator_id, project_name, description, stage, progress_percentage,
        team_members, funding_goal, funding_raised, created_at)
       VALUES ($1, $2, $3, 'ideation', 0, $4, $5, 0, NOW())
       RETURNING id`,
      [userId, projectName, description, teamMembers || [], fundingGoal || 0]
    );

    res.json({ success: true, data: { projectId: result[0].id } });
  } catch (err) { next(err); }
}

// POST /incubation/project/update — 更新项目进度
export async function updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { projectId, stage, progressPercentage, description } = req.body;

    if (!projectId) {
      throw new AppError(400, '缺少 projectId', 'MISSING_PROJECT_ID');
    }

    const project = await queryOne(
      `SELECT id FROM incubation_projects
       WHERE id = $1 AND creator_id = $2 AND deleted_at IS NULL`,
      [projectId, userId]
    );

    if (!project) {
      throw new AppError(404, '项目不存在或无权限', 'PROJECT_NOT_FOUND');
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (stage) {
      updates.push(`stage = $${paramIndex++}`);
      values.push(stage);
    }
    if (progressPercentage !== undefined) {
      updates.push(`progress_percentage = $${paramIndex++}`);
      values.push(progressPercentage);
    }
    if (description) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }

    if (updates.length > 0) {
      updates.push(`updated_at = NOW()`);
      values.push(projectId);
      await query(
        `UPDATE incubation_projects SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
        values
      );
    }

    res.json({ success: true, message: '项目已更新' });
  } catch (err) { next(err); }
}

// GET /incubation/milestones/:projectId — 获取项目里程碑
export async function getMilestones(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { projectId } = req.params;
    const milestones = await query(
      `SELECT id, milestone_name, description, target_date, completed,
              completed_at, created_at
       FROM incubation_milestones
       WHERE project_id = $1 AND deleted_at IS NULL
       ORDER BY target_date ASC`,
      [projectId]
    );
    res.json({ success: true, data: milestones });
  } catch (err) { next(err); }
}

// POST /incubation/milestone/create — 创建里程碑
export async function createMilestone(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { projectId, milestoneName, description, targetDate } = req.body;

    if (!projectId || !milestoneName) {
      throw new AppError(400, '缺少必要参数', 'MISSING_PARAMS');
    }

    // 验证项目所有权
    const project = await queryOne(
      `SELECT id FROM incubation_projects
       WHERE id = $1 AND creator_id = $2 AND deleted_at IS NULL`,
      [projectId, userId]
    );

    if (!project) {
      throw new AppError(404, '项目不存在或无权限', 'PROJECT_NOT_FOUND');
    }

    const result = await query(
      `INSERT INTO incubation_milestones
       (project_id, milestone_name, description, target_date, completed, created_at)
       VALUES ($1, $2, $3, $4, false, NOW())
       RETURNING id`,
      [projectId, milestoneName, description, targetDate]
    );

    res.json({ success: true, data: { milestoneId: result[0].id } });
  } catch (err) { next(err); }
}

// POST /incubation/milestone/complete — 完成里程碑
export async function completeMilestone(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { milestoneId } = req.body;

    if (!milestoneId) {
      throw new AppError(400, '缺少 milestoneId', 'MISSING_MILESTONE_ID');
    }

    // 验证里程碑所有权
    const milestone = await queryOne(
      `SELECT m.id, m.project_id
       FROM incubation_milestones m
       JOIN incubation_projects p ON p.id = m.project_id
       WHERE m.id = $1 AND p.creator_id = $2 AND m.deleted_at IS NULL`,
      [milestoneId, userId]
    );

    if (!milestone) {
      throw new AppError(404, '里程碑不存在或无权限', 'MILESTONE_NOT_FOUND');
    }

    await query(
      `UPDATE incubation_milestones
       SET completed = true, completed_at = NOW()
       WHERE id = $1`,
      [milestoneId]
    );

    res.json({ success: true, message: '里程碑已完成' });
  } catch (err) { next(err); }
}

// GET /incubation/resources — 获取孵化资源
export async function getResources(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const resources = await query(
      `SELECT id, resource_type, title, description, url, tags, created_at
       FROM incubation_resources
       WHERE deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT 50`
    );
    res.json({ success: true, data: resources });
  } catch (err) { next(err); }
}
