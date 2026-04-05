"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 情绪信号检测 Cron Job (v7新增)
 * 每小时扫描用户行为，更新情绪状态信号
 * 触发规则 (来自 PRD Ch.13 & Ch.26):
 * - 连续3天未登录 → cooling (冷却)
 * - 任务被打回2次 → frustrated (挫败)
 * - 连续2个任务被打回 → high_frustrated → 客服主动联系
 * - 完成任务后24h内再次登录 → excited (兴奋)
 */
const node_cron_1 = __importDefault(require("node-cron"));
const db_1 = require("../utils/db");
const logger_1 = __importDefault(require("../utils/logger"));
// 每小时运行
node_cron_1.default.schedule('0 * * * *', async () => {
    try {
        await Promise.all([
            detectCoolingSignals(),
            detectHighFrustratedSignals(),
        ]);
    }
    catch (err) {
        logger_1.default.error('Emotion signal detection cron failed', { error: err.message });
    }
});
// ============================================================
// 冷却信号: 连续3天未登录 + 有未完成任务
// ============================================================
async function detectCoolingSignals() {
    const coldUsers = await (0, db_1.query)(`SELECT u.id as user_id
     FROM users u
     JOIN task_assignments ta ON ta.student_id = u.id AND ta.status = 'accepted'
     WHERE u.role = 'student'
       AND u.last_login_at < NOW() - interval '3 days'
       AND NOT EXISTS (
         SELECT 1 FROM emotion_signals es
         WHERE es.user_id = u.id
           AND es.signal_type = 'cooling'
           AND es.detected_at > NOW() - interval '3 days'
       )
     LIMIT 100`);
    for (const { user_id } of coldUsers) {
        await (0, db_1.query)(`INSERT INTO emotion_signals (user_id, signal_type, signal_value, trigger_event)
       VALUES ($1, 'cooling', 5, 'inactive_3_days')
       ON CONFLICT DO NOTHING`, [user_id]);
        // 推送「同类人故事」(不催促，只展示)
        await (0, db_1.query)(`INSERT INTO notifications (user_id, type, title, content, action_url)
       VALUES ($1, 'peer_story', '看看和你差不多的人最近在做什么', '不催你——只是想告诉你，你的任务还在等你', '/story/peers')`, [user_id]);
    }
    if (coldUsers.length > 0)
        logger_1.default.info(`Cooling signals detected: ${coldUsers.length} users`);
}
// ============================================================
// 高挫败信号: 连续2个任务被打回 → 客服主动联系
// ============================================================
async function detectHighFrustratedSignals() {
    const highFrustrated = await (0, db_1.query)(`SELECT student_id as user_id
     FROM task_submissions
     WHERE status = 'rejected'
       AND submitted_at > NOW() - interval '7 days'
     GROUP BY student_id
     HAVING COUNT(*) >= 2
       AND NOT EXISTS (
         SELECT 1 FROM notifications n
         WHERE n.user_id = task_submissions.student_id
           AND n.type = 'cs_contact'
           AND n.created_at > NOW() - interval '7 days'
       )
     LIMIT 50`);
    for (const { user_id } of highFrustrated) {
        // 通知客服主动联系
        await (0, db_1.query)(`INSERT INTO notifications (user_id, type, title, content)
       VALUES ($1, 'cs_contact', '我们来帮你', '你最近遇到了一些挑战——我们的顾问想和你聊聊，帮你找到突破口')`, [user_id]);
    }
    if (highFrustrated.length > 0)
        logger_1.default.info(`High frustrated users: ${highFrustrated.length}`);
}
logger_1.default.info('Emotion signal detector cron started (every hour)');
//# sourceMappingURL=emotionSignalDetector.js.map