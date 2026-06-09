interface FollowUpTask {
    sessionId: number;
    studentId: number;
    taskId: number;
    reason: string;
    scheduledAt: Date;
    priority: 'low' | 'medium' | 'high';
}
interface FollowUpMessage {
    content: string;
    tone: string;
    shouldSend: boolean;
}
declare class ProactiveFollowUpService {
    /**
     * 检查需要跟进的学生
     */
    checkFollowUps(): Promise<FollowUpTask[]>;
    /**
     * 生成跟进消息
     */
    generateFollowUpMessage(sessionId: number, studentId: number, reason: string): Promise<FollowUpMessage>;
    /**
     * 发送跟进消息
     */
    sendFollowUp(sessionId: number, message: string): Promise<boolean>;
    /**
     * 查找不活跃的会话（24小时没有回复）
     */
    private findInactiveSessions;
    /**
     * 查找遇到困难的学生（记录了困难但没有解决）
     */
    private findStrugglingStudents;
    /**
     * 查找需要工具反馈的学生
     */
    private findToolFollowUps;
    /**
     * 查找未庆祝的里程碑
     */
    private findUncelebratedMilestones;
    /**
     * 生成不活跃跟进消息
     */
    private generateInactiveFollowUp;
    /**
     * 生成困难跟进消息
     */
    private generateStrugglingFollowUp;
    /**
     * 生成工具跟进消息
     */
    private generateToolFollowUp;
    /**
     * 生成庆祝跟进消息
     */
    private generateCelebrationFollowUp;
    /**
     * 获取人性化上下文
     */
    private getHumanizedContext;
    /**
     * 执行所有跟进任务（定时任务）
     */
    executeFollowUps(): Promise<{
        total: number;
        sent: number;
        failed: number;
    }>;
}
export declare const proactiveFollowUpService: ProactiveFollowUpService;
export {};
//# sourceMappingURL=proactiveFollowUpService.d.ts.map