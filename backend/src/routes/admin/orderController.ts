import { Request, Response } from 'express';
import { query } from '../../utils/db';

/**
 * 获取订单列表
 */
export async function getOrderList(req: Request, res: Response) {
  try {
    const {
      page = 1,
      pageSize = 20,
      keyword,
      status,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (Number(page) - 1) * Number(pageSize);
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // 关键词搜索（任务标题、学生昵称、企业名称）
    if (keyword) {
      conditions.push(`(t.title LIKE $${paramIndex} OR u.nickname LIKE $${paramIndex} OR cp.company_name LIKE $${paramIndex})`);
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    // 状态筛选
    if (status) {
      conditions.push(`t.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 获取总数
    const countResult = await query<any>(
      `SELECT COUNT(*) as total
       FROM tasks t
       LEFT JOIN users u ON t.accepted_student_id = u.id
       LEFT JOIN company_profiles cp ON t.company_id = cp.id
       ${whereClause}`,
      params
    );

    const total = parseInt(countResult[0].total);

    // 获取列表数据
    params.push(Number(pageSize), offset);
    const orders = await query<any>(
      `SELECT
        t.id,
        t.title,
        t.description,
        t.status,
        t.company_price,
        t.student_price,
        t.platform_fee,
        t.deposit_amount,
        t.final_amount,
        t.deposit_paid,
        t.final_paid,
        t.deadline,
        t.created_at,
        t.accepted_student_id as student_id,
        t.company_id,
        u.nickname as student_name,
        u.phone as student_phone,
        cp.company_name,
        cp.contact_name as company_contact
       FROM tasks t
       LEFT JOIN users u ON t.accepted_student_id = u.id
       LEFT JOIN company_profiles cp ON t.company_id = cp.id
       ${whereClause}
       ORDER BY t.${sortBy} ${sortOrder}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    res.json({
      list: orders,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize))
      }
    });
  } catch (error) {
    console.error('获取订单列表失败:', error);
    res.status(500).json({ error: '获取订单列表失败' });
  }
}

/**
 * 获取订单详情
 */
export async function getOrderDetail(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // 获取订单基本信息
    const orderInfo = await query<any>(
      `SELECT
        t.*,
        u.nickname as student_name,
        u.phone as student_phone,
        u.avatar_url as student_avatar,
        cp.company_name,
        cp.contact_name as company_contact,
        cp.contact_phone as company_phone
       FROM tasks t
       LEFT JOIN users u ON t.accepted_student_id = u.id
       LEFT JOIN company_profiles cp ON t.company_id = cp.id
       WHERE t.id = $1`,
      [id]
    );

    if (orderInfo.length === 0) {
      return res.status(404).json({ error: '订单不存在' });
    }

    // 获取支付记录
    const payments = await query<any>(
      `SELECT
        id,
        amount,
        payment_type,
        status,
        paid_at,
        created_at
       FROM payments
       WHERE task_id = $1
       ORDER BY created_at DESC`,
      [id]
    );

    // 获取交付物
    const deliverables = await query<any>(
      `SELECT
        id,
        file_type,
        file_url,
        file_name,
        description,
        created_at
       FROM task_deliverables
       WHERE task_id = $1
       ORDER BY created_at DESC`,
      [id]
    );

    // 获取评价
    const reviews = await query<any>(
      `SELECT
        id,
        reviewer_type,
        rating,
        comment,
        created_at
       FROM task_reviews
       WHERE task_id = $1
       ORDER BY created_at DESC`,
      [id]
    );

    // 获取纠纷记录
    const disputes = await query<any>(
      `SELECT
        id,
        initiator_type,
        reason,
        status,
        resolution,
        created_at,
        resolved_at
       FROM task_disputes
       WHERE task_id = $1
       ORDER BY created_at DESC`,
      [id]
    );

    res.json({
      ...orderInfo[0],
      payments,
      deliverables,
      reviews,
      disputes
    });
  } catch (error) {
    console.error('获取订单详情失败:', error);
    res.status(500).json({ error: '获取订单详情失败' });
  }
}

/**
 * 获取订单统计
 */
