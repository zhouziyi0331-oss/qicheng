/**
 * 项目需求分析服务
 * 从项目描述推导出"项目的客观工作条件需求"
 */
interface ProjectInfo {
    taskId: string;
    title: string;
    description: string;
    deliverableType: string;
    cycle: number;
    budget: number;
    hasReference: boolean;
    clientCommunicationStyle: string;
}
interface ProjectRequirementProfile {
    taskId: string;
    informationReceptionNeed: {
        condition: string;
        requirement: string;
    };
    creationDriveNeed: {
        outputType: string;
        requirement: string;
    };
    learningApproachNeed: {
        startingPoint: string;
        requirement: string;
    };
    executionRhythmNeed: {
        cycle: string;
        flexibility: string;
        requirement: string;
    };
    autonomyNeed: {
        communicationFrequency: string;
        requirement: string;
    };
    riskLevel: {
        certainty: string;
        requirement: string;
    };
    requirementText: string;
    projectType: string;
}
declare class ProjectAnalysisService {
    /**
     * 从项目信息生成需求条件画像
     */
    generateRequirementProfile(projectInfo: ProjectInfo): Promise<ProjectRequirementProfile>;
    /**
     * 分析信息接收需求
     */
    private analyzeInformationReceptionNeed;
    /**
     * 分析创作驱动需求
     */
    private analyzeCreationDriveNeed;
    /**
     * 分析学习切入需求
     */
    private analyzeLearningApproachNeed;
    /**
     * 分析执行节奏需求
     */
    private analyzeExecutionRhythmNeed;
    /**
     * 分析自主度需求
     */
    private analyzeAutonomyNeed;
    /**
     * 分析风险水平
     */
    private analyzeRiskLevel;
    /**
     * 确定项目类型
     */
    private determineProjectType;
    /**
     * 生成综合需求文本
     */
    private generateRequirementText;
    /**
     * 保存项目需求画像到数据库
     */
    saveRequirementProfile(profile: ProjectRequirementProfile): Promise<void>;
}
declare const _default: ProjectAnalysisService;
export default _default;
//# sourceMappingURL=projectAnalysisService.d.ts.map