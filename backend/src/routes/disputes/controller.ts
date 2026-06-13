import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { query } from '../../utils/db';

/**
 * 申诉/纠纷处理控制器
 * 学生或企业对任务结果不满时可发起申诉，由管理员介入处理
 */

// 创建申诉
export const createDispute = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const { taskId, disputeType, description, evidenceUrls } = req.body;

    // 验证任务存在且用户有权限申诉
    const taskCheck = await query(
      `SELECT t.*, ts.student_id, t.company_id
       FROM tasks t
       LEFT JOIN task_students ts ON t.id = ts.task_id
       WHERE t.id = $1`,
      [taskId]
    );

    if (taskCheck.length === 0) {
      return res.status(404).json({ success: false, message: '任务不存在' });
    }

    const task = taskCheck[0];
    const isStudent = task.student_id === userId;
    const isCompany = task.company_id === userId;

    if (!isStudent && !isCompany) {
      return res.status(403).json({ success: false, message: '无权对此任务发起申诉' });
    }

    // 检查是否已有未处理的申诉
    const existingDispute = await query(
      `SELECT id FROM disputes
       WHERE task_id = $1 AND initiator_id = $2 AND status IN ('pending', 'investigating')`,
      [taskId, userId]
    );

    if (existingDispute.length > 0) {
      return res.status(400).json({ success: false, message: '该任务已有待处理的申诉，请勿重复提交' });
    }

    // 创建申诉记录
    const result = await query(
      `INSERT INTO disputes
       (task_id, initiator_id, initiator_type, dispute_type, description, evidence_urls, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())
       RETURNING *`,
      [
        taskId,
        userId,
        isStudent ? 'student' : 'company',
        disputeType,
        description,
        evidenceUrls || []
      ]
    );

    // 发送通知给管理员
    await query(
      `INSERT INTO notifications (user_id, type, title, content, related_id, created_at)
       SELECT id, 'dispute_created', '新申诉待处理', $1, $2, NOW()
       FROM users WHERE role = 'admin'`,
      [
        `${isStudent ? '学生' : '企业'}对任务发起了申诉，请及时处理`,
        result[0].id
      ]
    );

    res.json({
      success: true,
      message: '申诉已提交，管理员将在24小时内处理',
      data: result[0]
    });

  } catch (error) {
    logger.error('创建申诉失败:', error);
    res.status(500).json({ success: false, message: '创建申诉失败' });
  }
};

// 获取我的申诉列表
export const getMyDisputes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { status } = req.query;

    let queryText = `
      SELECT d.*, t.title as task_title, u.nickname as initiator_name
      FROM disputes d
      JOIN tasks t ON d.task_id = t.id
      JOIN users u ON d.initiator_id = u.id
      WHERE d.initiator_id = $1
    `;
    const params: any[] = [userId];

    if (status) {
      queryText += ` AND d.status = $2`;
      params.push(status);
    }

    queryText += ` ORDER BY d.created_at DESC`;

    const result = await query(queryText, params);

    res.json({
      success: true,
      data: result.length > 0 ? result : []
    });

  } catch (error) {
    logger.error('获取申诉列表失败:', error);
    res.status(500).json({ success: false, message: '获取申诉列表失败' });
  }
};

// 获取申诉详情
export const getDisputeDetail = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const { disputeId } = req.params;

    const result = await query(
      `SELECT d.*,
              t.title as task_title,
              t.description as task_description,
              initiator.nickname as initiator_name,
              initiator.phone as initiator_phone,
              resolver.nickname as resolver_name
       FROM disputes d
       JOIN tasks t ON d.task_id = t.id
       JOIN users initiator ON d.initiator_id = initiator.id
       LEFT JOIN users resolver ON d.resolved_by = resolver.id
       WHERE d.id = $1`,
      [disputeId]
    );

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: '申诉不存在' });
    }

    const dispute = result[0];

    // 权限检查：只有申诉发起人和管理员可以查看
    if (userRole !== 'admin' && dispute.initiator_id !== userId) {
      return res.status(403).json({ success: false, message: '无权查看此申诉' });
    }

    res.json({
      success: true,
      data: dispute
    });

  } catch (error) {
    logger.error('获取申诉详情失败:', error);
    res.status(500).json({ success: false, message: '获取申诉详情失败' });
  }
};

// 管理员处理申诉
export const handleDispute = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.userId;
    const { disputeId } = req.params;
    const { action, adminResponse, resolution } = req.body;

    // 验证管理员权限
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: '仅管理员可处理申诉' });
    }

    // 更新申诉状态
    const newStatus = action === 'resolve' ? 'resolved' : action === 'reject' ? 'rejected' : 'investigating';

    const result = await query(
      `UPDATE disputes
       SET status = $1,
           admin_response = $2,
           resolution = $3,
           resolved_at = $4,
           resolved_by = $5
       WHERE id = $6
       RETURNING *`,
      [
        newStatus,
        adminResponse,
        resolution || null,
        action === 'resolve' || action === 'reject' ? new Date() : null,
        adminId,
        disputeId
      ]
    );

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: '申诉不存在' });
    }

    const dispute = result[0];

    // 发送通知给申诉发起人
    await query(
      `INSERT INTO notifications (user_id, type, title, content, related_id, created_at)
       VALUES ($1, 'dispute_handled', '申诉处理结果', $2, $3, NOW())`,
      [
        dispute.initiator_id,
        `您的申诉已${newStatus === 'resolved' ? '解决' : newStatus === 'rejected' ? '驳回' : '进入调查阶段'}`,
        disputeId
      ]
    );

    // 记录管理员操作日志
    await query(
      `INSERT INTO admin_logs (admin_id, action, target_type, target_id, details, created_at)
       VALUES ($1, 'handle_dispute', 'dispute', $2, $3, NOW())`,
      [adminId, disputeId, JSON.stringify({ action, adminResponse, resolution })]
    );

    res.json({
      success: true,
      message: '申诉处理成功',
      data: result[0]
    });

  } catch (error) {
    logger.error('处理申诉失败:', error);
    res.status(500).json({ success: false, message: '处理申诉失败' });
  }
};

// 管理员获取所有申诉列表
export const getAllDisputes = async (req: AuthRequest, res: Response) => {
  try {
    // 验证管理员权限
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: '仅管理员可查看所有申诉' });
    }

    const { status, disputeType, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let queryText = `
      SELECT d.*,
             t.title as task_title,
             initiator.nickname as initiator_name,
             initiator.phone as initiator_phone,
             resolver.nickname as resolver_name
      FROM disputes d
      JOIN tasks t ON d.task_id = t.id
      JOIN users initiator ON d.initiator_id = initiator.id
      LEFT JOIN users resolver ON d.resolved_by = resolver.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      queryText += ` AND d.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (disputeType) {
      queryText += ` AND d.dispute_type = $${paramIndex}`;
      params.push(disputeType);
      paramIndex++;
    }

    queryText += ` ORDER BY d.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    // 获取总数
    const countResult = await query(
      `SELECT COUNT(*) FROM disputes WHERE 1=1
       ${status ? `AND status = '${status}'` : ''}
       ${disputeType ? `AND dispute_type = '${disputeType}'` : ''}`
    );

    res.json({
      success: true,
      data: result.length > 0 ? result : [],
      pagination: {
        total: parseInt(String(countResult[0].count)),
        page: Number(page),
        limit: Number(limit)
      }
    });

  } catch (error) {
    logger.error('获取申诉列表失败:', error);
    res.status(500).json({ success: false, message: '获取申诉列表失败' });
  }
};
