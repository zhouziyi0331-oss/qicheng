"use strict";
/**
 * AI任务队列Worker进程
 * 专门处理AI相关的异步任务
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./services/aiTaskQueue");
const logger_1 = __importDefault(require("./utils/logger"));
const config_1 = require("../config");
logger_1.default.info('🤖 AI Task Worker started', {
    env: config_1.config.env,
    redis: config_1.config.redis.url
});
// 优雅关闭
process.on('SIGTERM', async () => {
    logger_1.default.info('SIGTERM received, shutting down worker...');
    const aiTaskQueue = require('./services/aiTaskQueue').default;
    await aiTaskQueue.close();
    logger_1.default.info('Worker shut down gracefully');
    process.exit(0);
});
process.on('SIGINT', async () => {
    logger_1.default.info('SIGINT received, shutting down worker...');
    const aiTaskQueue = require('./services/aiTaskQueue').default;
    await aiTaskQueue.close();
    logger_1.default.info('Worker shut down gracefully');
    process.exit(0);
});
// 未捕获的异常
process.on('uncaughtException', (error) => {
    logger_1.default.error('Uncaught exception in worker:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.default.error('Unhandled rejection in worker:', { reason, promise });
    process.exit(1);
});
// 保持进程运行
logger_1.default.info('Worker is ready to process AI tasks');
//# sourceMappingURL=worker.js.map