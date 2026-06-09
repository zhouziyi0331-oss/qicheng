/**
 * 个性化表达服务
 * 基于深度思考结果，生成个性化的、有温度的回复
 */
interface ExpressionContext {
    studentId: string;
    situation: string;
    question: string;
    taskId?: string;
}
interface PersonalizedResponse {
    thinking: any;
    response: string;
    tone: string;
}
declare class PersonalizedExpressionService {
    /**
     * 生成个性化回复 - 核心方法
     */
    generateResponse(context: ExpressionContext): Promise<PersonalizedResponse>;
    /**
     * 基于思考结果生成表达
     */
    private express;
    /**
     * 推断语气
     */
    private inferTone;
    /**
     * 保存到短期记忆
     */
    private saveToShortTermMemory;
    /**
     * 快速回复（不需要深度思考的场景）
     */
    quickResponse(studentId: string, situation: string, responseType: 'encouragement' | 'clarification' | 'acknowledgment'): Promise<string>;
}
declare const _default: PersonalizedExpressionService;
export default _default;
//# sourceMappingURL=personalizedExpressionService.d.ts.map