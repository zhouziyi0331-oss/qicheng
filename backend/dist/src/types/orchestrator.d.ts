/**
 * 编排器类型定义
 * Phase R1: 事件驱动的Agent调度系统
 */
export declare enum AgentEvent {
    STUDENT_REGISTERED = "student_registered",
    STUDENT_MESSAGE = "student_message",
    TASK_ACCEPTED = "task_accepted",
    TASK_STARTED = "task_started",
    TASK_SUBMITTED = "task_submitted",
    TASK_COMPLETED = "task_completed",
    TASK_REJECTED = "task_rejected",
    STUCK_DETECTED = "stuck_detected",
    EMOTION_DISTRESS = "emotion_distress",
    ENTERPRISE_POST_TASK = "enterprise_post_task",
    ENTERPRISE_ACCEPT = "enterprise_accept",
    ENTERPRISE_REJECT = "enterprise_reject",
    DEADLINE_APPROACHING = "deadline_approaching",
    PROACTIVE_CHECKIN_TRIGGER = "proactive_checkin_trigger",
    REPORT_PURCHASE = "report_purchase",
    GENERATE_REPORT = "generate_report",
    LEVEL_UPGRADED = "level_upgraded"
}
export declare enum MentorTrigger {
    USER_INITIATED = "user_initiated",// 学生主动对话
    TASK_ACCEPTED = "task_accepted",// 任务接取
    STUCK_HELP_REQUEST = "stuck_help_request",// 主动求助
    EMOTIONAL_DISTRESS_DETECTED = "emotional_distress_detected",// 情绪低落检测
    TASK_COMPLETED = "task_completed",// 任务完成
    PROACTIVE_CHECKIN = "proactive_checkin",// 主动关怀
    TASK_REJECTED_COMFORT = "task_rejected_comfort",// 质控打回安慰
    MILESTONE_REACHED = "milestone_reached",// 里程碑达成
    LONG_SILENCE = "long_silence",// 长时间未活跃
    BREAKTHROUGH_MOMENT = "breakthrough_moment",// 突破性时刻
    PATTERN_RECOGNITION = "pattern_recognition",// 模式识别触发
    RELATIONSHIP_DEEPENING = "relationship_deepening"
}
export interface EventData {
    userId: string;
    taskId?: string;
    enterpriseId?: string;
    message?: string;
    emotion?: string;
    context?: Record<string, any>;
    timestamp: Date;
}
export interface AgentInvocationResult {
    success: boolean;
    agentName: string;
    data?: any;
    error?: string;
    duration: number;
}
export interface OrchestratorConfig {
    enableLogging: boolean;
    eventQueueName: string;
    maxRetries: number;
    timeoutMs: number;
}
export interface MentorMemory {
    L1_session?: SessionContext;
    L2_task?: TaskContext;
    L3_recent?: RecentSummary;
    L4_growth?: GrowthArchive;
    L5_core?: CoreProfile;
    L6_relationship?: RelationshipMemory;
}
export interface SessionContext {
    sessionId: string;
    conversationHistory: ConversationMessage[];
    currentIntent: string;
    contextKeywords: string[];
    emotionalState: string;
}
export interface TaskContext {
    taskId: string;
    taskPhase: string;
    stuckPoints: StuckPoint[];
    hintsGiven: string[];
    emotionTimeline: EmotionEvent[];
    mentorAssessment: MentorAssessment;
}
export interface RecentSummary {
    tasksCompleted30d: number;
    tasksInProgress: number;
    topStuckTypes: string[];
    emotionTrend: string;
    avgResponseSpeedHours: number;
    lastActiveAt: Date;
    engagementScore: number;
}
export interface GrowthArchive {
    milestones: Milestone[];
    taskMicroReports: TaskMicroReport[];
    scoreSnapshots: ScoreSnapshot[];
    growthPatterns: GrowthPatterns;
}
export interface CoreProfile {
    nickname: string;
    grade?: string;
    major?: string;
    track?: string;
    level: number;
    talentProfile?: OPCProfile;
    abilityTags?: string[];
    communicationStyle?: CommunicationStyle;
}
export interface RelationshipMemory {
    relationshipStage: 'new' | 'warming' | 'trusted' | 'deep';
    memorableQuotes: Quote[];
    mentorPromises: Promise[];
    emotionalAnchors: EmotionalAnchor[];
    conversationSummaries: ConversationSummary[];
    lastInteractionAt?: Date;
    totalConversations: number;
}
export interface ConversationMessage {
    role: 'user' | 'mentor';
    content: string;
    timestamp: Date;
}
export interface StuckPoint {
    timestamp: Date;
    description: string;
    resolved: boolean;
    resolutionHint?: string;
}
export interface EmotionEvent {
    timestamp: Date;
    emotion: string;
    intensity: number;
}
export interface MentorAssessment {
    confidenceLevel: number;
    skillGaps: string[];
    strengths: string[];
}
export interface Milestone {
    date: Date;
    type: string;
    description: string;
    impact: string;
}
export interface TaskMicroReport {
    taskId: string;
    completionDate: Date;
    keyLearnings: string[];
    breakthrough?: string;
}
export interface ScoreSnapshot {
    date: Date;
    dimensions: {
        info_processing: number;
        creation_drive: number;
        tool_learning: number;
        task_execution: number;
        collaboration: number;
        risk_attitude: number;
    };
}
export interface GrowthPatterns {
    preferredLearningPath?: string;
    commonStruggles?: string[];
    strengthsEvolution?: string;
}
export interface OPCProfile {
    personality_tag: string;
    dimensions: {
        info_processing: number;
        creation_drive: number;
        tool_learning: number;
        task_execution: number;
        collaboration: number;
        risk_attitude: number;
    };
}
export interface CommunicationStyle {
    prefersEncouragement?: boolean;
    learningStyle?: string;
    responsePreference?: string;
}
export interface Quote {
    date: Date;
    quote: string;
    context: string;
}
export interface Promise {
    date: Date;
    promise: string;
    fulfilled: boolean;
}
export interface EmotionalAnchor {
    type: string;
    description: string;
    triggerContext: string;
}
export interface ConversationSummary {
    date: Date;
    topic: string;
    emotionalTone: string;
    outcome: string;
}
//# sourceMappingURL=orchestrator.d.ts.map