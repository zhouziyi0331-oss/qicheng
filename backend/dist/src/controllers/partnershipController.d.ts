import { Request, Response } from 'express';
/**
 * 合伙人关系系统 Controller
 *
 * 核心理念：从雇佣关系到合伙人关系的自然演进
 * - 第1次合作：雇佣关系（hired）
 * - 第2次合作：建立信任（trusted）
 * - 第3次合作后：可以邀请成为合伙人（partner）
 */
export declare const getPartnership: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateCollaborationCount: (req: Request, res: Response) => Promise<void>;
export declare const invitePartner: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const respondToInvitation: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getStudentPartnerships: (req: Request, res: Response) => Promise<void>;
export declare const getCompanyPartnerships: (req: Request, res: Response) => Promise<void>;
export declare const recordInteraction: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=partnershipController.d.ts.map