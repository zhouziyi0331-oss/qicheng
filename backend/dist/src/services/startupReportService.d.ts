interface CustomizedAnalysis {
    strengthAnalysis: string;
    futurePossibilities: Array<{
        title: string;
        description: string;
        marketSize: string;
        difficulty: string;
        actionPlan: string;
    }>;
    painPointAnalysis: string;
    targetMarket: string;
    acquisitionStrategy: string;
    productServiceIdeas: Array<{
        title: string;
        description: string;
        mvp: string;
        timeline: string;
        budget: string;
    }>;
    firstSteps: string[];
    diyPath: {
        title: string;
        steps: Array<{
            step: string;
            description: string;
            resources: string[];
            estimatedTime: string;
        }>;
        totalCost: string;
        difficulty: string;
    };
    agencyPath: {
        title: string;
        services: Array<{
            service: string;
            description: string;
            estimatedCost: string;
            providers: string[];
        }>;
        totalCost: string;
        advantages: string[];
    };
}
interface StartupGuide {
    title: string;
    content: string;
}
interface StartupReportContent {
    customizedAnalysis: CustomizedAnalysis;
    startupGuides: StartupGuide[];
    generatedAt: string;
    version: string;
}
/**
 * 创业报告服务
 */
export declare class StartupReportService {
    /**
     * 生成完整的创业综合报告
     */
    static generateStartupReport(userId: string, reportId: string): Promise<StartupReportContent>;
    /**
     * 收集用户数据
     */
    private static collectUserData;
    /**
     * 使用 Claude API 生成定制化分析
     */
    private static generateCustomizedAnalysis;
    /**
     * 构建 Claude API 的 prompt
     */
    private static buildPrompt;
    /**
     * 降级方案：基于规则的分析
     */
    private static generateFallbackAnalysis;
    /**
     * 获取通用创业指南
     */
    private static getStartupGuides;
}
export {};
//# sourceMappingURL=startupReportService.d.ts.map