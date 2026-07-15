interface MatchResult {
    studentId: string;
    taskId: string;
    overallScore: number;
    talentMatchScore: number;
    opcCompatibilityScore: number;
    growthPotentialScore: number;
    matchedTraits: Array<{
        tagName: string;
        studentStrength: string;
        studentConfidence: number;
        importance: string;
    }>;
    missingRequiredTraits: string[];
    recommendation: string;
    reasoning: string[];
}
export declare class TalentMatchingService {
    /**
     * 为任务匹配学生
     */
    static matchStudentsForTask(taskId: string, topN?: number): Promise<MatchResult[]>;
    /**
     * 获取任务需求的特质
     */
    private static getTaskRequirements;
    /**
     * 获取学生的天赋画像
     */
    private static getStudentTalentProfile;
    /**
     * 计算学生与任务的匹配度
     */
    private static calculateMatch;
    /**
     * 计算天赋特质匹配度
     */
    private static calculateTalentMatch;
    /**
     * 计算OPC兼容性
     */
    private static calculateOPCCompatibility;
    /**
     * 计算成长潜力
     */
    private static calculateGrowthPotential;
    /**
     * 生成推荐
     */
    private static generateRecommendation;
}
export {};
//# sourceMappingURL=talentMatchingService.d.ts.map