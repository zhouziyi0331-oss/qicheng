/**
 * 需求拆解服务
 * 将复杂任务拆解成3层结构，每个子需求可以独立匹配学生
 */
interface BreakdownNode {
    id?: number;
    level: number;
    parentId?: number;
    requirementName: string;
    requirementDescription: string;
    sequenceOrder: number;
    dependencies?: number[];
    estimatedHours?: number;
    difficultyLevel?: string;
    requiredCapabilities: {
        talents?: string[];
        tools?: string[];
        domainKnowledge?: string[];
        caseExperience?: string[];
    };
    isMandatory: boolean;
    canBeLearned: boolean;
    children?: BreakdownNode[];
}
export declare class RequirementBreakdownService {
    /**
     * 为任务创建需求拆解
     */
    static createBreakdown(taskId: string, breakdown: BreakdownNode[]): Promise<void>;
    /**
     * 递归插入节点
     */
    private static insertNodeRecursive;
    /**
     * 获取任务的完整拆解树
     */
    static getBreakdownTree(taskId: string): Promise<BreakdownNode[]>;
    /**
     * 为单个子需求匹配学生
     */
    static matchStudentsForRequirement(taskId: string, requirementId: number, topN?: number): Promise<Array<{
        studentId: string;
        matchScore: number;
        matchedCapabilities: any;
        missingCapabilities: any;
        canLearn: boolean;
    }>>;
    /**
     * 计算学生与单个需求的匹配度
     */
    private static calculateRequirementMatch;
    /**
     * 示例：创建一个电商客服Agent任务的拆解
     */
    static createEcommerceCustomerServiceAgentBreakdown(): BreakdownNode[];
}
export {};
//# sourceMappingURL=requirementBreakdownService.d.ts.map