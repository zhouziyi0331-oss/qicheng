import { Document } from 'mongoose';
export interface IMessage {
    role: 'student' | 'assistant';
    content: string;
    timestamp: Date;
}
export interface IConversation extends Document {
    conversationId: string;
    studentId: string;
    taskId: string;
    messages: IMessage[];
    createdAt: Date;
    updatedAt: Date;
}
export declare const Conversation: any;
//# sourceMappingURL=Conversation.d.ts.map