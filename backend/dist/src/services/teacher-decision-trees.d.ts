/**
 * 导师决策树
 * 不是每次都调用GPT-4，而是用规则引擎快速响应常见场景
 */
interface StudentContext {
    studentId: string;
    currentCourse: string;
    currentStage: string;
    conversationHistory: Array<{
        role: string;
        content: string;
    }>;
    learningProgress: any;
    emotionalState?: string;
    strugglingPoints?: string[];
}
interface DecisionTreeResponse {
    shouldUseAI: boolean;
    response?: string;
    action?: string;
    emotionalTone?: string;
    nextSteps?: string[];
    reason?: string;
}
/**
 * 橙子的决策树
 */
export declare class OrangeDecisionTree {
    /**
     * 主决策函数：判断是否需要调用AI
     */
    decide(message: string, context: StudentContext): DecisionTreeResponse;
    /**
     * 规则引擎：情绪检测
     */
    private detectEmotionByRules;
    /**
     * 处理情绪危机
     */
    private handleEmotionalCrisis;
    /**
     * 匹配常见问题
     */
    private matchCommonQuestion;
    /**
     * 阶段特定引导
     */
    private getStageSpecificGuidance;
    /**
     * 检查进度里程碑
     */
    private checkProgressMilestone;
    /**
     * 获取阶段的第一步
     */
    private getFirstStepForStage;
    /**
     * 获取阶段的具体步骤
     */
    private getStageFirstSteps;
    /**
     * 判断是否需要严格要求
     */
    shouldBeStrict(context: StudentContext): boolean;
    /**
     * 判断是否需要鼓励
     */
    shouldEncourage(context: StudentContext): boolean;
}
/**
 * 启程老师的决策树
 */
export declare class QiChengDecisionTree {
    /**
     * 判断任务是否适合学生（规则引擎）
     */
    quickMatchTask(taskRequirements: any, studentProfile: any): {
        suitable: boolean;
        confidence: number;
        reason: string;
        needsAI: boolean;
    };
    /**
     * 快速翻译常见术语
     */
    quickTranslateTerm(term: string): {
        translation: string;
        explanation: string;
    } | null;
    /**
     * 判断是否需要详细翻译
     */
    needsDetailedTranslation(message: string): boolean;
}
export declare const orangeDecisionTree: OrangeDecisionTree;
export declare const qichengDecisionTree: QiChengDecisionTree;
export {};
//# sourceMappingURL=teacher-decision-trees.d.ts.map