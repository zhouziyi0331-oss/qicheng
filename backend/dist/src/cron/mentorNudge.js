"use strict";
// AI导师系统 - Cron定时任务
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startMentorNudgeCron = startMentorNudgeCron;
const node_cron_1 = __importDefault(require("node-cron"));
const controller_1 = require("../routes/mentor/controller");
// 每小时检查一次长时间无操作的学生
function startMentorNudgeCron() {
    if (process.env.NODE_ENV === 'test') {
        console.log('[Mentor Cron] Skipped in test environment');
        return;
    }
    // 每小时的第5分钟执行（避开整点高峰）
    node_cron_1.default.schedule('5 * * * *', async () => {
        console.log('[Mentor Cron] Checking idle students...');
        try {
            await (0, controller_1.checkIdleStudents)();
            console.log('[Mentor Cron] Idle check completed');
        }
        catch (error) {
            console.error('[Mentor Cron] Error:', error);
        }
    });
    console.log('[Mentor Cron] Started - runs every hour at :05');
}
//# sourceMappingURL=mentorNudge.js.map