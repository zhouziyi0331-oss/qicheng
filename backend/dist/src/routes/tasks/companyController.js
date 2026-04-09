"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTask = createTask;
exports.getCompanyTasks = getCompanyTasks;
exports.approveTask = approveTask;
exports.rejectTask = rejectTask;
const db_1 = require("../../utils/db");
const errorHandler_1 = require("../../middleware/errorHandler");
const logger_1 = __importDefault(require("../../utils/logger"));
const sixDimUpdater_1 = require("../../utils/sixDimUpdater");
const smartReview_1 = require("../../utils/smartReview");
// POST /company — 企业发布任务
async function createTask(req, res, next) {
    try {
        const companyId = req.user.userId;
        // 企业需审核通过才能发布任务
        const company = await (0, db_1.queryOne)('SELECT verified_at, is_blacklisted FROM company_profiles WHERE user_id = $1', [companyId]);
        if (!company?.verified_at)
            throw new errorHandler_1.AppError(403, '企业账号待审核，审核通过后可发布任务', 'NOT_VERIFIED');
        if (company.is_blacklisted)
            throw new errorHandler_1.AppError(403, '账号已被封禁', 'BLACKLISTED');
        const { title, description, taskType, track, levelRequired, budgetGross, acceptanceCriteria, deadline, estimatedMinutes, publishType // 新增：'normal' 或 'invitation'
         } = req.body;
        if (!title || !description || !budgetGross || !acceptanceCriteria) {
            throw new errorHandler_1.AppError(400, '标题、描述、预算和验收标准为必填项', 'MISSING_FIELDS');
        }
        if (!publishType || !['normal', 'invitation'].includes(publishType)) {
            throw new errorHandler_1.AppError(400, '请选择任务发布类型（普通任务或邀请任务）', 'INVALID_PUBLISH_TYPE');
        }
        // 邀请任务的额外校验
        if (publishType === 'invitation') {
            if (!levelRequired || parseInt(levelRequired) < 10) {
                throw new errorHandler_1.AppError(400, '邀请任务仅限满级学生（Lv.10+）', 'INVITATION_LEVEL_REQUIRED');
            }
        }
        // 根据等级计算平台抽成
        const level = parseInt(levelRequired || '0');
        let feeRate = 0.20;
        if (level === 3)
            feeRate = 0.18;
        else if (level >= 4)
            feeRate = 0.15;
        const gross = parseFloat(budgetGross);
        const net = parseFloat((gross * (1 - feeRate)).toFixed(2));
        const [task] = await (0, db_1.query)(`INSERT INTO tasks
        (company_id, title, description, task_type, track, level_required,
         budget_gross, budget_net, platform_fee_rate, acceptance_criteria,
         deadline, estimated_minutes, status, task_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'pending_review',$13)
       RETURNING id`, [companyId, title, description, taskType, track || 'A', level,
            gross, net, feeRate, acceptanceCriteria, deadline, estimatedMinutes, publishType]);
        await (0, db_1.query)('UPDATE company_profiles SET total_tasks_posted = total_tasks_posted + 1 WHERE user_id = $1', [companyId]);
        // 如果是邀请任务，自动触发智能匹配
        if (publishType === 'invitation') {
            // 异步触发匹配，不阻塞响应
            const { InvitationMatchService } = await Promise.resolve().then(() => __importStar(require('../../services/invitation/matchService')));
            const matchService = new InvitationMatchService();
            matchService.matchStudentsForTask(companyId, {
                target_level_min: level,
                max_invitations: 10
            }).catch((err) => {
                logger_1.default.error('Failed to match students for invitation task', { taskId: task.id, error: err.message });
            });
        }
        logger_1.default.info('Company task created', { taskId: task.id, companyId, publishType });
        res.status(201).json({
            success: true,
            data: {
                taskId: task.id,
                budgetGross: gross,
                budgetNet: net,
                platformFeeRate: feeRate,
                status: 'pending_review',
                message: '任务已提交，平台审核后将开始匹配学生',
            },
        });
    }
    catch (err) {
        next(err);
    }
}
// GET /company — 企业获取任务列表
async function getCompanyTasks(req, res, next) {
    try {
        const companyId = req.user.userId;
        const tasks = await (0, db_1.query)(`SELECT t.id, t.title, t.status, t.budget_gross, t.budget_net,
              t.level_required, t.created_at, t.deadline,
              COUNT(ta.id) FILTER (WHERE ta.status = 'accepted') as assigned_count,
              COUNT(ts.id) FILTER (WHERE ts.status = 'pending') as pending_review_count
       FROM tasks t
       LEFT JOIN task_assignments ta ON ta.task_id = t.id
       LEFT JOIN task_submissions ts ON ts.task_id = t.id
       WHERE t.company_id = $1 AND t.deleted_at IS NULL
       GROUP BY t.id
       ORDER BY t.created_at DESC`, [companyId]);
        res.json({ success: true, data: tasks });
    }
    catch (err) {
        next(err);
    }
}
// POST /company/:id/approve — 企业验收通过
async function approveTask(req, res, next) {
    try {
        const companyId = req.user.userId;
        const { id: taskId } = req.params;
        const { score, feedback, useAiReview } = req.body;
        const submission = await (0, db_1.queryOne)(`SELECT ts.id, ts.student_id, t.is_first_task, ts.submission_note, ts.file_urls
       FROM task_submissions ts
       JOIN tasks t ON t.id = ts.task_id
       WHERE ts.task_id = $1 AND t.company_id = $2
         AND ts.status = 'pending'
       ORDER BY ts.submitted_at DESC LIMIT 1`, [taskId, companyId]);
        if (!submission)
            throw new errorHandler_1.AppError(404, '未找到待验收的提交', 'SUBMISSION_NOT_FOUND');
        // 如果企业请求AI辅助验收
        let finalScore = score || 80;
        let finalFeedback = feedback || '验收通过';
        let aiReview = null;
        if (useAiReview) {
            const taskInfo = await (0, db_1.queryOne)('SELECT title, description, acceptance_criteria FROM tasks WHERE id = $1', [taskId]);
            if (taskInfo) {
                aiReview = await (0, smartReview_1.reviewTaskSubmission)(taskInfo.title, taskInfo.description, taskInfo.acceptance_criteria || '按要求完成任务', submission.submission_note || '', submission.file_urls || []);
                // 如果没有手动评分，使用AI评分
                if (!score)
                    finalScore = aiReview.score;
                if (!feedback) {
                    finalFeedback = aiReview.feedback;
                    if (aiReview.issues.length > 0) {
                        finalFeedback += '\n\n问题：\n' + aiReview.issues.map(i => `- ${i}`).join('\n');
                    }
                    if (aiReview.highlights.length > 0) {
                        finalFeedback += '\n\n亮点：\n' + aiReview.highlights.map(h => `- ${h}`).join('\n');
                    }
                }
            }
        }
        await (0, db_1.withTransaction)(async (client) => {
            // 更新提交状态
            await client.query(`UPDATE task_submissions
         SET status = 'approved', company_score = $1, company_feedback = $2, approved_at = NOW()
         WHERE id = $3`, [finalScore, finalFeedback, submission.id]);
            // 更新任务状态为完成
            await client.query(`UPDATE tasks SET status = 'completed' WHERE id = $1`, [taskId]);
            // 获取任务金额
            const taskResult = await client.query('SELECT budget_net, is_first_task FROM tasks WHERE id = $1', [taskId]);
            const { budget_net, is_first_task } = taskResult.rows[0];
            // 创建支付记录
            await client.query(`INSERT INTO payments
          (task_id, student_id, company_id, payer, gross_amount, platform_fee, net_amount,
           is_first_task, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'escrowed')`, [
                taskId, submission.student_id, companyId,
                is_first_task ? 'platform' : 'company',
                budget_net, 0, budget_net, // 抽成已在发布时计算进 budget_net
                is_first_task,
            ]);
            // 更新学生任务统计
            await client.query(`UPDATE student_profiles
         SET task_count = task_count + 1, total_earnings = total_earnings + $1
         WHERE user_id = $2`, [budget_net, submission.student_id]);
            // 智能更新六维分数（基于任务表现）
            const taskDetailResult = await client.query(`SELECT track_type, level_required FROM tasks WHERE id = $1`, [taskId]);
            if (taskDetailResult.rows.length > 0) {
                await (0, sixDimUpdater_1.updateSixDimScores)(submission.student_id, taskId, finalScore, taskDetailResult.rows[0].track_type, taskDetailResult.rows[0].level_required);
            }
            // 检查联系方式解锁 (同企业完成2单)
            await checkContactUnlock(client, submission.student_id, companyId, taskId);
            // 记录成长时间线
            await client.query(`INSERT INTO growth_timeline
          (user_id, event_type, event_title, event_desc, task_id, event_data)
         VALUES ($1, 'task_completed', '完成一单', $2, $3, $4::jsonb)`, [
                submission.student_id,
                `完成任务并获得 ¥${budget_net} 收入`,
                taskId,
                JSON.stringify({ earnings: budget_net, is_first_task }),
            ]);
            // 情绪信号: 任务完成后回到激励状态
            await client.query(`UPDATE emotion_signals SET resolved_at = NOW()
         WHERE user_id = $1 AND signal_type IN ('frustrated', 'cooling') AND resolved_at IS NULL`, [submission.student_id]);
        });
        // 首单: 触发24h结算通知
        if (submission.is_first_task) {
            setImmediate(() => scheduleFirstTaskSettlement(submission.student_id, taskId).catch(logger_1.default.error));
        }
        res.json({
            success: true,
            message: '验收通过，结算已启动',
            data: aiReview ? {
                aiReview: {
                    score: aiReview.score,
                    isQualified: aiReview.isQualified,
                    issues: aiReview.issues,
                    highlights: aiReview.highlights,
                }
            } : undefined
        });
    }
    catch (err) {
        next(err);
    }
}
// POST /company/:id/reject — 企业验收打回
async function rejectTask(req, res, next) {
    try {
        const companyId = req.user.userId;
        const { id: taskId } = req.params;
        const { feedback } = req.body;
        const submission = await (0, db_1.queryOne)(`SELECT ts.id, ts.student_id, ts.ai_review_count
       FROM task_submissions ts
       JOIN tasks t ON t.id = ts.task_id
       WHERE ts.task_id = $1 AND t.company_id = $2 AND ts.status = 'pending'
       ORDER BY ts.submitted_at DESC LIMIT 1`, [taskId, companyId]);
        if (!submission)
            throw new errorHandler_1.AppError(404, '未找到待审核的提交', 'SUBMISSION_NOT_FOUND');
        await (0, db_1.query)(`UPDATE task_submissions
       SET status = 'rejected', company_feedback = $1, reviewed_at = NOW()
       WHERE id = $2`, [feedback, submission.id]);
        // 触发挫败信号
        if (submission.ai_review_count >= 2) {
            await (0, db_1.query)(`INSERT INTO emotion_signals (user_id, signal_type, signal_value, trigger_event)
         VALUES ($1, 'frustrated', 7, 'company_rejected')`, [submission.student_id]);
        }
        res.json({ success: true, message: '已打回，学生将收到修改建议' });
    }
    catch (err) {
        next(err);
    }
}
// ============================================================
// 内部: 检查联系方式解锁
// ============================================================
async function checkContactUnlock(client, studentId, companyId, taskId) {
    // 获取任务收入
    const taskResult = await client.query('SELECT budget_net FROM tasks WHERE id = $1', [taskId]);
    const earnings = taskResult[0]?.budget_net || 0;
    // 调用信任加速器MatchService记录合作
    const { MatchService } = require('../../services/trustAccelerator/matchService');
    const matchResult = await MatchService.recordTaskCompletion(studentId, companyId, earnings);
    // 如果达到解锁资格（完成2次任务）
    if (matchResult.unlockEligible) {
        // 发送通知：提示学生可以解锁联系方式
        await client.query(`INSERT INTO notifications (user_id, type, title, content)
       VALUES ($1, 'unlock_eligible', '🎉 解锁深度合作机会', $2)`, [
            studentId,
            JSON.stringify({
                message: '你已完成该商家2个任务，现在可以付费解锁联系方式，开启长期合作！',
                matchId: matchResult.matchId,
                companyId: companyId
            })
        ]);
        logger_1.default.info('Student eligible for contact unlock', {
            studentId,
            companyId,
            matchId: matchResult.matchId
        });
    }
}
async function scheduleFirstTaskSettlement(studentId, taskId) {
    // 首单24h到账通知 (实际结算由 cron job 处理)
    logger_1.default.info('First task settlement scheduled', { studentId, taskId });
}
//# sourceMappingURL=companyController.js.map