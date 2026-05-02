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
interface ReportContent {
    customizedAnalysis: CustomizedAnalysis;
    startupGuides: StartupGuide[];
    generatedAt: string;
    version: string;
}
/**
 * PDF生成服务
 */
export declare class PDFGeneratorService {
    /**
     * 生成创业报告PDF
     */
    static generateStartupReportPDF(reportContent: ReportContent, userName: string): Promise<Buffer>;
    /**
     * 添加封面
     */
    private static addCoverPage;
    /**
     * 添加目录
     */
    private static addTableOfContents;
    /**
     * 添加定制化分析
     */
    private static addCustomizedAnalysis;
    /**
     * 添加通用创业指南
     */
    private static addStartupGuides;
    /**
     * 添加章节
     */
    private static addSection;
    /**
     * 添加页码
     */
    private static addPageNumbers;
}
export {};
//# sourceMappingURL=pdfGeneratorService.d.ts.map