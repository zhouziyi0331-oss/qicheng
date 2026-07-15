"use strict";
/**
 * Phase R5.3: 报告生成队列Worker
 * 处理后台报告生成任务
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startReportWorker = startReportWorker;
exports.stopReportWorker = stopReportWorker;
const queue_1 = require("../config/queue");
const queue_2 = require("../config/queue");
const db_1 = require("../utils/db");
const logger_1 = __importDefault(require("../utils/logger"));
const reportGeneratorAgent_1 = __importDefault(require("../agents/reportGeneratorAgent"));
const reportTriggerService_1 = require("../services/reportTriggerService");
/**
 * 启动报告生成Worker
 */
function startReportWorker() {
    logger_1.default.info('[报告Worker] 启动报告生成Worker');
    // 处理报告生成任务
    queue_1.reportQueue.process('generate-report', 3, async (job) => {
        const startTime = Date.now();
        const jobData = job.data;
        logger_1.default.info('[报告Worker] 开始处理报告生成任务', {
            jobId: job.id,
            studentId: jobData.studentId,
            trigger: jobData.trigger
        });
        try {
            // 1. 生成报告
            const report = await reportGeneratorAgent_1.default.generateReport(jobData.studentId, {
                reportType: jobData.reportType || 'comprehensive',
                timeRange: 90
            });
            // 2. 保存到数据库
            await (0, db_1.query)(`INSERT INTO student_reports (student_id, report_type, report_data, generated_at, generated_for_company_id)
         VALUES ($1, $2, $3, NOW(), $4)`, [
                jobData.studentId,
                jobData.reportType || 'comprehensive',
                JSON.stringify(report),
                jobData.triggerContext?.requestedBy || null
            ]);
            // 3. 发送通知（异步，不阻塞）
            await sendReportNotification(jobData);
            const duration = Date.now() - startTime;
            logger_1.default.info('[报告Worker] 报告生成完成', {
                jobId: job.id,
                studentId: jobData.studentId,
                trigger: jobData.trigger,
                duration
            });
            return {
                success: true,
                studentId: jobData.studentId,
                reportType: jobData.reportType,
                trigger: jobData.trigger,
                duration
            };
        }
        catch (error) {
            logger_1.default.error('[报告Worker] 报告生成失败', {
                jobId: job.id,
                studentId: jobData.studentId,
                trigger: jobData.trigger,
                error: error.message,
                stack: error.stack
            });
            throw error; // 抛出错误以触发重试机制
        }
    });
    logger_1.default.info('[报告Worker] 报告生成Worker已启动，并发数: 3');
}
/**
 * 发送报告生成通知
 */
async function sendReportNotification(jobData) {
    try {
        // 根据触发类型构建通知内容
        let notificationContent = '';
        let notificationTitle = '';
        switch (jobData.trigger) {
            case reportTriggerService_1.ReportTrigger.LEVEL_UPGRADE:
                notificationTitle = '恭喜升级！';
                notificationContent = `你已升级到 Lv.${jobData.triggerContext?.newLevel}，查看你的最新能力报告吧！`;
                break;
            case reportTriggerService_1.ReportTrigger.TASK_MILESTONE:
                notificationTitle = '里程碑达成！';
                notificationContent = `你已完成第 ${jobData.triggerContext?.taskCount} 个任务，查看你的成长报告！`;
                break;
            case reportTriggerService_1.ReportTrigger.PURCHASE_REQUEST:
                notificationTitle = '企业查看了你的报告';
                notificationContent = '有企业购买并查看了你的能力报告，快去看看吧！';
                break;
            case reportTriggerService_1.ReportTrigger.PERIODIC_WEEKLY:
                notificationTitle = '本周成长报告';
                notificationContent = '你的本周成长报告已生成，看看这周有什么进步吧！';
                break;
            case reportTriggerService_1.ReportTrigger.PERIODIC_MONTHLY:
                notificationTitle = '本月成长报告';
                notificationContent = '你的本月成长报告已生成，回顾一下这个月的成长！';
                break;
            default:
                notificationTitle = '能力报告已生成';
                notificationContent = '你的最新能力报告已生成，快来查看吧！';
        }
        // 添加到通知队列
        await queue_2.notificationQueue.add('send-notification', {
            userId: jobData.studentId,
            type: 'report_generated',
            title: notificationTitle,
            content: notificationContent,
            data: {
                trigger: jobData.trigger,
                reportType: jobData.reportType,
                triggerContext: jobData.triggerContext
            }
        });
        logger_1.default.info('[报告Worker] 通知已加入队列', {
            studentId: jobData.studentId,
            trigger: jobData.trigger
        });
    }
    catch (error) {
        logger_1.default.error('[报告Worker] 发送通知失败', {
            studentId: jobData.studentId,
            error: error.message
        });
        // 通知失败不影响报告生成，不抛出错误
    }
}
/**
 * 停止报告生成Worker
 */
async function stopReportWorker() {
    logger_1.default.info('[报告Worker] 停止报告生成Worker');
    await queue_1.reportQueue.close();
    logger_1.default.info('[报告Worker] 报告生成Worker已停止');
}
//# sourceMappingURL=reportWorker.js.map