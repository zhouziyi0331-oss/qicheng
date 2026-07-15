/**
 * 任务邀约控制器
 *
 * 处理学生端的邀约相关HTTP请求
 */
import { Request, Response } from 'express';
/**
 * 获取我的邀约列表
 * GET /api/v1/invitations/my-invitations
 */
export declare function getMyInvitations(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 获取邀约详情
 * GET /api/v1/invitations/:invitationId
 */
export declare function getInvitationDetail(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 接受邀约
 * POST /api/v1/invitations/:invitationId/accept
 */
export declare function acceptInvitation(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 拒绝邀约
 * POST /api/v1/invitations/:invitationId/decline
 */
export declare function declineInvitation(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * AI能力核验（接受邀约后的二次确认）
 * POST /api/v1/invitations/:invitationId/verify
 */
export declare function verifyCapability(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 手动触发过期检查（管理员接口）
 * POST /api/v1/invitations/expire-old
 */
export declare function expireOldInvitations(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 创建邀约
 * POST /api/v1/invitations/create
 *
 * 仅供内部服务调用
 */
export declare function createInvitation(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 批量创建邀约
 * POST /api/v1/invitations/batch-create
 *
 * 仅供内部匹配引擎调用
 */
export declare function batchCreateInvitations(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=invitationController.d.ts.map