/**
 * Redis缓存工具
 * 用于缓存AI生成结果，避免重复生成
 */
declare class CacheManager {
    private cache;
    private cleanupInterval;
    constructor();
    /**
     * 设置缓存
     * @param key 缓存键
     * @param data 缓存数据
     * @param ttl 过期时间（秒），默认1小时
     */
    set(key: string, data: any, ttl?: number): void;
    /**
     * 获取缓存
     * @param key 缓存键
     * @returns 缓存数据，如果不存在或已过期返回null
     */
    get(key: string): any | null;
    /**
     * 删除缓存
     */
    delete(key: string): void;
    /**
     * 清除所有缓存
     */
    clear(): void;
    /**
     * 清理过期缓存
     */
    private cleanup;
    /**
     * 获取缓存统计
     */
    getStats(): {
        size: number;
        keys: string[];
    };
    /**
     * 停止清理定时器
     */
    destroy(): void;
}
export declare const cacheManager: CacheManager;
export declare const generateCacheKey: {
    decompositionReport: (projectId: string) => string;
    practiceList: (userId: string, status?: string, track?: string) => string;
    practiceStats: (userId: string) => string;
    partnerList: (userId: string) => string;
};
export {};
//# sourceMappingURL=cache.d.ts.map