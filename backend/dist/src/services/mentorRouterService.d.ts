export declare class MentorRouterService {
    analyzeMessageType(message: string, context: any): Promise<any>;
    private fallbackAnalysis;
    private calculateKeywordScore;
    getUserContext(userId: string): Promise<{
        recent_messages: any[];
        mentor_mode: any;
        active_project: any;
        has_active_project: boolean;
        last_mentor: any;
    }>;
    logRouting(userId: string, analysis: any, sessionId: string): Promise<void>;
    generateTransition(emotionalResponse: any, projectResponse: any): Promise<string>;
}
export declare const mentorRouterService: MentorRouterService;
//# sourceMappingURL=mentorRouterService.d.ts.map