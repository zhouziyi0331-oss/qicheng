/**
 * 通知控制器
 */
import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
/**
 * 获取用户通知列表
 */
export declare function getNotifications(req: AuthRequest, res: Response): Promise<void>;
export declare function getUnreadCountHandler(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function markNotificationAsRead(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function markAllNotificationsAsRead(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteNotification(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateNotificationPreferences(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getNotificationPreferences(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=controller.d.ts.map