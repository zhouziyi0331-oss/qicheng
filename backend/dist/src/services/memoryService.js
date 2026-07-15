"use strict";
/**
 * 6层记忆系统服务
 * Phase R1: 为导师Agent提供完整的记忆读写API
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoryService = exports.MemoryService = void 0;
const db_1 = require("../utils/db");
const logger_1 = __importDefault(require("../utils/logger"));
class MemoryService {
    /**
     * 加载所有6层记忆
     */
    async loadAllLayers(userId) {
        try {
            const [L5_core, L6_relationship, L4_growth, L3_recent] = await Promise.all([
                this.loadCoreProfile(userId),
                this.loadRelationshipMemory(userId),
                this.loadGrowthArchive(userId),
                this.loadRecentSummary(userId)
            ]);
            return {
                L5_core: L5_core || undefined,
                L6_relationship: L6_relationship || undefined,
                L4_growth: L4_growth || undefined,
                L3_recent: L3_recent || undefined
                // L1 和 L2 按需加载
            };
        }
        catch (error) {
            logger_1.default.error('加载6层记忆失败:', error);
            throw error;
        }
    }
    /**
     * L5: 加载核心画像
     */
    async loadCoreProfile(userId) {
        try {
            const result = await (0, db_1.queryOne)(`SELECT * FROM mentor_memory_core_profile WHERE user_id = $1`, [userId]);
            if (!result) {
                logger_1.default.warn(`用户 ${userId} 的核心画像不存在`);
                return null;
            }
            return {
                nickname: result.nickname,
                grade: result.grade,
                major: result.major,
                track: result.track,
                level: result.level,
                talentProfile: result.talent_profile,
                abilityTags: result.ability_tags,
                communicationStyle: result.communication_style
            };
        }
        catch (error) {
            logger_1.default.error('加载L5核心画像失败:', error);
            return null;
        }
    }
    /**
     * L6: 加载关系记忆
     */
    async loadRelationshipMemory(userId) {
        try {
            const result = await (0, db_1.queryOne)(`SELECT * FROM mentor_memory_relationship WHERE user_id = $1`, [userId]);
            if (!result) {
                logger_1.default.warn(`用户 ${userId} 的关系记忆不存在`);
                return null;
            }
            return {
                relationshipStage: result.relationship_stage,
                memorableQuotes: result.memorable_quotes || [],
                mentorPromises: result.mentor_promises || [],
                emotionalAnchors: result.emotional_anchors || [],
                conversationSummaries: result.conversation_summaries || [],
                lastInteractionAt: result.last_interaction_at,
                totalConversations: result.total_conversations
            };
        }
        catch (error) {
            logger_1.default.error('加载L6关系记忆失败:', error);
            return null;
        }
    }
    /**
     * L4: 加载成长档案
     */
    async loadGrowthArchive(userId) {
        try {
            const result = await (0, db_1.queryOne)(`SELECT * FROM mentor_memory_growth_archive WHERE user_id = $1`, [userId]);
            if (!result) {
                logger_1.default.warn(`用户 ${userId} 的成长档案不存在`);
                return null;
            }
            return {
                milestones: result.milestones || [],
                taskMicroReports: result.task_micro_reports || [],
                scoreSnapshots: result.score_snapshots || [],
                growthPatterns: result.growth_patterns || {}
            };
        }
        catch (error) {
            logger_1.default.error('加载L4成长档案失败:', error);
            return null;
        }
    }
    /**
     * L3: 加载近期摘要
     */
    async loadRecentSummary(userId) {
        try {
            const result = await (0, db_1.queryOne)(`SELECT * FROM mentor_memory_recent_summary WHERE user_id = $1`, [userId]);
            if (!result) {
                logger_1.default.warn(`用户 ${userId} 的近期摘要不存在`);
                return null;
            }
            return {
                tasksCompleted30d: result.tasks_completed_30d,
                tasksInProgress: result.tasks_in_progress,
                topStuckTypes: result.top_stuck_types || [],
                emotionTrend: result.emotion_trend,
                avgResponseSpeedHours: parseFloat(result.avg_response_speed_hours) || 0,
                lastActiveAt: result.last_active_at,
                engagementScore: parseFloat(result.engagement_score) || 0
            };
        }
        catch (error) {
            logger_1.default.error('加载L3近期摘要失败:', error);
            return null;
        }
    }
    /**
     * L2: 加载任务记忆
     */
    async loadTaskContext(userId, taskId) {
        try {
            const result = await (0, db_1.queryOne)(`SELECT * FROM mentor_memory_task_context WHERE user_id = $1 AND task_id = $2`, [userId, taskId]);
            if (!result) {
                return null;
            }
            return {
                taskId: result.task_id,
                taskPhase: result.task_phase,
                stuckPoints: result.stuck_points || [],
                hintsGiven: result.hints_given || [],
                emotionTimeline: result.emotion_timeline || [],
                mentorAssessment: result.mentor_assessment || {}
            };
        }
        catch (error) {
            logger_1.default.error('加载L2任务记忆失败:', error);
            return null;
        }
    }
    /**
     * 更新L5核心画像
     */
    async updateCoreProfile(userId, updates) {
        try {
            const setClauses = [];
            const values = [];
            let paramIndex = 1;
            if (updates.abilityTags) {
                setClauses.push(`ability_tags = $${paramIndex++}`);
                values.push(JSON.stringify(updates.abilityTags));
            }
            if (updates.communicationStyle) {
                setClauses.push(`communication_style = $${paramIndex++}`);
                values.push(JSON.stringify(updates.communicationStyle));
            }
            if (updates.track) {
                setClauses.push(`track = $${paramIndex++}`);
                values.push(updates.track);
            }
            if (setClauses.length === 0)
                return;
            values.push(userId);
            await (0, db_1.query)(`UPDATE mentor_memory_core_profile SET ${setClauses.join(', ')} WHERE user_id = $${paramIndex}`, values);
            logger_1.default.info(`更新用户 ${userId} 的L5核心画像`);
        }
        catch (error) {
            logger_1.default.error('更新L5核心画像失败:', error);
            throw error;
        }
    }
    /**
     * 更新L6关系记忆
     */
    async updateRelationshipMemory(userId, updates) {
        try {
            if (updates.addQuote) {
                await (0, db_1.query)(`UPDATE mentor_memory_relationship
           SET memorable_quotes = COALESCE(memorable_quotes, '[]'::jsonb) || $1::jsonb,
               last_interaction_at = NOW(),
               total_conversations = total_conversations + 1
           WHERE user_id = $2`, [JSON.stringify({ date: new Date(), ...updates.addQuote }), userId]);
            }
            if (updates.addPromise) {
                await (0, db_1.query)(`UPDATE mentor_memory_relationship
           SET mentor_promises = COALESCE(mentor_promises, '[]'::jsonb) || $1::jsonb
           WHERE user_id = $2`, [JSON.stringify({ date: new Date(), fulfilled: false, ...updates.addPromise }), userId]);
            }
            if (updates.addAnchor) {
                await (0, db_1.query)(`UPDATE mentor_memory_relationship
           SET emotional_anchors = COALESCE(emotional_anchors, '[]'::jsonb) || $1::jsonb
           WHERE user_id = $2`, [JSON.stringify(updates.addAnchor), userId]);
            }
            if (updates.addSummary) {
                await (0, db_1.query)(`UPDATE mentor_memory_relationship
           SET conversation_summaries = COALESCE(conversation_summaries, '[]'::jsonb) || $1::jsonb
           WHERE user_id = $2`, [JSON.stringify({ date: new Date(), ...updates.addSummary }), userId]);
            }
            if (updates.updateStage) {
                await (0, db_1.query)(`UPDATE mentor_memory_relationship
           SET relationship_stage = $1
           WHERE user_id = $2`, [updates.updateStage, userId]);
            }
            logger_1.default.info(`更新用户 ${userId} 的L6关系记忆`);
        }
        catch (error) {
            logger_1.default.error('更新L6关系记忆失败:', error);
            throw error;
        }
    }
    /**
     * 更新L4成长档案
     */
    async updateGrowthArchive(userId, updates) {
        try {
            if (updates.addMilestone) {
                console.log(`[memoryService.updateGrowthArchive] 开始添加里程碑, userId=${userId}`);
                console.log(`[memoryService.updateGrowthArchive] milestone=`, updates.addMilestone);
                const result = await (0, db_1.query)(`UPDATE mentor_memory_growth_archive
           SET milestones = COALESCE(milestones, '[]'::jsonb) || $1::jsonb
           WHERE user_id = $2
           RETURNING user_id`, [JSON.stringify({ date: new Date(), ...updates.addMilestone }), userId]);
                console.log(`[memoryService.updateGrowthArchive] UPDATE结果: rowCount=${result.rowCount}`);
                if (result.rowCount === 0) {
                    logger_1.default.warn(`用户 ${userId} 的L4成长档案不存在，无法更新里程碑`);
                    console.log(`[memoryService.updateGrowthArchive] ⚠️  UPDATE未匹配到任何行`);
                }
                else {
                    logger_1.default.info(`已添加里程碑到用户 ${userId} 的L4成长档案`);
                    console.log(`[memoryService.updateGrowthArchive] ✓ 里程碑已添加`);
                }
            }
            if (updates.addTaskReport) {
                await (0, db_1.query)(`UPDATE mentor_memory_growth_archive
           SET task_micro_reports = COALESCE(task_micro_reports, '[]'::jsonb) || $1::jsonb
           WHERE user_id = $2`, [JSON.stringify({ completionDate: new Date(), ...updates.addTaskReport }), userId]);
            }
            if (updates.addScoreSnapshot) {
                await (0, db_1.query)(`UPDATE mentor_memory_growth_archive
           SET score_snapshots = COALESCE(score_snapshots, '[]'::jsonb) || $1::jsonb
           WHERE user_id = $2`, [JSON.stringify({ date: new Date(), ...updates.addScoreSnapshot }), userId]);
            }
            logger_1.default.info(`更新用户 ${userId} 的L4成长档案完成`);
        }
        catch (error) {
            console.error('[memoryService.updateGrowthArchive] ❌ 错误:', error);
            logger_1.default.error('更新L4成长档案失败:', error);
            throw error;
        }
    }
    /**
     * 创建L2任务记忆
     */
    async createTaskContext(userId, taskId, initialData) {
        try {
            console.log(`[createTaskContext] 开始创建 userId=${userId}, taskId=${taskId}`);
            const result = await (0, db_1.query)(`INSERT INTO mentor_memory_task_context
         (user_id, task_id, task_phase, stuck_points, hints_given, emotion_timeline, mentor_assessment)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (user_id, task_id) DO NOTHING`, [
                userId,
                taskId,
                initialData.taskPhase || 'started',
                JSON.stringify(initialData.stuckPoints || []),
                initialData.hintsGiven || [],
                JSON.stringify(initialData.emotionTimeline || []),
                JSON.stringify(initialData.mentorAssessment || {})
            ]);
            console.log(`[createTaskContext] 结果: rowCount=${result.rowCount}`);
            logger_1.default.info(`创建用户 ${userId} 任务 ${taskId} 的L2任务记忆`);
        }
        catch (error) {
            console.error(`[createTaskContext] 失败:`, error);
            logger_1.default.error('创建L2任务记忆失败:', error);
            throw error;
        }
    }
    /**
     * 更新L2任务记忆
     */
    async updateTaskContext(userId, taskId, updates) {
        try {
            // 确保记录存在
            const existing = await this.loadTaskContext(userId, taskId);
            if (!existing) {
                await this.createTaskContext(userId, taskId, {
                    taskPhase: updates.taskPhase || 'in_progress'
                });
            }
            if (updates.taskPhase) {
                await (0, db_1.query)(`UPDATE mentor_memory_task_context SET task_phase = $1 WHERE user_id = $2 AND task_id = $3`, [updates.taskPhase, userId, taskId]);
            }
            if (updates.addStuckPoint) {
                console.log(`[updateTaskContext] 添加卡点: userId=${userId}, taskId=${taskId}, stuckPoint=${JSON.stringify(updates.addStuckPoint)}`);
                const result = await (0, db_1.query)(`UPDATE mentor_memory_task_context
           SET stuck_points = COALESCE(stuck_points, '[]'::jsonb) || $1::jsonb
           WHERE user_id = $2 AND task_id = $3`, [JSON.stringify({ timestamp: new Date(), ...updates.addStuckPoint }), userId, taskId]);
                console.log(`[updateTaskContext] addStuckPoint结果: rowCount=${result.rowCount}`);
            }
            if (updates.addHint) {
                await (0, db_1.query)(`UPDATE mentor_memory_task_context
           SET hints_given = array_append(COALESCE(hints_given, ARRAY[]::text[]), $1)
           WHERE user_id = $2 AND task_id = $3`, [updates.addHint, userId, taskId]);
            }
            if (updates.addEmotionEvent) {
                await (0, db_1.query)(`UPDATE mentor_memory_task_context
           SET emotion_timeline = COALESCE(emotion_timeline, '[]'::jsonb) || $1::jsonb
           WHERE user_id = $2 AND task_id = $3`, [JSON.stringify({ timestamp: new Date(), ...updates.addEmotionEvent }), userId, taskId]);
            }
            if (updates.mentorAssessment) {
                await (0, db_1.query)(`UPDATE mentor_memory_task_context
           SET mentor_assessment = $1
           WHERE user_id = $2 AND task_id = $3`, [JSON.stringify(updates.mentorAssessment), userId, taskId]);
            }
            logger_1.default.info(`更新用户 ${userId} 任务 ${taskId} 的L2任务记忆`);
        }
        catch (error) {
            logger_1.default.error('更新L2任务记忆失败:', error);
            throw error;
        }
    }
    /**
     * 更新L3近期摘要
     */
    async updateRecentSummary(userId, updates) {
        try {
            if (updates.incrementTasksCompleted) {
                await (0, db_1.query)(`UPDATE mentor_memory_recent_summary
           SET tasks_completed_30d = tasks_completed_30d + 1,
               last_active_at = NOW()
           WHERE user_id = $1`, [userId]);
            }
            if (updates.updateEmotionTrend) {
                await (0, db_1.query)(`UPDATE mentor_memory_recent_summary
           SET emotion_trend = $1
           WHERE user_id = $2`, [updates.updateEmotionTrend, userId]);
            }
            if (updates.updateEngagementScore !== undefined) {
                await (0, db_1.query)(`UPDATE mentor_memory_recent_summary
           SET engagement_score = $1
           WHERE user_id = $2`, [updates.updateEngagementScore, userId]);
            }
            if (updates.addStuckType) {
                // 将新的卡点类型添加到top_stuck_types数组（如果不存在）
                await (0, db_1.query)(`UPDATE mentor_memory_recent_summary
           SET top_stuck_types = CASE
             WHEN $1 = ANY(top_stuck_types) THEN top_stuck_types
             ELSE array_append(top_stuck_types, $1)
           END
           WHERE user_id = $2`, [updates.addStuckType, userId]);
            }
            logger_1.default.info(`更新用户 ${userId} 的L3近期摘要`);
        }
        catch (error) {
            logger_1.default.error('更新L3近期摘要失败:', error);
            throw error;
        }
    }
}
exports.MemoryService = MemoryService;
exports.memoryService = new MemoryService();
//# sourceMappingURL=memoryService.js.map