import mongoose, { Document } from 'mongoose';
/**
 * 里程碑记录
 * 记录用户达成的重要成就和里程碑
 */
export interface IMilestone extends Document {
    userId: mongoose.Types.ObjectId;
    type: 'level_up' | 'achievement' | 'first_time' | 'milestone' | 'special';
    title: string;
    description?: string;
    icon?: string;
    metadata?: any;
    achievedAt: Date;
    createdAt: Date;
}
export declare const Milestone: mongoose.Model<IMilestone, {}, {}, {}, mongoose.Document<unknown, {}, IMilestone, {}, {}> & IMilestone & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Milestone.d.ts.map