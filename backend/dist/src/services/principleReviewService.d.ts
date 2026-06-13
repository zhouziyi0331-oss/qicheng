/**
 * AI-07 初心审核引擎
 *
 * 目的: 每次AI导师生成回复后，自动审核该回复是否符合初心
 * 审核标准: 该回复让学生更独立、更有判断力（通过），还是更依赖、更容易被控制（不通过）
 *
 * 这不是一个"拦截器"，而是产品初心的技术落地
 */
interface ReviewResult {
    pass: boolean;
    reason: string;
}
export declare class PrincipleReviewService {
    /**
     * 审核AI导师回复是否符合初心
     */
    reviewMentorResponse(candidateResponse: string, context: {
        studentLevel: number;
        conversationHistory?: string;
        hasRealCaseData?: boolean;
    }): Promise<ReviewResult>;
    /**
     * 检查回复中是否包含禁止模式（前端补充检查）
     */
    checkBlockedPatterns(text: string): {
        blocked: boolean;
        pattern?: string;
    };
}
declare const _default: PrincipleReviewService;
export default _default;
//# sourceMappingURL=principleReviewService.d.ts.map