/**
 * ✅ P0安全: 订单服务 - Service层强制权限校验
 *
 * 关键原则：
 * 1. 所有Service方法都接收currentUser参数
 * 2. 权限校验在Service层，不在Controller层
 * 3. 根据角色返回不同的字段（脱敏）
 */
import { JwtPayload } from '../middleware/auth';
export declare class NotFoundError extends Error {
    statusCode: number;
    constructor(message: string);
}
export declare class ForbiddenError extends Error {
    statusCode: number;
    constructor(message: string);
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
export declare class OrderService {
    /**
     * ✅ P0安全: 获取订单详情 - 强制权限校验
     *
     * @param orderId 订单ID
     * @param currentUser 当前用户（从JWT获取）
     * @returns 脱敏后的订单数据
     */
    getOrderById(orderId: string, currentUser: JwtPayload): Promise<Order>;
    /**
     * ✅ P0安全: 获取订单列表 - 自动过滤只返回当前用户的订单
     */
    getOrderList(currentUser: JwtPayload, filters: any): Promise<Order[]>;
    /**
     * ✅ P0安全: 根据角色脱敏订单数据
     */
    private sanitizeOrderForRole;
    /**
     * 手机号脱敏
     */
    private maskPhone;
    /**
     * ✅ P0安全: 更新订单状态 - 强制权限校验
     */
    updateOrderStatus(orderId: string, newStatus: string, currentUser: JwtPayload): Promise<void>;
    /**
     * 根据角色获取允许的状态转换
     */
    private getAllowedStatusTransitions;
}
export declare const orderService: OrderService;
//# sourceMappingURL=orderService.d.ts.map