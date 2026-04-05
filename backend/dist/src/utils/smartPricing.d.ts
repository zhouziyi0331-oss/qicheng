/**
 * 智能计算任务金额
 * 根据任务复杂度、所需技能、市场行情、学生等级智能定价
 */
export declare function calculateTaskBudget(taskDescription: string, taskType: string, requiredLevel: number, estimatedHours: number): Promise<{
    suggestedBudget: number;
    reasoning: string;
}>;
/**
 * 智能梳理任务要求
 * 分析任务描述，提取关键要求和注意事项
 */
export declare function analyzeTaskRequirements(taskDescription: string, taskType: string): Promise<{
    requirements: string[];
    warnings: string[];
    estimatedDifficulty: number;
}>;
//# sourceMappingURL=smartPricing.d.ts.map