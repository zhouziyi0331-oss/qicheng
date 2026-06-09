import { Server as HTTPServer } from 'http';
declare class WebSocketService {
    private io;
    private userSockets;
    /**
     * 初始化WebSocket服务
     */
    initialize(httpServer: HTTPServer): void;
    /**
     * 推送消息给指定用户
     */
    pushToUser(userId: string, event: string, data: any): void;
    /**
     * 推送消息给指定角色的所有用户
     */
    pushToRole(role: 'student' | 'company' | 'admin', event: string, data: any): void;
    /**
     * 广播消息给所有连接的用户
     */
    broadcast(event: string, data: any): void;
    /**
     * 检查用户是否在线
     */
    isUserOnline(userId: string): boolean;
    /**
     * 获取在线用户数
     */
    getOnlineUserCount(): number;
    /**
     * 获取在线用户列表
     */
    getOnlineUsers(): string[];
    /**
     * AI任务完成通知
     */
    notifyAITaskComplete(userId: string, taskType: string, result: any): void;
    /**
     * 学生画像生成完成
     */
    notifyProfileAnalysisComplete(studentId: string, profile: any): void;
    /**
     * 项目需求画像生成完成
     */
    notifyRequirementAnalysisComplete(companyId: string, taskId: string, profile: any): void;
    /**
     * 匹配完成通知
     */
    notifyMatchComplete(companyId: string, taskId: string, matchCount: number): void;
    /**
     * 任务推荐通知（推送给学生）
     */
    notifyTaskRecommendation(studentId: string, data: {
        taskId: string;
        taskTitle: string;
        message: string;
    }): void;
    /**
     * 导师消息推送
     */
    notifyMentorMessage(studentId: string, message: any): void;
    /**
     * 订单状态变更通知
     */
    notifyOrderStatusChange(userId: string, orderId: string, status: string, message: string): void;
    /**
     * 交付物审核完成通知
     */
    notifySubmissionReviewed(studentId: string, orderId: string, result: any): void;
    /**
     * 成长报告生成完成
     */
    notifyGrowthReportReady(studentId: string, reportId: string): void;
}
declare const _default: WebSocketService;
export default _default;
//# sourceMappingURL=websocketService.d.ts.map