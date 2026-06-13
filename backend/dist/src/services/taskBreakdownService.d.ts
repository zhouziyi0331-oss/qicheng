/**
 * AI任务拆解服务 - E-01功能
 * 将企业的模糊需求拆解为具体的子任务
 * 提供价格和工期建议
 */
interface SubTask {
    id: string;
    title: string;
    description: string;
    skills: string[];
    difficulty: number;
    estimatedHours: number;
    estimatedCost: {
        min: number;
        max: number;
    };
    priority: 'high' | 'medium' | 'low';
    dependencies: string[];
}
interface BreakdownResult {
    subtasks: SubTask[];
    totalCost: {
        min: number;
        max: number;
        recommended: number;
    };
    totalDays: {
        min: number;
        max: number;
        recommended: number;
    };
    requiredSkills: string[];
    riskWarnings: string[];
    recommendations: string[];
}
interface BreakdownOptions {
    userId?: string;
    additionalContext?: any;
}
declare class TaskBreakdownService {
    private anthropic;
    constructor();
    /**
     * 拆解任务需求
     */
    breakdownTask(rawDescription: string, options?: BreakdownOptions): Promise<BreakdownResult>;
    /**
     * 构建AI拆解提示词
     */
    private buildBreakdownPrompt;
    /**
     * 标准化子任务格式
     */
    private normalizeSubtasks;
    /**
     * 创建降级拆解结果（当AI失败时）
     */
    private createFallbackBreakdown;
    /**
     * 保存拆解结果到数据库
     */
    saveBreakdownResult(taskId: string, rawDescription: string, result: BreakdownResult, options?: BreakdownOptions): Promise<string>;
    /**
     * 获取任务的拆解结果
     */
    getBreakdownResult(taskId: string): Promise<BreakdownResult | null>;
    /**
     * 获取拆解历史
     */
    getBreakdownHistory(taskId: string, limit?: number): Promise<any[]>;
    /**
     * 用户接受拆解结果
     */
    acceptBreakdown(historyId: string, feedback?: string): Promise<void>;
    /**
     * 用户修改拆解结果
     */
    modifyBreakdown(historyId: string, modifiedResult: Partial<BreakdownResult>): Promise<void>;
    /**
     * 获取拆解统计
     */
    getBreakdownStats(days?: number): Promise<any>;
}
declare const _default: TaskBreakdownService;
export default _default;
//# sourceMappingURL=taskBreakdownService.d.ts.map