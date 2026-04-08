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
const student_1 = __importDefault(require("./routes/student"));
const company_1 = __importDefault(require("./routes/company"));
const tasks_1 = __importDefault(require("./routes/tasks"));
const ability_1 = __importDefault(require("./routes/ability"));
const reports_1 = __importDefault(require("./routes/reports"));
const story_1 = __importDefault(require("./routes/story"));
const admin_1 = __importDefault(require("./routes/admin"));
const payments_1 = __importDefault(require("./routes/payments"));
const chat_1 = __importDefault(require("./routes/chat"));
const notification_1 = __importDefault(require("./routes/notification"));
const upload_1 = __importDefault(require("./routes/upload"));
const mentor_1 = __importDefault(require("./routes/mentor"));
const trust_1 = __importDefault(require("./routes/trust"));
const invitation_1 = __importDefault(require("./routes/invitation"));
const challenge_1 = __importDefault(require("./routes/challenge"));
const subcontract_1 = __importDefault(require("./routes/subcontract"));
const adminRoutes_1 = __importDefault(require("./routes/admin/adminRoutes"));
const team_1 = __importDefault(require("./routes/team"));
// Cron jobs — only load when not running tests
if (process.env.NODE_ENV !== 'test') {
    require('./jobs/emotionSignalDetector');
    require('./jobs/firstTaskSettlement');
    require('./cron/mentorNudge').startMentorNudgeCron();
    require('./jobs/invitationCron');
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
app.use('/api/v1/student', student_1.default);
app.use('/api/v1/company', company_1.default);
app.use('/api/v1/tasks', tasks_1.default);
app.use('/api/v1/ability', ability_1.default);
app.use('/api/v1/reports', reports_1.default);
app.use('/api/v1/story', story_1.default);
app.use('/api/v1/admin', admin_1.default);
app.use('/api/v1/payments', payments_1.default);
app.use('/api/v1/chat', chat_1.default);
app.use('/api/v1/notification', notification_1.default);
app.use('/api/v1/upload', upload_1.default);
app.use('/api/v1/mentor', mentor_1.default);
app.use('/api/v1/trust', trust_1.default);
app.use('/api/v1/invitation', invitation_1.default);
app.use('/api/v1/challenge', challenge_1.default);
app.use('/api/v1/subcontract', subcontract_1.default);
app.use('/api/v1/admin-management', adminRoutes_1.default);
app.use('/api/v1/team', team_1.default);
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