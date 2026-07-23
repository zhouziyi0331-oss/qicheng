"use strict";
/**
 * Redis缓存工具
 * 用于缓存AI生成结果，避免重复生成
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCacheKey = exports.cacheManager = void 0;
class CacheManager {
    constructor() {
        this.cache = new Map();
        // 每小时清理一次过期缓存
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60 * 60 * 1000);
    }
    /**
     * 设置缓存
     * @param key 缓存键
     * @param data 缓存数据
     * @param ttl 过期时间（秒），默认1小时
     */
    set(key, data, ttl = 3600) {
        const expireAt = Date.now() + ttl * 1000;
        this.cache.set(key, { data, expireAt });
    }
    /**
     * 获取缓存
     * @param key 缓存键
     * @returns 缓存数据，如果不存在或已过期返回null
     */
    get(key) {
        const item = this.cache.get(key);
        if (!item) {
            return null;
        }
        // 检查是否过期
        if (Date.now() > item.expireAt) {
            this.cache.delete(key);
            return null;
        }
        return item.data;
    }
    /**
     * 删除缓存
     */
    delete(key) {
        this.cache.delete(key);
    }
    /**
     * 清除所有缓存
     */
    clear() {
        this.cache.clear();
    }
    /**
     * 清理过期缓存
     */
    cleanup() {
        const now = Date.now();
        let cleanedCount = 0;
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expireAt) {
                this.cache.delete(key);
                cleanedCount++;
            }
        }
        if (cleanedCount > 0) {
            console.log(`✓ 清理了 ${cleanedCount} 个过期缓存`);
        }
    }
    /**
     * 获取缓存统计
     */
    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
    /**
     * 停止清理定时器
     */
    destroy() {
        clearInterval(this.cleanupInterval);
    }
}
// 导出单例
exports.cacheManager = new CacheManager();
// 生成缓存键的辅助函数
exports.generateCacheKey = {
    decompositionReport: (projectId) => `decomposition:${projectId}`,
    practiceList: (userId, status, track) => `practice:list:${userId}:${status || 'all'}:${track || 'all'}`,
    practiceStats: (userId) => `practice:stats:${userId}`,
    partnerList: (userId) => `partners:${userId}`
};
//# sourceMappingURL=cache.js.map