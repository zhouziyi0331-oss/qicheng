interface GrowthState {
    technicalSkills?: {
        [key: string]: number;
    };
    softSkills?: {
        [key: string]: number;
    };
    confidence?: number;
    emotionalState?: string;
    strugglingAreas?: string[];
    strengths?: string[];
}
interface Milestone {
    id: number;
    type: string;
    title: string;
    description: string;
    beforeState: GrowthState;
    afterState: GrowthState;
    growthIndicators: any;
    celebrated: boolean;
    createdAt: Date;
}
declare class GrowthTrackingService {
    private milestoneTypes;
    /**
     * 检测并记录成长里程碑
     */
    detectAndRecordMilestone(studentId: number, taskId: number, sessionId: number, context: {
        currentMessage: string;
        previousMessages: Array<{
            role: string;
            content: string;
        }>;
        currentEmotion?: string;
        previousEmotions?: Array<{
            emotion: string;
            intensity: number;
        }>;
        taskProgress?: number;
    }): Promise<Milestone | null>;
    /**
     * 分析是否达成里程碑
     */
    private analyzePotentialMilestone;
    /**
     * 基于规则的里程碑检测
     */
    private detectMilestoneByRules;
    /**
     * 使用AI进行深度里程碑分析
     */
    private detectMilestoneByAI;
    /**
     * 创建里程碑记录
     */
    private createMilestone;
    /**
     * 生成庆祝消息
     */
    private generateCelebrationMessage;
    /**
     * 更新学生档案
     */
    private updateStudentProfile;
    /**
     * 获取学生档案
     */
    private getStudentProfile;
    /**
     * 获取最近的里程碑
     */
    getRecentMilestones(studentId: number, limit?: number): Promise<Milestone[]>;
    /**
     * 获取单个里程碑
     */
    private getMilestone;
    /**
     * 获取未庆祝的里程碑
     */
    getUncelebratedMilestones(studentId: number): Promise<Milestone[]>;
    /**
     * 标记里程碑为已庆祝
     */
    markAsCelebrated(milestoneId: number): Promise<void>;
    /**
     * 获取成长统计
     */
    getGrowthStats(studentId: number): Promise<{
        totalMilestones: number;
        milestonesByType: {
            [key: string]: number;
        };
        confidenceTrend: Array<{
            date: Date;
            score: number;
        }>;
        recentGrowth: Milestone[];
    }>;
}
export declare const growthTrackingService: GrowthTrackingService;
export {};
//# sourceMappingURL=growthTrackingService.d.ts.map