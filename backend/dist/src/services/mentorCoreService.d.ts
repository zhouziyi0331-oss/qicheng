interface ConversationMessage {
    role: 'student' | 'mentor' | 'system';
    content: string;
    timestamp: string;
}
interface DetectedSignals {
    passionSpark: boolean;
    flowMoment: boolean;
    stuckPoint: boolean;
    lifeQuestionConnection: boolean;
}
export declare class MentorCoreService {
    private anthropic;
    private defaultModel;
    private defaultTemperature;
    private useStreaming;
    constructor();
    /**
     * 核心对话方法
     * @param studentId 学生ID
     * @param message 学生消息
     * @param taskId 任务ID（可选）
     * @param sessionId 会话ID（可选，用于继续对话）
     */
    chat(studentId: string, message: string, taskId?: string, sessionId?: string): Promise<{
        success: boolean;
        sessionId: string;
        response: string;
        tokensUsed: number;
        responseTime: number;
        detectedSignals: DetectedSignals;
        suggestions?: string[];
    }>;
    /**
     * 构建AI Prompt - 确保400字回复（集成长期记忆和风格自适应）
     */
    private buildPrompt;
    /**
     * 调用Claude API
     */
    private callClaudeAPI;
    /**
     * 检测信号
     */
    private detectSignals;
    /**
     * 生成建议
     */
    private generateSuggestions;
    /**
     * 构建上下文
     */
    private buildContext;
    /**
     * 加载学生上下文
     */
    private loadStudentContext;
    /**
     * 加载任务上下文
     */
    private loadTaskContext;
    /**
     * 加载对话历史
     */
    private loadConversationHistory;
    /**
     * 统计检测到的信号
     */
    private countDetectedSignals;
    /**
     * 智能上下文管理 - 根据对话长度决定策略
     *
     * 策略：
     * - ≤10条：直接使用全部对话
     * - 11-20条：保留最近10条
     * - >20条：压缩前面的对话，保留最近10条
     */
    private buildContextHistory;
    /**
     * 生成对话摘要
     */
    private summarizeConversation;
    /**
     * 获取或创建会话
     */
    private getOrCreateSession;
    /**
     * 保存消息
     */
    private saveMessage;
    /**
     * 更新会话统计
     */
    private updateSessionStats;
    /**
     * 获取会话消息列表
     */
    getSessionMessages(sessionId: string, limit?: number, offset?: number): Promise<ConversationMessage[]>;
    /**
     * 获取学生的所有会话
     */
    getStudentSessions(studentId: string): Promise<any[]>;
    /**
     * 获取会话统计
     */
    getSessionStats(sessionId: string): Promise<{
        messageCount: number;
        totalTokens: number;
        passionSparks: number;
        flowMoments: number;
        stuckPoints: number;
        avgResponseTime: number;
    }>;
    /**
     * 获取学生的对话统计
     */
    getStudentStats(studentId: string): Promise<{
        totalSessions: number;
        totalMessages: number;
        totalTokens: number;
        passionSparks: number;
        flowMoments: number;
        stuckPoints: number;
        lastConversationAt: string | null;
    }>;
    /**
     * 流式对话方法 - 支持实时返回
     * @param studentId 学生ID
     * @param message 学生消息
     * @param onChunk 接收每个文本块的回调函数
     * @param taskId 任务ID（可选）
     * @param sessionId 会话ID（可选）
     */
    chatStream(studentId: string, message: string, onChunk: (chunk: string) => void, taskId?: string, sessionId?: string): Promise<{
        success: boolean;
        sessionId: string;
        fullResponse: string;
        tokensUsed: number;
        responseTime: number;
        detectedSignals: DetectedSignals;
        suggestions?: string[];
    }>;
    /**
     * 验证订单归属（用于API路由）
     */
    verifyOrderOwnership(orderId: string, studentId: string): Promise<boolean>;
    /**
     * 获取会话历史（用于API路由）
     */
    getSessionHistory(orderId: string): Promise<any[]>;
    /**
     * 创建学生消息记录（用于API路由）
     */
    createStudentMessage(studentId: string, orderId: string, message: string): Promise<string>;
    /**
     * 处理学生消息并生成AI回复（用于API路由）
     */
    handleStudentMessage(studentId: string, orderId: string, message: string, sessionId: string): Promise<void>;
    /**
     * 生成提交前自查清单（T-07场景）
     */
    generatePreSubmitChecklist(studentId: string, orderId: string, submissionPreview?: string): Promise<string>;
}
declare const _default: MentorCoreService;
export default _default;
//# sourceMappingURL=mentorCoreService.d.ts.map