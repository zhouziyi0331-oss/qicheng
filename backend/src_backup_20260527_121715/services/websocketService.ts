import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import logger from '../utils/logger';
import { verifyToken } from '../middleware/auth';

/**
 * WebSocket服务
 * 用于实时推送AI任务完成通知、导师消息等
 */

interface SocketUser {
  userId: string;
  role: 'student' | 'company' | 'admin';
  socketId: string;
}

class WebSocketService {
  private io: SocketIOServer | null = null;
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set<socketId>

  /**
   * 初始化WebSocket服务
   */
  initialize(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*', // 生产环境应该配置具体域名
        methods: ['GET', 'POST']
      },
      path: '/socket.io'
    });

    // 认证中间件
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // 验证token
        const decoded = verifyToken(token);
        if (!decoded) {
          return next(new Error('Invalid token'));
        }

        // 将用户信息附加到socket
        (socket as any).user = {
          userId: decoded.userId,
          role: decoded.role
        };

        next();
      } catch (error) {
        logger.error('WebSocket authentication failed:', error);
        next(new Error('Authentication failed'));
      }
    });

    // 连接事件
    this.io.on('connection', (socket) => {
      const user = (socket as any).user as SocketUser;
      user.socketId = socket.id;

      logger.info(`WebSocket connected: ${user.userId} (${user.role})`);

      // 记录用户socket
      if (!this.userSockets.has(user.userId)) {
        this.userSockets.set(user.userId, new Set());
      }
      this.userSockets.get(user.userId)!.add(socket.id);

      // 加入用户专属房间
      socket.join(`user:${user.userId}`);
      socket.join(`role:${user.role}`);

      // 发送连接成功消息
      socket.emit('connected', {
        userId: user.userId,
        role: user.role,
        timestamp: new Date().toISOString()
      });

      // 断开连接
      socket.on('disconnect', () => {
        logger.info(`WebSocket disconnected: ${user.userId}`);

        const sockets = this.userSockets.get(user.userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            this.userSockets.delete(user.userId);
          }
        }
      });

      // 心跳
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });
    });

    logger.info('WebSocket service initialized');
  }

  /**
   * 推送消息给指定用户
   */
  pushToUser(userId: string, event: string, data: any) {
    if (!this.io) {
      logger.warn('WebSocket not initialized');
      return;
    }

    this.io.to(`user:${userId}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });

    logger.info(`WebSocket push to user ${userId}: ${event}`);
  }

  /**
   * 推送消息给指定角色的所有用户
   */
  pushToRole(role: 'student' | 'company' | 'admin', event: string, data: any) {
    if (!this.io) {
      logger.warn('WebSocket not initialized');
      return;
    }

    this.io.to(`role:${role}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });

    logger.info(`WebSocket push to role ${role}: ${event}`);
  }

  /**
   * 广播消息给所有连接的用户
   */
  broadcast(event: string, data: any) {
    if (!this.io) {
      logger.warn('WebSocket not initialized');
      return;
    }

    this.io.emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });

    logger.info(`WebSocket broadcast: ${event}`);
  }

  /**
   * 检查用户是否在线
   */
  isUserOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return sockets ? sockets.size > 0 : false;
  }

  /**
   * 获取在线用户数
   */
  getOnlineUserCount(): number {
    return this.userSockets.size;
  }

  /**
   * 获取在线用户列表
   */
  getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  /**
   * AI任务完成通知
   */
  notifyAITaskComplete(userId: string, taskType: string, result: any) {
    this.pushToUser(userId, 'ai_task_complete', {
      taskType,
      result
    });
  }

  /**
   * 学生画像生成完成
   */
  notifyProfileAnalysisComplete(studentId: string, profile: any) {
    this.pushToUser(studentId, 'profile_analysis_complete', {
      profileText: profile.profileText,
      coreStrengths: profile.coreStrengths,
      message: '你的工作条件画像已生成完成'
    });
  }

  /**
   * 项目需求画像生成完成
   */
  notifyRequirementAnalysisComplete(companyId: string, taskId: string, profile: any) {
    this.pushToUser(companyId, 'requirement_analysis_complete', {
      taskId,
      projectType: profile.projectType,
      requirementText: profile.requirementText,
      message: '项目需求条件画像已生成完成'
    });
  }

  /**
   * 匹配完成通知
   */
  notifyMatchComplete(companyId: string, taskId: string, matchCount: number) {
    this.pushToUser(companyId, 'match_complete', {
      taskId,
      matchCount,
      message: `已为您匹配${matchCount}个合适的学生`
    });
  }

  /**
   * 任务推荐通知（推送给学生）
   */
  notifyTaskRecommendation(studentId: string, data: { taskId: string; taskTitle: string; message: string }) {
    this.pushToUser(studentId, 'task_recommendation', {
      taskId: data.taskId,
      taskTitle: data.taskTitle,
      message: data.message
    });
  }

  /**
   * 导师消息推送
   */
  notifyMentorMessage(studentId: string, message: any) {
    this.pushToUser(studentId, 'mentor_push', {
      orderId: message.orderId,
      scenario: message.scenario,
      content: message.content,
      message: '启程老师给你发来了新消息'
    });
  }

  /**
   * 订单状态变更通知
   */
  notifyOrderStatusChange(userId: string, orderId: string, status: string, message: string) {
    this.pushToUser(userId, 'order_status_change', {
      orderId,
      status,
      message
    });
  }

  /**
   * 交付物审核完成通知
   */
  notifySubmissionReviewed(studentId: string, orderId: string, result: any) {
    this.pushToUser(studentId, 'submission_reviewed', {
      orderId,
      score: result.score,
      feedback: result.feedback,
      message: '你的交付物已完成预审核'
    });
  }

  /**
   * 成长报告生成完成
   */
  notifyGrowthReportReady(studentId: string, reportId: string) {
    this.pushToUser(studentId, 'growth_report_ready', {
      reportId,
      message: '你的成长报告已生成，快来查看吧'
    });
  }
}

export default new WebSocketService();
