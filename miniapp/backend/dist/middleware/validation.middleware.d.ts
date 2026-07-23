import { Request, Response, NextFunction } from 'express';
/**
 * 请求验证中间件
 * 验证必需参数
 */
export declare const validateBody: (requiredFields: string[]) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * 分页参数验证
 */
export declare const validatePagination: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * MongoDB ObjectId验证
 */
export declare const validateObjectId: (paramName: string) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=validation.middleware.d.ts.map