/**
 * 通知消息控制器
 */
import { Request, Response } from 'express';
/**
 * 发送通知
 */
export declare function sendNotification(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 批量发送通知
 */
export declare function sendBulkNotifications(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 获取用户通知列表
 */
export declare function getUserNotifications(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 获取未读消息统计
 */
export declare function getUnreadCount(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 标记通知已读
 */
export declare function markAsRead(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 批量标记已读
 */
export declare function markAllAsRead(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 删除通知
 */
export declare function deleteNotification(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 获取用户通知设置
 */
export declare function getUserSettings(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 更新用户通知设置
 */
export declare function updateUserSettings(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 获取通知模板
 */
export declare function getTemplate(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 获取所有模板
 */
export declare function getAllTemplates(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=notificationController.d.ts.map