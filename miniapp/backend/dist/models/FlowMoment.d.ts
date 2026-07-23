import mongoose, { Document } from 'mongoose';
/**
 * 穿越感时刻记录
 * 捕捉学生进入心流状态的时刻
 */
export interface IFlowMoment extends Document {
    userId: mongoose.Types.ObjectId;
    taskId?: mongoose.Types.ObjectId;
    momentText: string;
    durationMinutes?: number;
    context: string;
    capturedAt: Date;
}
export declare const FlowMoment: mongoose.Model<IFlowMoment, {}, {}, {}, mongoose.Document<unknown, {}, IFlowMoment, {}, {}> & IFlowMoment & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=FlowMoment.d.ts.map