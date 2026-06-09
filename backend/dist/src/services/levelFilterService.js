"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../utils/db");
const logger_1 = __importDefault(require("../utils/logger"));
class LevelFilterService {
    /**
     * 获取学生等级信息
     */
    async getStudentLevelInfo(studentId) {
        try {
            const student = await (0, db_1.queryOne)(`SELECT current_level, track FROM users WHERE id = $1`, [studentId]);
            if (!student) {
                return null;
            }
            // 获取等级配置
            const levelConfig = await (0, db_1.queryOne)(`SELECT platform_fee_rate, task_difficulty_range, unlocked_features
         FROM level_configs
         WHERE level = $1 AND track = $2`, [student.current_level, student.track]);
            if (!levelConfig) {
                logger_1.default.warn(`Level config not found for level ${student.current_level}, track ${student.track}`);
                return null;
            }
            return {
                studentId,
                currentLevel: student.current_level,
                track: student.track,
                allowedDifficulties: levelConfig.task_difficulty_range,
                platformFeeRate: levelConfig.platform_fee_rate,
                unlockedFeatures: levelConfig.unlocked_features || [],
            };
        }
        catch (error) {
            logger_1.default.error('Failed to get student level info:', error);
            return null;
        }
    }
    /**
     * 根据学生等级过滤任务列表
     */
    async filterTasksByLevel(studentId, options = {}) {
        try {
            const levelInfo = await this.getStudentLevelInfo(studentId);
            if (!levelInfo) {
                throw new Error('Student level info not found');
            }
            const { includeChallengeTasks = false, limit = 20, offset = 0, sortBy = 'created_at', sortOrder = 'DESC', } = options;
            // 构建难度过滤条件
            let difficultyCondition = `difficulty = ANY($2::int[])`;
            let difficultyParams = levelInfo.allowedDifficulties;
            // 如果包含挑战任务，添加高一级的难度
            if (includeChallengeTasks && levelInfo.currentLevel < 5) {
                const maxAllowedDifficulty = Math.max(...levelInfo.allowedDifficulties);
                if (maxAllowedDifficulty < 5) {
                    difficultyParams = [...difficultyParams, maxAllowedDifficulty + 1];
                }
            }
            // 查询任务
            const tasks = await (0, db_1.query)(`SELECT
          t.*,
          tsm.overall_score as match_score,
          tsm.rank_in_task as match_rank,
          CASE
            WHEN t.difficulty = ANY($2::int[]) THEN false
            ELSE true
          END as is_challenge_task
         FROM tasks t
         LEFT JOIN task_student_matches tsm ON t.id = tsm.task_id AND tsm.student_id = $1
         WHERE t.status = 'open'
           AND t.track IN ($3, 'mixed')
           AND t.required_level <= $4
           AND t.difficulty = ANY($5::int[])
         ORDER BY
           CASE WHEN $6 = 'match_score' THEN tsm.overall_score END ${sortOrder} NULLS LAST,
           CASE WHEN $6 = 'difficulty' THEN t.difficulty END ${sortOrder},
           CASE WHEN $6 = 'created_at' THEN t.created_at END ${sortOrder}
         LIMIT $7 OFFSET $8`, [
                studentId,
                levelInfo.allowedDifficulties,
                levelInfo.track,
                levelInfo.currentLevel,
                difficultyParams,
                sortBy,
                limit,
                offset,
            ]);
            // 获取总数
            const countResult = await (0, db_1.queryOne)(`SELECT COUNT(*) as count
         FROM tasks t
         WHERE t.status = 'open'
           AND t.track IN ($1, 'mixed')
           AND t.required_level <= $2
           AND t.difficulty = ANY($3::int[])`, [levelInfo.track, levelInfo.currentLevel, difficultyParams]);
            return {
                tasks: tasks.rows,
                totalCount: countResult?.count || 0,
                studentLevel: levelInfo.currentLevel,
                allowedDifficulties: difficultyParams,
            };
        }
        catch (error) {
            logger_1.default.error('Failed to filter tasks by level:', error);
            throw error;
        }
    }
    /**
     * 检查学生是否可以接某个任务
     */
    async canAcceptTask(studentId, taskId) {
        try {
            const levelInfo = await this.getStudentLevelInfo(studentId);
            if (!levelInfo) {
                return {
                    canAccept: false,
                    reason: '无法获取学生等级信息',
                };
            }
            // 获取任务信息
            const task = await (0, db_1.queryOne)(`SELECT track, required_level, difficulty, status FROM tasks WHERE id = $1`, [taskId]);
            if (!task) {
                return {
                    canAccept: false,
                    reason: '任务不存在',
                };
            }
            if (task.status !== 'open') {
                return {
                    canAccept: false,
                    reason: '任务已关闭',
                };
            }
            // 检查赛道
            if (task.track !== 'mixed' && task.track !== levelInfo.track) {
                return {
                    canAccept: false,
                    reason: `此任务属于${task.track === 'content' ? '内容创作' : '工具开发'}赛道，你当前在${levelInfo.track === 'content' ? '内容创作' : '工具开发'}赛道`,
                };
            }
            // 检查等级要求
            if (task.required_level > levelInfo.currentLevel) {
                return {
                    canAccept: false,
                    reason: `此任务需要Lv.${task.required_level}，你当前是Lv.${levelInfo.currentLevel}`,
                };
            }
            // 检查难度（允许接高一级的挑战任务）
            const maxAllowedDifficulty = Math.max(...levelInfo.allowedDifficulties) + 1;
            if (task.difficulty > maxAllowedDifficulty) {
                return {
                    canAccept: false,
                    reason: `此任务难度为${task.difficulty}，超出你当前可接受的难度范围`,
                };
            }
            return {
                canAccept: true,
            };
        }
        catch (error) {
            logger_1.default.error('Failed to check if student can accept task:', error);
            return {
                canAccept: false,
                reason: '检查失败，请稍后重试',
            };
        }
    }
    /**
     * 获取学生的升级进度
     */
    async getUpgradeProgress(studentId) {
        try {
            const levelInfo = await this.getStudentLevelInfo(studentId);
            if (!levelInfo) {
                return null;
            }
            if (levelInfo.currentLevel >= 5) {
                return {
                    currentLevel: 5,
                    nextLevel: 5,
                    progress: {
                        completedOrders: 0,
                        requiredOrders: 0,
                        avgRating: 0,
                        requiredRating: 0,
                    },
                    canUpgrade: false,
                    nextLevelFeatures: [],
                };
            }
            // 获取下一等级配置
            const nextLevelConfig = await (0, db_1.queryOne)(`SELECT required_orders, min_rating, unlocked_features
         FROM level_configs
         WHERE level = $1 AND track = $2`, [levelInfo.currentLevel + 1, levelInfo.track]);
            if (!nextLevelConfig) {
                return null;
            }
            // 获取学生订单统计
            const orderStats = await (0, db_1.queryOne)(`SELECT
          COUNT(*) as completed_orders,
          AVG(company_score) as avg_rating
         FROM orders
         WHERE student_id = $1 AND status = 'completed' AND order_type = 'normal'`, [studentId]);
            const completedOrders = orderStats?.completed_orders || 0;
            const avgRating = orderStats?.avg_rating || 0;
            const canUpgrade = completedOrders >= nextLevelConfig.required_orders &&
                avgRating >= nextLevelConfig.min_rating;
            return {
                currentLevel: levelInfo.currentLevel,
                nextLevel: levelInfo.currentLevel + 1,
                progress: {
                    completedOrders,
                    requiredOrders: nextLevelConfig.required_orders,
                    avgRating,
                    requiredRating: nextLevelConfig.min_rating,
                },
                canUpgrade,
                nextLevelFeatures: nextLevelConfig.unlocked_features || [],
            };
        }
        catch (error) {
            logger_1.default.error('Failed to get upgrade progress:', error);
            return null;
        }
    }
    /**
     * 自动升级学生等级（订单完成后调用）
     */
    async autoUpgradeIfEligible(studentId) {
        try {
            const progress = await this.getUpgradeProgress(studentId);
            if (!progress || !progress.canUpgrade) {
                return { upgraded: false };
            }
            // 升级
            await (0, db_1.query)(`UPDATE users SET current_level = $1, updated_at = NOW() WHERE id = $2`, [progress.nextLevel, studentId]);
            logger_1.default.info(`Student ${studentId} auto-upgraded from Lv.${progress.currentLevel} to Lv.${progress.nextLevel}`);
            // 发送升级通知（可以通过WebSocket或导师消息）
            const levelConfig = await (0, db_1.queryOne)(`SELECT name, description, unlocked_features FROM level_configs WHERE level = $1 AND track = (SELECT track FROM users WHERE id = $2)`, [progress.nextLevel, studentId]);
            if (levelConfig) {
                const mentorMessage = `🎉 恭喜升级！

你已经从Lv.${progress.currentLevel}升级到Lv.${progress.nextLevel} · ${levelConfig.name}！

**解锁新功能：**
${(levelConfig.unlocked_features || []).map((f) => `- ${f}`).join('\n')}

**${levelConfig.description}**

现在你可以接更高难度的任务了。继续加油！`;
                // 创建一个系统消息（不关联具体订单）
                await (0, db_1.query)(`INSERT INTO mentor_sessions (order_id, student_id, scenario, message, created_at)
           VALUES (NULL, $1, 'SYSTEM-Upgrade', $2, NOW())`, [studentId, mentorMessage]);
            }
            return {
                upgraded: true,
                newLevel: progress.nextLevel,
                oldLevel: progress.currentLevel,
            };
        }
        catch (error) {
            logger_1.default.error('Failed to auto-upgrade student:', error);
            return { upgraded: false };
        }
    }
    /**
     * 获取所有等级配置（用于前端展示）
     */
    async getAllLevelConfigs(track) {
        try {
            const configs = await (0, db_1.query)(`SELECT * FROM level_configs WHERE track = $1 ORDER BY level ASC`, [track]);
            return configs.rows;
        }
        catch (error) {
            logger_1.default.error('Failed to get all level configs:', error);
            return [];
        }
    }
}
exports.default = new LevelFilterService();
//# sourceMappingURL=levelFilterService.js.map