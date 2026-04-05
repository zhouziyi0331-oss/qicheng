import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
export declare const upload: multer.Multer;
export declare function uploadFile(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function uploadMultiple(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=controller.d.ts.map