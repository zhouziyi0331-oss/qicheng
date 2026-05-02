"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = require("../config");
const logger_1 = __importDefault(require("./utils/logger"));
const errorHandler_1 = require("./middleware/errorHandler");
// Route imports (指令1-8 实现)
const auth_1 = __importDefault(require("./routes/auth"));
const user_1 = __importDefault(require("./routes/user"));
const student_1 = __importDefault(require("./routes/student"));
const company_1 = __importDefault(require("./routes/company"));
const tasks_1 = __importDefault(require("./routes/tasks"));
const ability_1 = __importDefault(require("./routes/ability"));
const reports_1 = __importDefault(require("./routes/reports"));
const story_1 = __importDefault(require("./routes/story"));
const mainRoutes_1 = __importDefault(require("./routes/admin/mainRoutes"));
const payments_1 = __importDefault(require("./routes/payments"));
const chat_1 = __importDefault(require("./routes/chat"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const upload_1 = __importDefault(require("./routes/upload"));
const mentor_1 = __importDefault(require("./routes/mentor"));
const trust_1 = __importDefault(require("./routes/trust"));
const invitation_1 = __importDefault(require("./routes/invitation"));
const challenge_1 = __importDefault(require("./routes/challenge"));
const subcontract_1 = __importDefault(require("./routes/subcontract"));
const team_1 = __importDefault(require("./routes/team"));
const disputes_1 = __importDefault(require("./routes/disputes"));
const draftRoutes_1 = __importDefault(require("./routes/tasks/draftRoutes"));
const pricing_1 = __importDefault(require("./routes/pricing"));
const rating_1 = __importDefault(require("./routes/rating"));
const taskLevel_1 = __importDefault(require("./routes/taskLevel"));
const escrow_1 = __importDefault(require("./routes/escrow"));
const communication_1 = __importDefault(require("./routes/communication"));
const challengeGraduation_1 = __importDefault(require("./routes/challengeGraduation"));
const agreement_1 = __importDefault(require("./routes/agreement"));
const aiEngine_1 = __importDefault(require("./routes/aiEngine"));
const opcGrowth_1 = __importDefault(require("./routes/opcGrowth"));
const communityPortfolio_1 = __importDefault(require("./routes/communityPortfolio"));
const opcV2Assessment_1 = __importDefault(require("./routes/opcV2Assessment"));
const opcRoutes_1 = __importDefault(require("./routes/opcRoutes"));
// Cron jobs — only load when not running tests
if (process.env.NODE_ENV !== 'test') {
    require('./jobs/emotionSignalDetector');
    require('./jobs/firstTaskSettlement');
    require('./cron/mentorNudge').startMentorNudgeCron();
    require('./jobs/invitationCron');
    // 启动定时任务调度器（7天自动确认等）
    const { pool } = require('./utils/db');
    const { CronScheduler } = require('./cron/scheduler');
    const cronScheduler = new CronScheduler(pool);
    cronScheduler.start();
    // 优雅关闭时停止定时任务
    process.on('SIGTERM', () => {
        cronScheduler.stop();
    });
    process.on('SIGINT', () => {
        cronScheduler.stop();
    });
}
const app = (0, express_1.default)();
exports.app = app;
// ============================================================
// Security & parsing middleware
// ============================================================
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: config_1.config.env === 'production' ? false : '*' }));
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Rate limiting — disabled in test environment (in-memory store resets per process)
const isTest = config_1.config.env === 'test' || process.env.NODE_ENV === 'test';
app.use((0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: isTest ? 10000 : 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, code: 'RATE_LIMIT', message: '请求过于频繁，请稍后重试' },
}));
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: isTest ? 10000 : 10,
    message: { success: false, code: 'RATE_LIMIT', message: '登录尝试过于频繁，请15分钟后重试' },
});
// ============================================================
// Health check
// ============================================================
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'qicheng-backend', timestamp: new Date().toISOString() });
});
// ============================================================
// Routes
// ============================================================
app.use('/api/v1/auth', authLimiter, auth_1.default);
app.use('/api/v1/user', user_1.default);
app.use('/api/v1/student', student_1.default);
app.use('/api/v1/company', company_1.default);
app.use('/api/v1/tasks', tasks_1.default);
app.use('/api/v1/ability', ability_1.default);
app.use('/api/v1/reports', reports_1.default);
app.use('/api/v1/story', story_1.default);
app.use('/api/v1/admin', mainRoutes_1.default); // 新的管理端路由（包含认证、数据看板等）
app.use('/api/v1/payments', payments_1.default);
app.use('/api/v1/chat', chat_1.default);
app.use('/api/v1/notifications', notifications_1.default);
app.use('/api/v1/upload', upload_1.default);
app.use('/api/v1/mentor', mentor_1.default);
app.use('/api/v1/trust', trust_1.default);
app.use('/api/v1/invitation', invitation_1.default);
app.use('/api/v1/challenge', challenge_1.default);
app.use('/api/v1/subcontract', subcontract_1.default);
app.use('/api/v1/team', team_1.default);
app.use('/api/v1/disputes', disputes_1.default);
app.use('/api/v1/tasks', draftRoutes_1.default); // 草稿箱和追加需求路由
app.use('/api/v1/pricing', pricing_1.default); // AI智能定价建议
app.use('/api/v1/rating', rating_1.default); // 评价系统
app.use('/api/v1/task-level', taskLevel_1.default); // 任务分级和智能匹配
app.use('/api/v1/escrow', escrow_1.default); // 支付托管和提现系统
app.use('/api/v1/communication', communication_1.default); // 任务沟通中转系统
app.use('/api/v1/challenge-graduation', challengeGraduation_1.default); // 跳级挑战与毕业系统
app.use('/api/v1/agreement', agreement_1.default); // 注册协议与数据授权
app.use('/api/v1/ai-engine', aiEngine_1.default); // AI引擎系统
app.use('/api/v1/opc-growth', opcGrowth_1.default); // OPC测评和成长报告系统
app.use('/api/v1/community-portfolio', communityPortfolio_1.default); // 社群和作品展示系统
app.use('/api/v1/opc-v2', opcV2Assessment_1.default); // OPC v2.0 能力画像测试系统
app.use('/api/v1', opcRoutes_1.default); // OPC测试、匹配、导师、等级系统
// Static file serving for uploads
app.use('/uploads', express_1.default.static('uploads'));
// ============================================================
// Error handling
// ============================================================
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
exports.default = app;
// Only start the HTTP server when this module is the entry point, not when imported by tests
if (require.main === module) {
    const server = app.listen(config_1.config.port, () => {
        logger_1.default.info(`🚀 启程 Backend started`, {
            port: config_1.config.port,
            env: config_1.config.env,
        });
    });
    process.on('SIGTERM', () => {
        logger_1.default.info('SIGTERM received, closing server...');
        server.close(() => {
            logger_1.default.info('Server closed');
            process.exit(0);
        });
    });
}
//# sourceMappingURL=app.js.map