import { Request, Response } from 'express';
import { authenticate } from '../../middleware/auth';
import { uploadImages, uploadDocuments } from '../../middleware/fileUpload';
/**
 * 上传单个图片 - 真实上传到OSS或本地
 */
export declare function uploadSingleImage(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 上传多个图片 - 真实上传
 */
export declare function uploadMultipleImages(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 上传文档 - 真实上传
 */
export declare function uploadDocument(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export { authenticate, uploadImages, uploadDocuments };
//# sourceMappingURL=controller.d.ts.map