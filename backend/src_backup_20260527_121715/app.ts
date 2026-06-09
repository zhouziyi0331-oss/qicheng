import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from '../config';
import logger from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Route imports (指令1-8 实现)
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import studentRoutes from './routes/student';
import companyRoutes from './routes/company';
import taskRoutes from './routes/tasks';
import abilityRoutes from './routes/ability';
import reportRoutes from './routes/reports';
import storyRoutes from './routes/story';
import adminMainRoutes from './routes/admin/mainRoutes';
import paymentRoutes from './routes/payments';
import chatRoutes from './routes/chat';
import notificationRoutes from './routes/notificationRoutes';
import uploadRoutes from './routes/upload';
import mentorRoutes from './routes/mentor';
import enhancedMentorRoutes from './routes/mentor/enhanced-routes';
import mentorStageRoutes from './routes/mentorStageRoutes';
import adminDashboardRoutes from './routes/admin/dashboard';
import trustRoutes from './routes/trust';
import invitationRoutes from './routes/invitation';
import challengeRoutes from './routes/challenge';
import subcontractRoutes from './routes/subcontract';
import teamRoutes from './routes/team';
import disputeRoutes from './routes/disputes';
import draftRoutes from './routes/tasks/draftRoutes';
import pricingRoutes from './routes/pricing';
import ratingRoutes from './routes/rating';
import taskLevelRoutes from './routes/taskLevel';
import escrowRoutes from './routes/escrow';
import escrowRoutesNew from './routes/escrowRoutes';
import communicationRoutes from './routes/communication';
import challengeGraduationRoutes from './routes/challengeGraduation';
import agreementRoutes from './routes/agreement';
import aiEngineRoutes from './routes/aiEngine';
import opcGrowthRoutes from './routes/opcGrowth';
import communityPortfolioRoutes from './routes/communityPortfolio';
import opcV2AssessmentRoutes from './routes/opcV2Assessment';
import opcRoutes from './routes/opcRoutes';
import opcTestRoutes from './routes/opc';
import submissionPreCheckRoutes from './routes/submissionPreCheck';
import taskBreakdownRoutes from './routes/taskBreakdown';
import qaRoutes from './routes/qa';
import invitationMatchingRoutes from './routes/invitationMatching';
import dynamicProfileRoutes from './routes/dynamicProfile';
import partnershipsRoutes from './routes/partnerships';
import alliancesRoutes from './routes/alliances';
import explorationRoutes from './routes/exploration';
import incubationRoutes from './routes/incubation';
import passionRoutes from './routes/passion';
import lifeQuestionRoutes from './routes/life-question';
import messageRelayRoutes from './routes/messageRelayRoutes';
import taskDraftRoutes from './routes/taskDraftRoutes';
import taskAmendmentRoutes from './routes/taskAmendmentRoutes';
import aiPricingRoutes from './routes/aiPricingRoutes';
import ratingRoutesNew from './routes/ratingRoutes';
import taskLevelMatchingRoutes from './routes/taskLevelMatchingRoutes';
import pblAgentRoutes from './routes/pblAgentRoutes';
import unifiedMentorRoutes from './routes/unifiedMentorRoutes';
import securityRoutes from './routes/security';
import workConditionMatchingRoutes from './routes/workConditionMatchingRoutes';
import adminMonitorRoutes from './routes/adminMonitorRoutes';
import orderFlowRoutes from './routes/orderFlowRoutes';

// 新增：等级、跳级、组队、社区系统路由
import jumpTestRoutes from './routes/students/jumpTestRoutes';
import teamsRoutes from './routes/teams';
import communityRoutes from './routes/community';

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

const app = express();

