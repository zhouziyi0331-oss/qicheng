/**
 * 深度推理引擎
 * 启程老师的"大脑" - 不是填模板，而是真正的思考过程
 */
interface ThinkingContext {
    studentId: string;
    question: string;
    currentSituation: string;
    taskId?: string;
}
interface Hypothesis {
    hypothesis: string;
    evidence: string[];
    confidence: number;
}
interface ThinkingProcess {
    question: string;
    recall: {
        studentHistory: any[];
        similarCases: any[];
        relevantPatterns: string[];
    };
    hypotheses: Hypothesis[];
    reasoning: {
        mainHypothesis: string;
        reasoning: string;
        counterEvidence: string;
    };
    insight: {
        understanding: string;
        rootCause: string;
        actionable: string;
    };
}
declare class ReasoningEngine {
    /**
     * 深度思考 - 核心方法
     */
    think(context: ThinkingContext): Promise<ThinkingProcess>;
    /**
     * 第一步：回忆相关信息
     */
    private recall;
    /**
     * 提取行为模式
     */
    private extractPatterns;
    /**
     * 第二步：形成多个假设
     */
    private generateHypotheses;
    /**
     * 备用假设（当AI调用失败时）- 增强版：基于真实数据推理
     */
    private getFallbackHypotheses;
    /**
     * 分析学生画像 - 基于历史数据
     */
    private analyzeStudentProfile;
    /**
     * 理解"言外之意" - 分析学生话语背后的真实意图
     */
    private analyzeImpliedMeaning;
    /**
     * 第三步：推理验证
     */
    private reason;
    /**
     * 第四步：形成洞察
     */
    private formInsight;
    /**
     * 保存思考记录
     */
    private saveThinkingRecord;
}
declare const _default: ReasoningEngine;
export default _default;
//# sourceMappingURL=reasoningEngine.d.ts.map