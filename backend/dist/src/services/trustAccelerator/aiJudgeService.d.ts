/**
 * AIJudgeService - AI判断服务
 *
 * 核心功能：
 * 1. 调用DeepSeek API判断学生回答质量
 * 2. 返回结构化判断结果（pass/retry/fail）
 * 3. 记录判断日志用于阈值校准
 */
interface JudgeCriteria {
    pass: string;
    fail: string;
}
interface JudgeResult {
    result: 'pass' | 'retry' | 'fail';
    reason: string;
    retry_prompt?: string;
}
export declare class AIJudgeService {
    private static readonly DEEPSEEK_API_KEY;
    private static readonly DEEPSEEK_API_URL;
    private static readonly GPT_API_KEY;
    private static readonly GPT_API_URL;
    /**
     * 第一轮判断（能力验证）- 有retry机会
     */
    static judgeRound1(params: {
        sessionId: string;
        needDescription: string;
        questionText: string;
        criteria: JudgeCriteria;
        studentAnswer: string;
    }): Promise<JudgeResult>;
    /**
     * 第二轮判断（意愿验证）- 无retry，只有pass/fail
     */
    static judgeRound2(params: {
        sessionId: string;
        needDescription: string;
        questionText: string;
        criteria: JudgeCriteria;
        studentAnswer: string;
    }): Promise<JudgeResult>;
    /**
     * 调用AI API（支持DeepSeek主用，GPT备用）
     */
    private static callAI;
    /**
     * 记录AI判断日志
     */
    private static logJudge;
    /**
     * 获取当前阈值配置
     */
    static getThreshold(track?: string): Promise<{
        round1: number;
        round2: number;
    }>;
}
export {};
//# sourceMappingURL=aiJudgeService.d.ts.map