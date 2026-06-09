interface ToolRecommendation {
    toolId: number;
    toolName: string;
    toolCategory: string;
    whyRecommend: string;
    howToUse: string;
    quickStartSteps: string[];
    websiteUrl: string;
    isFree: boolean;
}
interface ToolUsageResult {
    success: boolean;
    message: string;
    trackingId?: number;
}
declare class ToolRecommendationService {
    /**
     * 根据任务和学生情况推荐工具
     */
    recommendTools(taskId: number, studentId: number, struggle?: {
        rootCause: string;
        specificGap: string;
    }): Promise<ToolRecommendation[]>;
    /**
     * 记录工具推荐
     */
    trackRecommendation(studentId: number, taskId: number, toolId: number, context: string): Promise<number>;
    /**
     * 学生反馈工具使用情况
     */
    recordToolUsage(trackingId: number, usage: {
        tried: boolean;
        succeeded?: boolean;
        difficultyLevel?: 'easy' | 'medium' | 'hard';
        timeToLearnMinutes?: number;
        comment?: string;
        wouldRecommend?: boolean;
    }): Promise<ToolUsageResult>;
    /**
     * 获取工具使用统计
     */
    getToolStatistics(toolId: number): Promise<any>;
    /**
     * 获取最受欢迎的工具
     */
    getPopularTools(category?: string, limit?: number): Promise<ToolRecommendation[]>;
    /**
     * 添加新工具
     */
    addTool(tool: {
        toolName: string;
        toolCategory: string;
        toolDescription: string;
        whyRecommend: string;
        howToUse: string;
        quickStartSteps: string[];
        suitableFor: any;
        isFree: boolean;
        websiteUrl: string;
        tutorialUrl?: string;
        alternatives?: string[];
    }): Promise<number>;
    /**
     * 分析任务类型
     */
    private analyzeTaskType;
    /**
     * 获取学生技能水平
     */
    private getStudentSkillLevel;
    /**
     * 增加推荐次数
     */
    private incrementRecommendationCount;
    /**
     * 更新工具成功率
     */
    private updateToolSuccessRate;
}
export declare const toolRecommendationService: ToolRecommendationService;
export {};
//# sourceMappingURL=toolRecommendationService.d.ts.map