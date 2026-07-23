import mongoose, { Document } from 'mongoose';
/**
 * AI导师对话记录
 * 记录学生和导师的所有对话
 */
export interface IMentorConversation extends Document {
    userId: mongoose.Types.ObjectId;
    taskId?: mongoose.Types.ObjectId;
    studentMessage: string;
    mentorResponse: string;
    context: 'task' | 'working' | 'stuck' | 'rejected' | 'milestone' | 'general';
    detectedPassionSpark: boolean;
    detectedFlowMoment: boolean;
    createdAt: Date;
}
export declare const MentorConversation: mongoose.Model<IMentorConversation, {}, {}, {}, mongoose.Document<unknown, {}, IMentorConversation, {}, {}> & IMentorConversation & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=MentorConversation.d.ts.map