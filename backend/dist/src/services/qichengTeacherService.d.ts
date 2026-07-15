/**
 * 启程老师翻译服务 - 融合版
 *
 * 融合特点：
 * 1. 保留：心理洞察能力，温暖的语言风格（旧版精华）
 * 2. 整合：决策树快速响应，术语快速翻译（新版精华）
 * 3. 策略：常见情况用决策树（<50ms），复杂情况用AI（保留温暖）
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
    used_decision_tree?: boolean;
}
declare class QichengTeacherService {
    private anthropic;
    private decisionTree;
    constructor();
    /**
     * 分析任务并生成完整翻译（融合版）
     * 策略：先尝试决策树快速响应，复杂任务才调用AI
     */
    analyzeAndTranslateTask(task: Task): Promise<TaskTranslation>;
    /**
     * 新增：为简单任务生成模块
     */
    private generateSimpleModules;
    /**
     * 新增：为简单任务生成步骤
     */
    private generateSimpleSteps;
    /**
     * 新增：为简单任务生成学习内容
     */
    private generateSimpleLearning;
    /**
     * 计算综合难度（保留旧版）
     */
    private calculateOverallDifficulty;
    /**
     * 创建降级翻译（当AI失败时）（保留旧版）
     */
    private createFallbackTranslation;
    /**
     * 拆解功能模块（保留旧版）
     */
    breakdownFunctionalModules(taskDescription: string): Promise<FunctionalModule[]>;
    /**
     * 简化任务描述（保留旧版）
     */
    simplifyDescription(taskDescription: string): Promise<string>;
    /**
     * 评估任务难度（保留旧版）
     */
    assessTaskDifficulty(task: Task): Promise<DifficultyAssessment>;
    /**
     * 提取技能要求（保留旧版）
     */
    extractSkillRequirements(task: Task): Promise<SkillRequirement[]>;
    /**
     * 保存翻译到数据库（保留旧版）
     */
    saveTranslation(translation: TaskTranslation): Promise<void>;
    /**
     * 获取任务翻译（保留旧版）
     */
    getTranslation(taskId: string): Promise<TaskTranslation | null>;
    /**
     * 为任务创建并保存翻译（保留旧版）
     */
    translateTask(taskId: string): Promise<TaskTranslation>;
}
declare const _default: QichengTeacherService;
export default _default;
//# sourceMappingURL=qichengTeacherService.d.ts.map