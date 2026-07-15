import { Request, Response } from 'express';
/**
 * 图片内容安全检查控制器
 * POST /api/v1/security/imgSecCheck
 */
export declare function imgSecCheck(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 文本内容安全检查控制器
 * POST /api/v1/security/msgSecCheck
 */
export declare function msgSecCheck(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=securityController.d.ts.map