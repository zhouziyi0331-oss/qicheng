"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../utils/db");
const logger_1 = __importDefault(require("../utils/logger"));
class TeacherObservationService {
    /**
     * 记录学生行为事件
     */
    async recordStudentBehavior(observation) {
        try {
            await (0, db_1.query)(`INSERT INTO teacher_observations (
          student_id, behavior_type, context, emotional_state, work_pattern
        ) VALUES ($1, $2, $3, $4, $5)`, [
                observation.studentId,
                observation.behaviorType,
                JSON.stringify(observation.context),
                observation.emotionalState ? JSON.stringify(observation.emotionalState) : null,
                observation.workPattern ? JSON.stringify(observation.workPattern) : null
            ]);
            logger_1.default.info(`Recorded student behavior: ${observation.behaviorType} for student ${observation.studentId}`);
            // 异步分析行为模式
            this.analyzeAndUpdatePatterns(observation.studentId).catch(err => {
                logger_1.default.error('Failed to analyze patterns:', err);
            });
        }
        catch (error) {
            logger_1.default.error('Failed to record student behavior:', error);
            throw error;
        }
    }
    /**
     * 记录企业反馈观察
     */
    async recordCompanyFeedback(observation) {
        try {
            await (0, db_1.query)(`INSERT INTO teacher_company_observations (
          company_id, student_id, task_id, feedback_type, original_words, tone, preferences
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
                observation.companyId,
                observation.studentId,
                observation.taskId,
                observation.feedbackType,
                observation.originalWords,
                observation.tone || null,
                observation.preferences ? JSON.stringify(observation.preferences) : null
            ]);
            logger_1.default.info(`Recorded company feedback: ${observation.feedbackType} for student ${observation.studentId}`);
        }
        catch (error) {
            logger_1.default.error('Failed to record company feedback:', error);
            throw error;
        }
    }
    /**
     * 获取学生最近的行为记录
     */
    async getRecentBehaviors(studentId, limit = 20) {
        try {
            const behaviors = await (0, db_1.query)(`SELECT * FROM teacher_observations
         WHERE student_id = $1
         ORDER BY timestamp DESC
         LIMIT $2`, [studentId, limit]);
            return behaviors;
        }
        catch (error) {
            logger_1.default.error('Failed to get recent behaviors:', error);
            return [];
        }
    }
    /**
     * 获取学生在特定任务中的行为
     */
    async getTaskBehaviors(studentId, taskId) {
        try {
            const behaviors = await (0, db_1.query)(`SELECT * FROM teacher_observations
         WHERE student_id = $1
           AND context->>'taskId' = $2
         ORDER BY timestamp ASC`, [studentId, taskId]);
            return behaviors;
        }
        catch (error) {
            logger_1.default.error('Failed to get task behaviors:', error);
            return [];
        }
    }
    /**
     * 分析并更新学生的行为模式
     */
    async analyzeAndUpdatePatterns(studentId) {
        try {
            // 获取最近30天的行为
            const behaviors = await (0, db_1.query)(`SELECT * FROM teacher_observations
         WHERE student_id = $1
           AND timestamp > NOW() - INTERVAL '30 days'
         ORDER BY timestamp DESC`, [studentId]);
            if (behaviors.length < 5) {
                // 数据太少，无法分析
                return;
            }
            // 分析工作时段
            const workHours = behaviors.map(b => new Date(b.timestamp).getHours());
            const avgWorkHour = workHours.reduce((a, b) => a + b, 0) / workHours.length;
            const workTimeOfDay = avgWorkHour < 12 ? 'morning' :
                avgWorkHour < 18 ? 'afternoon' : 'evening';
            // 分析求助频率
            const helpRequests = behaviors.filter(b => b.behavior_type === 'seek_help');
            const helpFrequency = helpRequests.length / behaviors.length;
            // 推断情绪状态
            const frustration = Math.min(helpFrequency * 2, 1); // 求助越频繁，挫折感越高
            const engagement = behaviors.length / 30; // 活跃度
            // 识别关键时刻
            await this.identifyKeyMoments(studentId, behaviors);
            logger_1.default.info(`Analyzed patterns for student ${studentId}: workTime=${workTimeOfDay}, frustration=${frustration.toFixed(2)}`);
        }
        catch (error) {
            logger_1.default.error('Failed to analyze patterns:', error);
        }
    }
    /**
     * 识别关键时刻
     */
    async identifyKeyMoments(studentId, behaviors) {
        try {
            // 检查是否有"第一次求助"
            const firstHelpRequest = behaviors
                .filter(b => b.behavior_type === 'seek_help')
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())[0];
            if (firstHelpRequest) {
                const existing = await (0, db_1.queryOne)(`SELECT id FROM teacher_key_moments
           WHERE student_id = $1 AND event_type = 'first_help_request'`, [studentId]);
                if (!existing) {
                    await (0, db_1.query)(`INSERT INTO teacher_key_moments (
              student_id, event_type, event_description, teacher_insight, importance, timestamp
            ) VALUES ($1, $2, $3, $4, $5, $6)`, [
                        studentId,
                        'first_help_request',
                        '学生第一次主动求助',
                        '这是一个重要的转折点，说明学生开始信任老师，愿意暴露自己的困难',
                        8,
                        firstHelpRequest.timestamp
                    ]);
                    logger_1.default.info(`Identified key moment: first_help_request for student ${studentId}`);
                }
            }
            // 检查是否有"连续3次通过"
            const recentSubmissions = behaviors
                .filter(b => b.behavior_type === 'submit_work')
                .slice(0, 3);
            if (recentSubmissions.length === 3) {
                // 这里需要检查这3次是否都通过了，需要关联订单数据
                // 简化处理：如果连续3次提交，认为是好的迹象
                const existing = await (0, db_1.queryOne)(`SELECT id FROM teacher_key_moments
           WHERE student_id = $1
             AND event_type = 'consistent_delivery'
             AND timestamp > NOW() - INTERVAL '7 days'`, [studentId]);
                if (!existing) {
                    await (0, db_1.query)(`INSERT INTO teacher_key_moments (
              student_id, event_type, event_description, teacher_insight, importance
            ) VALUES ($1, $2, $3, $4, $5)`, [
                        studentId,
                        'consistent_delivery',
                        '学生连续稳定交付',
                        '学生已经找到了自己的工作节奏，进入稳定期',
                        7
                    ]);
                    logger_1.default.info(`Identified key moment: consistent_delivery for student ${studentId}`);
                }
            }
        }
        catch (error) {
            logger_1.default.error('Failed to identify key moments:', error);
        }
    }
    /**
     * 获取学生的关键时刻
     */
    async getKeyMoments(studentId, limit = 10) {
        try {
            const moments = await (0, db_1.query)(`SELECT * FROM teacher_key_moments
         WHERE student_id = $1
         ORDER BY importance DESC, timestamp DESC
         LIMIT $2`, [studentId, limit]);
            return moments;
        }
        catch (error) {
            logger_1.default.error('Failed to get key moments:', error);
            return [];
        }
    }
}
exports.default = new TeacherObservationService();
//# sourceMappingURL=teacherObservationService.js.map