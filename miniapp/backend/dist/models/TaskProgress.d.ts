import mongoose, { Document } from 'mongoose';
export interface ITaskProgress extends Document {
    userId: mongoose.Types.ObjectId;
    projectType: 'practice' | 'real';
    projectId: mongoose.Types.ObjectId;
    projectSnapshot: {
        title: string;
        description: string;
        difficulty: string;
    };
    tasks: Array<{
        taskNumber: number;
        title: string;
        description: string;
        approach: string;
        steps: Array<{
            stepNumber: number;
            content: string;
            estimatedTime: string;
            tips?: string[];
        }>;
        status: 'pending' | 'in_progress' | 'completed' | 'blocked';
        progress: number;
        startedAt?: Date;
        completedAt?: Date;
        estimatedDuration: string;
        actualDuration?: string;
        deliverables: Array<{
            name: string;
            description: string;
            url?: string;
            completed: boolean;
        }>;
        challenges?: Array<{
            problem: string;
            solution: string;
            recordedAt: Date;
        }>;
        reflection?: {
            whatWorked: string[];
            whatToImprove: string[];
            lessonsLearned: string[];
        };
    }>;
    overallProgress: number;
    status: 'planning' | 'in_progress' | 'completed' | 'paused';
    aiRecommendations?: Array<{
        type: 'task_order' | 'time_management' | 'quality_improvement' | 'resource';
        content: string;
        priority: 'high' | 'medium' | 'low';
        createdAt: Date;
    }>;
    projectSummary?: {
        totalTimeSpent: string;
        tasksCompleted: number;
        challengesFaced: number;
        keyAchievements: string[];
        skillsImproved: string[];
        nextSteps: string[];
    };
    createdAt: Date;
    updatedAt: Date;
}
export declare const TaskProgress: mongoose.Model<ITaskProgress, {}, {}, {}, mongoose.Document<unknown, {}, ITaskProgress, {}, {}> & ITaskProgress & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=TaskProgress.d.ts.map