export async function getOrderStats(req: Request, res: Response) {
  try {
    // 总订单数
    const totalOrders = await query<any>(
      `SELECT COUNT(*) as count FROM tasks WHERE accepted_student_id IS NOT NULL`
    );

    // 各状态订单数
    const statusStats = await query<any>(
      `SELECT
        status,
        COUNT(*) as count
       FROM tasks
       WHERE accepted_student_id IS NOT NULL
       GROUP BY status`
    );

    // 总交易额
    const totalAmount = await query<any>(
      `SELECT
        COALESCE(SUM(company_price), 0) as total_company_price,
        COALESCE(SUM(student_price), 0) as total_student_price,
        COALESCE(SUM(platform_fee), 0) as total_platform_fee
       FROM tasks
       WHERE accepted_student_id IS NOT NULL`
    );

    // 本月订单数和交易额
    const monthlyStats = await query<any>(
      `SELECT
        COUNT(*) as count,
        COALESCE(SUM(company_price), 0) as total_amount
       FROM tasks
       WHERE accepted_student_id IS NOT NULL
       AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)`
    );

    // 待处理订单
    const pendingOrders = await query<any>(
      `SELECT COUNT(*) as count
       FROM tasks
       WHERE status IN ('in_progress', 'pending_review', 'disputed')`
    );

    res.json({
      totalOrders: parseInt(totalOrders[0].count),
      statusStats: statusStats.map((s: any) => ({
        status: s.status,
        count: parseInt(s.count)
      })),
      totalAmount: {
        companyPrice: parseFloat(totalAmount[0].total_company_price),
        studentPrice: parseFloat(totalAmount[0].total_student_price),
        platformFee: parseFloat(totalAmount[0].total_platform_fee)
      },
      monthlyStats: {
        count: parseInt(monthlyStats[0].count),
        amount: parseFloat(monthlyStats[0].total_amount)
      },
      pendingOrders: parseInt(pendingOrders[0].count)
    });
  } catch (error) {
    console.error('获取订单统计失败:', error);
    res.status(500).json({ error: '获取订单统计失败' });
  }
}

/**
 * 处理订单纠纷
 */
export async function handleDispute(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { disputeId, resolution, refundAmount, winner } = req.body;

    // 更新纠纷状态
    await query(
      `UPDATE task_disputes
       SET status = 'resolved',
           resolution = $1,
           resolved_at = NOW()
       WHERE id = $2`,
      [resolution, disputeId]
    );

    // 如果需要退款，更新订单状态
    if (refundAmount && refundAmount > 0) {
      // TODO: 实现退款逻辑
      // 1. 更新escrow_accounts
      // 2. 创建退款记录
    }

    // 记录操作日志
    const adminId = (req as any).user.userId;
    await query(
      `INSERT INTO admin_operation_logs (admin_id, operation_type, target_type, target_id, details)
       VALUES ($1, 'handle_dispute', 'order', $2, $3)`,
      [adminId, id, JSON.stringify({ disputeId, resolution, refundAmount, winner })]
    );

    res.json({ message: '纠纷处理成功' });
  } catch (error) {
    console.error('处理订单纠纷失败:', error);
    res.status(500).json({ error: '处理订单纠纷失败' });
  }
}

/**
 * 强制完成订单
 */
export async function forceCompleteOrder(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    await query(
      `UPDATE tasks
       SET status = 'completed',
           updated_at = NOW()
       WHERE id = $1`,
      [id]
    );

    // 记录操作日志
    const adminId = (req as any).user.userId;
    await query(
      `INSERT INTO admin_operation_logs (admin_id, operation_type, target_type, target_id, details)
       VALUES ($1, 'force_complete_order', 'order', $2, $3)`,
      [adminId, id, JSON.stringify({ reason })]
    );

    res.json({ message: '订单已强制完成' });
  } catch (error) {
    console.error('强制完成订单失败:', error);
    res.status(500).json({ error: '强制完成订单失败' });
  }
}

/**
 * 取消订单
 */
export async function cancelOrder(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { reason, refundType } = req.body; // refundType: 'full' | 'partial' | 'none'

    await query(
      `UPDATE tasks
       SET status = 'cancelled',
           updated_at = NOW()
       WHERE id = $1`,
      [id]
    );

    // TODO: 根据refundType处理退款
    // 1. full: 全额退款
    // 2. partial: 部分退款（如只退定金）
    // 3. none: 不退款

    // 记录操作日志
    const adminId = (req as any).user.userId;
    await query(
      `INSERT INTO admin_operation_logs (admin_id, operation_type, target_type, target_id, details)
       VALUES ($1, 'cancel_order', 'order', $2, $3)`,
      [adminId, id, JSON.stringify({ reason, refundType })]
    );

    res.json({ message: '订单已取消' });
  } catch (error) {
    console.error('取消订单失败:', error);
    res.status(500).json({ error: '取消订单失败' });
  }
}

/**
 * 获取逾期订单列表
 */
