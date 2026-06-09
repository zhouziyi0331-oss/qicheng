/**
 * 任务分级和智能匹配服务
 *
 * 处理任务等级计算、学生等级管理、智能匹配等功能
 */
export interface TaskLevel {
    id: string;
    level_code: string;
    level_name: string;
    level_order: number;
    min_complexity_score: number;
    max_complexity_score: number;
    min_price: number;
    max_price: number;
    estimated_hours_range: string;
    min_student_level: number;
    required_completed_tasks: number;
    min_avg_rating: number;
    description: string;
    examples: string;
}
export interface StudentLevel {
    id: string;
    student_id: string;
    current_level: number;
    level_name: string;
    total_exp: number;
    current_level_exp: number;
    next_level_exp: number;
    total_tasks_completed: number;
    total_tasks_failed: number;
    success_rate: number;
    l1_completed: number;
    l2_completed: number;
    l3_completed: number;
    l4_completed: number;
    l5_completed: number;
    avg_rating: number;
    total_ratings: number;
    quality_score: number;
    speed_score: number;
    communication_score: number;
    max_task_level: number;
    last_level_up_at?: Date;
    level_up_count: number;
}
export interface MatchScore {
    task_id: string;
    student_id: string;
    total_score: number;
    level_match_score: number;
    skill_match_score: number;
    experience_match_score: number;
    availability_score: number;
    location_score: number;
    price_match_score: number;
    history_score: number;
    match_reasons: any[];
    mismatch_reasons: any[];
    recommendation_level: string;
    ai_analysis?: string;
}
declare class TaskLevelMatchingService {
    /**
     * 计算任务等级
     */
    calculateTaskLevel(taskId: string): Promise<string>;
    /**
     * 获取所有任务等级定义
     */
    getTaskLevels(): Promise<TaskLevel[]>;
    /**
     * 获取学生等级信息
     */
    getStudentLevel(studentId: string): Promise<StudentLevel | null>;
    /**
     * 更新学生等级
     */
    updateStudentLevel(studentId: string): Promise<void>;
    /**
     * 智能匹配：为任务找到合适的学生
     */
    matchTaskWithStudents(taskId: string, limit?: number): Promise<MatchScore[]>;
    /**
     * 计算单个学生与任务的匹配分数
     */
    private calculateMatchScore;
    /**
     * 计算等级匹配分数
     */
    private calculateLevelMatch;
    /**
     * 计算技能匹配分数
     */
    private calculateSkillMatch;
    /**
     * 计算经验匹配分数
     */
    private calculateExperienceMatch;
    /**
     * 计算可用性分数
     */
    private calculateAvailability;
    /**
     * 计算价格匹配分数
     */
    private calculatePriceMatch;
    /**
     * 计算历史合作分数
     */
    private calculateHistoryScore;
    /**
     * 保存匹配分数到数据库
     */
    private saveMatchScore;
    /**
     * 获取任务的匹配学生列表
     */
    getTaskMatches(taskId: string, limit?: number): Promise<any[]>;
    /**
     * 获取学生的推荐任务
     */
    getStudentRecommendedTasks(studentId: string, limit?: number): Promise<any[]>;
    /**
     * 通知匹配的学生
     */
    notifyMatchedStudents(taskId: string, topN?: number): Promise<void>;
}
export declare const taskLevelMatchingService: TaskLevelMatchingService;
export {};
//# sourceMappingURL=taskLevelMatchingService.d.ts.map