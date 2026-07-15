/**
 * 天赋标签推断服务
 * 从OPC测评结果自动推断学生的天赋标签
 */
interface OPCScores {
    info_processing_score: number;
    info_processing_tendency: string;
    creation_drive_score: number;
    creation_drive_tendency: string;
    tool_learning_score: number;
    tool_learning_tendency: string;
    task_execution_score: number;
    task_execution_tendency: string;
    collaboration_score: number;
    collaboration_tendency: string;
    risk_attitude_score: number;
    risk_attitude_tendency: string;
}
export declare class TalentTagInferenceService {
    /**
     * 从OPC测评结果推断天赋标签
     */
    static inferFromOPC(studentId: string, opcScores: OPCScores): Promise<void>;
    /**
     * 从单个维度推断标签
     */
    private static inferFromDimension;
    /**
     * 从任务表现推断天赋标签
     */
    static inferFromTaskPerformance(studentId: string, taskId: string, performanceData: {
        response_time_minutes?: number;
        requirement_clarifications?: number;
        proactive_reports?: number;
        revision_count?: number;
        delivery_status?: string;
        delivery_completeness?: string;
        problem_handling?: string;
        optimization_awareness?: string;
        enterprise_rating?: number;
        enterprise_feedback?: string;
    }): Promise<void>;
}
export {};
//# sourceMappingURL=talentTagInferenceService.d.ts.map