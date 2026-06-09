export declare class UnifiedMentorService {
    chat(userId: string, message: string, options?: any): Promise<{
        content: string;
        mentor_type: string;
        mentor_name: string;
        mentor_avatar: string;
        switch_suggestion: {
            suggested: boolean;
            to_mentor: string;
            reason: string;
            confidence: number;
        } | null;
        session_id: string;
    } | {
        content: string;
        mentor_type: string;
        mentor_name: string;
        mentor_avatar: string;
        project_id: any;
        session_id: string;
    } | {
        content: string;
        mentor_type: string;
        mentor_name: string;
        mentor_avatar: string;
        session_id: string;
        project_id?: undefined;
    } | {
        content: string;
        mentor_type: string;
        emotional_part: {
            content: string;
            mentor_name: string;
            mentor_avatar: string;
        };
        transition: string;
        project_part: {
            content: string;
            mentor_name: string;
            mentor_avatar: string;
        };
        session_id: string;
    }>;
    private directRoute;
    private emotionalMentorResponse;
    private projectMentorResponse;
    private coordinatedResponse;
    private callEmotionalMentor;
    private checkSwitchSuggestion;
    private isProjectInitiationMessage;
    private saveMessage;
    switchMode(userId: string, mode: 'emotional' | 'project' | 'hybrid' | 'auto'): Promise<{
        success: boolean;
        message: string;
    }>;
    getConversationHistory(userId: string, sessionId: string, limit?: number): Promise<any[]>;
    linkEmotionToProject(userId: string, emotionalData: {
        life_question_id?: string;
        flow_moment_id?: string;
        emotional_state?: string;
        emotional_description?: string;
    }, projectId: string, linkType: string, transformationStory?: string): Promise<any>;
    getGrowthJourney(userId: string): Promise<any[]>;
}
export declare const unifiedMentorService: UnifiedMentorService;
//# sourceMappingURL=unifiedMentorService.d.ts.map