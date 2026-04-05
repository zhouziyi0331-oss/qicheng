"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToOSS = uploadToOSS;
exports.deleteFromOSS = deleteFromOSS;
exports.getSignedUrl = getSignedUrl;
const ali_oss_1 = __importDefault(require("ali-oss"));
const logger_1 = __importDefault(require("./logger"));
/**
 * 上传文件到阿里云OSS
 * 文档: https://help.aliyun.com/document_detail/111265.html
 */
async function uploadToOSS(file, folder = 'uploads') {
    const region = process.env.OSS_REGION;
    const accessKeyId = process.env.OSS_ACCESS_KEY_ID;
    const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET;
    const bucket = process.env.OSS_BUCKET;
    // 开发模式或未配置：使用本地存储
    if (process.env.NODE_ENV === 'development' || !accessKeyId || !accessKeySecret) {
        logger_1.default.info('OSS dev mode - using local storage');
        return `/uploads/${file.filename}`;
    }
    try {
        const client = new ali_oss_1.default({
            region: region || 'oss-cn-hangzhou',
            accessKeyId,
            accessKeySecret,
            bucket: bucket || 'qicheng-prod',
        });
        // 生成唯一文件名
        const ext = file.originalname.split('.').pop();
        const timestamp = Date.now();
        const random = Math.random().toString(36).slice(2, 8);
        const ossPath = `${folder}/${timestamp}-${random}.${ext}`;
        // 上传到OSS
        const result = await client.put(ossPath, file.path);
        logger_1.default.info('File uploaded to OSS', {
            ossPath,
            url: result.url,
            size: file.size
        });
        // 返回CDN URL (如果配置了CDN域名)
        const cdnDomain = process.env.OSS_CDN_DOMAIN;
        if (cdnDomain) {
            return `https://${cdnDomain}/${ossPath}`;
        }
        return result.url;
    }
    catch (err) {
        logger_1.default.error('OSS upload error', { error: err.message });
        // 失败时降级到本地存储
        return `/uploads/${file.filename}`;
    }
}
/**
 * 删除OSS文件
 */
async function deleteFromOSS(ossPath) {
    const accessKeyId = process.env.OSS_ACCESS_KEY_ID;
    const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET;
    if (!accessKeyId || !accessKeySecret) {
        logger_1.default.info('OSS not configured - skip delete');
        return true;
    }
    try {
        const client = new ali_oss_1.default({
            region: process.env.OSS_REGION || 'oss-cn-hangzhou',
            accessKeyId,
            accessKeySecret,
            bucket: process.env.OSS_BUCKET || 'qicheng-prod',
        });
        await client.delete(ossPath);
        logger_1.default.info('File deleted from OSS', { ossPath });
        return true;
    }
    catch (err) {
        logger_1.default.error('OSS delete error', { error: err.message });
        return false;
    }
}
/**
 * 生成OSS签名URL (用于私有文件访问)
 */
async function getSignedUrl(ossPath, expiresInSeconds = 3600) {
    const accessKeyId = process.env.OSS_ACCESS_KEY_ID;
    const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET;
    if (!accessKeyId || !accessKeySecret) {
        return ossPath; // 开发模式直接返回路径
    }
    try {
        const client = new ali_oss_1.default({
            region: process.env.OSS_REGION || 'oss-cn-hangzhou',
            accessKeyId,
            accessKeySecret,
            bucket: process.env.OSS_BUCKET || 'qicheng-prod',
        });
        const url = client.signatureUrl(ossPath, {
            expires: expiresInSeconds,
        });
        return url;
    }
    catch (err) {
        logger_1.default.error('OSS signed URL error', { error: err.message });
        return ossPath;
    }
}
//# sourceMappingURL=oss.js.map