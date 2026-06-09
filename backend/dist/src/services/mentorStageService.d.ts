/**
 * AI导师阶段管理服务（终极版 - 有温度的陪伴）
 * 负责管理4个阶段的会话、消息和状态转换
 * 集成情绪感知、成长追踪、记忆系统、自适应引导和人性化对话
 */
export declare enum MentorStage {
    REQUIREMENT_UNDERSTANDING = "requirement_understanding",
    EXECUTION_GUIDANCE = "execution_guidance",
    QUALITY_REVIEW = "quality_review",
    COMMUNICATION_BRIDGE = "communication_bridge"
}
export declare enum StageStatus {
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    SKIPPED = "skipped"
}
export interface MentorStageSession {
    id: string;
    taskId: string;
    studentId: string;
    currentStage: MentorStage;
    stageStatus: StageStatus;
    requirementUnderstandingScore?: number;
    requirementConfirmed: boolean;
    productFramework?: string;
    guidanceCount: number;
    encouragementCount: number;
    toolsRecommended: string[];
    preReviewCount: number;
    preReviewPassed: boolean;
    finalReviewScore?: number;
    translationCount: number;
    communicationResolved: boolean;
    totalMessages: number;
    totalTokensUsed: number;
    totalCost: number;
    startedAt: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface MentorStageMessage {
    id: string;
    sessionId: string;
    stage: MentorStage;
    role: 'student' | 'mentor' | 'system';
    content: string;
    modelUsed?: string;
    tokensUsed?: number;
    cost?: number;
    responseTimeMs?: number;
    metadata?: any;
    createdAt: Date;
}
export declare class MentorStageService {
    /**
     * 创建新的导师会话
     */
    createSession(taskId: string, studentId: string): Promise<string>;
    /**
     * 获取会话信息
     */
    getSession(sessionId: string): Promise<MentorStageSession | null>;
    /**
     * 根据任务ID获取会话
     */
    getSessionByTaskId(taskId: string): Promise<MentorStageSession | null>;
    /**
     * 更新阶段
     */
    transitionStage(sessionId: string, newStage: MentorStage): Promise<void>;
    /**
     * 更新会话字段
     */
    updateSession(sessionId: string, updates: Partial<MentorStageSession>): Promise<void>;
    /**
     * 保存消息（增强版 - 带情绪分析和记忆提取）
     */
    saveMessage(sessionId: string, role: 'student' | 'mentor' | 'system', content: string, metadata?: {
        stage?: MentorStage;
        modelUsed?: string;
        tokensUsed?: number;
        cost?: number;
        responseTimeMs?: number;
        extra?: any;
    }): Promise<string>;
    /**
     * 处理学生消息（情绪分析、成长检测、记忆提取）
     */
    private processStudentMessage;
    /**
     * 构建上下文摘要
     */
    private buildContextSummary;
    /**
     * 生成自适应引导回复（终极版 - 人性化）
     */
    generateAdaptiveResponse(sessionId: string, studentMessage: string): Promise<{
        content: string;
        metadata: any;
    }>;
    /**
     * 获取消息历史
     */
    getMessages(sessionId: string, limit?: number, offset?: number): Promise<MentorStageMessage[]>;
    /**
     * 更新统计（增量）
     */
    incrementStats(sessionId: string, field: 'guidanceCount' | 'encouragementCount' | 'preReviewCount' | 'translationCount', increment?: number): Promise<void>;
    /**
     * 添加推荐工具
     */
    addRecommendedTool(sessionId: string, tool: string): Promise<void>;
    /**
     * 获取会话统计（增强版 - 包含情绪和成长数据）
     */
    getSessionStats(sessionId: string): Promise<{
        totalMessages: number;
        totalTokensUsed: number;
        totalCost: number;
        messagesByRole: {
            student: number;
            mentor: number;
            system: number;
        };
        averageResponseTime: number;
        emotionSummary?: {
            currentEmotion: string;
            recentEmotions: Array<{
                emotion: string;
                intensity: number;
            }>;
        };
        growthSummary?: {
            milestonesAchieved: number;
            recentMilestones: Array<{
                title: string;
                type: string;
            }>;
        };
    }>;
    /**
     * 获取学生的完整成长仪表板
     */
    getStudentGrowthDashboard(studentId: string): Promise<any>;
    /**
     * 获取未庆祝的里程碑
     */
    getUncelebratedMilestones(studentId: string): Promise<any[]>;
    /**
     * 标记里程碑为已庆祝
     */
    celebrateMilestone(milestoneId: number): Promise<void>;
    /**
     * 获取引导建议
     */
    getGuidanceRecommendations(sessionId: string): Promise<any>;
}
export declare const mentorStageService: MentorStageService;
//# sourceMappingURL=mentorStageService.d.ts.map