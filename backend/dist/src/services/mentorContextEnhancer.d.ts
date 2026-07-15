/**
 * AI导师上下文增强服务
 *
 * 核心原则：让AI导师的每句话都有真实数据支撑
 * - 查得到就引用，查不到就不编造
 * - 所有引用都能追溯到数据库记录
 */
interface RealStuckCase {
    observation_content: string;
    context: any;
    student_level?: number;
    time_stuck_days?: number;
}
interface LastMessage {
    content: string;
    created_at: Date;
}
interface GrowthComparison {
    initial_gaps: string[];
    current_skills: string[];
    gaps_closed: string[];
    client_feedback?: {
        rating: number;
        comment: string;
    };
}
declare class MentorContextEnhancer {
    /**
     * T-02: 获取真实的同类卡点案例（增强版）
     *
     * 优先从案例库获取，如果案例库为空则回退到mentor_growth_observations
     *
     * @param studentId 当前学生ID
     * @param taskId 当前任务ID
     * @returns 真实案例或null（查不到不编造）
     */
    getRealStuckCase(studentId: string, taskId: string): Promise<RealStuckCase | null>;
    /**
     * T-04: 获取学生在该任务的最近一条消息
     *
     * @param taskId 任务ID
     * @returns 最近消息或null
     */
    getLastStudentMessage(taskId: string): Promise<LastMessage | null>;
    /**
     * T-05: 获取学生成长对比数据（入驻时vs现在）
     *
     * @param studentId 学生ID
     * @param assignmentId 任务分配ID (task_assignments.id)
     * @returns 成长对比数据
     */
    getGrowthComparison(studentId: string, assignmentId: string): Promise<GrowthComparison>;
    /**
     * 计算时间间隔（用于轻推消息）
     */
    private calculateTimeSince;
    /**
     * 获取时间间隔的小时数（数字）
     */
    getHoursSince(timestamp: Date): number;
}
declare const _default: MentorContextEnhancer;
export default _default;
//# sourceMappingURL=mentorContextEnhancer.d.ts.map