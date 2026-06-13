"use strict";
/**
 * VerifyService - 验证服务（状态机管理）
 *
 * 核心功能：
 * 1. 创建验证会话
 * 2. 管理两轮验证流程
 * 3. 状态机转换
 * 4. 调用AI判断服务
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyService = void 0;
const db_1 = require("../../utils/db");
const logger_1 = __importDefault(require("../../utils/logger"));
const aiJudgeService_1 = require("./aiJudgeService");
class VerifyService {
    /**
     * 创建验证会话
     */
    static async createSession(studentId, companyId, matchId) {
        return (0, db_1.withTransaction)(async (client) => {
            // 检查是否已有进行中的会话
            const existingSession = await client.query(`SELECT id FROM verify_sessions
         WHERE student_id = $1 AND company_id = $2
           AND status NOT IN ('failed', 'paid_unlocked')
           AND expires_at > NOW()
           AND deleted_at IS NULL`, [studentId, companyId]);
            if (existingSession.rows.length > 0) {
                throw new Error('已有进行中的验证会话');
            }
            // 获取第一轮题目（优先商家专属题，否则通用题）
            const questionResult = await client.query(`SELECT id, question_text, judge_criteria
         FROM verify_questions
         WHERE (company_id = $1 OR company_id IS NULL)
           AND round = 'round1'
           AND is_active = true
           AND deleted_at IS NULL
         ORDER BY company_id NULLS LAST
         LIMIT 1`, [companyId]);
            if (questionResult.rows.length === 0) {
                throw new Error('未找到验证题目');
            }
            const question = questionResult.rows[0];
            // 创建会话
            const sessionResult = await client.query(`INSERT INTO verify_sessions
         (student_id, company_id, match_id, status, round1_question_id, expires_at)
         VALUES ($1, $2, $3, 'round1_pending', $4, NOW() + INTERVAL '24 hours')
         RETURNING id`, [studentId, companyId, matchId, question.id]);
            const sessionId = sessionResult.rows[0].id;
            // 更新匹配记录状态
            await client.query(`UPDATE student_company_matches
         SET status = 'verifying', updated_at = NOW()
         WHERE id = $1`, [matchId]);
            logger_1.default.info(`[VerifyService] 创建验证会话: ${sessionId}`);
            return {
                sessionId,
                round1Question: {
                    id: question.id,
                    question_text: question.question_text,
                    judge_criteria: question.judge_criteria
                }
            };
        });
    }
    /**
     * 提交第一轮回答
     */
    static async submitRound1Answer(sessionId, answer) {
        return (0, db_1.withTransaction)(async (client) => {
            // 获取会话信息
            const sessionResult = await client.query(`SELECT vs.*, vq.question_text, vq.judge_criteria,
                t.description as need_description
         FROM verify_sessions vs
         JOIN verify_questions vq ON vs.round1_question_id = vq.id
         JOIN student_company_matches scm ON vs.match_id = scm.id
         JOIN tasks t ON t.company_id = scm.company_id
         WHERE vs.id = $1 AND vs.deleted_at IS NULL
         LIMIT 1`, [sessionId]);
            if (sessionResult.rows.length === 0) {
                throw new Error('验证会话不存在');
            }
            const session = sessionResult.rows[0];
            if (session.status !== 'round1_pending') {
                throw new Error(`当前状态不允许提交: ${session.status}`);
            }
            if (new Date(session.expires_at) < new Date()) {
                throw new Error('验证会话已过期');
            }
            // 更新状态为judging
            await client.query(`UPDATE verify_sessions
         SET status = 'round1_judging', round1_answer = $2, updated_at = NOW()
         WHERE id = $1`, [sessionId, answer]);
            // 异步调用AI判断（不阻塞）
            this.processRound1Judge(sessionId, session, answer).catch(err => {
                logger_1.default.error('[VerifyService] AI判断异步处理失败:', err);
            });
            return { status: 'round1_judging' };
        });
    }
    /**
     * 处理第一轮AI判断（异步）
     */
    static async processRound1Judge(sessionId, session, answer) {
        try {
            // 调用AI判断
            const judgeResult = await aiJudgeService_1.AIJudgeService.judgeRound1({
                sessionId,
                needDescription: session.need_description,
                questionText: session.question_text,
                criteria: session.judge_criteria,
                studentAnswer: answer
            });
            // 更新会话状态
            await (0, db_1.withTransaction)(async (client) => {
                if (judgeResult.result === 'pass') {
                    // 通过，进入第二轮
                    const round2Question = await client.query(`SELECT id, question_text, judge_criteria
             FROM verify_questions
             WHERE (company_id = $1 OR company_id IS NULL)
               AND round = 'round2'
               AND is_active = true
               AND deleted_at IS NULL
             ORDER BY company_id NULLS LAST
             LIMIT 1`, [session.company_id]);
                    await client.query(`UPDATE verify_sessions
             SET status = 'round1_pass',
                 round1_result = 'pass',
                 round1_ai_reason = $2,
                 round2_question_id = $3,
                 updated_at = NOW()
             WHERE id = $1`, [sessionId, judgeResult.reason, round2Question.rows[0]?.id]);
                }
                else if (judgeResult.result === 'retry') {
                    // 需要重试
                    const retryCount = session.round1_retry_count + 1;
                    if (retryCount >= 2) {
                        // 超过重试次数，判定为失败
                        await client.query(`UPDATE verify_sessions
               SET status = 'round1_fail',
                   round1_result = 'fail',
                   round1_ai_reason = '重试次数已用完',
                   completed_at = NOW(),
                   updated_at = NOW()
               WHERE id = $1`, [sessionId]);
                    }
                    else {
                        // 允许重试
                        await client.query(`UPDATE verify_sessions
               SET status = 'round1_retry',
                   round1_result = 'retry',
                   round1_retry_count = $2,
                   round1_ai_reason = $3,
                   round1_retry_prompt = $4,
                   updated_at = NOW()
               WHERE id = $1`, [sessionId, retryCount, judgeResult.reason, judgeResult.retry_prompt]);
                    }
                }
                else {
                    // 失败
                    await client.query(`UPDATE verify_sessions
             SET status = 'round1_fail',
                 round1_result = 'fail',
                 round1_ai_reason = $2,
                 completed_at = NOW(),
                 updated_at = NOW()
             WHERE id = $1`, [sessionId, judgeResult.reason]);
                }
            });
        }
        catch (error) {
            logger_1.default.error('[VerifyService] 第一轮判断处理失败:', error);
            // 更新状态为失败
            await (0, db_1.query)(`UPDATE verify_sessions
         SET status = 'failed', updated_at = NOW()
         WHERE id = $1`, [sessionId]);
        }
    }
    /**
     * 提交第二轮回答
     */
    static async submitRound2Answer(sessionId, answer) {
        return (0, db_1.withTransaction)(async (client) => {
            const sessionResult = await client.query(`SELECT vs.*, vq.question_text, vq.judge_criteria,
                t.description as need_description
         FROM verify_sessions vs
         JOIN verify_questions vq ON vs.round2_question_id = vq.id
         JOIN student_company_matches scm ON vs.match_id = scm.id
         JOIN tasks t ON t.company_id = scm.company_id
         WHERE vs.id = $1 AND vs.deleted_at IS NULL
         LIMIT 1`, [sessionId]);
            if (sessionResult.rows.length === 0) {
                throw new Error('验证会话不存在');
            }
            const session = sessionResult.rows[0];
            if (session.status !== 'round1_pass') {
                throw new Error(`当前状态不允许提交第二轮: ${session.status}`);
            }
            await client.query(`UPDATE verify_sessions
         SET status = 'round2_judging', round2_answer = $2, updated_at = NOW()
         WHERE id = $1`, [sessionId, answer]);
            // 异步调用AI判断
            this.processRound2Judge(sessionId, session, answer).catch(err => {
                logger_1.default.error('[VerifyService] 第二轮AI判断失败:', err);
            });
            return { status: 'round2_judging' };
        });
    }
    /**
     * 处理第二轮AI判断（异步）
     */
    static async processRound2Judge(sessionId, session, answer) {
        try {
            const judgeResult = await aiJudgeService_1.AIJudgeService.judgeRound2({
                sessionId,
                needDescription: session.need_description,
                questionText: session.question_text,
                criteria: session.judge_criteria,
                studentAnswer: answer
            });
            await (0, db_1.withTransaction)(async (client) => {
                if (judgeResult.result === 'pass') {
                    // 全部通过
                    await client.query(`UPDATE verify_sessions
             SET status = 'all_pass',
                 round2_result = 'pass',
                 round2_ai_reason = $2,
                 completed_at = NOW(),
                 updated_at = NOW()
             WHERE id = $1`, [sessionId, judgeResult.reason]);
                }
                else {
                    // 失败
                    await client.query(`UPDATE verify_sessions
             SET status = 'failed',
                 round2_result = 'fail',
                 round2_ai_reason = $2,
                 completed_at = NOW(),
                 updated_at = NOW()
             WHERE id = $1`, [sessionId, judgeResult.reason]);
                }
            });
        }
        catch (error) {
            logger_1.default.error('[VerifyService] 第二轮判断处理失败:', error);
            await (0, db_1.query)(`UPDATE verify_sessions
         SET status = 'failed', updated_at = NOW()
         WHERE id = $1`, [sessionId]);
        }
    }
    /**
     * 获取会话状态
     */
    static async getSessionStatus(sessionId) {
        const result = await (0, db_1.query)(`SELECT * FROM verify_sessions
       WHERE id = $1 AND deleted_at IS NULL`, [sessionId]);
        if (result.length === 0) {
            throw new Error('验证会话不存在');
        }
        return result[0];
    }
    /**
     * 获取第二轮题目
     */
    static async getRound2Question(sessionId) {
        const result = await (0, db_1.query)(`SELECT vq.id, vq.question_text, vq.judge_criteria
       FROM verify_sessions vs
       JOIN verify_questions vq ON vs.round2_question_id = vq.id
       WHERE vs.id = $1 AND vs.deleted_at IS NULL`, [sessionId]);
        if (result.length === 0) {
            throw new Error('未找到第二轮题目');
        }
        return result[0];
    }
}
exports.VerifyService = VerifyService;
//# sourceMappingURL=verifyService.js.map