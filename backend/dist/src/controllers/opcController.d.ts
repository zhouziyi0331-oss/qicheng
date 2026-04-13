import { Request, Response } from 'express';
/**
 * 提交OPC测试结果
 * POST /api/opc/submit
 */
export declare const submitOPCTest: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 获取用户OPC测试结果
 * GET /api/opc/result/:userId
 */
export declare const getOPCResult: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=opcController.d.ts.map