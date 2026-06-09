import { Document } from 'mongoose';
export interface ICapabilityScores {
    technical_depth: number;
    problem_solving: number;
    communication: number;
    collaboration: number;
    learning_agility: number;
    delivery_quality: number;
}
export interface IProfileSnapshot {
    opc_tag: string;
    capability_scores: ICapabilityScores;
}
export interface IProfileHistory extends Document {
    studentId: string;
    taskId: string;
    submissionId: string;
    previousProfile: IProfileSnapshot;
    updatedProfile: IProfileSnapshot;
    changes: {
        opc_tag_changed: boolean;
        significant_score_changes: Array<{
            dimension: string;
            old_score: number;
            new_score: number;
            change: number;
        }>;
    };
    insights: {
        strengths: string[];
        areas_for_improvement: string[];
        growth_trajectory: string;
        recommended_next_tasks: string[];
    };
    createdAt: Date;
}
export declare const ProfileHistory: any;
//# sourceMappingURL=ProfileHistory.d.ts.map