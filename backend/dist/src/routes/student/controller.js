"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = getProfile;
exports.updateProfile = updateProfile;
exports.getTestQuestions = getTestQuestions;
exports.submitTest = submitTest;
exports.getOnboardingStatus = getOnboardingStatus;
exports.completeOnboardingStep = completeOnboardingStep;
exports.getEmotionSignals = getEmotionSignals;
const axios_1 = __importDefault(require("axios"));
const db_1 = require("../../utils/db");
const errorHandler_1 = require("../../middleware/errorHandler");
const config_1 = require("../../../config");
const logger_1 = __importDefault(require("../../utils/logger"));
// GET /student/profile
async function getProfile(req, res, next) {
    try {
        const userId = req.user.userId;
        const profile = await (0, db_1.queryOne)(`SELECT u.id, u.phone, u.nickname, u.avatar_url, u.university, u.city, u.major, u.grade,
              sp.track, sp.level_a, sp.level_b, sp.opc_label, sp.opc_label_secondary,
              sp.six_dim_scores, sp.total_earnings, sp.task_count, sp.graduated_at,
              sb.balance
       FROM users u
       LEFT JOIN student_profiles sp ON sp.user_id = u.id
       LEFT JOIN student_balances sb ON sb.user_id = u.id
       WHERE u.id = $1 AND u.deleted_at IS NULL`, [userId]);
        if (!profile)
            throw new errorHandler_1.AppError(404, '用户不存在', 'USER_NOT_FOUND');
        res.json({ success: true, data: profile });
    }
    catch (err) {
        next(err);
    }
}
// POST /student/profile
async function updateProfile(req, res, next) {
    try {
        const userId = req.user.userId;
        const { nickname, avatarUrl, university, city, major, grade } = req.body;
        await (0, db_1.query)(`UPDATE users SET
        nickname = COALESCE($1, nickname),
        avatar_url = COALESCE($2, avatar_url),
        university = COALESCE($3, university),
        city = COALESCE($4, city),
        major = COALESCE($5, major),
        grade = COALESCE($6, grade)
       WHERE id = $7`, [nickname, avatarUrl, university, city, major, grade, userId]);
        res.json({ success: true, message: '信息已更新' });
    }
    catch (err) {
        next(err);
    }
}
// GET /student/test/questions
async function getTestQuestions(req, res, next) {
    try {
        const questions = await (0, db_1.query)(`SELECT question_num, dimension, question_text, input_type, options, max_select
       FROM test_questions WHERE is_active = TRUE ORDER BY question_num ASC`);
        res.json({ success: true, data: questions });
    }
    catch (err) {
        next(err);
    }
}
// POST /student/test/submit
async function submitTest(req, res, next) {
    try {
        const userId = req.user.userId;
        const { answers } = req.body;
        if (!answers || typeof answers !== 'object') {
            throw new errorHandler_1.AppError(400, '答案数据格式不正确', 'INVALID_ANSWERS');
        }
        // 检查测试间隔 (30天限制)
        const lastTest = await (0, db_1.queryOne)(`SELECT created_at FROM test_results
       WHERE user_id = $1 AND is_current = TRUE ORDER BY created_at DESC LIMIT 1`, [userId]);
        if (lastTest) {
            const daysSince = (Date.now() - new Date(lastTest.created_at).getTime()) / (1000 * 60 * 60 * 24);
            if (daysSince < 30) {
                throw new errorHandler_1.AppError(400, `距上次测试不足30天，还需等待 ${Math.ceil(30 - daysSince)} 天`, 'TEST_COOLDOWN');
            }
        }
        // 调用 Python AI 服务 AI-01
        let aiResult;
        try {
            const aiResponse = await axios_1.default.post(`${config_1.config.ai.serviceUrl}/ai/analyze-test`, { user_id: userId, answers }, { timeout: config_1.config.ai.timeout });
            aiResult = aiResponse.data;
        }
        catch (aiErr) {
            logger_1.default.error('AI-01 test analysis failed', { userId, error: aiErr.message });
            // 降级: 使用基础评分逻辑
            aiResult = buildFallbackAnalysis(answers);
        }
        const attemptCount = lastTest ? 2 : 1;
        await (0, db_1.withTransaction)(async (client) => {
            // 旧记录标记为非当前
            await client.query('UPDATE test_results SET is_current = FALSE WHERE user_id = $1', [userId]);
            // 插入新测试结果
            await client.query(`INSERT INTO test_results
          (user_id, attempt_number, answers_json, d1_score, d2_score, d3_score, d4_score, d5_score,
           opc_label, opc_label_secondary, recommended_track, recommended_level,
           share_card_caption, share_card_data, ai_raw_response)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`, [
                userId, attemptCount, JSON.stringify(answers),
                aiResult.d1_score, aiResult.d2_score, aiResult.d3_score,
                aiResult.d4_score, aiResult.d5_score,
                aiResult.opc_label, aiResult.opc_label_secondary,
                aiResult.recommended_track, aiResult.recommended_level,
                aiResult.share_card_caption, JSON.stringify(aiResult.share_card_data),
                aiResult.raw_response,
            ]);
            // 更新学生档案的 OPC 标签
            await client.query(`UPDATE student_profiles SET
          opc_label = $1, opc_label_secondary = $2,
          track = COALESCE($3::track_type, track),
          updated_at = NOW()
         WHERE user_id = $4`, [aiResult.opc_label, aiResult.opc_label_secondary, aiResult.recommended_track, userId]);
            // 更新 Onboarding 状态: J2 完成
            await client.query(`UPDATE onboarding_status
         SET j2_completed_at = NOW(), completed_steps = completed_steps || '["J2_test_done"]'::jsonb,
             current_step = 'J3_opc_label_shared', updated_at = NOW()
         WHERE user_id = $1 AND j2_completed_at IS NULL`, [userId]);
            // 记录成长时间线
            await client.query(`INSERT INTO growth_timeline (user_id, event_type, event_title, event_desc, event_data)
         VALUES ($1, 'task_completed', '完成OPC测试', $2, $3::jsonb)`, [userId,
                `你的OPC人格标签是「${aiResult.opc_label}」`,
                JSON.stringify({ opc_label: aiResult.opc_label, track: aiResult.recommended_track })]);
        });
        res.json({
            success: true,
            data: {
                opcLabel: aiResult.opc_label,
                opcLabelSecondary: aiResult.opc_label_secondary,
                scores: {
                    d1: aiResult.d1_score, d2: aiResult.d2_score, d3: aiResult.d3_score,
                    d4: aiResult.d4_score, d5: aiResult.d5_score,
                },
                recommendedTrack: aiResult.recommended_track,
                recommendedLevel: aiResult.recommended_level,
                shareCard: aiResult.share_card_data,
                nextStep: 'first_task', // 引导到首单
            },
        });
    }
    catch (err) {
        next(err);
    }
}
// GET /student/onboarding
async function getOnboardingStatus(req, res, next) {
    try {
        const userId = req.user.userId;
        const status = await (0, db_1.queryOne)('SELECT * FROM onboarding_status WHERE user_id = $1', [userId]);
        res.json({ success: true, data: status });
    }
    catch (err) {
        next(err);
    }
}
// POST /student/onboarding/:step/complete
async function completeOnboardingStep(req, res, next) {
    try {
        const userId = req.user.userId;
        const { step } = req.params;
        const validSteps = ['J1', 'J2', 'J3', 'J4', 'J5', 'J6', 'J7', 'J8'];
        if (!validSteps.includes(step)) {
            throw new errorHandler_1.AppError(400, '无效的步骤', 'INVALID_STEP');
        }
        const col = `${step.toLowerCase()}_completed_at`;
        await (0, db_1.query)(`UPDATE onboarding_status
       SET ${col} = NOW(), updated_at = NOW()
       WHERE user_id = $1 AND ${col} IS NULL`, [userId]);
        res.json({ success: true, message: `${step} 已完成` });
    }
    catch (err) {
        next(err);
    }
}
// GET /student/emotion-signals
async function getEmotionSignals(req, res, next) {
    try {
        const userId = req.user.userId;
        const signals = await (0, db_1.query)(`SELECT id, signal_type as "signalType", signal_value as "signalValue",
              trigger_event as "triggerEvent", detected_at as "detectedAt"
       FROM emotion_signals
       WHERE user_id = $1
       ORDER BY detected_at DESC
       LIMIT 5`, [userId]);
        res.json({ success: true, data: signals });
    }
    catch (err) {
        next(err);
    }
}
// 降级分析逻辑 (AI服务不可用时)
function buildFallbackAnalysis(answers) {
    return {
        d1_score: 60, d2_score: 60, d3_score: 50, d4_score: 60, d5_score: 55,
        opc_label: '探索中的AI实践者',
        opc_label_secondary: null,
        recommended_track: 'A',
        recommended_level: 0,
        share_card_caption: '我正在开启AI变现之旅',
        share_card_data: { label: '探索中的AI实践者', abilities: ['好奇心', '执行力', '学习力'] },
        raw_response: null,
    };
}
//# sourceMappingURL=controller.js.map