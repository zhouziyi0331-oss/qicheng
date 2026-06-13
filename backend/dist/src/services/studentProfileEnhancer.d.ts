/**
 * 学生档案增强服务 - E-05功能
 * 将普通学生信息转化为"投资简报"风格的展示
 * 包含成长故事、关键里程碑、数据可视化
 */
interface EnhancedProfile {
    student_id: string;
    student_name: string;
    level: number;
    avatar?: string;
    headline: string;
    growth_story: string;
    key_strengths: string[];
    milestones: Array<{
        date: string;
        title: string;
        description: string;
        impact: string;
    }>;
    metrics: {
        tasks_completed: number;
        success_rate: number;
        on_time_rate: number;
        avg_rating: number;
        response_time_hours: number;
        growth_rate: number;
    };
    skill_radar: Array<{
        skill: string;
        proficiency: number;
        confidence: number;
    }>;
    tags: string[];
    investment_highlights: string[];
}
declare class StudentProfileEnhancer {
    private anthropic;
    constructor();
    /**
     * 生成增强的学生档案
     */
    generateEnhancedProfile(studentId: string): Promise<EnhancedProfile>;
    /**
     * 获取学生基础信息
     */
    private getStudentBasicInfo;
    /**
     * 获取学生能力数据
     */
    private getStudentCapability;
    /**
     * 获取任务历史
     */
    private getTaskHistory;
    /**
     * 使用AI生成成长故事和亮点
     */
    private generateGrowthStory;
    /**
     * 提取关键里程碑
     */
    private extractMilestones;
    /**
     * 生成技能雷达图数据
     */
    private generateSkillRadar;
    /**
     * 生成特色标签
     */
    private generateTags;
    /**
     * 批量生成增强档案
     */
    batchGenerateProfiles(studentIds: string[]): Promise<Map<string, EnhancedProfile>>;
}
declare const _default: StudentProfileEnhancer;
export default _default;
//# sourceMappingURL=studentProfileEnhancer.d.ts.map