/**
 * 能力标签提取服务
 * 从任务描述和学生交付物中自动提取能力标签
 */
interface TaskInfo {
    taskId: string;
    title: string;
    description: string;
    requirements?: string;
    deliverables?: string;
}
export declare class CapabilityExtractionService {
    /**
     * 从任务完成中提取学生的能力标签
     */
    static extractFromTaskCompletion(studentId: string, taskId: string, taskInfo: TaskInfo, deliverableInfo?: {
        deliverableType: string;
        deliverableContent: string;
        quality: number;
    }): Promise<void>;
    /**
     * 从文本中提取标签（基于规则）
     */
    private static extractFromText;
    /**
     * 记录工具使用
     */
    private static recordToolUsage;
    /**
     * 记录案例经验
     */
    private static recordCaseExperience;
    /**
     * 记录领域理解
     */
    private static recordDomainUnderstanding;
    /**
     * 获取学生的完整能力画像
     */
    static getStudentCapabilityProfile(studentId: string): Promise<{
        tools: any[];
        caseExperience: any[];
        domainUnderstanding: any[];
    }>;
}
export {};
//# sourceMappingURL=capabilityExtractionService.d.ts.map