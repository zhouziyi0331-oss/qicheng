import { Request, Response } from 'express';
/**
 * 聊天系统控制器
 * 功能：学生和企业之间的实时聊天
 */
export declare const getOrCreateSession: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getChatSessions: (req: Request, res: Response) => Promise<void>;
export declare const getChatMessages: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const sendMessage: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const markMessagesAsRead: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getUnreadCount: (req: Request, res: Response) => Promise<void>;
export declare const archiveSession: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=chatController.d.ts.map