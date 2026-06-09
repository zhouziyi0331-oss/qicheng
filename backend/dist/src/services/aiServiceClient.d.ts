declare class AIServiceClient {
    private client;
    constructor();
    preCheckSubmission(data: {
        task_id: string;
        student_id: string;
        submission_description: string;
        attachments: string[];
    }): Promise<any>;
    getProgressFeedback(data: {
        student_id: string;
        task_id: string;
    }): Promise<any>;
    breakdownTask(data: {
        task_id: string;
        student_id: string;
    }): Promise<any>;
    answerQuestion(data: {
        student_id: string;
        task_id: string;
        question: string;
        context?: string;
        conversation_history?: Array<{
            role: string;
            content: string;
        }>;
    }): Promise<any>;
    matchStudentsForTask(data: {
        task_id: string;
        limit?: number;
    }): Promise<any>;
    matchTasksForStudent(data: {
        student_id: string;
        limit?: number;
    }): Promise<any>;
    updateProfile(data: {
        student_id: string;
        task_id: string;
        performance: {
            rating: number;
            completion_time: number;
            feedback?: string;
            stuck_points_count?: number;
            revision_count?: number;
        };
    }): Promise<any>;
    healthCheck(): Promise<any>;
    chat(data: {
        messages: Array<{
            role: string;
            content: string;
        }>;
        model?: string;
        max_tokens?: number;
        temperature?: number;
        system?: string;
    }): Promise<any>;
}
export declare const aiServiceClient: AIServiceClient;
export {};
//# sourceMappingURL=aiServiceClient.d.ts.map