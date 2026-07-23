import { Request, Response } from 'express';
/**
 * OPC测评控制器
 */
/**
 * 获取所有测试题
 */
export declare const getQuestions: (req: Request, res: Response) => Promise<void>;
/**
 * 提交OPC测评
 */
export declare const submitTest: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 获取用户OPC测评结果
 */
export declare const getResult: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 获取用户最新的测评结果
 */
export declare const getLatestResult: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 获取用户所有测评历史
 */
export declare const getUserResults: (req: Request, res: Response) => Promise<void>;
/**
 * 生成OPC成长报告（占位，后续实现）
 */
export declare const generateReport: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=opc.controller.d.ts.map