export async function getOverdueOrders(req: Request, res: Response) {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);

    const countResult = await query<any>(
      `SELECT COUNT(*) as total
       FROM tasks
       WHERE status IN ('in_progress', 'pending_review')
       AND deadline < NOW()`
    );
    const total = parseInt(countResult[0].total);

    const orders = await query<any>(
      `SELECT
        t.id,
        t.title,
        t.status,
        t.deadline,
        t.company_price,
        t.student_price,
        u.nickname as student_name,
        cp.company_name,
        EXTRACT(DAY FROM (NOW() - t.deadline)) as overdue_days
       FROM tasks t
       LEFT JOIN users u ON t.accepted_student_id = u.id
       LEFT JOIN company_profiles cp ON t.company_id = cp.id
       WHERE t.status IN ('in_progress', 'pending_review')
       AND t.deadline < NOW()
       ORDER BY t.deadline ASC
       LIMIT $1 OFFSET $2`,
      [Number(pageSize), offset]
    );

    res.json({
      list: orders,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize))
      }
    });
  } catch (error) {
    console.error('获取逾期订单列表失败:', error);
    res.status(500).json({ error: '获取逾期订单列表失败' });
  }
}

/**
 * 获取待审核交付物列表
 */
export async function getPendingDeliverables(req: Request, res: Response) {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);

    const countResult = await query<any>(
      `SELECT COUNT(*) as total
       FROM tasks
       WHERE status = 'pending_review'`
    );
    const total = parseInt(countResult[0].total);

    const orders = await query<any>(
      `SELECT
        t.id,
        t.title,
        t.status,
        t.deadline,
        t.created_at,
        u.nickname as student_name,
        cp.company_name,
        (SELECT COUNT(*) FROM task_deliverables WHERE task_id = t.id) as deliverable_count
       FROM tasks t
       LEFT JOIN users u ON t.accepted_student_id = u.id
       LEFT JOIN company_profiles cp ON t.company_id = cp.id
       WHERE t.status = 'pending_review'
       ORDER BY t.created_at ASC
       LIMIT $1 OFFSET $2`,
      [Number(pageSize), offset]
    );

    res.json({
      list: orders,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize))
      }
    });
  } catch (error) {
    console.error('获取待审核交付物列表失败:', error);
    res.status(500).json({ error: '获取待审核交付物列表失败' });
  }
}

/**
 * 获取异常订单列表（逾期+纠纷）
 */
export async function getAbnormalOrders(req: Request, res: Response) {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);

    const countResult = await query<any>(
      `SELECT COUNT(*) as total
       FROM tasks
       WHERE (status IN ('in_progress', 'pending_review') AND deadline < NOW())
       OR status = 'disputed'`
    );
    const total = parseInt(countResult[0].total);

    const orders = await query<any>(
      `SELECT
        t.id,
        t.title,
        t.status,
        t.deadline,
        t.company_price,
        t.student_price,
        u.nickname as student_name,
        cp.company_name,
        CASE
          WHEN t.status = 'disputed' THEN 'disputed'
          WHEN t.deadline < NOW() THEN 'overdue'
          ELSE 'normal'
        END as abnormal_type,
        EXTRACT(DAY FROM (NOW() - t.deadline)) as overdue_days
       FROM tasks t
       LEFT JOIN users u ON t.accepted_student_id = u.id
       LEFT JOIN company_profiles cp ON t.company_id = cp.id
       WHERE (t.status IN ('in_progress', 'pending_review') AND t.deadline < NOW())
       OR t.status = 'disputed'
       ORDER BY t.deadline ASC
       LIMIT $1 OFFSET $2`,
      [Number(pageSize), offset]
    );

    res.json({
      list: orders,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize))
      }
    });
  } catch (error) {
    console.error('获取异常订单列表失败:', error);
    res.status(500).json({ error: '获取异常订单列表失败' });
  }
}

/**
 * 获取纠纷列表
 */
export async function getDisputeList(req: Request, res: Response) {
  try {
    const { page = 1, pageSize = 20, status } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`td.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query<any>(
      `SELECT COUNT(*) as total
       FROM task_disputes td
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult[0].total);

    params.push(Number(pageSize), offset);
    const disputes = await query<any>(
      `SELECT
        td.id,
        td.task_id,
        td.initiator_type,
        td.reason,
        td.status,
        td.resolution,
        td.created_at,
        td.resolved_at,
        t.title as task_title,
        u.nickname as student_name,
        cp.company_name
       FROM task_disputes td
       LEFT JOIN tasks t ON td.task_id = t.id
       LEFT JOIN users u ON t.accepted_student_id = u.id
       LEFT JOIN company_profiles cp ON t.company_id = cp.id
       ${whereClause}
       ORDER BY td.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    res.json({
      list: disputes,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize))
      }
    });
  } catch (error) {
    console.error('获取纠纷列表失败:', error);
    res.status(500).json({ error: '获取纠纷列表失败' });
  }
}

/**
 * 处理纠纷（别名函数，指向handleDispute）
 */
export async function resolveDispute(req: Request, res: Response) {
  return handleDispute(req, res);
}

