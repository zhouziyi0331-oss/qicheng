import mongoose from 'mongoose';
/**
 * AI导师服务
 * 实现心理引导、PBL教育、探索式引导
 */
export declare class MentorService {
    private readonly PASSION_KEYWORDS;
    private readonly FLOW_KEYWORDS;
    /**
     * 生成AI导师Prompt
     * 核心：不是老师，是"先走过这条河的人"
     */
    private generateMentorPrompt;
    /**
     * AI对话核心方法
     */
    chat(userId: string, message: string, context?: string, taskId?: string, conversationHistory?: Array<{
        role: string;
        content: string;
    }>): Promise<{
        response: string;
        detectedPassionSpark: boolean;
        detectedFlowMoment: boolean;
    }>;
    /**
     * 检测热情火花
     */
    private detectPassionSpark;
    /**
     * 检测穿越感时刻
     */
    private detectFlowMoment;
    /**
     * 获取对话历史
     */
    getHistory(userId: string, taskId?: string): Promise<(mongoose.Document<unknown, {}, import("../models/MentorConversation").IMentorConversation, {}, {}> & import("../models/MentorConversation").IMentorConversation & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    /**
     * 生成接单欢迎消息
     * 连接学生的OPC人格和生命问题
     */
    getFirstStep(userId: string, taskId: string): Promise<string>;
    /**
     * 学生说"我卡住了"
     */
    reportStuck(userId: string, taskId: string, stuckPoint: string): Promise<string>;
    /**
     * 完成里程碑时的见证
     * 使用自我对比式反馈
     */
    celebrateMilestone(userId: string, taskId: string, milestone: string): Promise<string>;
    /**
     * 获取用户的热情火花列表
     */
    getPassionSparks(userId: string, limit?: number): Promise<(mongoose.Document<unknown, {}, import("../models/PassionSpark").IPassionSpark, {}, {}> & import("../models/PassionSpark").IPassionSpark & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    /**
     * 获取用户的穿越感时刻列表
     */
    getFlowMoments(userId: string, limit?: number): Promise<(mongoose.Document<unknown, {}, import("../models/FlowMoment").IFlowMoment, {}, {}> & import("../models/FlowMoment").IFlowMoment & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    /**
     * 获取用户的成长统计
     */
    getGrowthStats(userId: string): Promise<{
        totalConversations: number;
        totalPassionSparks: number;
        totalFlowMoments: number;
    }>;
}
export declare const mentorService: MentorService;
//# sourceMappingURL=mentor.service.d.ts.map