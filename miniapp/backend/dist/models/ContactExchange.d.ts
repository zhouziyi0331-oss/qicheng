import mongoose, { Document } from 'mongoose';
export interface IContactExchange extends Document {
    requesterId: string;
    partnerId: string;
    status: 'pending' | 'confirmed' | 'rejected';
    requesterConfirmed: boolean;
    partnerConfirmed: boolean;
    collaborationCount: number;
    requestedAt: Date;
    confirmedAt?: Date;
    exchangedContact?: {
        requesterContact: string;
        partnerContact: string;
    };
    createdAt: Date;
    updatedAt: Date;
}
export declare const ContactExchange: mongoose.Model<IContactExchange, {}, {}, {}, mongoose.Document<unknown, {}, IContactExchange, {}, {}> & IContactExchange & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=ContactExchange.d.ts.map