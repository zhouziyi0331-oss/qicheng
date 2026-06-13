/**
 * Redis缓存配置
 * 用于缓存热点数据，减少数据库查询
 */

import Redis from 'ioredis';

export const redis = new Redis({
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
redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err);
});

// ============================================================================
// 缓存键前缀
// ============================================================================

export const CacheKeys = {
  // 学生相关
  STUDENT_PROFILE: (id: string) => `student:profile:${id}`,
  STUDENT_SNAPSHOT: (id: string) => `student:snapshot:${id}`,
  
  // 匹配相关
  MATCHING_RESULT: (taskId: string) => `matching:result:${taskId}`,
  MATCH_SCORE: (taskId: string, studentId: string) => `match:score:${taskId}:${studentId}`,
  
  // 关注相关
  FOLLOW_UPDATES: (companyId: string) => `follow:updates:${companyId}`,
  FOLLOWERS_LIST: (studentId: string) => `followers:list:${studentId}`,
  
  // 关系相关
  RELATIONSHIP_BADGES: (companyId: string, studentId: string) => 
    `badges:${companyId}:${studentId}`,
  COLLABORATION_COUNT: (companyId: string, studentId: string) =>
    `collab:count:${companyId}:${studentId}`,
  
  // 任务相关
  TASK_PROGRESS: (taskId: string) => `task:progress:${taskId}`,
  TASK_DETAILS: (taskId: string) => `task:details:${taskId}`,
};

// ============================================================================
// 缓存TTL（秒）
// ============================================================================

export const CacheTTL = {
  STUDENT_PROFILE: 3600,       // 1小时
  STUDENT_SNAPSHOT: 1800,      // 30分钟
  MATCHING_RESULT: 300,        // 5分钟
  MATCH_SCORE: 300,            // 5分钟
  FOLLOW_UPDATES: 600,         // 10分钟
  FOLLOWERS_LIST: 1800,        // 30分钟
  RELATIONSHIP_BADGES: 86400,  // 24小时
  COLLABORATION_COUNT: 3600,   // 1小时
  TASK_PROGRESS: 60,           // 1分钟（实时性要求高）
  TASK_DETAILS: 600,           // 10分钟
};

// ============================================================================
// 缓存辅助函数
// ============================================================================

/**
 * 获取缓存（带JSON解析）
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const value = await redis.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`Cache get error for key ${key}:`, error);
    return null;
  }
}

/**
 * 设置缓存（带JSON序列化）
 */
export async function setCache(key: string, value: any, ttl?: number): Promise<void> {
  try {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await redis.setex(key, ttl, serialized);
    } else {
      await redis.set(key, serialized);
    }
  } catch (error) {
    console.error(`Cache set error for key ${key}:`, error);
  }
}

/**
 * 删除缓存
 */
export async function deleteCache(key: string | string[]): Promise<void> {
  try {
    if (Array.isArray(key)) {
      if (key.length > 0) {
        await redis.del(...key);
      }
    } else {
      await redis.del(key);
    }
  } catch (error) {
    console.error(`Cache delete error:`, error);
  }
}

/**
 * 批量删除缓存（通过模式匹配）
 */
export async function deleteCacheByPattern(pattern: string): Promise<number> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length === 0) return 0;
    await redis.del(...keys);
    return keys.length;
  } catch (error) {
    console.error(`Cache delete by pattern error for ${pattern}:`, error);
    return 0;
  }
}

/**
 * 检查缓存是否存在
 */
export async function cacheExists(key: string): Promise<boolean> {
  try {
    const result = await redis.exists(key);
    return result === 1;
  } catch (error) {
    console.error(`Cache exists check error for key ${key}:`, error);
    return false;
  }
}

/**
 * 缓存包装器 - 自动缓存函数结果
 */
export async function withCache<T>(
  key: string,
  ttl: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  // 1. 尝试从缓存获取
  const cached = await getCache<T>(key);
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
export async function invalidateStudentCache(studentId: string) {
  const keysToDelete = [
    CacheKeys.STUDENT_PROFILE(studentId),
    CacheKeys.STUDENT_SNAPSHOT(studentId),
    CacheKeys.FOLLOWERS_LIST(studentId),
  ];
  
  await deleteCache(keysToDelete);
  
  // 清除所有包含该学生的匹配分数缓存
  await deleteCacheByPattern(`match:score:*:${studentId}`);
}

/**
 * 任务变更时，清除相关缓存
 */
export async function invalidateTaskCache(taskId: string) {
  const keysToDelete = [
    CacheKeys.MATCHING_RESULT(taskId),
    CacheKeys.TASK_DETAILS(taskId),
    CacheKeys.TASK_PROGRESS(taskId),
  ];
  
  await deleteCache(keysToDelete);
  
  // 清除该任务的所有匹配分数缓存
  await deleteCacheByPattern(`match:score:${taskId}:*`);
}

/**
 * 企业关注变更时，清除相关缓存
 */
export async function invalidateFollowCache(companyId: string, studentId: string) {
  const keysToDelete = [
    CacheKeys.FOLLOW_UPDATES(companyId),
    CacheKeys.FOLLOWERS_LIST(studentId),
  ];
  
  await deleteCache(keysToDelete);
}

// ============================================================================
// 优雅关闭
// ============================================================================

export async function closeRedis() {
  console.log('Closing Redis connection...');
  await redis.quit();
  console.log('✅ Redis connection closed');
}

process.on('SIGTERM', closeRedis);
process.on('SIGINT', closeRedis);

export default redis;
