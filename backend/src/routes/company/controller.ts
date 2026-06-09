import { Request, Response, NextFunction } from 'express';
import { queryOne, query } from '../../utils/db';
import { AppError } from '../../middleware/errorHandler';

export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const profile = await queryOne(
      `SELECT u.id, u.email, u.nickname, u.created_at,
              cp.company_name, cp.industry, cp.scale, cp.contact_person,
              cp.contact_phone, cp.address, cp.description, cp.logo_url,
              cp.verified_at, cp.total_tasks_posted, cp.total_paid
       FROM users u
       JOIN company_profiles cp ON cp.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    );
    if (!profile) throw new AppError(404, '企业档案不存在', 'NOT_FOUND');
    res.json(profile);
  } catch (err) { next(err); }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { companyName, industry, scale, contactPerson, contactPhone, address, description, logoUrl } = req.body;
    await query(
      `UPDATE company_profiles SET
        company_name = COALESCE($1, company_name),
        industry = COALESCE($2, industry),
        scale = COALESCE($3, scale),
        contact_person = COALESCE($4, contact_person),
        contact_phone = COALESCE($5, contact_phone),
        address = COALESCE($6, address),
        description = COALESCE($7, description),
        logo_url = COALESCE($8, logo_url),
        updated_at = NOW()
       WHERE user_id = $9`,
      [companyName, industry, scale, contactPerson, contactPhone, address, description, logoUrl, userId]
    );
    res.json({ success: true, message: '信息已更新' });
  } catch (err) { next(err); }
}

export async function getReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { range = 'all' } = req.query;

    // 计算时间范围
    let dateFilter = '';
    if (range === 'year') {
      dateFilter = "AND t.created_at >= DATE_TRUNC('year', NOW())";
    } else if (range === 'month') {
      dateFilter = "AND t.created_at >= DATE_TRUNC('month', NOW())";
    }

    // 概览数据
    const overview = await queryOne(
      `SELECT
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE t.status IN ('in_progress', 'pending_review', 'reviewing')) as active_tasks,
        COUNT(*) FILTER (WHERE t.status = 'completed') as completed_tasks,
        COALESCE(SUM(t.budget), 0) as total_spent,
        COALESCE(AVG(t.budget), 0) as avg_task_price,
        CASE WHEN COUNT(*) > 0
          THEN ROUND(COUNT(*) FILTER (WHERE t.status = 'completed')::numeric / COUNT(*)::numeric * 100, 2)
          ELSE 0
        END as completion_rate
       FROM tasks t
       WHERE t.company_id = $1 ${dateFilter}`,
      [userId]
    );

    // 月度统计
    const monthlyStats = await query(
      `SELECT
        TO_CHAR(t.created_at, 'YYYY-MM') as month,
        COUNT(*) as tasks,
        COALESCE(SUM(t.budget), 0) as spent
       FROM tasks t
       WHERE t.company_id = $1 ${dateFilter}
       GROUP BY TO_CHAR(t.created_at, 'YYYY-MM')
       ORDER BY month DESC
       LIMIT 12`,
      [userId]
    );

    // 任务类型分布
    const categoryStats = await query(
      `SELECT
        t.track as category,
        COUNT(*) as count,
        ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER () * 100, 2) as percentage
       FROM tasks t
       WHERE t.company_id = $1 ${dateFilter}
       GROUP BY t.track
       ORDER BY count DESC`,
      [userId]
    );

    // 合作学生排行
    const topStudents = await query(
      `SELECT
        u.id,
        u.nickname,
        sp.avatar_url as avatar,
        COUNT(t.id) as tasks_count,
        COALESCE(SUM(t.budget), 0) as total_amount
       FROM tasks t
       JOIN users u ON u.id = t.student_id
       LEFT JOIN users u ON u.id = u.id
       WHERE t.company_id = $1 AND t.status = 'completed' ${dateFilter}
       GROUP BY u.id, u.nickname, sp.avatar_url
       ORDER BY tasks_count DESC, total_amount DESC
       LIMIT 10`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        overview,
        monthly_stats: monthlyStats,
        category_stats: categoryStats,
        top_students: topStudents
      }
    });
  } catch (err) { next(err); }
}

export async function getStudentProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { studentId } = req.params;

    // 学生基本信息
    const student = await queryOne(
      `SELECT
        u.id, u.nickname as name,
        sp.avatar_url as avatar,
        sp.level,
        sp.completed_tasks,
        COALESCE(sp.rating, 0) as rating
       FROM users u
       JOIN users u ON u.id = u.id
       WHERE u.id = $1`,
      [studentId]
    );

    if (!student) throw new AppError(404, '学生不存在', 'NOT_FOUND');

    // OPC测评结果
    const opcResult = await queryOne(
      `SELECT
        openness, conscientiousness, extraversion, agreeableness, neuroticism,
        primary_track, secondary_track
       FROM opc_results
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [studentId]
    );

    // 兴趣和技能标签
    const tags = await query(
      `SELECT tag_name, tag_type
       FROM user_tags
       WHERE user_id = $1`,
      [studentId]
    );

    const interests = tags.filter(t => t.tag_type === 'interest').map(t => t.tag_name);
    const skills = tags.filter(t => t.tag_type === 'skill').map(t => t.tag_name);

    // 历史作品
    const portfolio = await query(
      `SELECT
        t.title as task_title,
        t.completed_at,
        r.rating,
        d.file_urls as images
       FROM tasks t
       LEFT JOIN ratings r ON r.task_id = t.id AND r.rater_type = 'company'
       LEFT JOIN deliverables d ON d.task_id = t.id
       WHERE t.student_id = $1 AND t.status = 'completed'
       ORDER BY t.completed_at DESC
       LIMIT 10`,
      [studentId]
    );

    res.json({
      success: true,
      data: {
        ...student,
        opcResult: opcResult ? {
          ...opcResult,
          primaryTrack: opcResult.primary_track,
          secondaryTrack: opcResult.secondary_track,
          interests,
          skills
        } : null,
        portfolio: portfolio.map(p => ({
          taskTitle: p.task_title,
          completedAt: p.completed_at,
          rating: p.rating || 0,
          images: p.images || []
        }))
      }
    });
  } catch (err) { next(err); }
}

