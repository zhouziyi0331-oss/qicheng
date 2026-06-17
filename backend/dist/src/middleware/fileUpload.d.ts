import multer from 'multer';
/**
 * 配置：图片上传
 */
export declare const imageUploadConfig: {
    storage: multer.StorageEngine;
    limits: {
        fileSize: number;
        files: number;
    };
    fileFilter: (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => void;
};
/**
 * 配置：文档上传
 */
export declare const documentUploadConfig: {
    storage: multer.StorageEngine;
    limits: {
        fileSize: number;
        files: number;
    };
    fileFilter: (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => void;
};
/**
 * 配置：视频上传
 */
export declare const videoUploadConfig: {
    storage: multer.StorageEngine;
    limits: {
        fileSize: number;
        files: number;
    };
    fileFilter: (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => void;
};
/**
 * 中间件：上传后验证文件魔数
 * 在multer().array()之后使用
 */
export declare function validateUploadedFiles(req: any, _res: any, next: any): Promise<void>;
/**
 * 创建上传中间件
 * @param config 上传配置（imageUploadConfig | documentUploadConfig | videoUploadConfig）
 * @param fieldName 表单字段名
 * @param maxCount 最大文件数
 */
export declare function createUploadMiddleware(config: typeof imageUploadConfig, fieldName?: string, maxCount?: number): import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>[];
export declare const uploadImages: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>[];
export declare const uploadDocuments: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>[];
export declare const uploadVideos: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>[];
//# sourceMappingURL=fileUpload.d.ts.map