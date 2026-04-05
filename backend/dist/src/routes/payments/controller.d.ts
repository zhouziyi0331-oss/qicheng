import { Request, Response, NextFunction } from 'express';
export declare function getBalance(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getHistory(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function requestWithdrawal(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function wechatNotify(req: Request, res: Response, _next: NextFunction): Promise<void>;
export declare function alipayNotify(req: Request, res: Response, _next: NextFunction): Promise<void>;
//# sourceMappingURL=controller.d.ts.map