import { Request, Response } from 'express';
import logger from '../../utils/logger';
import { query } from '../../utils/db';

/**
 * 获取企业列表
 */
export async function getCompanyList(req: Request, res: Response) {
  try {
    const {
      page = 1,
      pageSize = 20,
      keyword,
      verificationStatus,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (Number(page) - 1) * Number(pageSize);
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // 关键词搜索（企业名称、联系人）
    if (keyword) {
      conditions.push(`(cp.company_name LIKE $${paramIndex} OR cp.contact_name LIKE $${paramIndex})`);
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    // 认证状态筛选
    if (verificationStatus === 'verified') {
      conditions.push(`cp.verified_at IS NOT NULL`);
    } else if (verificationStatus === 'pending') {
      conditions.push(`cp.verified_at IS NULL`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 获取总数
    const countResult = await query<any>(
      `SELECT COUNT(*) as total
       FROM company_profiles cp
       LEFT JOIN users u ON cp.user_id = u.id
       ${whereClause}`,
      params
    );

    const total = parseInt(countResult[0].total);

    // 获取列表数据
    params.push(Number(pageSize), offset);
    const companies = await query<any>(
      `SELECT
        cp.id,
        cp.user_id,
        cp.company_name,
        cp.industry,
        cp.contact_name,
        cp.contact_position,
        cp.contact_phone,
        cp.verified_at,
        cp.total_tasks_posted,
        cp.total_paid,
        cp.is_blacklisted,
        cp.created_at,
        u.phone as user_phone,
        u.avatar_url
       FROM company_profiles cp
       LEFT JOIN users u ON cp.user_id = u.id
       ${whereClause}
       ORDER BY cp.${sortBy} ${sortOrder}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    res.json({
      list: companies,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize))
      }
    });
  } catch (error: unknown) {
    logger.error('获取企业列表失败:', error);
    res.status(500).json({ message: '获取企业列表失败' });
  }
}

/**
 * 获取企业详情
 */
export async function getCompanyDetail(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // 获取企业基本信息
    const companyInfo = await query<any>(
      `SELECT
        cp.id,
        cp.user_id,
        cp.company_name,
        cp.industry,
        cp.contact_name,
        cp.contact_position,
        cp.contact_phone,
        cp.verified_at,
        cp.total_tasks_posted,
        cp.total_paid,
        cp.is_blacklisted,
        cp.blacklist_reason,
        cp.created_at,
        u.phone as user_phone,
        u.avatar_url
       FROM company_profiles cp
       LEFT JOIN users u ON cp.user_id = u.id
       WHERE cp.id = $1`,
      [id]
    );

    if (companyInfo.length === 0) {
      return res.status(404).json({ message: '企业不存在' });
    }

    // 获取发布的任务列表
    const tasks = await query<any>(
      `SELECT
        t.id,
        t.title,
        t.status,
        t.budget,
        t.created_at,
        t.deadline
       FROM tasks t
       WHERE t.company_id = $1
       ORDER BY t.created_at DESC
       LIMIT 10`,
      [id]
    );

    res.json({
      ...companyInfo[0],
      recentTasks: tasks
    });
  } catch (error: unknown) {
    logger.error('获取企业详情失败:', error);
    res.status(500).json({ message: '获取企业详情失败' });
  }
}

/**
 * 审核企业认证
 */
export async function verifyCompany(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { approved, reason } = req.body;

    // 获取企业信息
    const companyInfo = await query<any>(
      `SELECT user_id, company_name FROM company_profiles WHERE id = $1`,
      [id]
    );

    if (companyInfo.length === 0) {
      return res.status(404).json({ message: '企业不存在' });
    }

    const { user_id, company_name } = companyInfo[0];

    if (approved) {
      await query(
        `UPDATE company_profiles
         SET verified_at = NOW(),
             updated_at = NOW()
         WHERE id = $1`,
        [id]
      );

      // 发送通知给企业
      await query(
        `INSERT INTO system_notifications (user_id, type, title, content, related_type, related_id)
         VALUES ($1, 'company_verified', '企业认证通过', $2, 'company', $3)`,
        [user_id, `恭喜！您的企业"${company_name}"已通过认证审核，现在可以发布任务了。`, id]
      );
    } else {
      // 拒绝认证
      await query(
        `UPDATE company_profiles
         SET updated_at = NOW()
         WHERE id = $1`,
        [id]
      );

      // 发送通知给企业
      await query(
        `INSERT INTO system_notifications (user_id, type, title, content, related_type, related_id)
         VALUES ($1, 'company_rejected', '企业认证未通过', $2, 'company', $3)`,
        [user_id, `很抱歉，您的企业"${company_name}"认证未通过。原因：${reason || '不符合认证要求'}`, id]
      );
    }

    // 记录操作日志
    const adminId = (req as any).user.userId;
    await query(
      `INSERT INTO admin_operation_logs (admin_id, operation_type, target_type, target_id, details)
       VALUES ($1, 'verify_company', 'company', $2, $3)`,
      [adminId, id, JSON.stringify({ approved, reason, companyName: company_name })]
    );

    res.json({ message: approved ? '认证通过' : '认证拒绝' });
  } catch (error: unknown) {
    logger.error('审核企业认证失败:', error);
    res.status(500).json({ message: '审核企业认证失败' });
  }
}

/**
 * 加入/移出黑名单
 */
export async function toggleBlacklist(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { isBlacklisted, reason } = req.body;

    await query(
      `UPDATE company_profiles
       SET is_blacklisted = $1,
           blacklist_reason = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [isBlacklisted, reason || null, id]
    );

    res.json({ message: isBlacklisted ? '已加入黑名单' : '已移出黑名单' });
  } catch (error: unknown) {
    logger.error('操作黑名单失败:', error);
    res.status(500).json({ message: '操作黑名单失败' });
  }
}

/**
 * 获取待审核企业列表
 */
export async function getPendingVerifications(req: Request, res: Response) {
  try {
    const { page = '1', pageSize = '20' } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);

    const companies = await query<any>(
      `SELECT
        cp.id,
        cp.user_id,
        cp.company_name,
        cp.industry,
        cp.contact_name,
        cp.contact_position,
        cp.contact_phone,
        cp.created_at,
        u.phone as user_phone
       FROM company_profiles cp
       LEFT JOIN users u ON cp.user_id = u.id
       WHERE cp.verified_at IS NULL
       ORDER BY cp.created_at DESC
       LIMIT $1 OFFSET $2`,
      [pageSize, offset]
    );

    const countResult = await query<any>(
      `SELECT COUNT(*) as total
       FROM company_profiles
       WHERE verified_at IS NULL`
    );
    const total = parseInt(countResult[0].total);

    res.json({
      data: companies,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize))
      }
    });
  } catch (error: unknown) {
    logger.error('获取待审核企业列表失败:', error);
    res.status(500).json({ message: '获取待审核企业列表失败' });
  }
}

/**
 * 获取企业发布的任务列表
 */
export async function getCompanyTasks(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { page = '1', pageSize = '20' } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);

    const tasks = await query<any>(
      `SELECT
        t.id,
        t.title,
        t.status,
        t.budget,
        t.created_at,
        t.deadline,
        (SELECT COUNT(*) FROM task_applications WHERE task_id = t.id) as application_count
       FROM tasks t
       WHERE t.company_id = $1
       ORDER BY t.created_at DESC
       LIMIT $2 OFFSET $3`,
      [id, pageSize, offset]
    );

    const countResult = await query<any>(
      `SELECT COUNT(*) as total
       FROM tasks
       WHERE company_id = $1`,
      [id]
    );
    const total = parseInt(countResult[0].total);

    res.json({
      data: tasks,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize))
      }
    });
  } catch (error: unknown) {
    logger.error('获取企业任务列表失败:', error);
    res.status(500).json({ message: '获取企业任务列表失败' });
  }
}
