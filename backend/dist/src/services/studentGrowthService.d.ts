interface GrowthEvent {
    id: string;
    student_id: string;
    event_type: string;
    title: string;
    description: string;
    impact_score: number;
    related_task_id?: string;
    related_skill?: string;
    metric_change?: any;
    event_date: Date;
}
interface Milestone {
    id: string;
    student_id: string;
    milestone_type: string;
    title: string;
    description: string;
    icon?: string;
    badge_color?: string;
    reward?: any;
    unlocked_at: Date;
    is_featured: boolean;
}
interface SkillEvolution {
    skill_name: string;
    current_level: number;
    current_proficiency: number;
    level_history: Array<{
        date: string;
        level: number;
        proficiency: number;
    }>;
    practice_count: number;
    growth_rate: number;
    trend: 'rising' | 'stable' | 'declining';
    first_used_at: Date;
}
interface GrowthTimeline {
    events: GrowthEvent[];
    milestones: Milestone[];
    skill_evolution: SkillEvolution[];
    summary: {
        total_events: number;
        total_milestones: number;
        high_impact_events: number;
        skills_mastered: number;
        growth_trend: string;
    };
}
/**
 * E-07: 学生成长轨迹服务
 * 追踪和可视化学生的成长历程
 */
declare class StudentGrowthService {
    /**
     * 获取学生成长时间轴
     */
    getGrowthTimeline(studentId: string, options?: {
        startDate?: Date;
        endDate?: Date;
        eventTypes?: string[];
        limit?: number;
    }): Promise<GrowthTimeline>;
    /**
     * 记录成长事件
     */
    recordGrowthEvent(data: {
        studentId: string;
        eventType: string;
        title: string;
        description?: string;
        impactScore: number;
        relatedTaskId?: string;
        relatedSkill?: string;
        metricChange?: any;
        eventDate?: Date;
    }): Promise<GrowthEvent>;
    /**
     * 任务完成后自动记录成长事件
     */
    recordTaskCompletionEvent(studentId: string, taskId: string, taskTitle: string, rating: number): Promise<void>;
    /**
     * 等级提升时记录事件
     */
    recordLevelUpEvent(studentId: string, oldLevel: number, newLevel: number): Promise<void>;
    /**
     * 技能习得时记录事件
     */
    recordSkillAcquiredEvent(studentId: string, skillName: string, proficiency: number): Promise<void>;
    /**
     * 更新技能进化记录
     */
    updateSkillEvolution(studentId: string, skillName: string, proficiency: number): Promise<void>;
    /**
     * 检查并解锁里程碑
     */
    checkAndUnlockMilestones(studentId: string): Promise<Milestone[]>;
    /**
     * 获取学生统计数据
     */
    private getStudentStats;
    /**
     * 计算影响力分数
     */
    private calculateImpactScore;
    /**
     * 计算成长趋势
     */
    private calculateGrowthTrend;
    /**
     * 计算技能趋势
     */
    private calculateSkillTrend;
    /**
     * 计算成长速率
     */
    private calculateGrowthRate;
}
declare const _default: StudentGrowthService;
export default _default;
//# sourceMappingURL=studentGrowthService.d.ts.map