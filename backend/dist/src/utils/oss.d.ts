/**
 * 上传文件到阿里云OSS
 * 文档: https://help.aliyun.com/document_detail/111265.html
 */
export declare function uploadToOSS(file: Express.Multer.File, folder?: string): Promise<string>;
/**
 * 删除OSS文件
 */
export declare function deleteFromOSS(ossPath: string): Promise<boolean>;
/**
 * 生成OSS签名URL (用于私有文件访问)
 */
export declare function getSignedUrl(ossPath: string, expiresInSeconds?: number): Promise<string>;
//# sourceMappingURL=oss.d.ts.map