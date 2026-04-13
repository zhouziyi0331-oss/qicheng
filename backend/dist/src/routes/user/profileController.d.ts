import { Request, Response, NextFunction } from 'express';
/**
 * 用户个人资料控制器
 *
 * 功能：
 * 1. 获取个人资料
 * 2. 更新昵称
 * 3. 更新头像
 * 4. 更新完整资料
 * 5. 绑定手机号
 */
export declare function getProfile(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function updateNickname(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function updateAvatar(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getAvatarUploadUrl(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function bindPhone(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=profileController.d.ts.map