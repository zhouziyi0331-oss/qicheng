/**
 * ✅ P1安全: 登录服务 - 防暴力破解
 *
 * 关键安全措施：
 * 1. 同一手机号连续5次失败锁定30分钟
 * 2. 同一IP连续20次失败锁定1小时
 * 3. 锁定期间返回统一错误信息
 * 4. 登录成功清除失败记录
 */
export declare class AppError extends Error {
    statusCode: number;
    code: string;
    constructor(statusCode: number, message: string, code: string);
}
export declare class AuthService {
    /**
     * ✅ P1安全: 登录 - 带锁定机制
     */
    login(phone: string, password: string, ip: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: any;
            phone: any;
            role: any;
        };
    }>;
    /**
     * ✅ P0安全: 退出登录 - 撤销Token
     */
    logout(userId: string, refreshToken: string): Promise<void>;
    /**
     * ✅ P0安全: 退出所有设备
     */
    logoutAll(userId: string): Promise<void>;
}
export declare const authService: AuthService;
//# sourceMappingURL=authService.d.ts.map