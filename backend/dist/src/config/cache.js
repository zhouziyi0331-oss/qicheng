"use strict";
/**
 * Redis缓存配置
 * 用于缓存热点数据，减少数据库查询
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheTTL = exports.CacheKeys = exports.redis = void 0;
exports.getCache = getCache;
exports.setCache = setCache;
exports.deleteCache = deleteCache;
exports.deleteCacheByPattern = deleteCacheByPattern;
exports.cacheExists = cacheExists;
exports.withCache = withCache;
exports.invalidateStudentCache = invalidateStudentCache;
exports.invalidateTaskCache = invalidateTaskCache;
exports.invalidateFollowCache = invalidateFollowCache;
exports.closeRedis = closeRedis;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = __importDefault(require("../utils/logger"));
exports.redis = new ioredis_1.default({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: 3,
});
// 连接事件
exports.redis.on('connect', () => {
    logger_1.default.info('✅ Redis connected');
});
exports.redis.on('error', (err) => {
    logger_1.default.error('❌ Redis error:', err);
});
// ============================================================================
// 缓存键前缀
// ============================================================================
exports.CacheKeys = {
    // 学生相关
    STUDENT_PROFILE: (id) => `student:profile:${id}`,
    STUDENT_SNAPSHOT: (id) => `student:snapshot:${id}`,
    // 匹配相关
    MATCHING_RESULT: (taskId) => `matching:result:${taskId}`,
    MATCH_SCORE: (taskId, studentId) => `match:score:${taskId}:${studentId}`,
    // 关注相关
    FOLLOW_UPDATES: (companyId) => `follow:updates:${companyId}`,
    FOLLOWERS_LIST: (studentId) => `followers:list:${studentId}`,
    // 关系相关
    RELATIONSHIP_BADGES: (companyId, studentId) => `badges:${companyId}:${studentId}`,
    COLLABORATION_COUNT: (companyId, studentId) => `collab:count:${companyId}:${studentId}`,
    // 任务相关
    TASK_PROGRESS: (taskId) => `task:progress:${taskId}`,
    TASK_DETAILS: (taskId) => `task:details:${taskId}`,
};
// ============================================================================
// 缓存TTL（秒）
// ============================================================================
exports.CacheTTL = {
    STUDENT_PROFILE: 3600, // 1小时
    STUDENT_SNAPSHOT: 1800, // 30分钟
    MATCHING_RESULT: 300, // 5分钟
    MATCH_SCORE: 300, // 5分钟
    FOLLOW_UPDATES: 600, // 10分钟
    FOLLOWERS_LIST: 1800, // 30分钟
    RELATIONSHIP_BADGES: 86400, // 24小时
    COLLABORATION_COUNT: 3600, // 1小时
    TASK_PROGRESS: 60, // 1分钟（实时性要求高）
    TASK_DETAILS: 600, // 10分钟
};
// ============================================================================
// 缓存辅助函数
// ============================================================================
/**
 * 获取缓存（带JSON解析）
 */
async function getCache(key) {
    try {
        const value = await exports.redis.get(key);
        if (!value)
            return null;
        return JSON.parse(value);
    }
    catch (error) {
        logger_1.default.error(`Cache get error for key ${key}:`, error);
        return null;
    }
}
/**
 * 设置缓存（带JSON序列化）
 */
async function setCache(key, value, ttl) {
    try {
        const serialized = JSON.stringify(value);
        if (ttl) {
            await exports.redis.setex(key, ttl, serialized);
        }
        else {
            await exports.redis.set(key, serialized);
        }
    }
    catch (error) {
        logger_1.default.error(`Cache set error for key ${key}:`, error);
    }
}
/**
 * 删除缓存
 */
async function deleteCache(key) {
    try {
        if (Array.isArray(key)) {
            if (key.length > 0) {
                await exports.redis.del(...key);
            }
        }
        else {
            await exports.redis.del(key);
        }
    }
    catch (error) {
        logger_1.default.error(`Cache delete error:`, error);
    }
}
/**
 * 批量删除缓存（通过模式匹配）
 */
async function deleteCacheByPattern(pattern) {
    try {
        const keys = await exports.redis.keys(pattern);
        if (keys.length === 0)
            return 0;
        await exports.redis.del(...keys);
        return keys.length;
    }
    catch (error) {
        logger_1.default.error(`Cache delete by pattern error for ${pattern}:`, error);
        return 0;
    }
}
/**
 * 检查缓存是否存在
 */
async function cacheExists(key) {
    try {
        const result = await exports.redis.exists(key);
        return result === 1;
    }
    catch (error) {
        logger_1.default.error(`Cache exists check error for key ${key}:`, error);
        return false;
    }
}
/**
 * 缓存包装器 - 自动缓存函数结果
 */
async function withCache(key, ttl, fetchFn) {
    // 1. 尝试从缓存获取
    const cached = await getCache(key);
    if (cached !== null) {
        return cached;
    }
    // 2. 执行函数获取数据
    const data = await fetchFn();
    // 3. 写入缓存
    await setCache(key, data, ttl);
    return data;
}
// ============================================================================
// 缓存失效策略
// ============================================================================
/**
 * 学生数据变更时，清除相关缓存
 */
async function invalidateStudentCache(studentId) {
    const keysToDelete = [
        exports.CacheKeys.STUDENT_PROFILE(studentId),
        exports.CacheKeys.STUDENT_SNAPSHOT(studentId),
        exports.CacheKeys.FOLLOWERS_LIST(studentId),
    ];
    await deleteCache(keysToDelete);
    // 清除所有包含该学生的匹配分数缓存
    await deleteCacheByPattern(`match:score:*:${studentId}`);
}
/**
 * 任务变更时，清除相关缓存
 */
async function invalidateTaskCache(taskId) {
    const keysToDelete = [
        exports.CacheKeys.MATCHING_RESULT(taskId),
        exports.CacheKeys.TASK_DETAILS(taskId),
        exports.CacheKeys.TASK_PROGRESS(taskId),
    ];
    await deleteCache(keysToDelete);
    // 清除该任务的所有匹配分数缓存
    await deleteCacheByPattern(`match:score:${taskId}:*`);
}
/**
 * 企业关注变更时，清除相关缓存
 */
async function invalidateFollowCache(companyId, studentId) {
    const keysToDelete = [
        exports.CacheKeys.FOLLOW_UPDATES(companyId),
        exports.CacheKeys.FOLLOWERS_LIST(studentId),
    ];
    await deleteCache(keysToDelete);
}
// ============================================================================
// 优雅关闭
// ============================================================================
async function closeRedis() {
    logger_1.default.info('Closing Redis connection...');
    await exports.redis.quit();
    logger_1.default.info('✅ Redis connection closed');
}
process.on('SIGTERM', closeRedis);
process.on('SIGINT', closeRedis);
exports.default = exports.redis;
//# sourceMappingURL=cache.js.map