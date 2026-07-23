import mongoose, { Document } from 'mongoose';
/**
 * 后台任务模型
 * 记录所有异步后台任务的状态
 */
export interface IBackgroundTask extends Document {
    userId: mongoose.Types.ObjectId;
    taskType: 'ability_radar' | 'comparison_report' | 'growth_path' | 'graduation_report' | 'achievement_check';
    taskName: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    relatedId?: string;
    metadata?: any;
    attempts: number;
    maxAttempts: number;
    lastAttemptAt?: Date;
    completedAt?: Date;
    error?: string;
    errorStack?: string;
    result?: any;
    createdAt: Date;
    updatedAt: Date;
}
export declare const BackgroundTask: mongoose.Model<IBackgroundTask, {}, {}, {}, mongoose.Document<unknown, {}, IBackgroundTask, {}, {}> & IBackgroundTask & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=BackgroundTask.d.ts.map