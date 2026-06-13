/**
 * 启程老师翻译服务
 * 将企业任务翻译为学生易懂的语言
 * 拆解功能模块，评估难度，提取技能要求
 */
interface Task {
    id: string;
    title: string;
    description: string;
    required_skills?: any;
    budget?: number;
    duration?: number;
}
interface FunctionalModule {
    module: string;
    description: string;
    skills: string[];
    difficulty: number;
}
interface SkillRequirement {
    skill: string;
    proficiency: number;
    weight: number;
    why: string;
}
interface DifficultyAssessment {
    technical: number;
    cognitive: number;
    execution: number;
    communication: number;
    overall: number;
}
interface TaskTranslation {
    task_id: string;
    functional_modules: FunctionalModule[];
    student_friendly_title: string;
    student_friendly_description: string;
    what_you_will_do: string;
    what_you_will_learn: string;
    estimated_hours: number;
    required_skills: SkillRequirement[];
    difficulty: DifficultyAssessment;
    learning_value: number;
    career_impact: number;
}
declare class QichengTeacherService {
    private anthropic;
    constructor();
    /**
     * 分析任务并生成完整翻译
     */
    analyzeAndTranslateTask(task: Task): Promise<TaskTranslation>;
    /**
     * 计算综合难度
     */
    private calculateOverallDifficulty;
    /**
     * 创建降级翻译（当AI失败时）
     */
    private createFallbackTranslation;
    /**
     * 拆解功能模块
     */
    breakdownFunctionalModules(taskDescription: string): Promise<FunctionalModule[]>;
    /**
     * 生成学生友好描述
     */
    generateStudentFriendlyDescription(task: Task): Promise<string>;
    /**
     * 评估任务难度
     */
    assessTaskDifficulty(task: Task): Promise<DifficultyAssessment>;
    /**
     * 提取技能要求
     */
    extractSkillRequirements(task: Task): Promise<SkillRequirement[]>;
    /**
     * 保存翻译到数据库
     */
    saveTranslation(translation: TaskTranslation): Promise<void>;
    /**
     * 获取任务翻译
     */
    getTranslation(taskId: string): Promise<TaskTranslation | null>;
    /**
     * 为任务创建并保存翻译
     */
    translateTask(taskId: string): Promise<TaskTranslation>;
}
declare const _default: QichengTeacherService;
export default _default;
//# sourceMappingURL=qichengTeacherService.d.ts.map