/**
 * 学生能力更新服务
 * 动态更新学生能力画 像
 * 基于任务完成情况更新技能、质量、成长趋势
 */
interface OPCResults {
    openness: number;
    persistence: number;
    creativity: number;
    personality_style: string;
}
interface TaskPerformance {
    task_id: string;
    quality_score: number;
    client_satisfaction: number;
    delivered_on_time: boolean;
    response_time_hours: number;
    skills_used: string[];
}
interface GrowthTrend {
    trend: 'improving' | 'stable' | 'declining' | 'unknown';
    growth_rate: number;
    skill_acquisition_rate: number;
    recent_quality_avg: number;
    quality_change: number;
}
declare class StudentCapabilityService {
    /**
     * 初始化学生能力画像
     */
    initializeCapability(studentId: string, opcResults: OPCResults): Promise<void>;
    /**
     * 任务完成后更新能力
     */
    updateAfterTaskCompletion(studentId: string, taskId: string, performance: TaskPerformance): Promise<void>;
    /**
     * 更新技能熟练度
     */
    private updateSkills;
    /**
     * 计算学生成长趋势
     */
    calculateGrowthTrend(studentId: string): Promise<GrowthTrend>;
    /**
     * 更新学生向量
     */
    updateStudentVectors(studentId: string): Promise<void>;
    /**
     * 获取学生能力画像
     */
    getCapability(studentId: string): Promise<any>;
    /**
     * 批量初始化学生能力（用于迁移）
     */
    batchInitializeCapabilities(limit?: number): Promise<number>;
}
declare const _default: StudentCapabilityService;
export default _default;
//# sourceMappingURL=studentCapabilityService.d.ts.map