export async function getTaskProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { taskId } = req.params;
    const userId = req.user!.userId;

    // 任务基本信息
    const task = await queryOne<{
      id: string;
      title: string;
      status: string;
      student_name: string | null;
    }>(
      `SELECT t.id, t.title, t.status, u.nickname as student_name
       FROM tasks t
       LEFT JOIN users u ON u.id = t.student_id
       WHERE t.id = $1 AND t.company_id = $2`,
      [taskId, userId]
    );

    if (!task) throw new AppError(404, '任务不存在', 'NOT_FOUND');

    // 任务流程记录
    const logs = await query<{
      action_type: string;
      description: string;
      created_at: string;
      actor_type: string;
      actor_name: string;
    }>(
      `SELECT
        action_type,
        description,
        created_at,
        actor_type,
        actor_name
       FROM task_flow_logs
       WHERE task_id = $1
       ORDER BY created_at ASC`,
      [taskId]
    );

    // 构建进度步骤
    const statusMap: Record<string, string> = {
      'pending_match': '待匹配',
      'matching': '匹配中',
      'pending_accept': '待接单',
      'in_progress': '进行中',
      'pending_review': '待验收',
      'reviewing': 'AI审核中',
      'pending_payment': '待支付尾款',
      'completed': '已完成',
      'cancelled': '已取消'
    };

    const steps: Array<{
      id: string;
      title: string;
      description: string;
      status: string;
      timestamp?: any;
      operator?: string;
    }> = [
      { id: '1', title: '任务发布', description: '企业发布任务并支付30%定金', status: 'completed' },
      { id: '2', title: 'AI匹配学生', description: 'AI为您匹配合适的学生', status: 'completed' },
      { id: '3', title: '企业选择学生', description: '选择学生并发送邀请', status: 'completed' },
      { id: '4', title: '学生接单', description: '学生接受任务邀请', status: task.status === 'pending_accept' ? 'current' : 'completed' },
      { id: '5', title: '学生执行中', description: '学生正在完成任务', status: task.status === 'in_progress' ? 'current' : (task.status === 'pending_accept' ? 'pending' : 'completed') },
      { id: '6', title: '学生提交交付物', description: '学生提交任务成果', status: task.status === 'pending_review' ? 'current' : (task.status === 'in_progress' || task.status === 'pending_accept' ? 'pending' : 'completed') },
      { id: '7', title: 'AI初审', description: 'AI对交付物进行初步审核', status: task.status === 'reviewing' ? 'current' : (task.status === 'pending_review' || task.status === 'in_progress' || task.status === 'pending_accept' ? 'pending' : 'completed') },
      { id: '8', title: '企业验收', description: '验收交付物并决定通过或打回', status: task.status === 'pending_payment' ? 'completed' : (task.status === 'completed' ? 'completed' : 'pending') },
      { id: '9', title: '支付尾款', description: '验收通过后支付70%尾款', status: task.status === 'pending_payment' ? 'current' : (task.status === 'completed' ? 'completed' : 'pending') },
      { id: '10', title: '任务完成', description: '平台将款项支付给学生，任务结束', status: task.status === 'completed' ? 'completed' : 'pending' }
    ];

    // 添加时间戳和操作人
    logs.forEach(log => {
      const step = steps.find(s => s.description.includes(log.action_type) || s.title.includes(log.action_type));
      if (step && step.status === 'completed') {
        step.timestamp = log.created_at;
        step.operator = log.actor_name || log.actor_type;
      }
    });

    res.json({
      success: true,
      data: {
        taskId: task.id,
        taskTitle: task.title,
        currentStatus: statusMap[task.status] || task.status,
        steps
      }
    });
  } catch (err) { next(err); }
}

