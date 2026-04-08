export declare function analyzeOPCTest(userId: string, answers: Record<string, any>): Promise<{
    d1_score: number;
    d2_score: number;
    d3_score: number;
    d4_score: number;
    d5_score: number;
    d6_score: number;
    opc_label: string;
    opc_label_secondary: string;
    recommended_track: 'A' | 'B' | 'AB';
    recommended_level: number;
    share_card_caption: string;
    share_card_data: any;
    raw_response: string;
}>;
export declare function buildFallbackAnalysis(answers: Record<string, any>): any;
export declare function evaluateChallengeTest(questions: any[], answers: any[], currentLevel: number, targetLevel: number): Promise<{
    score: number;
    feedback: string;
    failedReason?: string;
    detailedAnalysis: any;
}>;
export declare function evaluateSubcontractReason(reason: string, taskTitle: string, taskDescription: string): Promise<{
    approved: boolean;
    feedback: string;
}>;
//# sourceMappingURL=aiAnalysis.d.ts.map