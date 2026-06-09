"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const logger_1 = __importDefault(require("../utils/logger"));
const vectorGenerationService_1 = __importDefault(require("./vectorGenerationService"));
const opcAnalysisService_1 = __importDefault(require("./opcAnalysisService"));
/**
 * OPC集成服务
 * 连接OPC v2测试系统和语义匹配系统
 *
 * 职责：
 * 1. OPC v2测试完成后，同步数据到student_capabilities
 * 2. 触发工作条件画像生成
 * 3. 触发向量生成
 * 4. 触发语义匹配
 */
class OPCIntegrationService {
    /**
     * OPC v2测试完成后的集成处理
     * 这个方法应该在opcV2AssessmentService.completeAssessment()之后调用
     */
    async handleOPCCompletion(assessmentId, studentId) {
        logger_1.default.info(`[OPC集成] 开始处理学生 ${studentId} 的OPC测试完成事件`);
        try {
            // 1. 获取OPC v2测试结果
            const opcResult = await this.getOPCResult(assessmentId);
            if (!opcResult) {
                throw new Error(`OPC测试结果不存在: ${assessmentId}`);
            }
            // 2. 同步到student_capabilities表
            await this.syncToStudentCapabilities(studentId, opcResult);
            // 3. 生成工作条件画像
            await this.generateWorkConditionProfile(studentId, opcResult);
            // 4. 触发向量生成
            await this.triggerVectorGeneration(studentId);
            // 5. 触发增量匹配（将学生匹配到所有开放任务）
            await this.triggerIncrementalMatching(studentId);
            logger_1.default.info(`[OPC集成] 完成学生 ${studentId} 的OPC集成处理`);
        }
        catch (error) {
            logger_1.default.error(`[OPC集成] 处理失败:`, error);
            throw error;
        }
    }
    /**
     * 获取OPC v2测试结果
     */
    async getOPCResult(assessmentId) {
        const client = await database_1.pool.connect();
        try {
            const result = await client.query(`SELECT
          r.*,
          a.self_defined_identity,
          a.self_defined_awesome
         FROM opc_v2_results r
         JOIN opc_v2_assessments a ON r.assessment_id = a.id
         WHERE r.assessment_id = $1`, [assessmentId]);
            return result.rows[0] || null;
        }
        finally {
            client.release();
        }
    }
    /**
     * 同步OPC v2结果到student_capabilities表
     *
     * 映射关系：
     * - info_processing_score → 影响学习能力和任务拆解能力
     * - creation_drive_score → 影响创造力和设计能力
     * - tool_learning_score → 影响技能学习速度
     * - task_execution_score → 影响任务执行质量
     * - collaboration_score → 影响团队协作能力
     * - risk_attitude_score → 影响接受挑战的意愿
     */
    async syncToStudentCapabilities(studentId, opcResult) {
        logger_1.default.info(`[OPC集成] 同步OPC结果到student_capabilities`);
        const client = await database_1.pool.connect();
        try {
            // 检查student_capabilities是否存在
            const existing = await client.query(`SELECT id FROM student_capabilities WHERE student_id = $1`, [studentId]);
            if (existing.rows.length === 0) {
                // 创建新记录
                await client.query(`INSERT INTO student_capabilities (
            student_id,
            skills,
            tasks_completed,
            avg_task_quality,
            avg_client_satisfaction,
            on_time_delivery_rate,
            avg_response_time_hours,
            quality_trend,
            growth_rate,
            skill_acquisition_rate,
            personality_style,
            profile_summary,
            created_at,
            updated_at,
            vector_updated_at
          ) VALUES ($1, $2, 0, 0, 0, 0, 24, 'stable', 0, 0, $3, $4, NOW(), NOW(), NOW())`, [
                    studentId,
                    JSON.stringify({}),
                    opcResult.personality_label,
                    this.generateProfileSummary(opcResult)
                ]);
                logger_1.default.info(`[OPC集成] 创建了新的student_capabilities记录`);
            }
            else {
                // 更新现有记录
                await client.query(`UPDATE student_capabilities SET
            personality_style = $1,
            profile_summary = $2,
            updated_at = NOW()
           WHERE student_id = $3`, [
                    opcResult.personality_label,
                    this.generateProfileSummary(opcResult),
                    studentId
                ]);
                logger_1.default.info(`[OPC集成] 更新了现有的student_capabilities记录`);
            }
        }
        finally {
            client.release();
        }
    }
    /**
     * 生成画像摘要文本
     */
    generateProfileSummary(opcResult) {
        const parts = [];
        parts.push(`人格类型：${opcResult.personality_label}`);
        // 信息处理
        if (opcResult.info_processing_score >= 60) {
            parts.push('整合型思维，善于把握全局');
        }
        else if (opcResult.info_processing_score <= 40) {
            parts.push('拆解型思维，善于细节执行');
        }
        // 创作驱动
        if (opcResult.creation_drive_score >= 60) {
            parts.push('视觉驱动，擅长创意设计');
        }
        else if (opcResult.creation_drive_score <= 40) {
            parts.push('逻辑驱动，擅长功能开发');
        }
        // 工具学习
        if (opcResult.tool_learning_score >= 60) {
            parts.push('探索型学习者');
        }
        else if (opcResult.tool_learning_score <= 40) {
            parts.push('手册型学习者');
        }
        // 任务执行
        if (opcResult.task_execution_score >= 60) {
            parts.push('规划型执行');
        }
        else if (opcResult.task_execution_score <= 40) {
            parts.push('迭代型执行');
        }
        // 协作倾向
        if (opcResult.collaboration_score >= 60) {
            parts.push('喜欢团队协作');
        }
        else if (opcResult.collaboration_score <= 40) {
            parts.push('偏好独立工作');
        }
        // 风险态度
        if (opcResult.risk_attitude_score >= 60) {
            parts.push('愿意接受挑战');
        }
        else if (opcResult.risk_attitude_score <= 40) {
            parts.push('偏好稳健任务');
        }
        return parts.join('，');
    }
    /**
     * 生成工作条件画像
     */
    async generateWorkConditionProfile(studentId, opcResult) {
        logger_1.default.info(`[OPC集成] 生成工作条件画像`);
        try {
            // 构建OPC测试结果对象
            const testResult = {
                studentId,
                answers: {}, // 原始答案（如果需要的话）
                scores: {
                    openness: opcResult.info_processing_score,
                    persistence: opcResult.task_execution_score,
                    creativity: opcResult.creation_drive_score,
                    informationProcessing: opcResult.info_processing_score,
                    creationDrive: opcResult.creation_drive_score,
                    learningStyle: opcResult.tool_learning_score,
                    executionRhythm: opcResult.task_execution_score,
                    collaborationStyle: opcResult.collaboration_score,
                    riskAttitude: opcResult.risk_attitude_score
                },
                personalityTag: opcResult.personality_label
            };
            // 调用opcAnalysisService生成工作条件画像
            const workConditionProfile = await opcAnalysisService_1.default.generateWorkConditionProfile(testResult);
            // 保存工作条件画像（会自动生成向量）
            await opcAnalysisService_1.default.saveWorkConditionProfile(workConditionProfile);
            logger_1.default.info(`[OPC集成] 工作条件画像生成完成`);
        }
        catch (error) {
            logger_1.default.error(`[OPC集成] 生成工作条件画像失败:`, error);
            // 不抛出错误，允许流程继续
        }
    }
    /**
     * 触发向量生成
     */
    async triggerVectorGeneration(studentId) {
        logger_1.default.info(`[OPC集成] 触发向量生成`);
        try {
            await vectorGenerationService_1.default.updateStudentEmbedding(studentId);
            logger_1.default.info(`[OPC集成] 向量生成完成`);
        }
        catch (error) {
            logger_1.default.error(`[OPC集成] 向量生成失败:`, error);
            // 不抛出错误，允许流程继续
        }
    }
    /**
     * 触发增量匹配
     * 将新学生匹配到所有开放任务
     */
    async triggerIncrementalMatching(studentId) {
        logger_1.default.info(`[OPC集成] 触发增量匹配`);
        try {
            // 检查matchingScheduler是否存在
            const matchingScheduler = require('./matchingScheduler').default;
            if (matchingScheduler && matchingScheduler.matchNewStudentToOpenTasks) {
                // 异步执行，不阻塞主流程
                matchingScheduler.matchNewStudentToOpenTasks(studentId).catch((err) => {
                    logger_1.default.error(`[OPC集成] 增量匹配失败:`, err);
                });
                logger_1.default.info(`[OPC集成] 增量匹配已触发`);
            }
            else {
                logger_1.default.warn(`[OPC集成] matchingScheduler不存在，跳过增量匹配`);
            }
        }
        catch (error) {
            logger_1.default.error(`[OPC集成] 触发增量匹配失败:`, error);
            // 不抛出错误，允许流程继续
        }
    }
    /**
     * 批量同步所有已完成OPC测试的学生
     * 用于修复历史数据
     */
    async syncAllCompletedOPC() {
        logger_1.default.info(`[OPC集成] 开始批量同步所有已完成OPC测试的学生`);
        const client = await database_1.pool.connect();
        try {
            // 获取所有已完成的OPC测试
            const result = await client.query(`SELECT r.assessment_id, r.student_id
         FROM opc_v2_results r
         WHERE r.student_id IS NOT NULL
         ORDER BY r.created_at DESC`);
            logger_1.default.info(`[OPC集成] 找到 ${result.rows.length} 个已完成的OPC测试`);
            for (const row of result.rows) {
                try {
                    await this.handleOPCCompletion(row.assessment_id, row.student_id);
                    logger_1.default.info(`[OPC集成] 已同步学生 ${row.student_id}`);
                    // 避免API限流
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                catch (error) {
                    logger_1.default.error(`[OPC集成] 同步学生 ${row.student_id} 失败:`, error);
                    // 继续处理下一个
                }
            }
            logger_1.default.info(`[OPC集成] 批量同步完成`);
        }
        finally {
            client.release();
        }
    }
    /**
     * 验证OPC集成是否正常工作
     */
    async verifyIntegration(studentId) {
        const client = await database_1.pool.connect();
        try {
            // 检查OPC结果
            const opcResult = await client.query(`SELECT id FROM opc_v2_results WHERE student_id = $1`, [studentId]);
            // 检查能力画像
            const abilityProfile = await client.query(`SELECT id FROM user_ability_profiles WHERE user_id = $1 AND is_current = true`, [studentId]);
            // 检查学生能力
            const studentCapability = await client.query(`SELECT id, combined_vector FROM student_capabilities WHERE student_id = $1`, [studentId]);
            // 检查工作条件画像
            const workConditionProfile = await client.query(`SELECT id FROM student_work_condition_profiles WHERE student_id = $1`, [studentId]);
            return {
                opcResult: opcResult.rows.length > 0,
                abilityProfile: abilityProfile.rows.length > 0,
                studentCapability: studentCapability.rows.length > 0,
                workConditionProfile: workConditionProfile.rows.length > 0,
                vector: studentCapability.rows.length > 0 && studentCapability.rows[0].combined_vector !== null
            };
        }
        finally {
            client.release();
        }
    }
}
exports.default = new OPCIntegrationService();
//# sourceMappingURL=opcIntegrationService.js.map