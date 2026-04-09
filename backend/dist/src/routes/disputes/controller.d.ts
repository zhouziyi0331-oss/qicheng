import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
/**
 * 申诉/纠纷处理控制器
 * 学生或企业对任务结果不满时可发起申诉，由管理员介入处理
 */
export declare const createDispute: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getMyDisputes: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getDisputeDetail: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const handleDispute: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getAllDisputes: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=controller.d.ts.map