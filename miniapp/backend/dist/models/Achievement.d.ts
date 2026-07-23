import mongoose, { Document } from 'mongoose';
export interface IAchievement extends Document {
    userId: mongoose.Types.ObjectId;
    type: 'project_milestone' | 'ability_growth' | 'income_milestone' | 'learning_streak' | 'social_contribution' | 'special_event';
    title: string;
    description: string;
    icon: string;
    level: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
    progress: {
        current: number;
        target: number;
        unit: string;
    };
    isUnlocked: boolean;
    unlockedAt?: Date;
    rewards?: {
        exp: number;
        badge?: string;
        title?: string;
    };
    relatedData?: {
        projectIds?: mongoose.Types.ObjectId[];
        milestoneId?: mongoose.Types.ObjectId;
        radarSnapshotId?: mongoose.Types.ObjectId;
    };
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    isDisplayed: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Achievement: mongoose.Model<IAchievement, {}, {}, {}, mongoose.Document<unknown, {}, IAchievement, {}, {}> & IAchievement & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Achievement.d.ts.map