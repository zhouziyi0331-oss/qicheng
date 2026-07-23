import { Request, Response } from 'express';
export declare class AuthController {
    /**
     * POST /api/auth/wechat-login
     * 微信小程序登录
     */
    wechatLogin(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/auth/refresh-token
     * 刷新Token
     */
    refreshToken(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/auth/profile
     * 获取用户信息
     */
    getProfile(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * PUT /api/auth/profile
     * 更新用户信息
     */
    updateProfile(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 调用微信接口获取session
     */
    private getWechatSession;
    /**
     * 生成JWT Token
     */
    private generateToken;
}
export declare const authController: AuthController;
//# sourceMappingURL=auth.controller.d.ts.map