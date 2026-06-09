import { Document } from 'mongoose';
export interface IInvitation extends Document {
    invitationId: string;
    taskId: string;
    companyId: string;
    studentId: string;
    status: 'pending' | 'accepted' | 'rejected' | 'expired';
    customMessage?: string;
    matchScore?: number;
    sentAt: Date;
    respondedAt?: Date;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Invitation: any;
//# sourceMappingURL=Invitation.d.ts.map