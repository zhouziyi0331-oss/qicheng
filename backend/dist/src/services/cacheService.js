"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
const config_1 = require("../../config");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Redis缓存服务
 *
 * 缓存策略：
 * - 匹配结果：6小时（频繁变化，但短期内稳定）
 * - 学生画像：24小时（相对稳定，每日更新）
 * - 项目数据：1小时（可能频繁更新）
 */
class CacheService {
    constructor() {
        try {
            this.redis = new ioredis_1.default(config_1.config.redis.url);
            this.enabled = true;
            this.redis.on('connect', () => {
                logger_1.default.info('Redis缓存服务已连接');
            });
            this.redis.on('error', (error) => {
                logger_1.default.error('Redis连接错误:', error);
                this.enabled = false;
            });
        }
        catch (error) {
            logger_1.default.error('Redis初始化失败:', error);
            this.enabled = false;
            // 创建一个空的Redis实例，避免后续调用报错
            this.redis = null;
        }
    }
    /**
     * 检查缓存是否可用
     */
    isEnabled() {
        return this.enabled && this.redis !== null;
    }
    // ============================================
    // 匹配结果缓存（6小时）
    // ============================================
    /**
     * 获取学生的匹配结果缓存
     */
    async getStudentMatches(studentId) {
        if (!this.isEnabled())
            return null;
        try {
            const key = `match:student:${studentId}`;
            const cached = await this.redis.get(key);
            if (cached) {
                logger_1.default.info('匹配结果缓存命中', { studentId });
                return JSON.parse(cached);
            }
            return null;
        }
        catch (error) {
            logger_1.default.error('获取匹配缓存失败:', error);
            return null;
        }
    }
    /**
     * 设置学生的匹配结果缓存（6小时）
     */
    async setStudentMatches(studentId, matches) {
        if (!this.isEnabled())
            return;
        try {
            const key = `match:student:${studentId}`;
            const ttl = 6 * 3600; // 6小时
            await this.redis.setex(key, ttl, JSON.stringify(matches));
            logger_1.default.info('匹配结果已缓存', { studentId, ttl });
        }
        catch (error) {
            logger_1.default.error('设置匹配缓存失败:', error);
        }
    }
    /**
     * 删除学生的匹配结果缓存
     */
    async deleteStudentMatches(studentId) {
        if (!this.isEnabled())
            return;
        try {
            const key = `match:student:${studentId}`;
            await this.redis.del(key);
            logger_1.default.info('匹配结果缓存已删除', { studentId });
        }
        catch (error) {
            logger_1.default.error('删除匹配缓存失败:', error);
        }
    }
    // ============================================
    // 学生画像缓存（24小时）
    // ============================================
    /**
     * 获取学生画像缓存
     */
    async getStudentProfile(studentId) {
        if (!this.isEnabled())
            return null;
        try {
            const key = `profile:${studentId}`;
            const cached = await this.redis.get(key);
            if (cached) {
                logger_1.default.info('学生画像缓存命中', { studentId });
                return JSON.parse(cached);
            }
            return null;
        }
        catch (error) {
            logger_1.default.error('获取画像缓存失败:', error);
            return null;
        }
    }
    /**
     * 设置学生画像缓存（24小时）
     */
    async setStudentProfile(studentId, profile) {
        if (!this.isEnabled())
            return;
        try {
            const key = `profile:${studentId}`;
            const ttl = 24 * 3600; // 24小时
            await this.redis.setex(key, ttl, JSON.stringify(profile));
            logger_1.default.info('学生画像已缓存', { studentId, ttl });
        }
        catch (error) {
            logger_1.default.error('设置画像缓存失败:', error);
        }
    }
    /**
     * 删除学生画像缓存
     */
    async deleteStudentProfile(studentId) {
        if (!this.isEnabled())
            return;
        try {
            const key = `profile:${studentId}`;
            await this.redis.del(key);
            logger_1.default.info('学生画像缓存已删除', { studentId });
        }
        catch (error) {
            logger_1.default.error('删除画像缓存失败:', error);
        }
    }
    /**
     * 画像更新时，同时删除相关缓存
     */
    async invalidateStudentCache(studentId) {
        if (!this.isEnabled())
            return;
        try {
            // 删除画像缓存
            await this.deleteStudentProfile(studentId);
            // 删除匹配缓存（因为画像变了，匹配结果也会变）
            await this.deleteStudentMatches(studentId);
            logger_1.default.info('学生相关缓存已全部清除', { studentId });
        }
        catch (error) {
            logger_1.default.error('清除学生缓存失败:', error);
        }
    }
    // ============================================
    // 项目数据缓存（1小时）
    // ============================================
    /**
     * 获取项目详情缓存
     */
    async getTaskDetail(taskId) {
        if (!this.isEnabled())
            return null;
        try {
            const key = `task:${taskId}`;
            const cached = await this.redis.get(key);
            if (cached) {
                logger_1.default.info('项目详情缓存命中', { taskId });
                return JSON.parse(cached);
            }
            return null;
        }
        catch (error) {
            logger_1.default.error('获取项目缓存失败:', error);
            return null;
        }
    }
    /**
     * 设置项目详情缓存（1小时）
     */
    async setTaskDetail(taskId, task) {
        if (!this.isEnabled())
            return;
        try {
            const key = `task:${taskId}`;
            const ttl = 3600; // 1小时
            await this.redis.setex(key, ttl, JSON.stringify(task));
            logger_1.default.info('项目详情已缓存', { taskId, ttl });
        }
        catch (error) {
            logger_1.default.error('设置项目缓存失败:', error);
        }
    }
    /**
     * 删除项目详情缓存
     */
    async deleteTaskDetail(taskId) {
        if (!this.isEnabled())
            return;
        try {
            const key = `task:${taskId}`;
            await this.redis.del(key);
            logger_1.default.info('项目详情缓存已删除', { taskId });
        }
        catch (error) {
            logger_1.default.error('删除项目缓存失败:', error);
        }
    }
    // ============================================
    // 通用缓存方法
    // ============================================
    /**
     * 通用获取缓存
     */
    async get(key) {
        if (!this.isEnabled())
            return null;
        try {
            const cached = await this.redis.get(key);
            return cached ? JSON.parse(cached) : null;
        }
        catch (error) {
            logger_1.default.error('获取缓存失败:', { key, error });
            return null;
        }
    }
    /**
     * 通用设置缓存
     */
    async set(key, value, ttl = 3600) {
        if (!this.isEnabled())
            return;
        try {
            await this.redis.setex(key, ttl, JSON.stringify(value));
        }
        catch (error) {
            logger_1.default.error('设置缓存失败:', { key, error });
        }
    }
    /**
     * 通用删除缓存
     */
    async delete(key) {
        if (!this.isEnabled())
            return;
        try {
            await this.redis.del(key);
        }
        catch (error) {
            logger_1.default.error('删除缓存失败:', { key, error });
        }
    }
    /**
     * 批量删除缓存（支持通配符）
     */
    async deletePattern(pattern) {
        if (!this.isEnabled())
            return;
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
                logger_1.default.info('批量删除缓存成功', { pattern, count: keys.length });
            }
        }
        catch (error) {
            logger_1.default.error('批量删除缓存失败:', { pattern, error });
        }
    }
    /**
     * 获取缓存统计信息
     */
    async getStats() {
        if (!this.isEnabled()) {
            return {
                enabled: false,
                keyCount: 0,
                memoryUsed: '0',
            };
        }
        try {
            const dbSize = await this.redis.dbsize();
            const info = await this.redis.info('memory');
            const memoryMatch = info.match(/used_memory_human:(.+)/);
            const memoryUsed = memoryMatch ? memoryMatch[1].trim() : '0';
            return {
                enabled: true,
                keyCount: dbSize,
                memoryUsed,
            };
        }
        catch (error) {
            logger_1.default.error('获取缓存统计失败:', error);
            return {
                enabled: false,
                keyCount: 0,
                memoryUsed: '0',
            };
        }
    }
    /**
     * 清空所有缓存（慎用）
     */
    async flushAll() {
        if (!this.isEnabled())
            return;
        try {
            await this.redis.flushdb();
            logger_1.default.warn('所有缓存已清空');
        }
        catch (error) {
            logger_1.default.error('清空缓存失败:', error);
        }
    }
    /**
     * 关闭Redis连接
     */
    async close() {
        if (this.redis) {
            await this.redis.quit();
            logger_1.default.info('Redis连接已关闭');
        }
    }
}
exports.default = new CacheService();
//# sourceMappingURL=cacheService.js.map