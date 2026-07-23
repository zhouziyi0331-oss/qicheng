import mongoose, { Document } from 'mongoose';
export interface ISecretSpace extends Document {
    userId: mongoose.Types.ObjectId;
    daysSinceJoined: number;
    consecutiveDays: number;
    lastCheckInDate: Date;
    moodRecords: Array<{
        date: Date;
        mood: 'excited' | 'happy' | 'normal' | 'tired' | 'frustrated';
        note: string;
        tags: string[];
    }>;
    privateNotes: Array<{
        title: string;
        content: string;
        createdAt: Date;
        updatedAt: Date;
        tags: string[];
    }>;
    personalMilestones: Array<{
        title: string;
        description: string;
        targetDate?: Date;
        completed: boolean;
        completedAt?: Date;
    }>;
    favoriteQuotes: Array<{
        text: string;
        author?: string;
        savedAt: Date;
    }>;
    settings: {
        theme: 'cat' | 'star' | 'forest' | 'ocean';
        backgroundColor: string;
        isPublic: boolean;
    };
    createdAt: Date;
    updatedAt: Date;
}
export declare const SecretSpace: mongoose.Model<ISecretSpace, {}, {}, {}, mongoose.Document<unknown, {}, ISecretSpace, {}, {}> & ISecretSpace & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=SecretSpace.d.ts.map