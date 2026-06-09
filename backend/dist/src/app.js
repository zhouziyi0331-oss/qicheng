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
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const upload_1 = __importDefault(require("./routes/upload"));
const mentor_1 = __importDefault(require("./routes/mentor"));
const enhanced_routes_1 = __importDefault(require("./routes/mentor/enhanced-routes"));
const mentorStageRoutes_1 = __importDefault(require("./routes/mentorStageRoutes"));
const dashboard_1 = __importDefault(require("./routes/admin/dashboard"));
const trust_1 = __importDefault(require("./routes/trust"));
const invitation_1 = __importDefault(require("./routes/invitation"));
const challenge_1 = __importDefault(require("./routes/challenge"));
const subcontract_1 = __importDefault(require("./routes/subcontract"));
const team_1 = __importDefault(require("./routes/team"));
const disputes_1 = __importDefault(require("./routes/disputes"));
const escrow_1 = __importDefault(require("./routes/escrow"));
const escrowRoutes_1 = __importDefault(require("./routes/escrowRoutes"));
const communication_1 = __importDefault(require("./routes/communication"));
const challengeGraduation_1 = __importDefault(require("./routes/challengeGraduation"));
const agreement_1 = __importDefault(require("./routes/agreement"));
const aiEngine_1 = __importDefault(require("./routes/aiEngine"));
const opcGrowth_1 = __importDefault(require("./routes/opcGrowth"));
const communityPortfolio_1 = __importDefault(require("./routes/communityPortfolio"));
const opcV2Assessment_1 = __importDefault(require("./routes/opcV2Assessment"));
const opcRoutes_1 = __importDefault(require("./routes/opcRoutes"));
const opc_1 = __importDefault(require("./routes/opc"));
const submissionPreCheck_1 = __importDefault(require("./routes/submissionPreCheck"));
const taskBreakdown_1 = __importDefault(require("./routes/taskBreakdown"));
const qa_1 = __importDefault(require("./routes/qa"));
const invitationMatching_1 = __importDefault(require("./routes/invitationMatching"));
const dynamicProfile_1 = __importDefault(require("./routes/dynamicProfile"));
const partnerships_1 = __importDefault(require("./routes/partnerships"));
const alliances_1 = __importDefault(require("./routes/alliances"));
const exploration_1 = __importDefault(require("./routes/exploration"));
const incubation_1 = __importDefault(require("./routes/incubation"));
const passion_1 = __importDefault(require("./routes/passion"));
const life_question_1 = __importDefault(require("./routes/life-question"));
const messageRelayRoutes_1 = __importDefault(require("./routes/messageRelayRoutes"));
const taskDraftRoutes_1 = __importDefault(require("./routes/taskDraftRoutes"));
const taskAmendmentRoutes_1 = __importDefault(require("./routes/taskAmendmentRoutes"));
const aiPricingRoutes_1 = __importDefault(require("./routes/aiPricingRoutes"));
const ratingRoutes_1 = __importDefault(require("./routes/ratingRoutes"));
const taskLevelMatchingRoutes_1 = __importDefault(require("./routes/taskLevelMatchingRoutes"));
const pblAgentRoutes_1 = __importDefault(require("./routes/pblAgentRoutes"));
const unifiedMentorRoutes_1 = __importDefault(require("./routes/unifiedMentorRoutes"));
const security_1 = __importDefault(require("./routes/security"));
const workConditionMatchingRoutes_1 = __importDefault(require("./routes/workConditionMatchingRoutes"));
const adminMonitorRoutes_1 = __importDefault(require("./routes/adminMonitorRoutes"));
const orderFlowRoutes_1 = __importDefault(require("./routes/orderFlowRoutes"));
const authIsolationRoutes_1 = __importDefault(require("./routes/authIsolationRoutes"));
// 新增：等级、跳级、组队、社区系统路由
const jumpTestRoutes_1 = __importDefault(require("./routes/students/jumpTestRoutes"));
const teams_1 = __importDefault(require("./routes/teams"));
const community_1 = __importDefault(require("./routes/community"));
// 新增：三次审核兜底、组队、社区、大师系统路由
const threeStrikeRoutes_1 = __importDefault(require("./routes/tasks/threeStrikeRoutes"));
const teamRoutes_1 = __importDefault(require("./routes/teamRoutes"));
const communityRoutes_1 = __importDefault(require("./routes/communityRoutes"));
const masterRoutes_1 = __importDefault(require("./routes/masterRoutes"));
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
    // 启动匹配调度器（每天自动重新匹配）
    const matchingScheduler = require('./services/matchingScheduler').default;
    matchingScheduler.start();
    // 优雅关闭时停止定时任务
    process.on('SIGTERM', () => {
        cronScheduler.stop();
        matchingScheduler.stop();
    });
    process.on('SIGINT', () => {
        cronScheduler.stop();
        matchingScheduler.stop();
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
app.use('/api/v1', authIsolationRoutes_1.default);
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
app.use('/api/v1/notifications', notificationRoutes_1.default);
app.use('/api/v1/upload', upload_1.default);
app.use('/api/v1/mentor', mentor_1.default);
app.use('/api/v1/mentor-stage', mentorStageRoutes_1.default); // AI导师4阶段系统
app.use('/api/mentor', enhanced_routes_1.default); // 增强版AI导师路由
app.use('/api/admin', dashboard_1.default); // 管理后台API
app.use('/api/v1/trust', trust_1.default);
app.use('/api/v1/invitation', invitation_1.default);
app.use('/api/v1/challenge', challenge_1.default);
app.use('/api/v1/subcontract', subcontract_1.default);
app.use('/api/v1/team', team_1.default);
app.use('/api/v1/disputes', disputes_1.default);
app.use('/api/v1/escrow', escrow_1.default); // 支付托管和提现系统（旧版）
app.use('/api/v1/escrow-new', escrowRoutes_1.default); // 支付托管和提现系统（新版-基于UUID）
app.use('/api/v1/communication', communication_1.default); // 任务沟通中转系统
app.use('/api/v1/challenge-graduation', challengeGraduation_1.default); // 跳级挑战与毕业系统
app.use('/api/v1/agreement', agreement_1.default); // 注册协议与数据授权
app.use('/api/v1/ai-engine', aiEngine_1.default); // AI引擎系统
app.use('/api/v1/opc-growth', opcGrowth_1.default); // OPC测评和成长报告系统
app.use('/api/v1/community-portfolio', communityPortfolio_1.default); // 社群和作品展示系统
app.use('/api/v1/opc-v2', opcV2Assessment_1.default); // OPC v2.0 能力画像测试系统
app.use('/api/v1', opcRoutes_1.default); // OPC测试、匹配、导师、等级系统
app.use('/api/v1', opc_1.default); // OPC能力画像测试系统
app.use('/api/v1/submissions', submissionPreCheck_1.default); // 交付物预检系统
app.use('/api/v1/task-breakdown', taskBreakdown_1.default); // 任务拆解系统
app.use('/api/v1/qa', qa_1.default); // 苏格拉底式问答系统
app.use('/api/v1/matching', invitationMatching_1.default); // 智能匹配系统
app.use('/api/v1/profile', dynamicProfile_1.default); // 动态能力画像系统
app.use('/api/v1/partnerships', partnerships_1.default); // 合伙人关系系统
app.use('/api/v1/alliances', alliances_1.default); // 联合体系统
app.use('/api/v1/exploration', exploration_1.default); // 模式探索系统
app.use('/api/v1/incubation', incubation_1.default); // 创业孵化系统
app.use('/api/v1/passion', passion_1.default); // 热情火花系统
app.use('/api/v1/life-question', life_question_1.default); // 人生反思问题系统
app.use('/api/v1/relay', messageRelayRoutes_1.default); // 消息中转系统（防跳单核心）
app.use('/api/v1/task-drafts', taskDraftRoutes_1.default); // 任务草稿箱系统
app.use('/api/v1/task-amendments', taskAmendmentRoutes_1.default); // 任务追加需求系统
app.use('/api/v1/ai-pricing', aiPricingRoutes_1.default); // AI智能定价系统
app.use('/api/v1/ratings-new', ratingRoutes_1.default); // 评价系统（双向评价+标签）
app.use('/api/v1/task-levels', taskLevelMatchingRoutes_1.default); // 任务分级和智能匹配系统
app.use('/api/v1/pbl-agent', pblAgentRoutes_1.default); // PBL导师Agent系统（苏格拉底式项目导师）
app.use('/api/v1/unified-mentor', unifiedMentorRoutes_1.default); // 统一导师系统（情感+项目协同）
app.use('/api/v1/security', security_1.default); // 数据安全与联系方式解锁系统
app.use('/api/v1/work-condition', workConditionMatchingRoutes_1.default); // 工作条件匹配系统（基于OPC测试的智能匹配）
app.use('/api/v1/admin/monitor', adminMonitorRoutes_1.default); // 管理端监控API（队列、WebSocket统计）
app.use('/api/v1/orders', orderFlowRoutes_1.default); // 订单流程API（自动触发AI任务）
// 新增：等级、跳级、组队、社区系统
app.use('/api/v1/students', jumpTestRoutes_1.default); // 跳级测试系统
app.use('/api/v1/teams', teams_1.default); // 组队系统（旧版）
app.use('/api/v1/community', community_1.default); // 社区板块（旧版）
// 新增：三次审核兜底、组队、社区、大师系统（新版）
app.use('/api/v1/tasks', threeStrikeRoutes_1.default); // 三次审核兜底系统
app.use('/api/v1/teams-new', teamRoutes_1.default); // 组队系统（新版）
app.use('/api/v1/community-new', communityRoutes_1.default); // 社区板块（新版）
app.use('/api/v1/master', masterRoutes_1.default); // 大师系统
app.use('/api/v1/masters', masterRoutes_1.default); // 大师系统（别名）
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
        // 初始化WebSocket服务
        try {
            const websocketService = require('./services/websocketService').default;
            websocketService.initialize(server);
            logger_1.default.info('✅ WebSocket service initialized');
        }
        catch (error) {
            logger_1.default.error('Failed to initialize WebSocket service:', error);
        }
        // 启动导师队列处理器
        try {
            const mentorQueueService = require('./services/mentorQueueService').default;
            mentorQueueService.start();
            logger_1.default.info('✅ Mentor queue processor started');
        }
        catch (error) {
            logger_1.default.error('Failed to start mentor queue processor:', error);
        }
    });
    process.on('SIGTERM', () => {
        logger_1.default.info('SIGTERM received, closing server...');
        // 停止导师队列处理器
        try {
            const mentorQueueService = require('./services/mentorQueueService').default;
            mentorQueueService.stop();
            logger_1.default.info('✅ Mentor queue processor stopped');
        }
        catch (error) {
            logger_1.default.error('Failed to stop mentor queue processor:', error);
        }
        server.close(() => {
            logger_1.default.info('Server closed');
            process.exit(0);
        });
    });
}
//# sourceMappingURL=app.js.map