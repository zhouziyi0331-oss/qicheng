import express, { Application, Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDatabase } from './config/database'
import authRoutes from './routes/auth.routes'
import practiceRoutes from './routes/practice.routes'
import contactExchangeRoutes from './routes/contactExchange.routes'
import paymentRoutes from './routes/payment.routes'
import adminRoutes from './routes/admin.routes'
import growthRoutes from './routes/growth.routes'
import realProjectRoutes from './routes/realProject.routes'
import financialRoutes from './routes/financial.routes'
import taskProgressRoutes from './routes/taskProgress.routes'
import favoriteRoutes from './routes/favorite.routes'
import achievementRoutes from './routes/achievement.routes'
import secretSpaceRoutes from './routes/secretSpace.routes'
import taskRoutes from './routes/task.routes'
import opcRoutes from './routes/opc.routes'
import mentorRoutes from './routes/mentor.routes'
import mentorEnhancedRoutes from './routes/mentorEnhanced.routes'
import levelRoutes from './routes/level.routes'
import levelUpValidationRoutes from './routes/levelUpValidation.routes'
import levelUpRoutes from './routes/levelUp.routes'
import storyWallRoutes from './routes/storyWall.routes'
import vectorMatchRoutes from './routes/vectorMatch.routes'
import projectSummaryRoutes from './routes/projectSummary.routes'
import achievementMapRoutes from './routes/achievementMap.routes'
import taskReportRoutes from './routes/taskReport.routes'
import graduationReportRoutes from './routes/graduationReport.routes'
import aiMentorRoutes from './routes/aiMentor.routes'
import vectorCoreRoutes from './routes/vectorCore.routes'
import userProfileRoutes from './routes/userProfile.routes'
import taskBreakdownRoutes from './routes/taskBreakdown.routes'
import { performanceMonitor, statisticsCollector } from './middleware/monitor.middleware'
import { scheduledTasks } from './utils/scheduledTasks'

// 加载环境变量
dotenv.config()

const app: Application = express()
const PORT = process.env.PORT || 3000

// 中间件
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 性能监控和统计
app.use(performanceMonitor)
app.use(statisticsCollector)

// 日志中间件
app.use((req: Request, res: Response, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// 健康检查
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: '启程OPC后端服务',
    version: '1.0.0'
  })
})

// API路由
app.use('/api/auth', authRoutes)
app.use('/api/practice', practiceRoutes)
app.use('/api/contact-exchange', contactExchangeRoutes)
app.use('/api/payment', paymentRoutes)
app.use('/api/admin', adminRoutes)
// app.use('/api/growth', growthRoutes) // 临时注释，待修复类型问题
app.use('/api/real-projects', realProjectRoutes)
app.use('/api/financial', financialRoutes)
app.use('/api/task-progress', taskProgressRoutes)
app.use('/api/favorites', favoriteRoutes)
app.use('/api/achievements', achievementRoutes)
app.use('/api/secret-space', secretSpaceRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/opc', opcRoutes)
app.use('/api/mentor', mentorRoutes)
app.use('/api/mentor-enhanced', mentorEnhancedRoutes)
app.use('/api/level', levelRoutes)
app.use('/api/level-up-validation', levelUpValidationRoutes)
app.use('/api/level-up', levelUpRoutes)
app.use('/api/story-wall', storyWallRoutes)
app.use('/api/vector-match', vectorMatchRoutes)
app.use('/api/project-summary', projectSummaryRoutes)
app.use('/api/achievement-map', achievementMapRoutes)
app.use('/api/task-report', taskReportRoutes)
// app.use('/api/graduation-report', graduationReportRoutes) // 临时注释，待修复
app.use('/api/ai-mentor', aiMentorRoutes)
app.use('/api/vector-core', vectorCoreRoutes)
app.use('/api/profile', userProfileRoutes)
app.use('/api/task-breakdown', taskBreakdownRoutes)

// 404处理
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: '接口不存在' })
})

