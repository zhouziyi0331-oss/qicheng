"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TalentTagInferenceService = void 0;
const db_1 = require("../utils/db");
const logger_1 = __importDefault(require("../utils/logger"));
class TalentTagInferenceService {
    /**
     * 从OPC测评结果推断天赋标签
     */
    static async inferFromOPC(studentId, opcScores) {
        const client = await db_1.pool.connect();
        try {
            logger_1.default.info(`[TalentInference] 开始为学生 ${studentId} 推断天赋标签`);
            await client.query('BEGIN');
            // 1. 信息处理维度 → 思维方式
            await this.inferFromDimension(client, studentId, 'info_processing', opcScores.info_processing_tendency, opcScores.info_processing_score);
            // 2. 创作驱动维度
            await this.inferFromDimension(client, studentId, 'creation_drive', opcScores.creation_drive_tendency, opcScores.creation_drive_score);
            // 3. 工具学习维度 → 学习特质
            await this.inferFromDimension(client, studentId, 'tool_learning', opcScores.tool_learning_tendency, opcScores.tool_learning_score);
            // 4. 任务执行维度 → 做事风格
            await this.inferFromDimension(client, studentId, 'task_execution', opcScores.task_execution_tendency, opcScores.task_execution_score);
            // 5. 协作倾向维度
            await this.inferFromDimension(client, studentId, 'collaboration', opcScores.collaboration_tendency, opcScores.collaboration_score);
            // 6. 风险态度维度
            await this.inferFromDimension(client, studentId, 'risk_attitude', opcScores.risk_attitude_tendency, opcScores.risk_attitude_score);
            await client.query('COMMIT');
            // 查询推断出的标签
            const result = await client.query(`SELECT tt.tag_name, stt.confidence, stt.strength
         FROM student_talent_tags stt
         JOIN talent_tags tt ON stt.tag_id = tt.id
         WHERE stt.student_id = $1 AND stt.source = 'opc_inferred'`, [studentId]);
            logger_1.default.info(`[TalentInference] 为学生 ${studentId} 推断了 ${result.rows.length} 个天赋标签`);
            result.rows.forEach(row => {
                logger_1.default.info(`  - ${row.tag_name} (置信度: ${row.confidence}, 强度: ${row.strength})`);
            });
        }
        catch (error) {
            await client.query('ROLLBACK');
            logger_1.default.error('[TalentInference] 推断失败:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * 从单个维度推断标签
     */
    static async inferFromDimension(client, studentId, dimension, tendency, score) {
        // 查找匹配的标签
        const result = await client.query(`SELECT id, tag_name 
       FROM talent_tags 
       WHERE opc_dimension = $1 
       AND opc_tendency = $2
       AND (opc_score_range->>'min')::int <= $3
       AND (opc_score_range->>'max')::int >= $3`, [dimension, tendency, score]);
        // 计算置信度：分数越极端，置信度越高
        let confidence = 0.6; // 基础置信度
        if (score >= 70 || score <= 30) {
            confidence = 0.8; // 高置信度
        }
        else if (score >= 80 || score <= 20) {
            confidence = 0.9; // 很高置信度
        }
        // 添加标签
        for (const tag of result.rows) {
            await client.query(`INSERT INTO student_talent_tags 
         (student_id, tag_id, strength, confidence, source, source_details, first_observed_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (student_id, tag_id) 
         DO UPDATE SET 
           confidence = GREATEST(student_talent_tags.confidence, EXCLUDED.confidence),
           updated_at = NOW()`, [
                studentId,
                tag.id,
                'emerging', // 初始强度
                confidence,
                'opc_inferred',
                JSON.stringify({
                    dimension,
                    tendency,
                    score,
                    inferred_at: new Date().toISOString()
                })
            ]);
            logger_1.default.info(`[TalentInference] 添加标签: ${tag.tag_name} (${dimension}, 置信度: ${confidence})`);
        }
    }
    /**
     * 从任务表现推断天赋标签
     */
    static async inferFromTaskPerformance(studentId, taskId, performanceData) {
        const client = await db_1.pool.connect();
        try {
            logger_1.default.info(`[TalentInference] 从任务 ${taskId} 推断学生 ${studentId} 的天赋`);
            // 记录任务表现
            await client.query(`INSERT INTO task_performance_records 
         (task_id, student_id, response_time_minutes, requirement_clarifications, 
          proactive_reports, revision_count, delivery_status, delivery_completeness,
          problem_handling, optimization_awareness, enterprise_rating, enterprise_feedback)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`, [
                taskId, studentId,
                performanceData.response_time_minutes,
                performanceData.requirement_clarifications,
                performanceData.proactive_reports,
                performanceData.revision_count,
                performanceData.delivery_status,
                performanceData.delivery_completeness,
                performanceData.problem_handling,
                performanceData.optimization_awareness,
                performanceData.enterprise_rating,
                performanceData.enterprise_feedback
            ]);
            // 基于表现推断标签
            const inferredTags = [];
            // 1. 响应速度 → 行动导向
            if (performanceData.response_time_minutes && performanceData.response_time_minutes <= 60) {
                inferredTags.push({
                    tagName: '行动导向',
                    confidence: 0.7,
                    reason: `响应时间${performanceData.response_time_minutes}分钟，非常快速`
                });
            }
            // 2. 需求确认次数 → 理解能力
            if (performanceData.requirement_clarifications !== undefined) {
                if (performanceData.requirement_clarifications <= 1) {
                    inferredTags.push({
                        tagName: '清晰表达',
                        confidence: 0.7,
                        reason: '需求确认次数少，理解准确'
                    });
                }
            }
            // 3. 主动汇报 → 主动性
            if (performanceData.proactive_reports && performanceData.proactive_reports >= 2) {
                inferredTags.push({
                    tagName: '自驱力强',
                    confidence: 0.8,
                    reason: `主动汇报${performanceData.proactive_reports}次`
                });
            }
            // 4. 返工次数 → 质量控制
            if (performanceData.revision_count !== undefined && performanceData.revision_count === 0) {
                inferredTags.push({
                    tagName: '细节敏感',
                    confidence: 0.7,
                    reason: '零返工，质量控制好'
                });
            }
            // 5. 交付状态 → 责任心
            if (performanceData.delivery_status === 'on_time' || performanceData.delivery_status === 'early') {
                inferredTags.push({
                    tagName: '责任心强',
                    confidence: 0.75,
                    reason: `${performanceData.delivery_status === 'early' ? '提前' : '准时'}交付`
                });
            }
            // 6. 交付完整度 → 结果导向
            if (performanceData.delivery_completeness === 'exceeded') {
                inferredTags.push({
                    tagName: '追求卓越',
                    confidence: 0.85,
                    reason: '超出预期的交付质量'
                });
            }
            // 7. 问题处理 → 问题解决能力
            if (performanceData.problem_handling === 'proactive_solved') {
                inferredTags.push({
                    tagName: '主动优化',
                    confidence: 0.8,
                    reason: '主动发现并解决问题'
                });
            }
            // 8. 优化意识 → 创新思维
            if (performanceData.optimization_awareness === 'proactive_suggestions') {
                inferredTags.push({
                    tagName: '主动优化',
                    confidence: 0.8,
                    reason: '主动提出优化建议'
                });
            }
            // 添加推断出的标签
            for (const inferred of inferredTags) {
                const tagResult = await client.query('SELECT id FROM talent_tags WHERE tag_name = $1', [inferred.tagName]);
                if (tagResult.rows.length > 0) {
                    const tagId = tagResult.rows[0].id;
                    // 检查是否已存在
                    const existingResult = await client.query('SELECT id, verified_count, confidence FROM student_talent_tags WHERE student_id = $1 AND tag_id = $2', [studentId, tagId]);
                    if (existingResult.rows.length > 0) {
                        // 更新：增加验证次数，提升置信度和强度
                        const existing = existingResult.rows[0];
                        const newVerifiedCount = existing.verified_count + 1;
                        const newConfidence = Math.min(existing.confidence + 0.05, 0.95);
                        let newStrength = 'emerging';
                        if (newVerifiedCount >= 10)
                            newStrength = 'core';
                        else if (newVerifiedCount >= 5)
                            newStrength = 'prominent';
                        else if (newVerifiedCount >= 3)
                            newStrength = 'clear';
                        await client.query(`UPDATE student_talent_tags 
               SET verified_count = $1, 
                   confidence = $2, 
                   strength = $3,
                   last_verified_at = NOW(),
                   updated_at = NOW()
               WHERE id = $4`, [newVerifiedCount, newConfidence, newStrength, existing.id]);
                        logger_1.default.info(`[TalentInference] 更新标签: ${inferred.tagName} (验证${newVerifiedCount}次, 置信度${newConfidence}, 强度${newStrength})`);
                    }
                    else {
                        // 新增
                        await client.query(`INSERT INTO student_talent_tags 
               (student_id, tag_id, strength, confidence, source, source_details, verified_count, last_verified_at, first_observed_at)
               VALUES ($1, $2, 'emerging', $3, 'task_inferred', $4, 1, NOW(), NOW())`, [
                            studentId,
                            tagId,
                            inferred.confidence,
                            JSON.stringify({
                                task_id: taskId,
                                reason: inferred.reason,
                                inferred_at: new Date().toISOString()
                            })
                        ]);
                        logger_1.default.info(`[TalentInference] 新增标签: ${inferred.tagName} (${inferred.reason})`);
                    }
                }
            }
            logger_1.default.info(`[TalentInference] 从任务推断完成，推断出 ${inferredTags.length} 个标签`);
        }
        catch (error) {
            logger_1.default.error('[TalentInference] 从任务推断失败:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
}
exports.TalentTagInferenceService = TalentTagInferenceService;
//# sourceMappingURL=talentTagInferenceService.js.map