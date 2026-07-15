/**
 * ✓ 订单服务 - 集成横向越权保护
 *
 * 后端已实现Service层权限校验，前端调用即可
 */

import { http } from '../utils/secureRequest';

export interface Order {
  id: string;
  studentId: string;
  clientId: string;
  taskId: string;
  status: string;
  amount: number;
  createdAt: string;
  student?: {
    id: string;
    nickname: string;
    phone: string; // ✓ 后端会自动脱敏
  };
  client?: {
    id: string;
    companyName: string;
  };
}

class OrderService {
  /**
   * ✓ P0安全: 获取订单详情
   * 后端会自动校验权限，学生只能查看自己的订单
   */
  async getOrderById(orderId: string): Promise<Order> {
    return await http.get<Order>(`/orders/${orderId}`);
  }

  /**
   * ✓ P0安全: 获取我的订单列表
   * 后端会自动过滤只返回当前用户的订单
   */
  async getMyOrders(params?: {
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<Order[]> {
    return await http.get<Order[]>('/orders/my', params);
  }

  /**
   * 接受订单
   */
  async acceptOrder(orderId: string): Promise<void> {
    await http.post(`/orders/${orderId}/accept`);
  }

  /**
   * 完成订单
   */
  async completeOrder(orderId: string, deliverables?: any): Promise<void> {
    await http.post(`/orders/${orderId}/complete`, { deliverables });
  }

  /**
   * 取消订单
   */
  async cancelOrder(orderId: string, reason?: string): Promise<void> {
    await http.post(`/orders/${orderId}/cancel`, { reason });
  }
}

export const orderService = new OrderService();
