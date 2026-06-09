interface QARequest {
    studentId: string;
    taskId: string;
    question: string;
    context?: string;
    conversationHistory?: Array<{
        role: string;
        content: string;
    }>;
}
interface QAResponse {
    answer: string;
    guidance_type: 'socratic' | 'hint' | 'direct' | 'encouragement';
    follow_up_questions: string[];
    related_stuck_points: Array<{
        description: string;
        solution_hint: string;
        similarity_score: number;
    }>;
    confidence_score: number;
    created_at: string;
}
declare class QAService {
    /**
     * 实时答疑 - 苏格拉底式引导
     */
    answerQuestion(request: QARequest): Promise<QAResponse>;
    /**
     * 保存对话消息到数据库
     */
    private saveConversationMessage;
    /**
     * 获取对话历史
     */
    getConversationHistory(conversationId: string): Promise<any>;
    /**
     * 获取学生在特定任务的对话历史
     */
    getConversationByStudentAndTask(studentId: string, taskId: string): Promise<any>;
    /**
     * 格式化答疑结果为前端友好的格式
     */
    formatAnswerForFrontend(response: QAResponse): {
        answer: string;
        guidanceType: "direct" | "encouragement" | "socratic" | "hint";
        followUpQuestions: string[];
        relatedStuckPoints: {
            description: string;
            solutionHint: string;
            similarityScore: number;
        }[];
        confidenceScore: number;
        createdAt: string;
    };
    /**
     * 判断是否应该提供直接答案（基于问题类型）
     */
    shouldProvideDirectAnswer(question: string): boolean;
}
export declare const qaService: QAService;
export {};
//# sourceMappingURL=qaService.d.ts.map