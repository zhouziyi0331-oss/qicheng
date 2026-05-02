import { Request, Response } from 'express';
/**
 * 获取订单列表
 */
export declare function getOrderList(req: Request, res: Response): Promise<void>;
/**
 * 获取订单详情
 */
export declare function getOrderDetail(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 获取订单统计
 */
export declare function getOrderStats(req: Request, res: Response): Promise<void>;
/**
 * 处理订单纠纷
 */
export declare function handleDispute(req: Request, res: Response): Promise<void>;
/**
 * 强制完成订单
 */
export declare function forceCompleteOrder(req: Request, res: Response): Promise<void>;
/**
 * 取消订单
 */
export declare function cancelOrder(req: Request, res: Response): Promise<void>;
/**
 * 获取逾期订单列表
 */
export declare function getOverdueOrders(req: Request, res: Response): Promise<void>;
/**
 * 获取待审核交付物列表
 */
export declare function getPendingDeliverables(req: Request, res: Response): Promise<void>;
/**
 * 获取异常订单列表（逾期+纠纷）
 */
export declare function getAbnormalOrders(req: Request, res: Response): Promise<void>;
/**
 * 获取纠纷列表
 */
export declare function getDisputeList(req: Request, res: Response): Promise<void>;
/**
 * 处理纠纷（别名函数，指向handleDispute）
 */
export declare function resolveDispute(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=orderController.d.ts.map