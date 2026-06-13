/**
 * Redis缓存配置
 * 用于缓存热点数据，减少数据库查询
 */
import Redis from 'ioredis';
export declare const redis: Redis;
export declare const CacheKeys: {
    STUDENT_PROFILE: (id: string) => string;
    STUDENT_SNAPSHOT: (id: string) => string;
    MATCHING_RESULT: (taskId: string) => string;
    MATCH_SCORE: (taskId: string, studentId: string) => string;
    FOLLOW_UPDATES: (companyId: string) => string;
    FOLLOWERS_LIST: (studentId: string) => string;
    RELATIONSHIP_BADGES: (companyId: string, studentId: string) => string;
    COLLABORATION_COUNT: (companyId: string, studentId: string) => string;
    TASK_PROGRESS: (taskId: string) => string;
    TASK_DETAILS: (taskId: string) => string;
};
export declare const CacheTTL: {
    STUDENT_PROFILE: number;
    STUDENT_SNAPSHOT: number;
    MATCHING_RESULT: number;
    MATCH_SCORE: number;
    FOLLOW_UPDATES: number;
    FOLLOWERS_LIST: number;
    RELATIONSHIP_BADGES: number;
    COLLABORATION_COUNT: number;
    TASK_PROGRESS: number;
    TASK_DETAILS: number;
};
/**
 * 获取缓存（带JSON解析）
 */
export declare function getCache<T>(key: string): Promise<T | null>;
/**
 * 设置缓存（带JSON序列化）
 */
export declare function setCache(key: string, value: any, ttl?: number): Promise<void>;
/**
 * 删除缓存
 */
export declare function deleteCache(key: string | string[]): Promise<void>;
/**
 * 批量删除缓存（通过模式匹配）
 */
export declare function deleteCacheByPattern(pattern: string): Promise<number>;
/**
 * 检查缓存是否存在
 */
export declare function cacheExists(key: string): Promise<boolean>;
/**
 * 缓存包装器 - 自动缓存函数结果
 */
export declare function withCache<T>(key: string, ttl: number, fetchFn: () => Promise<T>): Promise<T>;
/**
 * 学生数据变更时，清除相关缓存
 */
export declare function invalidateStudentCache(studentId: string): Promise<void>;
/**
 * 任务变更时，清除相关缓存
 */
export declare function invalidateTaskCache(taskId: string): Promise<void>;
/**
 * 企业关注变更时，清除相关缓存
 */
export declare function invalidateFollowCache(companyId: string, studentId: string): Promise<void>;
export declare function closeRedis(): Promise<void>;
export default redis;
//# sourceMappingURL=cache.d.ts.map