export async function getFavoriteStudents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;

    const favorites = await query(
      `SELECT
        fs.id as favorite_id,
        fs.created_at as favorited_at,
        u.id as student_id,
        u.nickname,
        sp.avatar_url,
        sp.level,
        sp.completed_tasks,
        sp.rating,
        COUNT(t.id) as collaboration_count,
        MAX(t.completed_at) as last_collaboration
       FROM favorite_students fs
       JOIN users u ON u.id = fs.student_id
       LEFT JOIN users u ON u.id = u.id
       LEFT JOIN tasks t ON t.student_id = u.id AND t.company_id = $1 AND t.status = 'completed'
       WHERE fs.company_id = $1
       GROUP BY fs.id, fs.created_at, u.id, u.nickname, sp.avatar_url, sp.level, sp.completed_tasks, sp.rating
       ORDER BY fs.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: favorites
    });
  } catch (err) { next(err); }
}

export async function addFavoriteStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { studentId } = req.body;

    if (!studentId) {
      throw new AppError(400, '学生ID不能为空', 'MISSING_STUDENT_ID');
    }

    // 检查是否已收藏
    const existing = await queryOne(
      `SELECT id FROM favorite_students WHERE company_id = $1 AND student_id = $2`,
      [userId, studentId]
    );

    if (existing) {
      throw new AppError(400, '已经收藏过该学生', 'ALREADY_FAVORITED');
    }

    await query(
      `INSERT INTO favorite_students (company_id, student_id) VALUES ($1, $2)`,
      [userId, studentId]
    );

    res.json({
      success: true,
      message: '收藏成功'
    });
  } catch (err) { next(err); }
}

export async function removeFavoriteStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { studentId } = req.params;

    const result = await query(
      `DELETE FROM favorite_students WHERE company_id = $1 AND student_id = $2 RETURNING id`,
      [userId, studentId]
    );

    if (result.length === 0) {
      throw new AppError(404, '未找到收藏记录', 'NOT_FOUND');
    }

    res.json({
      success: true,
      message: '取消收藏成功'
    });
  } catch (err) { next(err); }
}

export async function getRequirementSupplements(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { taskId } = req.params;

    // 验证任务归属
    const task = await queryOne(
      `SELECT id FROM tasks WHERE id = $1 AND company_id = $2`,
      [taskId, userId]
    );

    if (!task) {
      throw new AppError(404, '任务不存在', 'NOT_FOUND');
    }

    const supplements = await query(
      `SELECT
        id,
        content,
        estimated_days,
        old_deadline,
        new_deadline,
        created_at
       FROM requirement_supplements
       WHERE task_id = $1
       ORDER BY created_at DESC`,
      [taskId]
    );

    res.json({
      success: true,
      data: supplements
    });
  } catch (err) { next(err); }
}
