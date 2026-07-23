import mongoose, { Document } from 'mongoose';
export interface ICollaboration extends Document {
    projectId: string;
    masterId: string;
    studentId: string;
    role: 'master' | 'student';
    status: 'ongoing' | 'completed' | 'cancelled';
    rating?: number;
    review?: string;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Collaboration: mongoose.Model<ICollaboration, {}, {}, {}, mongoose.Document<unknown, {}, ICollaboration, {}, {}> & ICollaboration & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Collaboration.d.ts.map