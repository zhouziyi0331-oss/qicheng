interface OPCResults {
    openness: number;
    persistence: number;
    creativity: number;
    personalityStyle: string;
}
interface TaskPerformance {
    taskId: string;
    quality: number;
    clientSatisfaction: number;
    onTime: boolean;
    responseTimeHours: number;
    skillsUsed: string[];
    completionDate: Date;
}
interface GrowthTrend {
    qualityTrend: 'improving' | 'stable' | 'declining';
    growthRate: number;
    skillAcquisitionRate: number;
    recentPerformance: number[];
}
/**
 * 学生能力更新服务
 * 基于任务完成情况动态更新学生能力画像
 */
declare class StudentCapabilityService {
    /**
     * 初始化学生能力画像
     */
    initializeCapability(studentId: string, opcResults?: OPCResults): Promise<void>;
    /**
     * 任务完成后更新学生能力
     */
    updateAfterTaskCompletion(studentId: string, taskId: string, performance: TaskPerformance): Promise<void>;
    /**
     * 更新技能熟练度
     */
    private updateSkillProficiency;
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
    getStudentCapability(studentId: string): Promise<any>;
    /**
     * 批量初始化所有学生的能力画像
     */
    initializeAllStudents(): Promise<void>;
    /**
     * 更新学生的工作偏好
     */
    updateWorkPreferences(studentId: string, preferences: {
        preferredTaskTypes?: string[];
        maxHoursPerWeek?: number;
        workStyle?: any;
    }): Promise<void>;
}
declare const _default: StudentCapabilityService;
export default _default;
//# sourceMappingURL=studentCapabilityService.d.ts.map