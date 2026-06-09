interface FunctionalModule {
    module: string;
    description: string;
    skills: string[];
    difficulty: number;
    estimatedHours: number;
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
    taskId: string;
    functionalModules: FunctionalModule[];
    studentFriendlyTitle: string;
    studentFriendlyDescription: string;
    whatYouWillDo: string;
    whatYouWillLearn: string;
    estimatedHours: number;
    requiredSkills: SkillRequirement[];
    difficulty: DifficultyAssessment;
    learningValue: number;
    careerImpact: number;
}
/**
 * 启程老师翻译服务
 * AI理解企业任务，翻译成学生能懂的语言
 */
declare class QichengTeacherService {
    /**
     * 需求翻译：理解企业的真实需求
     *
     * 企业说"我们要一个酷炫的H5"
     * 真实需求："我们下周要见投资人，需要一个能在手机上展示、
     *           让人眼前一亮的东西，证明我们团队有技术实力"
     */
    translateRequirement(taskId: string): Promise<string>;
    /**
     * 分析并翻译任务（完整版）
     */
    analyzeAndTranslateTask(taskId: string): Promise<TaskTranslation>;
    /**
     * 拆解功能模块
     */
    breakdownFunctionalModules(taskDescription: string): Promise<FunctionalModule[]>;
    /**
     * 生成学生友好描述
     */
    generateStudentFriendlyDescription(taskTitle: string, taskDescription: string): Promise<string>;
    /**
     * 评估任务难度
     */
    assessTaskDifficulty(task: {
        title: string;
        description: string;
        required_skills: string[];
        level_required: string;
    }): Promise<DifficultyAssessment>;
    /**
     * 提取技能要求
     */
    extractSkillRequirements(task: {
        title: string;
        description: string;
        required_skills: string[];
    }): Promise<SkillRequirement[]>;
    /**
     * 保存翻译结果到数据库
     */
    private saveTranslation;
    /**
     * 获取任务翻译
     */
    getTaskTranslation(taskId: string): Promise<TaskTranslation | null>;
    /**
     * 生成项目需求摘要（与学生画像摘要结构对应）
     *
     * 核心原则：这段摘要将被转成1024维向量，必须和学生画像摘要在同一个语义层次上对话
     */
    generateProjectRequirementSummary(taskId: string): Promise<string>;
}
declare const _default: QichengTeacherService;
export default _default;
//# sourceMappingURL=qichengTeacherService.d.ts.map