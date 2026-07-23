"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const practice_routes_1 = __importDefault(require("./routes/practice.routes"));
const contactExchange_routes_1 = __importDefault(require("./routes/contactExchange.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const growth_routes_1 = __importDefault(require("./routes/growth.routes"));
const realProject_routes_1 = __importDefault(require("./routes/realProject.routes"));
const financial_routes_1 = __importDefault(require("./routes/financial.routes"));
const taskProgress_routes_1 = __importDefault(require("./routes/taskProgress.routes"));
const favorite_routes_1 = __importDefault(require("./routes/favorite.routes"));
const achievement_routes_1 = __importDefault(require("./routes/achievement.routes"));
const secretSpace_routes_1 = __importDefault(require("./routes/secretSpace.routes"));
const task_routes_1 = __importDefault(require("./routes/task.routes"));
const opc_routes_1 = __importDefault(require("./routes/opc.routes"));
const mentor_routes_1 = __importDefault(require("./routes/mentor.routes"));
const level_routes_1 = __importDefault(require("./routes/level.routes"));
const monitor_middleware_1 = require("./middleware/monitor.middleware");
const scheduledTasks_1 = require("./utils/scheduledTasks");
// 加载环境变量
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// 中间件
app.use((0, cors_1.default)({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// 性能监控和统计
app.use(monitor_middleware_1.performanceMonitor);
app.use(monitor_middleware_1.statisticsCollector);
// 日志中间件
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});
// 健康检查
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: '启程OPC后端服务',
        version: '1.0.0'
    });
});
// API路由
app.use('/api/auth', auth_routes_1.default);
app.use('/api/practice', practice_routes_1.default);
app.use('/api/contact-exchange', contactExchange_routes_1.default);
app.use('/api/payment', payment_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/growth', growth_routes_1.default);
app.use('/api/real-projects', realProject_routes_1.default);
app.use('/api/financial', financial_routes_1.default);
app.use('/api/task-progress', taskProgress_routes_1.default);
app.use('/api/favorites', favorite_routes_1.default);
app.use('/api/achievements', achievement_routes_1.default);
app.use('/api/secret-space', secretSpace_routes_1.default);
app.use('/api/tasks', task_routes_1.default);
app.use('/api/opc', opc_routes_1.default);
app.use('/api/mentor', mentor_routes_1.default);
app.use('/api/level', level_routes_1.default);
// 404处理
app.use((req, res) => {
    res.status(404).json({ error: '接口不存在' });
});
// 全局错误处理
app.use((err, req, res, next) => {
    console.error('全局错误:', err);
    res.status(500).json({
        error: '服务器内部错误',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});
// 启动服务
const startServer = async () => {
    try {
        // 连接数据库
        await (0, database_1.connectDatabase)();
        // 启动定时任务
        scheduledTasks_1.scheduledTasks.start();
        // 启动HTTP服务
        app.listen(PORT, () => {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('✓ 启程OPC后端服务启动成功');
            console.log(`✓ 服务器运行在: http://localhost:${PORT}`);
            console.log(`✓ 环境: ${process.env.NODE_ENV || 'development'}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('\n可用接口:');
            console.log('  GET  /health - 健康检查');
            console.log('\n认证相关:');
            console.log('  POST /api/auth/wechat-login - 微信登录');
            console.log('  GET  /api/auth/profile - 获取用户信息');
            console.log('  PUT  /api/auth/profile - 更新用户信息');
            console.log('\n实践项目:');
            console.log('  GET  /api/practice/projects - 获取实践项目列表');
            console.log('  GET  /api/practice/projects/:id/report - 获取项目报告');
            console.log('  GET  /api/practice/stats - 获取统计数据');
            console.log('  POST /api/practice/decomposition/generate - 生成AI拆解报告');
            console.log('\n联系方式交换:');
            console.log('  GET  /api/contact-exchange/partners - 获取合作伙伴');
            console.log('  POST /api/contact-exchange/request - 请求交换联系方式');
            console.log('\n管理接口:');
            console.log('  GET  /api/admin/stats - 系统统计');
            console.log('  GET  /api/admin/health-check - 详细健康检查');
            console.log('\n个人成长:');
            console.log('  POST /api/growth/assessment - 提交OC测评');
            console.log('  GET  /api/growth/ability-radar/latest - 获取最新能力雷达图');
            console.log('  GET  /api/growth/comparison-reports/latest - 获取最新对比报告');
            console.log('  GET  /api/growth/growth-path/latest - 获取成长路径');
            console.log('  POST /api/growth/graduation-report/generate - 生成毕业报告');
            console.log('\n真实项目:');
            console.log('  GET  /api/real-projects/available - 获取可接单项目');
            console.log('  GET  /api/real-projects/my/projects - 我的项目');
            console.log('  POST /api/real-projects/:id/apply - 申请项目');
            console.log('  POST /api/real-projects/:id/complete - 完成项目');
            console.log('\n财务管理:');
            console.log('  GET  /api/financial/balance - 查看余额');
            console.log('  GET  /api/financial/income - 收入记录');
            console.log('  POST /api/financial/withdrawal/request - 申请提现');
            console.log('\n任务进度:');
            console.log('  POST /api/task-progress/generate - 生成任务拆解');
            console.log('  GET  /api/task-progress/my/list - 我的任务进度列表');
            console.log('  PUT  /api/task-progress/:progressId/task/:taskNumber - 更新任务状态');
            console.log('\n收藏系统:');
            console.log('  GET  /api/favorites - 获取收藏列表');
            console.log('  POST /api/favorites - 添加收藏');
            console.log('  GET  /api/favorites/stats - 收藏统计');
            console.log('\n成就系统:');
            console.log('  GET  /api/achievements - 获取成就列表');
            console.log('  POST /api/achievements/check - 检查并解锁成就');
            console.log('  GET  /api/achievements/stats - 成就统计');
            console.log('\n小猫的秘密空间:');
            console.log('  GET  /api/secret-space - 获取秘密空间');
            console.log('  POST /api/secret-space/check-in - 签到');
            console.log('  POST /api/secret-space/mood - 记录心情');
            console.log('  POST /api/secret-space/notes - 添加私密笔记');
            console.log('\n按 Ctrl+C 停止服务\n');
        });
    }
    catch (error) {
        console.error('✗ 服务启动失败:', error);
        process.exit(1);
    }
};
// 优雅关闭
process.on('SIGTERM', () => {
    console.log('\n收到SIGTERM信号，准备关闭服务...');
    scheduledTasks_1.scheduledTasks.stop();
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('\n收到SIGINT信号，准备关闭服务...');
    scheduledTasks_1.scheduledTasks.stop();
    process.exit(0);
});
startServer();
//# sourceMappingURL=index.js.map