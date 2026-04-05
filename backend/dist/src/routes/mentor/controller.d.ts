import { Request, Response, NextFunction } from 'express';
export declare function sendTaskStartGuidance(taskId: string, studentId: string): Promise<void>;
export declare function handleStuckMessage(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function generateRejectionFeedback(submissionId: string, rejectionReason: string): Promise<string>;
export declare function checkIdleStudents(): Promise<void>;
export declare function celebrateMilestone(studentId: string, milestoneType: string, milestoneData: any): Promise<void>;
export declare function getConversations(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=controller.d.ts.map