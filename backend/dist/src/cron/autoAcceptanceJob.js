"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoAcceptanceJob = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * 48小时自动确认交付任务
 * 企业在学生提交交付物后48小时内未确认，系统自动确认交付
 * 保护学生权益，避免企业恶意拖延确认
 */
class AutoAcceptanceJob {
    constructor(pool) {
        this.pool = pool;
    }
    /**
     * 执行自动确认任务
     */
    async execute() {
        const client = await this.pool.connect();
        try {
            logger_1.default.info('开始执行48小时自动确认任务');
            // 查找所有需要自动确认的订单
            // 条件：状态为submitted，提交时间超过48小时，且未自动确认过
            const query = `
        SELECT
          o.id as order_id,
          o.task_id,
          o.student_id,
          o.company_id,
          t.title as task_title,
          o.submitted_at,
          NOW() - o.submitted_at as elapsed_time
        FROM orders o
        INNER JOIN tasks t ON o.task_id = t.id
        WHERE o.status = 'submitted'
          AND o.submitted_at < NOW() - INTERVAL '48 hours'
          AND NOT EXISTS (
            SELECT 1 FROM auto_acceptances aa
            WHERE aa.order_id = o.id
          )
        ORDER BY o.submitted_at ASC
      `;
            const result = await client.query(query);
            const ordersToAccept = result.rows;
            logger_1.default.info(`找到${ordersToAccept.length}个需要自动确认的订单`);
            if (ordersToAccept.length === 0) {
                return;
            }
            // 逐个处理
            for (const order of ordersToAccept) {
                try {
                    await client.query('BEGIN');
                    // 1. 更新订单状态为completed
                    await client.query(`UPDATE orders SET status = 'completed', completed_at = NOW() WHERE id = $1`, [order.order_id]);
                    // 2. 更新任务状态为completed
                    await client.query(`UPDATE tasks SET status = 'completed', completed_at = NOW() WHERE id = $1`, [order.task_id]);
                    // 3. 记录自动确认
                    await client.query(`INSERT INTO auto_acceptances (order_id, task_id, student_id, company_id, reason, executed_at)
             VALUES ($1, $2, $3, $4, $5, NOW())`, [
                        order.order_id,
                        order.task_id,
                        order.student_id,
                        order.company_id,
                        '企业48小时内未确认，系统自动确认交付'
                    ]);
                    // 4. 发送通知给学生
                    await client.query(`INSERT INTO notifications (user_id, type, title, content, created_at)
             VALUES ($1, $2, $3, $4, NOW())`, [
                        order.student_id,
                        'order_auto_accepted',
                        '交付已自动确认',
                        `您的任务「${order.task_title}」企业48小时内未确认，系统已自动确认交付。尾款将在24小时内到账。`
                    ]);
                    // 5. 发送通知给企业
                    await client.query(`INSERT INTO notifications (user_id, type, title, content, created_at)
             VALUES ($1, $2, $3, $4, NOW())`, [
                        order.company_id,
                        'order_auto_accepted',
                        '任务已自动确认',
                        `任务「${order.task_title}」超过48小时未确认，系统已自动确认交付。`
                    ]);
                    await client.query('COMMIT');
                    logger_1.default.info(`✅ 自动确认订单: ${order.order_id}, 任务: ${order.task_title}`);
                }
                catch (error) {
                    await client.query('ROLLBACK');
                    logger_1.default.error(`❌ 自动确认订单 ${order.order_id} 失败:`, error);
                }
            }
            logger_1.default.info(`48小时自动确认任务完成，处理了${ordersToAccept.length}个订单`);
        }
        catch (error) {
            logger_1.default.error('执行48小时自动确认任务失败:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * 获取Cron调度表达式
     * 每小时执行一次
     */
    static getCronSchedule() {
        return '0 * * * *'; // 每小时的第0分钟执行
    }
}
exports.AutoAcceptanceJob = AutoAcceptanceJob;
//# sourceMappingURL=autoAcceptanceJob.js.map