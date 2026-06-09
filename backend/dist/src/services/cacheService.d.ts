/**
 * Redis缓存服务
 *
 * 缓存策略：
 * - 匹配结果：6小时（频繁变化，但短期内稳定）
 * - 学生画像：24小时（相对稳定，每日更新）
 * - 项目数据：1小时（可能频繁更新）
 */
declare class CacheService {
    private redis;
    private enabled;
    constructor();
    /**
     * 检查缓存是否可用
     */
    private isEnabled;
    /**
     * 获取学生的匹配结果缓存
     */
    getStudentMatches(studentId: string): Promise<any | null>;
    /**
     * 设置学生的匹配结果缓存（6小时）
     */
    setStudentMatches(studentId: string, matches: any): Promise<void>;
    /**
     * 删除学生的匹配结果缓存
     */
    deleteStudentMatches(studentId: string): Promise<void>;
    /**
     * 获取学生画像缓存
     */
    getStudentProfile(studentId: string): Promise<any | null>;
    /**
     * 设置学生画像缓存（24小时）
     */
    setStudentProfile(studentId: string, profile: any): Promise<void>;
    /**
     * 删除学生画像缓存
     */
    deleteStudentProfile(studentId: string): Promise<void>;
    /**
     * 画像更新时，同时删除相关缓存
     */
    invalidateStudentCache(studentId: string): Promise<void>;
    /**
     * 获取项目详情缓存
     */
    getTaskDetail(taskId: string): Promise<any | null>;
    /**
     * 设置项目详情缓存（1小时）
     */
    setTaskDetail(taskId: string, task: any): Promise<void>;
    /**
     * 删除项目详情缓存
     */
    deleteTaskDetail(taskId: string): Promise<void>;
    /**
     * 通用获取缓存
     */
    get(key: string): Promise<any | null>;
    /**
     * 通用设置缓存
     */
    set(key: string, value: any, ttl?: number): Promise<void>;
    /**
     * 通用删除缓存
     */
    delete(key: string): Promise<void>;
    /**
     * 批量删除缓存（支持通配符）
     */
    deletePattern(pattern: string): Promise<void>;
    /**
     * 获取缓存统计信息
     */
    getStats(): Promise<{
        enabled: boolean;
        keyCount: number;
        memoryUsed: string;
    }>;
    /**
     * 清空所有缓存（慎用）
     */
    flushAll(): Promise<void>;
    /**
     * 关闭Redis连接
     */
    close(): Promise<void>;
}
declare const _default: CacheService;
export default _default;
//# sourceMappingURL=cacheService.d.ts.map