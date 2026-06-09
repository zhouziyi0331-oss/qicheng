import { Request, Response } from 'express';
import { query } from '../../utils/db';

/**
 * 获取数据看板统计
 */
export async function getDashboardStats(req: Request, res: Response) {
  try {
    // 今日数据
    const todayStats = await query<any>(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'student' AND DATE(created_at) = CURRENT_DATE) as new_students_today,
        (SELECT COUNT(*) FROM users WHERE role = 'company' AND DATE(created_at) = CURRENT_DATE) as new_companies_today,
        (SELECT COUNT(*) FROM tasks WHERE DATE(created_at) = CURRENT_DATE AND accepted_student_id IS NOT NULL) as new_orders_today,
        (SELECT COALESCE(SUM(company_price), 0) FROM tasks WHERE DATE(created_at) = CURRENT_DATE AND accepted_student_id IS NOT NULL) as gmv_today
    `);

    // 总计数据
    const totalStats = await query<any>(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'student') as total_students,
        (SELECT COUNT(*) FROM users WHERE role = 'company') as total_companies,
        (SELECT COUNT(*) FROM tasks) as total_tasks,
        (SELECT COUNT(*) FROM tasks WHERE accepted_student_id IS NOT NULL) as total_orders,
        (SELECT COALESCE(SUM(company_price), 0) FROM tasks WHERE accepted_student_id IS NOT NULL) as total_gmv
    `);

    // 近30天趋势数据
    const trendData = await query<any>(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) FILTER (WHERE role = 'student') as students,
        COUNT(*) FILTER (WHERE role = 'company') as companies
      FROM users
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    // 订单趋势
    const orderTrend = await query<any>(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as orders,
        COALESCE(SUM(company_price), 0) as gmv
      FROM tasks
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days' AND accepted_student_id IS NOT NULL
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    // 学生等级分布
    const levelDistribution = await query<any>(`
      SELECT
        current_level as level,
        COUNT(*) as count
      FROM student_capabilities
      WHERE level_a IS NOT NULL
      GROUP BY level_a
      ORDER BY level_a
    `);

    // 项目类型分布
    const taskTypeDistribution = await query<any>(`
      SELECT
        track,
        COUNT(*) as count
      FROM tasks
      WHERE track IS NOT NULL
      GROUP BY track
      ORDER BY count DESC
    `);

    // 待处理事项
    const pendingItems = await query<any>(`
      SELECT
        (SELECT COUNT(*) FROM company_profiles WHERE verified_at IS NULL) as pending_company_reviews,
        (SELECT COUNT(*) FROM tasks WHERE status = 'pending_review') as pending_task_reviews,
        (SELECT COUNT(*) FROM withdrawal_requests WHERE status = 'pending') as pending_withdrawals,
        (SELECT COUNT(*) FROM tasks WHERE status = 'in_progress' AND deadline < CURRENT_TIMESTAMP) as overdue_orders
    `);

    // Transform to match frontend expected structure
    const today = todayStats[0];
    const total = totalStats[0];
    const pending = pendingItems[0];

    const totalStudents = parseInt(total.total_students) || 0;
    const totalCompanies = parseInt(total.total_companies) || 0;
    const totalTasks = parseInt(total.total_tasks) || 0;
    const newStudentsToday = parseInt(today.new_students_today) || 0;
    const newCompaniesToday = parseInt(today.new_companies_today) || 0;
    const totalGmv = parseFloat(total.total_gmv) || 0;

    res.json({
      users: {
        total: totalStudents + totalCompanies,
        students: totalStudents,
        companies: totalCompanies,
        today: newStudentsToday + newCompaniesToday
      },
      tasks: {
        total: totalTasks,
        active: totalTasks - (parseInt(pending.pending_task_reviews) || 0),
        pending_review: parseInt(pending.pending_task_reviews) || 0,
        completed: parseInt(total.total_orders) || 0
      },
      finance: {
        total_gross: totalGmv,
        total_net: totalGmv * 0.85, // Assuming 15% platform fee
        pending_withdrawals: parseInt(pending.pending_withdrawals) || 0,
        pending_advances: 0 // Not tracked yet
      },
      story: {
        total_posts: 0 // Not implemented yet
      },
      trends: {
        users: trendData,
        orders: orderTrend
      },
      distribution: {
        levels: levelDistribution,
        taskTypes: taskTypeDistribution
      },
      pending: {
        companies: parseInt(pending.pending_company_reviews) || 0,
        tasks: parseInt(pending.pending_task_reviews) || 0,
        withdrawals: parseInt(pending.pending_withdrawals) || 0,
        overdue_orders: parseInt(pending.overdue_orders) || 0
      }
    });
  } catch (error) {
    console.error('获取数据看板失败:', error);
    res.status(500).json({ error: '获取数据失败' });
  }
}

/**
 * 获取预警列表
 */
export async function getAlerts(req: Request, res: Response) {
  try {
    const alerts = [];

    // 超时订单
    const overdueOrders = await query<any>(`
      SELECT t.id, t.id as task_id, t.title, t.accepted_student_id as student_id, t.deadline
      FROM tasks t
      WHERE t.status = 'in_progress'
        AND t.deadline < CURRENT_TIMESTAMP
        AND t.accepted_student_id IS NOT NULL
      ORDER BY t.deadline
      LIMIT 10
    `);

    overdueOrders.forEach((order: any) => {
      alerts.push({
        type: 'overdue_order',
        level: 'high',
        title: '订单超时',
        message: `订单《${order.title}》已超时`,
        data: order,
        createdAt: order.deadline
      });
    });

    // 待审核企业积压
    const pendingCompanies = await query<any>(`
      SELECT COUNT(*) as count
      FROM company_profiles
      WHERE verified_at IS NULL
      AND created_at < CURRENT_TIMESTAMP - INTERVAL '3 days'
    `);

    if (pendingCompanies[0].count > 0) {
      alerts.push({
        type: 'pending_company_review',
        level: 'medium',
        title: '企业认证积压',
        message: `有 ${pendingCompanies[0].count} 个企业认证申请超过3天未处理`,
        data: { count: pendingCompanies[0].count }
      });
    }

    // 待审核项目积压
    const pendingTasks = await query<any>(`
      SELECT COUNT(*) as count
      FROM tasks
      WHERE status = 'pending_review'
      AND created_at < CURRENT_TIMESTAMP - INTERVAL '2 days'
    `);

    if (pendingTasks[0].count > 0) {
      alerts.push({
        type: 'pending_task_review',
        level: 'medium',
        title: '项目审核积压',
        message: `有 ${pendingTasks[0].count} 个项目超过2天未审核`,
        data: { count: pendingTasks[0].count }
      });
    }

    // 待处理提现
    const pendingWithdrawals = await query<any>(`
      SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total_amount
      FROM withdrawal_requests
      WHERE status = 'pending'
    `);

    if (pendingWithdrawals[0].count > 0) {
      alerts.push({
        type: 'pending_withdrawal',
        level: 'high',
        title: '待处理提现',
        message: `有 ${pendingWithdrawals[0].count} 笔提现申请待处理，总金额 ¥${pendingWithdrawals[0].total_amount}`,
        data: pendingWithdrawals[0]
      });
    }

    res.json({ alerts });
  } catch (error) {
    console.error('获取预警列表失败:', error);
    res.status(500).json({ error: '获取预警失败' });
  }
}
