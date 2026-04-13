"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTaskDeliverables = getTaskDeliverables;
exports.approveAndPayFinal = approveAndPayFinal;
exports.finalConfirmation = finalConfirmation;
exports.autoConfirmTasks = autoConfirmTasks;
exports.addRequirementSupplement = addRequirementSupplement;
const db_1 = require("../../utils/db");
const errorHandler_1 = require("../../middleware/errorHandler");
const logger_1 = __importDefault(require("../../utils/logger"));
/**
 * 企业验收和支付流程API
 *
 * 流程：
 * 1. 企业查看交付物
 * 2. 企业验收通过 → 支付70%尾款
 * 3. 7天内确认或自动确认 → 平台付款给学生
 * 4. 检查连续合作2次 → 交换微信
 */
// ============================================
// 1. 企业查看交付物
// ============================================
async function getTaskDeliverables(req, res, next) {
    try {
        const companyId = req.user.userId;
        const { taskId } = req.params;
        // 验证任务归属
        const task = await (0, db_1.queryOne)(`SELECT * FROM tasks WHERE id = $1 AND company_id = $2`, [taskId, companyId]);
        if (!task) {
            throw new errorHandler_1.AppError(404, '任务不存在', 'TASK_NOT_FOUND');
        }
        // 获取交付物
        const deliverables = await (0, db_1.query)(`SELECT
        td.*,
        u.nickname as student_name
       FROM task_deliverables td
       JOIN users u ON td.student_id = u.id
       WHERE td.task_id = $1
       ORDER BY td.created_at DESC`, [taskId]);
        // 获取任务进度记录
        const progressHistory = await (0, db_1.query)(`SELECT * FROM task_progress
       WHERE task_id = $1
       ORDER BY created_at DESC`, [taskId]);
        res.json({
            success: true,
            data: {
                taskId,
                taskTitle: task.title,
                taskStatus: task.status,
                studentPrice: task.student_price,
                companyPrice: task.company_price,
                finalAmount: task.final_amount,
                deliverables: deliverables.map((d) => ({
                    id: d.id,
                    fileType: d.file_type,
                    fileUrl: d.file_url,
                    fileName: d.file_name,
                    fileSize: d.file_size,
                    description: d.description,
                    aiReviewStatus: d.ai_review_status,
                    aiReviewResult: d.ai_review_result,
                    aiReviewedAt: d.ai_reviewed_at,
                    submittedAt: d.created_at
                })),
                progressHistory: progressHistory.map((p) => ({
                    percentage: p.progress_percentage,
                    description: p.progress_description,
                    milestone: p.milestone,
                    createdAt: p.created_at
                }))
            }
        });
    }
    catch (err) {
        next(err);
    }
}
// ============================================
// 2. 企业验收通过并支付尾款
// ============================================
async function approveAndPayFinal(req, res, next) {
    try {
        const companyId = req.user.userId;
        const { taskId } = req.params;
        const { paymentMethod, transactionId, feedback, rating } = req.body;
        await (0, db_1.withTransaction)(async (client) => {
            // 1. 验证任务状态
            const task = await client.query(`SELECT * FROM tasks WHERE id = $1 AND company_id = $2 FOR UPDATE`, [taskId, companyId]);
            if (task.rows.length === 0) {
                throw new errorHandler_1.AppError(404, '任务不存在', 'TASK_NOT_FOUND');
            }
            const taskData = task.rows[0];
            if (taskData.status !== 'pending_verification') {
                throw new errorHandler_1.AppError(400, '任务状态不正确', 'INVALID_STATUS');
            }
            // 2. 记录尾款支付
            await client.query(`INSERT INTO payments (
          task_id, payer_id, payer_type, receiver_id, receiver_type,
          amount, payment_type, payment_method, transaction_id, status, paid_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`, [
                taskId,
                companyId,
                'company',
                'platform',
                'platform',
                taskData.final_amount,
                'final',
                paymentMethod,
                transactionId,
                'success'
            ]);
            // 3. 更新任务状态和尾款标记
            const verificationDeadline = new Date();
            verificationDeadline.setDate(verificationDeadline.getDate() + 7); // 7天后
            await client.query(`UPDATE tasks
         SET status = 'pending_confirmation',
             final_paid = true,
             verification_deadline = $1
         WHERE id = $2`, [verificationDeadline, taskId]);
            // 4. 通知学生
            await client.query(`INSERT INTO notifications (user_id, user_type, type, title, content, related_task_id)
         VALUES ($1, 'student', 'verification_approved', '企业验收通过', $2, $3)`, [
                taskData.accepted_student_id,
                `企业已验收通过任务《${taskData.title}》，尾款已支付到平台，7天内确认后将付款给您`,
                taskId
            ]);
            logger_1.default.info('Task approved and final payment made', {
                taskId,
                companyId,
                finalAmount: taskData.final_amount
            });
            res.json({
                success: true,
                data: {
                    taskId,
                    finalAmount: taskData.final_amount,
                    verificationDeadline,
                    status: 'pending_confirmation',
                    message: '验收通过！尾款已支付，7天内确认或自动确认后将付款给学生'
                }
            });
        });
    }
    catch (err) {
        next(err);
    }
}
// ============================================
// 3. 企业最终确认（7天内）
// ============================================
async function finalConfirmation(req, res, next) {
    try {
        const companyId = req.user.userId;
        const { taskId } = req.params;
        const { rating, feedback } = req.body;
        await (0, db_1.withTransaction)(async (client) => {
            // 1. 验证任务状态
            const task = await client.query(`SELECT * FROM tasks WHERE id = $1 AND company_id = $2 FOR UPDATE`, [taskId, companyId]);
            if (task.rows.length === 0) {
                throw new errorHandler_1.AppError(404, '任务不存在', 'TASK_NOT_FOUND');
            }
            const taskData = task.rows[0];
            if (taskData.status !== 'pending_confirmation') {
                throw new errorHandler_1.AppError(400, '任务状态不正确', 'INVALID_STATUS');
            }
            // 2. 平台付款给学生
            await client.query(`INSERT INTO payments (
          task_id, payer_id, payer_type, receiver_id, receiver_type,
          amount, payment_type, status, paid_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`, [
                taskId,
                'platform',
                'platform',
                taskData.accepted_student_id,
                'student',
                taskData.student_price,
                'platform_to_student',
                'success'
            ]);
            // 3. 更新任务状态为已完成
            await client.query(`UPDATE tasks
         SET status = 'completed',
             auto_confirmed = false
         WHERE id = $1`, [taskId]);
            // 4. 更新学生统计
            await client.query(`UPDATE student_profiles
         SET completed_tasks = completed_tasks + 1,
             active_tasks = active_tasks - 1,
             total_earnings = total_earnings + $1
         WHERE user_id = $2`, [taskData.student_price, taskData.accepted_student_id]);
            // 5. 通知学生
            await client.query(`INSERT INTO notifications (user_id, user_type, type, title, content, related_task_id)
         VALUES ($1, 'student', 'payment_received', '收到付款', $2, $3)`, [
                taskData.accepted_student_id,
                `恭喜！任务《${taskData.title}》已完成，您已收到付款¥${taskData.student_price}`,
                taskId
            ]);
            // 6. 检查合作次数，是否需要交换微信
            await checkAndExchangeWechat(client, companyId, taskData.accepted_student_id, taskId);
            logger_1.default.info('Task final confirmation completed', {
                taskId,
                companyId,
                studentId: taskData.accepted_student_id,
                amount: taskData.student_price
            });
            res.json({
                success: true,
                data: {
                    taskId,
                    status: 'completed',
                    studentPayment: taskData.student_price,
                    message: '任务已完成，平台已付款给学生'
                }
            });
        });
    }
    catch (err) {
        next(err);
    }
}
// ============================================
// 4. 7天自动确认（定时任务调用）
// ============================================
async function autoConfirmTasks() {
    try {
        // 查找所有超过7天未确认的任务
        const tasks = await (0, db_1.query)(`SELECT * FROM tasks
       WHERE status = 'pending_confirmation'
         AND verification_deadline < NOW()
         AND auto_confirmed = false`, []);
        for (const task of tasks) {
            await (0, db_1.withTransaction)(async (client) => {
                // 1. 平台付款给学生
                await client.query(`INSERT INTO payments (
            task_id, payer_id, payer_type, receiver_id, receiver_type,
            amount, payment_type, status, paid_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`, [
                    task.id,
                    'platform',
                    'platform',
                    task.accepted_student_id,
                    'student',
                    task.student_price,
                    'platform_to_student',
                    'success'
                ]);
                // 2. 更新任务状态
                await client.query(`UPDATE tasks
           SET status = 'completed',
               auto_confirmed = true
           WHERE id = $1`, [task.id]);
                // 3. 更新学生统计
                await client.query(`UPDATE student_profiles
           SET completed_tasks = completed_tasks + 1,
               active_tasks = active_tasks - 1,
               total_earnings = total_earnings + $1
           WHERE user_id = $2`, [task.student_price, task.accepted_student_id]);
                // 4. 通知企业
                await client.query(`INSERT INTO notifications (user_id, user_type, type, title, content, related_task_id)
           VALUES ($1, 'company', 'auto_confirmed', '任务自动确认', $2, $3)`, [
                    task.company_id,
                    `任务《${task.title}》已超过7天验收期，系统已自动确认并付款给学生`,
                    task.id
                ]);
                // 5. 通知学生
                await client.query(`INSERT INTO notifications (user_id, user_type, type, title, content, related_task_id)
           VALUES ($1, 'student', 'payment_received', '收到付款', $2, $3)`, [
                    task.accepted_student_id,
                    `任务《${task.title}》已自动确认完成，您已收到付款¥${task.student_price}`,
                    task.id
                ]);
                // 6. 检查合作次数
                await checkAndExchangeWechat(client, task.company_id, task.accepted_student_id, task.id);
                logger_1.default.info('Task auto-confirmed', {
                    taskId: task.id,
                    companyId: task.company_id,
                    studentId: task.accepted_student_id
                });
            });
        }
        logger_1.default.info('Auto-confirm tasks completed', { count: tasks.length });
    }
    catch (err) {
        logger_1.default.error('Auto-confirm tasks failed', { error: err });
        throw err;
    }
}
// ============================================
// 5. 检查并交换微信（连续合作2次）
// ============================================
async function checkAndExchangeWechat(client, companyId, studentId, taskId) {
    try {
        // 1. 查询或创建合作关系记录
        const collaboration = await client.query(`SELECT * FROM collaborations
       WHERE company_id = $1 AND student_id = $2`, [companyId, studentId]);
        let collaborationCount = 0;
        let wechatExchanged = false;
        if (collaboration.rows.length === 0) {
            // 首次合作
            await client.query(`INSERT INTO collaborations (
          company_id, student_id, collaboration_count,
          first_collaboration_at, last_collaboration_at
        ) VALUES ($1, $2, 1, NOW(), NOW())`, [companyId, studentId]);
            collaborationCount = 1;
        }
        else {
            // 增加合作次数
            const collab = collaboration.rows[0];
            collaborationCount = collab.collaboration_count + 1;
            wechatExchanged = collab.wechat_exchanged;
            await client.query(`UPDATE collaborations
         SET collaboration_count = $1,
             last_collaboration_at = NOW()
         WHERE company_id = $2 AND student_id = $3`, [collaborationCount, companyId, studentId]);
        }
        // 2. 如果达到2次合作且未交换微信，则交换
        if (collaborationCount >= 2 && !wechatExchanged) {
            // 获取双方微信号
            const company = await client.query(`SELECT wechat_id FROM users WHERE id = $1`, [companyId]);
            const student = await client.query(`SELECT wechat_id FROM users WHERE id = $1`, [studentId]);
            const companyWechat = company.rows[0]?.wechat_id;
            const studentWechat = student.rows[0]?.wechat_id;
            // 更新合作关系，标记已交换
            await client.query(`UPDATE collaborations
         SET wechat_exchanged = true,
             company_wechat = $1,
             student_wechat = $2
         WHERE company_id = $3 AND student_id = $4`, [companyWechat, studentWechat, companyId, studentId]);
            // 通知企业
            await client.query(`INSERT INTO notifications (user_id, user_type, type, title, content, related_task_id)
         VALUES ($1, 'company', 'wechat_exchanged', '已交换微信', $2, $3)`, [
                companyId,
                `您已与该学生合作2次，系统已为您交换微信联系方式：${studentWechat || '未设置'}。后续可直接联系，平台不再参与交易。`,
                taskId
            ]);
            // 通知学生
            await client.query(`INSERT INTO notifications (user_id, user_type, type, title, content, related_task_id)
         VALUES ($1, 'student', 'wechat_exchanged', '已交换微信', $2, $3)`, [
                studentId,
                `您已与该企业合作2次，系统已为您交换微信联系方式：${companyWechat || '未设置'}。后续可直接联系，平台不再参与交易。`,
                taskId
            ]);
            logger_1.default.info('Wechat exchanged after 2 collaborations', {
                companyId,
                studentId,
                collaborationCount
            });
        }
    }
    catch (err) {
        logger_1.default.error('Check and exchange wechat failed', { error: err });
        // 不抛出错误，避免影响主流程
    }
}
// ============================================
// 6. 企业补充需求
// ============================================
async function addRequirementSupplement(req, res, next) {
    try {
        const companyId = req.user.userId;
        const { taskId } = req.params;
        const { content, estimatedDays } = req.body;
        if (!content) {
            throw new errorHandler_1.AppError(400, '补充内容不能为空', 'MISSING_CONTENT');
        }
        await (0, db_1.withTransaction)(async (client) => {
            // 1. 验证任务状态
            const task = await client.query(`SELECT * FROM tasks WHERE id = $1 AND company_id = $2`, [taskId, companyId]);
            if (task.rows.length === 0) {
                throw new errorHandler_1.AppError(404, '任务不存在', 'TASK_NOT_FOUND');
            }
            const taskData = task.rows[0];
            if (taskData.status !== 'in_progress') {
                throw new errorHandler_1.AppError(400, '只能在任务进行中补充需求', 'INVALID_STATUS');
            }
            // 2. 计算新的截止日期
            const oldDeadline = new Date(taskData.deadline);
            const newDeadline = new Date(oldDeadline);
            newDeadline.setDate(newDeadline.getDate() + (estimatedDays || 3));
            // 3. 记录补充需求
            await client.query(`INSERT INTO requirement_supplements (
          task_id, company_id, content, estimated_days, old_deadline, new_deadline
        ) VALUES ($1, $2, $3, $4, $5, $6)`, [taskId, companyId, content, estimatedDays, oldDeadline, newDeadline]);
            // 4. 更新任务截止日期
            await client.query(`UPDATE tasks SET deadline = $1 WHERE id = $2`, [newDeadline, taskId]);
            // 5. 通知学生
            await client.query(`INSERT INTO notifications (user_id, user_type, type, title, content, related_task_id)
         VALUES ($1, 'student', 'requirement_supplement', '企业补充了需求', $2, $3)`, [
                taskData.accepted_student_id,
                `任务《${taskData.title}》有新的补充需求，截止日期已延长${estimatedDays || 3}天至${newDeadline.toLocaleDateString()}`,
                taskId
            ]);
            logger_1.default.info('Requirement supplement added', {
                taskId,
                companyId,
                estimatedDays,
                newDeadline
            });
            res.json({
                success: true,
                data: {
                    taskId,
                    oldDeadline,
                    newDeadline,
                    estimatedDays: estimatedDays || 3,
                    message: `需求补充成功，截止日期已延长${estimatedDays || 3}天`
                }
            });
        });
    }
    catch (err) {
        next(err);
    }
}
// 导出所有函数
exports.default = {
    getTaskDeliverables,
    approveAndPayFinal,
    finalConfirmation,
    autoConfirmTasks,
    addRequirementSupplement
};
//# sourceMappingURL=verificationFlowController.js.map