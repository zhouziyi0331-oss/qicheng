"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../utils/db");
const logger_1 = __importDefault(require("../utils/logger"));
class MentorContextEnhancer {
    /**
     * T-02: 获取真实的同类卡点案例（增强版）
     *
     * 优先从案例库获取，如果案例库为空则回退到mentor_growth_observations
     *
     * @param studentId 当前学生ID
     * @param taskId 当前任务ID
     * @returns 真实案例或null（查不到不编造）
     */
    async getRealStuckCase(studentId, taskId) {
        try {
            // 1. 获取当前任务的赛道
            const taskInfo = await (0, db_1.queryOne)(`SELECT track
         FROM tasks
         WHERE id = $1`, [taskId]);
            if (!taskInfo) {
                logger_1.default.warn(`Task ${taskId} not found for stuck case query`);
                return null;
            }
            // 2. 优先从案例库查询（Phase 2.4新增）
            const caseLibraryCases = await (0, db_1.query)(`SELECT title, situation, solution, time_to_resolve, difficulty
         FROM case_library
         WHERE case_type = 'stuck'
           AND category = $1
           AND solution IS NOT NULL
         ORDER BY helpfulness DESC, RANDOM()
         LIMIT 1`, [taskInfo.track]);
            if (caseLibraryCases.length > 0) {
                const caseData = caseLibraryCases[0];
                logger_1.default.info('Found case from case library', {
                    track: taskInfo.track,
                    title: caseData.title
                });
                return {
                    observation_content: `${caseData.situation} 解决方式：${caseData.solution}`,
                    context: {
                        source: 'case_library',
                        title: caseData.title,
                        time_to_resolve: caseData.time_to_resolve,
                        difficulty: caseData.difficulty
                    }
                };
            }
            // 3. 回退到原有的mentor_growth_observations查询
            const cases = await (0, db_1.query)(`SELECT
           mgo.observation_content,
           mgo.context
         FROM mentor_growth_observations mgo
         JOIN task_assignments ta ON mgo.task_id = ta.id
         JOIN tasks t ON ta.task_id = t.id
         WHERE mgo.observation_type = 'stuck'
           AND t.track = $1
           AND mgo.student_id != $2
           AND mgo.observation_content IS NOT NULL
           AND mgo.observation_content != ''
         ORDER BY RANDOM()
         LIMIT 1`, [taskInfo.track, studentId]);
            if (cases.length === 0) {
                logger_1.default.info(`No real stuck case found for track ${taskInfo.track}`);
                return null;
            }
            const realCase = cases[0];
            logger_1.default.info('Found real stuck case from observations', {
                track: taskInfo.track,
                hasContext: !!realCase.context
            });
            return {
                observation_content: realCase.observation_content,
                context: realCase.context
            };
        }
        catch (error) {
            logger_1.default.error('Failed to get real stuck case:', error);
            return null;
        }
    }
    /**
     * T-04: 获取学生在该任务的最近一条消息
     *
     * @param taskId 任务ID
     * @returns 最近消息或null
     */
    async getLastStudentMessage(taskId) {
        try {
            const messages = await (0, db_1.query)(`SELECT mm.content, mm.created_at
         FROM mentor_messages mm
         JOIN mentor_sessions ms ON mm.session_id = ms.id
         WHERE ms.task_id = $1
           AND mm.role = 'student'
           AND mm.content IS NOT NULL
           AND mm.content != ''
         ORDER BY mm.created_at DESC
         LIMIT 1`, [taskId]);
            if (messages.length === 0) {
                logger_1.default.info(`No student message found for task ${taskId}`);
                return null;
            }
            const lastMessage = messages[0];
            logger_1.default.info('Found last student message', {
                taskId,
                messageLength: lastMessage.content.length,
                timeSince: this.calculateTimeSince(lastMessage.created_at)
            });
            return {
                content: lastMessage.content,
                created_at: lastMessage.created_at
            };
        }
        catch (error) {
            logger_1.default.error('Failed to get last student message:', error);
            return null;
        }
    }
    /**
     * T-05: 获取学生成长对比数据（入驻时vs现在）
     *
     * @param studentId 学生ID
     * @param assignmentId 任务分配ID (task_assignments.id)
     * @returns 成长对比数据
     */
    async getGrowthComparison(studentId, assignmentId) {
        try {
            // 1. 查入驻时的能力画像（从最早的画像）
            const initialProfile = await (0, db_1.queryOne)(`SELECT
           information_processing,
           creative_drive,
           tool_learning,
           task_execution,
           collaboration_tendency,
           profile_summary
         FROM user_ability_profiles
         WHERE user_id = $1
           AND is_current = false
         ORDER BY created_at ASC
         LIMIT 1`, [studentId]);
            // 从profile_summary中提取能力缺口关键词
            const initialGaps = [];
            if (initialProfile?.profile_summary) {
                // 简单提取：查找"需要提升"、"缺乏"、"较弱"等关键词后的内容
                const summary = initialProfile.profile_summary;
                if (summary.includes('需要提升'))
                    initialGaps.push('需要提升的能力');
                if (summary.includes('缺乏'))
                    initialGaps.push('缺乏经验的领域');
                if (initialProfile.information_processing < 60)
                    initialGaps.push('信息处理能力');
                if (initialProfile.creative_drive < 60)
                    initialGaps.push('创造力驱动');
                if (initialProfile.tool_learning < 60)
                    initialGaps.push('工具学习能力');
                if (initialProfile.task_execution < 60)
                    initialGaps.push('任务执行能力');
            }
            // 2. 查本单展示的skills（从成长观察）
            const observations = await (0, db_1.query)(`SELECT skills_demonstrated, observation_content
         FROM mentor_growth_observations
         WHERE task_id = $1
           AND observation_type IN ('skill_shown', 'breakthrough')
           AND skills_demonstrated IS NOT NULL`, [assignmentId]);
            const currentSkills = observations.flatMap(obs => Array.isArray(obs.skills_demonstrated) ? obs.skills_demonstrated : []);
            // 3. 查当前能力画像
            const currentProfile = await (0, db_1.queryOne)(`SELECT
           information_processing,
           creative_drive,
           tool_learning,
           task_execution
         FROM user_ability_profiles
         WHERE user_id = $1
           AND is_current = true
         LIMIT 1`, [studentId]);
            // 4. 对比找出进步的维度
            const gapsClosed = [];
            if (initialProfile && currentProfile) {
                if (initialProfile.information_processing < 60 && currentProfile.information_processing >= 60) {
                    gapsClosed.push('信息处理能力有明显提升');
                }
                if (initialProfile.creative_drive < 60 && currentProfile.creative_drive >= 60) {
                    gapsClosed.push('创造力驱动有明显提升');
                }
                if (initialProfile.tool_learning < 60 && currentProfile.tool_learning >= 60) {
                    gapsClosed.push('工具学习能力有明显提升');
                }
                if (initialProfile.task_execution < 60 && currentProfile.task_execution >= 60) {
                    gapsClosed.push('任务执行能力有明显提升');
                }
            }
            // 5. 查客户评价（额外证据）
            const assignmentInfo = await (0, db_1.queryOne)(`SELECT
           tr.rating,
           tr.comment as review_comment
         FROM task_assignments ta
         LEFT JOIN task_reviews tr ON ta.task_id = tr.task_id AND ta.student_id::text = tr.reviewee_id
         WHERE ta.id = $1`, [assignmentId]);
            const result = {
                initial_gaps: initialGaps,
                current_skills: currentSkills,
                gaps_closed: gapsClosed
            };
            if (assignmentInfo?.rating) {
                result.client_feedback = {
                    rating: assignmentInfo.rating,
                    comment: assignmentInfo.review_comment || ''
                };
            }
            logger_1.default.info('Growth comparison generated', {
                studentId,
                assignmentId,
                initialGapsCount: initialGaps.length,
                currentSkillsCount: currentSkills.length,
                gapsClosedCount: gapsClosed.length
            });
            return result;
        }
        catch (error) {
            logger_1.default.error('Failed to get growth comparison:', error);
            // 返回空对象，不抛出异常
            return {
                initial_gaps: [],
                current_skills: [],
                gaps_closed: []
            };
        }
    }
    /**
     * 计算时间间隔（用于轻推消息）
     */
    calculateTimeSince(timestamp) {
        const now = new Date();
        const diffMs = now.getTime() - new Date(timestamp).getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays > 0) {
            return `${diffDays}天前`;
        }
        else if (diffHours > 0) {
            return `${diffHours}小时前`;
        }
        else {
            return '刚才';
        }
    }
    /**
     * 获取时间间隔的小时数（数字）
     */
    getHoursSince(timestamp) {
        const now = new Date();
        const diffMs = now.getTime() - new Date(timestamp).getTime();
        return Math.floor(diffMs / (1000 * 60 * 60));
    }
}
exports.default = new MentorContextEnhancer();
//# sourceMappingURL=mentorContextEnhancer.js.map