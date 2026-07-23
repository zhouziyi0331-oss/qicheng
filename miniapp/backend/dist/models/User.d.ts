import mongoose, { Document } from 'mongoose';
export interface IUser extends Document {
    openId: string;
    unionId?: string;
    nickname: string;
    avatar: string;
    phone?: string;
    email?: string;
    wechatId?: string;
    company?: string;
    track?: 'content' | 'dev';
    role: 'user' | 'admin';
    level: number;
    exp: number;
    totalIncome: number;
    totalProjects: number;
    rating: number;
    balance: number;
    totalWithdrawal: number;
    personalityTag?: string;
    opcCompleted?: boolean;
    opcCompletedAt?: Date;
    lifeQuestion?: string;
    isTestData?: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=User.d.ts.map