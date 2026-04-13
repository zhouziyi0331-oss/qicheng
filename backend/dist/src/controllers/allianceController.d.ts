import { Request, Response } from 'express';
/**
 * 联合体组建 Controller
 *
 * 核心理念：孵化计划学生可以组建联合体，一起接大项目
 * - 创始人发起联合体
 * - 邀请其他孵化学生加入
 * - 一起接项目，分配收益
 */
export declare const createAlliance: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const inviteMember: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const respondToInvitation: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getStudentAlliances: (req: Request, res: Response) => Promise<void>;
export declare const getAllianceDetail: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createAllianceProject: (req: Request, res: Response) => Promise<void>;
export declare const getPendingInvitations: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=allianceController.d.ts.map