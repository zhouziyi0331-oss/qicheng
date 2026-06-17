"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mentorTriggerCronService = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const database_1 = require("../config/database");
const mentorAutoTriggerService_1 = __importDefault(require("./mentorAutoTriggerService"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * AI导师自动触发定时任务服务
 *
 * 功能：
 * 1. 每30秒检查一次待触发的记录
 * 2. 执行到期的触发任务
 * 3. 更新触发状态
 */
class MentorTriggerCronService {
    constructor() {
        this.cronJob = null;
        this.isProcessing = false;
    }
    /**
     * 启动定时任务
     */
    start() {
        if (this.cronJob) {
            logger_1.default.warn('Mentor trigger cron job already running');
            return;
        }
        // 每30秒执行一次
        this.cronJob = node_cron_1.default.schedule('*/30 * * * * *', async () => {
            await this.processPendingTriggers();
        });
        logger_1.default.info('Mentor trigger cron job started (every 30 seconds)');
    }
    /**
     * 停止定时任务
     */
    stop() {
        if (this.cronJob) {
            this.cronJob.stop();
            this.cronJob = null;
            logger_1.default.info('Mentor trigger cron job stopped');
        }
    }
    /**
     * 处理待触发的记录
     */
    async processPendingTriggers() {
        // 防止并发执行
        if (this.isProcessing) {
            return;
        }
        this.isProcessing = true;
        try {
            // 查询所有到期的待触发记录
            const result = await database_1.pool.query(`SELECT id, order_id, trigger_type
         FROM mentor_trigger_logs
         WHERE status = 'pending'
           AND scheduled_at <= NOW()
         ORDER BY scheduled_at ASC
         LIMIT 10`);
            const triggers = result.rows;
            if (triggers.length === 0) {
                return;
            }
            logger_1.default.info(`Processing ${triggers.length} pending mentor triggers`);
            // 逐个处理触发任务
            for (const trigger of triggers) {
                await this.executeTrigger(trigger);
            }
        }
        catch (error) {
            logger_1.default.error('Error processing pending triggers:', error);
        }
        finally {
            this.isProcessing = false;
        }
    }
    /**
     * 执行单个触发任务
     */
    async executeTrigger(trigger) {
        const { id, order_id, trigger_type } = trigger;
        try {
            logger_1.default.info(`Executing ${trigger_type} for order ${order_id}`);
            let messageId = null;
            // 根据触发类型调用对应的服务方法
            switch (trigger_type) {
                case 'T-01':
                    messageId = (await mentorAutoTriggerService_1.default.triggerT01(order_id));
                    break;
                case 'T-03':
                    messageId = (await mentorAutoTriggerService_1.default.triggerT03(order_id, undefined));
                    break;
                case 'T-05':
                    messageId = (await mentorAutoTriggerService_1.default.triggerT05(order_id, undefined));
                    break;
                default:
                    throw new Error(`Unknown trigger type: ${trigger_type}`);
            }
            // 更新触发记录为成功
            await database_1.pool.query(`UPDATE mentor_trigger_logs
         SET status = 'triggered',
             triggered_at = NOW(),
             message_id = $1,
             updated_at = NOW()
         WHERE id = $2`, [messageId, id]);
            logger_1.default.info(`Successfully executed ${trigger_type} for order ${order_id}, message_id: ${messageId}`);
        }
        catch (error) {
            logger_1.default.error(`Failed to execute ${trigger_type} for order ${order_id}:`, error);
            // 更新触发记录为失败
            await database_1.pool.query(`UPDATE mentor_trigger_logs
         SET status = 'failed',
             error_message = $1,
             updated_at = NOW()
         WHERE id = $2`, [error.message || 'Unknown error', id]);
        }
    }
    /**
     * 手动触发处理（用于测试或立即执行）
     */
    async processNow() {
        logger_1.default.info('Manual trigger processing requested');
        await this.processPendingTriggers();
    }
    /**
     * 获取待处理的触发任务数量
     */
    async getPendingCount() {
        const result = await database_1.pool.query(`SELECT COUNT(*) as count
       FROM mentor_trigger_logs
       WHERE status = 'pending'
         AND scheduled_at <= NOW()`);
        return parseInt(result.rows[0].count, 10);
    }
    /**
     * 获取触发统计信息
     */
    async getStats() {
        const result = await database_1.pool.query(`SELECT
         trigger_type,
         status,
         COUNT(*) as count
       FROM mentor_trigger_logs
       WHERE created_at >= NOW() - INTERVAL '24 hours'
       GROUP BY trigger_type, status
       ORDER BY trigger_type, status`);
        return result.rows;
    }
}
exports.mentorTriggerCronService = new MentorTriggerCronService();
//# sourceMappingURL=mentorTriggerCronService.js.map