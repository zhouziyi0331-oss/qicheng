/**
 * 任务赛道类型
 */
export type TaskTrack = 'content' | 'tool';
/**
 * 任务等级 (0-4)
 */
export type TaskLevel = 0 | 1 | 2 | 3 | 4;
/**
 * 难度评估
 */
export type DifficultyLevel = 'easy' | 'moderate' | 'challenging' | 'stretch';
/**
 * 学生能力画像
 */
export interface StudentAbility {
    userId: number;
    openness: number;
    persistence: number;
    creativity: number;
    primaryTrack: TaskTrack;
    currentLevel: TaskLevel;
    totalCompletedTasks: number;
    skills: string[];
}
/**
 * 任务需求
 */
export interface TaskRequirement {
    taskId: number;
    track: TaskTrack;
    level: TaskLevel;
    requiredOpenness: number;
    requiredPersistence: number;
    requiredCreativity: number;
    isStretchProject: boolean;
}
/**
 * 匹配结果
 */
export interface MatchResult {
    studentId: number;
    taskId: number;
    match_score: number;
    difficultyLevel: DifficultyLevel;
    matchReasons: string[];
    estimatedGrowth: {
        openness: number;
        persistence: number;
        creativity: number;
    };
}
/**
 * 智能匹配服务
 */
export declare class MatchingService {
    /**
     * 为任务匹配最合适的学生（Top N）
     */
    matchStudentsForTask(taskId: number, topN?: number): Promise<MatchResult[]>;
    /**
     * 为学生推荐最合适的任务（Top N）
     */
    matchTasksForStudent(userId: number, topN?: number): Promise<MatchResult[]>;
    /**
     * 核心匹配算法：计算学生与任务的匹配度
     */
    private calculateMatch;
    /**
     * 计算单项能力匹配分数
     * @param gap 能力差距（需求 - 当前）
     * @returns 分数 0-100
     */
    private calculateAbilityScore;
    /**
     * 保存匹配结果到数据库
     */
    saveMatchResults(matches: MatchResult[]): Promise<void>;
    /**
     * 获取任务的匹配学生列表
     */
    getMatchedStudentsForTask(taskId: number, limit?: number): Promise<{
        studentId: any;
        username: any;
        avatar: any;
        match_score: any;
        difficultyLevel: any;
        matchReasons: any;
        estimatedGrowth: {
            openness: any;
            persistence: any;
            creativity: any;
        };
        abilities: {
            openness: any;
            persistence: any;
            creativity: any;
        };
        currentLevel: any;
        totalCompletedTasks: any;
    }[]>;
    /**
     * 获取学生的推荐任务列表
     */
    getMatchedTasksForStudent(userId: number, limit?: number): Promise<{
        taskId: any;
        title: any;
        description: any;
        track: any;
        level: any;
        budgetRange: any;
        duration: any;
        studentPrice: any;
        isStretchProject: any;
        companyName: any;
        match_score: any;
        difficultyLevel: any;
        matchReasons: any;
        estimatedGrowth: {
            openness: any;
            persistence: any;
            creativity: any;
        };
    }[]>;
}
export declare const matchingService: MatchingService;
//# sourceMappingURL=matchingService.d.ts.map