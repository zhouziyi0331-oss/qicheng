/**
 * 数据访问日志服务
 *
 * 功能：
 * 1. 记录所有数据访问行为
 * 2. 记录解密操作
 * 3. 查询访问历史
 */
interface AccessLogParams {
    userId: string;
    userType: string;
    resourceType: string;
    resourceId: string;
    action: string;
    accessMethod?: string;
    success?: boolean;
    failureReason?: string;
    decryptionPerformed?: boolean;
    decryptedFields?: string[];
    ipAddress?: string;
    userAgent?: string;
    accessDurationMs?: number;
}
interface AccessLog {
    id: string;
    userId: string;
    userType: string;
    resourceType: string;
    resourceId: string;
    action: string;
    accessMethod: string;
    success: boolean;
    failureReason?: string;
    decryptionPerformed: boolean;
    decryptedFields?: string[];
    ipAddress?: string;
    userAgent?: string;
    accessDurationMs?: number;
    createdAt: Date;
}
declare class DataAccessLogService {
    /**
     * 记录数据访问
     */
    logAccess(params: AccessLogParams): Promise<void>;
    /**
     * 获取资源访问历史
     */
    getAccessHistory(resourceType: string, resourceId: string, limit?: number): Promise<AccessLog[]>;
    /**
     * 获取用户访问历史
     */
    getUserAccessHistory(userId: string, limit?: number): Promise<AccessLog[]>;
    /**
     * 获取解密操作历史
     */
    getDecryptionHistory(resourceType: string, resourceId: string, limit?: number): Promise<AccessLog[]>;
    /**
     * 统计访问次数
     */
    getAccessCount(resourceType: string, resourceId: string): Promise<number>;
    /**
     * 获取最近访问时间
     */
    getLastAccessTime(resourceType: string, resourceId: string): Promise<Date | null>;
    /**
     * 从请求对象提取访问信息
     */
    extractAccessInfo(req: any): {
        ipAddress?: string;
        userAgent?: string;
    };
}
declare const _default: DataAccessLogService;
export default _default;
//# sourceMappingURL=dataAccessLogService.d.ts.map