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
import adminRoutes from './routes/admin';
import paymentRoutes from './routes/payments';
import chatRoutes from './routes/chat';
import notificationRoutes from './routes/notification';
import uploadRoutes from './routes/upload';
import mentorRoutes from './routes/mentor';
import trustRoutes from './routes/trust';
import invitationRoutes from './routes/invitation';
import challengeRoutes from './routes/challenge';
import subcontractRoutes from './routes/subcontract';
import adminManagementRoutes from './routes/admin/adminRoutes';
import teamRoutes from './routes/team';
import disputeRoutes from './routes/disputes';
import draftRoutes from './routes/tasks/draftRoutes';
import pricingRoutes from './routes/pricing';
import ratingRoutes from './routes/rating';
import taskLevelRoutes from './routes/taskLevel';
import escrowRoutes from './routes/escrow';
import communicationRoutes from './routes/communication';
import challengeGraduationRoutes from './routes/challengeGraduation';
import agreementRoutes from './routes/agreement';
import aiEngineRoutes from './routes/aiEngine';

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
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/notification', notificationRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/mentor', mentorRoutes);
app.use('/api/v1/trust', trustRoutes);
app.use('/api/v1/invitation', invitationRoutes);
app.use('/api/v1/challenge', challengeRoutes);
app.use('/api/v1/subcontract', subcontractRoutes);
app.use('/api/v1/admin-management', adminManagementRoutes);
app.use('/api/v1/team', teamRoutes);
app.use('/api/v1/disputes', disputeRoutes);
app.use('/api/v1/tasks', draftRoutes); // 草稿箱和追加需求路由
app.use('/api/v1/pricing', pricingRoutes); // AI智能定价建议
app.use('/api/v1/rating', ratingRoutes); // 评价系统
app.use('/api/v1/task-level', taskLevelRoutes); // 任务分级和智能匹配
app.use('/api/v1/escrow', escrowRoutes); // 支付托管和提现系统
app.use('/api/v1/communication', communicationRoutes); // 任务沟通中转系统
app.use('/api/v1/challenge-graduation', challengeGraduationRoutes); // 跳级挑战与毕业系统
app.use('/api/v1/agreement', agreementRoutes); // 注册协议与数据授权
app.use('/api/v1/ai-engine', aiEngineRoutes); // AI引擎系统

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
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, closing server...');
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });
}