// ============================================================
// Security & parsing middleware
// ============================================================
app.use(helmet());
app.use(cors({ origin: config.env === 'production' ? false : '*' }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting — disabled in test environment (in-memory store resets per process)
const isTest = config.env === 'test' || process.env.NODE_ENV === 'test';

app.use(rateLimit({
  windowMs: 60 * 1000,
  max: isTest ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, code: 'RATE_LIMIT', message: '请求过于频繁，请稍后重试' },
}));

const authLimiter = rateLimit({
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
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/student', studentRoutes);
app.use('/api/v1/company', companyRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/ability', abilityRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/story', storyRoutes);
app.use('/api/v1/admin', adminMainRoutes); // 新的管理端路由（包含认证、数据看板等）
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/mentor', mentorRoutes);
app.use('/api/v1/mentor-stage', mentorStageRoutes); // AI导师4阶段系统
app.use('/api/mentor', enhancedMentorRoutes); // 增强版AI导师路由
app.use('/api/admin', adminDashboardRoutes); // 管理后台API
app.use('/api/v1/trust', trustRoutes);
app.use('/api/v1/invitation', invitationRoutes);
app.use('/api/v1/challenge', challengeRoutes);
app.use('/api/v1/subcontract', subcontractRoutes);
app.use('/api/v1/team', teamRoutes);
app.use('/api/v1/disputes', disputeRoutes);
app.use('/api/v1/escrow', escrowRoutes); // 支付托管和提现系统（旧版）
app.use('/api/v1/escrow-new', escrowRoutesNew); // 支付托管和提现系统（新版-基于UUID）
app.use('/api/v1/communication', communicationRoutes); // 任务沟通中转系统
app.use('/api/v1/challenge-graduation', challengeGraduationRoutes); // 跳级挑战与毕业系统
app.use('/api/v1/agreement', agreementRoutes); // 注册协议与数据授权
app.use('/api/v1/ai-engine', aiEngineRoutes); // AI引擎系统
app.use('/api/v1/opc-growth', opcGrowthRoutes); // OPC测评和成长报告系统
app.use('/api/v1/community-portfolio', communityPortfolioRoutes); // 社群和作品展示系统
app.use('/api/v1/opc-v2', opcV2AssessmentRoutes); // OPC v2.0 能力画像测试系统
app.use('/api/v1', opcRoutes); // OPC测试、匹配、导师、等级系统
app.use('/api/v1', opcTestRoutes); // OPC能力画像测试系统
app.use('/api/v1/submissions', submissionPreCheckRoutes); // 交付物预检系统
app.use('/api/v1/task-breakdown', taskBreakdownRoutes); // 任务拆解系统
app.use('/api/v1/qa', qaRoutes); // 苏格拉底式问答系统
app.use('/api/v1/matching', invitationMatchingRoutes); // 智能匹配系统
app.use('/api/v1/profile', dynamicProfileRoutes); // 动态能力画像系统
app.use('/api/v1/partnerships', partnershipsRoutes); // 合伙人关系系统
app.use('/api/v1/alliances', alliancesRoutes); // 联合体系统
app.use('/api/v1/exploration', explorationRoutes); // 模式探索系统
app.use('/api/v1/incubation', incubationRoutes); // 创业孵化系统
app.use('/api/v1/passion', passionRoutes); // 热情火花系统
app.use('/api/v1/life-question', lifeQuestionRoutes); // 人生反思问题系统
app.use('/api/v1/relay', messageRelayRoutes); // 消息中转系统（防跳单核心）
app.use('/api/v1/task-drafts', taskDraftRoutes); // 任务草稿箱系统
app.use('/api/v1/task-amendments', taskAmendmentRoutes); // 任务追加需求系统
app.use('/api/v1/ai-pricing', aiPricingRoutes); // AI智能定价系统
app.use('/api/v1/ratings-new', ratingRoutesNew); // 评价系统（双向评价+标签）
app.use('/api/v1/task-levels', taskLevelMatchingRoutes); // 任务分级和智能匹配系统
app.use('/api/v1/pbl-agent', pblAgentRoutes); // PBL导师Agent系统（苏格拉底式项目导师）
app.use('/api/v1/unified-mentor', unifiedMentorRoutes); // 统一导师系统（情感+项目协同）
app.use('/api/v1/security', securityRoutes); // 数据安全与联系方式解锁系统
app.use('/api/v1/work-condition', workConditionMatchingRoutes); // 工作条件匹配系统（基于OPC测试的智能匹配）
app.use('/api/v1/admin/monitor', adminMonitorRoutes); // 管理端监控API（队列、WebSocket统计）
app.use('/api/v1/orders', orderFlowRoutes); // 订单流程API（自动触发AI任务）

// 新增：等级、跳级、组队、社区系统
app.use('/api/v1/students', jumpTestRoutes); // 跳级测试系统
app.use('/api/v1/teams', teamsRoutes); // 组队系统
app.use('/api/v1/community', communityRoutes); // 社区板块

// Static file serving for uploads
app.use('/uploads', express.static('uploads'));

// ============================================================
// Error handling
// ============================================================
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
export default app;

// Only start the HTTP server when this module is the entry point, not when imported by tests
if (require.main === module) {
  const server = app.listen(config.port, () => {
    logger.info(`🚀 启程 Backend started`, {
      port: config.port,
      env: config.env,
    });

    // 初始化WebSocket服务
    try {
      const websocketService = require('./services/websocketService').default;
      websocketService.initialize(server);
      logger.info('✅ WebSocket service initialized');
    } catch (error) {
      logger.error('Failed to initialize WebSocket service:', error);
    }
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, closing server...');
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });
}
