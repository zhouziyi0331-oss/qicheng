/**
 * ✅ P0安全: 订单服务 - Service层强制权限校验
 *
 * 关键原则：
 * 1. 所有Service方法都接收currentUser参数
 * 2. 权限校验在Service层，不在Controller层
 * 3. 根据角色返回不同的字段（脱敏）
 */

import { query } from '../utils/db';
import { JwtPayload } from '../middleware/auth';
import logger from '../utils/logger';

export class NotFoundError extends Error {
  statusCode = 404;
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends Error {
  statusCode = 403;
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export interface Order {
  id: string;
  studentId: string;
  clientId: string;
  taskId: string;
  status: string;
  amount: number;
  createdAt: Date;
  student?: any;
  client?: any;
  task?: any;
}

export class OrderService {
  /**
   * ✅ P0安全: 获取订单详情 - 强制权限校验
   *
   * @param orderId 订单ID
   * @param currentUser 当前用户（从JWT获取）
   * @returns 脱敏后的订单数据
   */
  async getOrderById(orderId: string, currentUser: JwtPayload): Promise<Order> {
    logger.info('获取订单详情', { orderId, userId: currentUser.userId, role: currentUser.role });

    // 查询订单
    const orders = await query<Order>(
      `SELECT o.*,
              json_build_object('id', s.id, 'nickname', s.nickname, 'phone', s.phone, 'phone_masked', s.phone_masked) as student,
              json_build_object('id', c.id, 'company_name', c.company_name, 'contact_phone', c.contact_phone) as client
       FROM orders o
       LEFT JOIN users s ON o.student_id = s.id
       LEFT JOIN companies c ON o.client_id = c.id
       WHERE o.id = $1`,
      [orderId]
    );

    if (!orders || orders.length === 0) {
      throw new NotFoundError('订单不存在');
    }

    const order = orders[0];

    // ✅ Service层强制校验权限（最关键的安全检查）
    if (currentUser.role === 'student' && order.studentId !== currentUser.userId) {
      logger.warn('横向越权尝试被拦截', {
        userId: currentUser.userId,
        attemptedOrderId: orderId,
        actualStudentId: order.studentId
      });
      throw new ForbiddenError('无权访问此订单');
    }

    if (currentUser.role === 'company' && order.clientId !== currentUser.userId) {
      logger.warn('横向越权尝试被拦截', {
        userId: currentUser.userId,
        attemptedOrderId: orderId,
        actualClientId: order.clientId
      });
      throw new ForbiddenError('无权访问此订单');
    }

    // ✅ 根据角色脱敏返回数据
    return this.sanitizeOrderForRole(order, currentUser.role);
  }

  /**
   * ✅ P0安全: 获取订单列表 - 自动过滤只返回当前用户的订单
   */
  async getOrderList(currentUser: JwtPayload, filters: any): Promise<Order[]> {
    logger.info('获取订单列表', { userId: currentUser.userId, role: currentUser.role, filters });

    let whereClause = '';
    let params: any[] = [];

    // ✅ 根据角色自动添加过滤条件（防止查看其他人的订单）
    if (currentUser.role === 'student') {
      whereClause = 'WHERE o.student_id = $1';
      params.push(currentUser.userId);
    } else if (currentUser.role === 'company') {
      whereClause = 'WHERE o.client_id = $1';
      params.push(currentUser.userId);
    } else if (currentUser.role === 'admin') {
      // 管理员可以看所有订单
      whereClause = 'WHERE 1=1';
    }

    // 添加额外过滤条件
    if (filters.status) {
      params.push(filters.status);
      whereClause += ` AND o.status = $${params.length}`;
    }

    const orders = await query<Order>(
      `SELECT o.* FROM orders o ${whereClause} ORDER BY o.created_at DESC LIMIT 100`,
      params
    );

    // ✅ 批量脱敏
    return orders.map(order => this.sanitizeOrderForRole(order, currentUser.role));
  }

  /**
   * ✅ P0安全: 根据角色脱敏订单数据
   */
  private sanitizeOrderForRole(order: Order, role: string): Order {
    const sanitized = { ...order };

    if (role === 'company') {
      // 企业端不返回学生的手机号和敏感信息
      if (sanitized.student) {
        delete sanitized.student.phone;
        // 只返回脱敏后的手机号
        if (sanitized.student.phone_masked) {
          sanitized.student.phone = this.maskPhone(sanitized.student.phone_masked);
        }
      }
    }

    if (role === 'student') {
      // 学生端不返回企业的联系人手机号
      if (sanitized.client) {
        delete sanitized.client.contact_phone;
      }
    }

    return sanitized;
  }

  /**
   * 手机号脱敏
   */
  private maskPhone(phone: string): string {
    if (!phone || phone.length !== 11) return '***';
    return phone.substring(0, 3) + '****' + phone.substring(7);
  }

  /**
   * ✅ P0安全: 更新订单状态 - 强制权限校验
   */
  async updateOrderStatus(
    orderId: string,
    newStatus: string,
    currentUser: JwtPayload
  ): Promise<void> {
    // 先获取订单（会自动校验权限）
    const order = await this.getOrderById(orderId, currentUser);

    // 根据角色限制可以修改的状态
    const allowedTransitions = this.getAllowedStatusTransitions(order.status, currentUser.role);

    if (!allowedTransitions.includes(newStatus)) {
      throw new ForbiddenError(`当前角色不能将订单从 ${order.status} 改为 ${newStatus}`);
    }

    await query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2',
      [newStatus, orderId]
    );

    logger.info('订单状态已更新', {
      orderId,
      oldStatus: order.status,
      newStatus,
      userId: currentUser.userId
    });
  }

  /**
   * 根据角色获取允许的状态转换
   */
  private getAllowedStatusTransitions(currentStatus: string, role: string): string[] {
    const transitions: Record<string, Record<string, string[]>> = {
      'pending': {
        'student': ['accepted', 'rejected'],
        'company': ['cancelled'],
        'admin': ['accepted', 'rejected', 'cancelled']
      },
      'accepted': {
        'student': ['in_progress', 'cancelled'],
        'company': ['cancelled'],
        'admin': ['in_progress', 'cancelled']
      },
      'in_progress': {
        'student': ['completed'],
        'company': [],
        'admin': ['completed', 'cancelled']
      },
      'completed': {
        'student': [],
        'company': ['confirmed'],
        'admin': ['confirmed']
      }
    };

    return transitions[currentStatus]?.[role] || [];
  }
}

// 导出单例
export const orderService = new OrderService();
