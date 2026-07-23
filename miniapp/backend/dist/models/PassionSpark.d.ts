import mongoose, { Document } from 'mongoose';
/**
 * 热情火花记录
 * 自动捕捉学生表现出热情的时刻
 */
export interface IPassionSpark extends Document {
    userId: mongoose.Types.ObjectId;
    taskId?: mongoose.Types.ObjectId;
    sparkText: string;
    context: string;
    capturedAt: Date;
}
export declare const PassionSpark: mongoose.Model<IPassionSpark, {}, {}, {}, mongoose.Document<unknown, {}, IPassionSpark, {}, {}> & IPassionSpark & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=PassionSpark.d.ts.map