/**
 * VerifyService - 验证服务（状态机管理）
 *
 * 核心功能：
 * 1. 创建验证会话
 * 2. 管理两轮验证流程
 * 3. 状态机转换
 * 4. 调用AI判断服务
 */
interface VerifySession {
    id: string;
    student_id: string;
    company_id: string;
    match_id: string;
    status: string;
    round1_question_id?: string;
    round1_answer?: string;
    round1_result?: string;
    round1_retry_count: number;
    round1_ai_reason?: string;
    round1_retry_prompt?: string;
    round2_question_id?: string;
    round2_answer?: string;
    round2_result?: string;
    round2_ai_reason?: string;
    expires_at: Date;
}
interface Question {
    id: string;
    question_text: string;
    judge_criteria: {
        pass: string;
        fail: string;
    };
}
export declare class VerifyService {
    /**
     * 创建验证会话
     */
    static createSession(studentId: string, companyId: string, matchId: string): Promise<{
        sessionId: string;
        round1Question: Question;
    }>;
    /**
     * 提交第一轮回答
     */
    static submitRound1Answer(sessionId: string, answer: string): Promise<{
        status: string;
    }>;
    /**
     * 处理第一轮AI判断（异步）
     */
    private static processRound1Judge;
    /**
     * 提交第二轮回答
     */
    static submitRound2Answer(sessionId: string, answer: string): Promise<{
        status: string;
    }>;
    /**
     * 处理第二轮AI判断（异步）
     */
    private static processRound2Judge;
    /**
     * 获取会话状态
     */
    static getSessionStatus(sessionId: string): Promise<VerifySession>;
    /**
     * 获取第二轮题目
     */
    static getRound2Question(sessionId: string): Promise<Question>;
}
export {};
//# sourceMappingURL=verifyService.d.ts.map