// 全局错误处理
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('全局错误:', err)
  res.status(500).json({
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

// 启动服务
const startServer = async () => {
  try {
    // 连接数据库
    await connectDatabase()

    // 启动定时任务
    scheduledTasks.start()

    // 启动HTTP服务
    app.listen(PORT, () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('✓ 启程OPC后端服务启动成功')
      console.log(`✓ 服务器运行在: http://localhost:${PORT}`)
      console.log(`✓ 环境: ${process.env.NODE_ENV || 'development'}`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('\n可用接口:')
      console.log('  GET  /health - 健康检查')
      console.log('\n认证相关:')
      console.log('  POST /api/auth/wechat-login - 微信登录')
      console.log('  GET  /api/auth/profile - 获取用户信息')
      console.log('  PUT  /api/auth/profile - 更新用户信息')
      console.log('\n实践项目:')
      console.log('  GET  /api/practice/projects - 获取实践项目列表')
      console.log('  GET  /api/practice/projects/:id/report - 获取项目报告')
      console.log('  GET  /api/practice/stats - 获取统计数据')
      console.log('  POST /api/practice/decomposition/generate - 生成AI拆解报告')
      console.log('\n联系方式交换:')
      console.log('  GET  /api/contact-exchange/partners - 获取合作伙伴')
      console.log('  POST /api/contact-exchange/request - 请求交换联系方式')
      console.log('\n管理接口:')
      console.log('  GET  /api/admin/stats - 系统统计')
      console.log('  GET  /api/admin/health-check - 详细健康检查')
      console.log('\n个人成长:')
      console.log('  POST /api/growth/assessment - 提交OC测评')
      console.log('  GET  /api/growth/ability-radar/latest - 获取最新能力雷达图')
      console.log('  GET  /api/growth/comparison-reports/latest - 获取最新对比报告')
      console.log('  GET  /api/growth/growth-path/latest - 获取成长路径')
      console.log('  POST /api/growth/graduation-report/generate - 生成毕业报告')
      console.log('\n真实项目:')
      console.log('  GET  /api/real-projects/available - 获取可接单项目')
      console.log('  GET  /api/real-projects/my/projects - 我的项目')
      console.log('  POST /api/real-projects/:id/apply - 申请项目')
      console.log('  POST /api/real-projects/:id/complete - 完成项目')
      console.log('\n财务管理:')
      console.log('  GET  /api/financial/balance - 查看余额')
      console.log('  GET  /api/financial/income - 收入记录')
      console.log('  POST /api/financial/withdrawal/request - 申请提现')
      console.log('\n任务进度:')
      console.log('  POST /api/task-progress/generate - 生成任务拆解')
      console.log('  GET  /api/task-progress/my/list - 我的任务进度列表')
      console.log('  PUT  /api/task-progress/:progressId/task/:taskNumber - 更新任务状态')
      console.log('\n收藏系统:')
      console.log('  GET  /api/favorites - 获取收藏列表')
      console.log('  POST /api/favorites - 添加收藏')
      console.log('  GET  /api/favorites/stats - 收藏统计')
      console.log('\n成就系统:')
      console.log('  GET  /api/achievements - 获取成就列表')
      console.log('  POST /api/achievements/check - 检查并解锁成就')
      console.log('  GET  /api/achievements/stats - 成就统计')
      console.log('\n小猫的秘密空间:')
      console.log('  GET  /api/secret-space - 获取秘密空间')
      console.log('  POST /api/secret-space/check-in - 签到')
      console.log('  POST /api/secret-space/mood - 记录心情')
      console.log('  POST /api/secret-space/notes - 添加私密笔记')
      console.log('\n按 Ctrl+C 停止服务\n')
    })
  } catch (error) {
    console.error('✗ 服务启动失败:', error)
    process.exit(1)
  }
}

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('\n收到SIGTERM信号，准备关闭服务...')
  scheduledTasks.stop()
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('\n收到SIGINT信号，准备关闭服务...')
  scheduledTasks.stop()
  process.exit(0)
})

startServer()
