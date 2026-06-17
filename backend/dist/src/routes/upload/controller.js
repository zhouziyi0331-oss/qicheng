"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadDocuments = exports.uploadImages = exports.authenticate = void 0;
exports.uploadSingleImage = uploadSingleImage;
exports.uploadMultipleImages = uploadMultipleImages;
exports.uploadDocument = uploadDocument;
const auth_1 = require("../../middleware/auth");
Object.defineProperty(exports, "authenticate", { enumerable: true, get: function () { return auth_1.authenticate; } });
const fileUpload_1 = require("../../middleware/fileUpload");
Object.defineProperty(exports, "uploadImages", { enumerable: true, get: function () { return fileUpload_1.uploadImages; } });
Object.defineProperty(exports, "uploadDocuments", { enumerable: true, get: function () { return fileUpload_1.uploadDocuments; } });
const logger_1 = __importDefault(require("../../utils/logger"));
const ali_oss_1 = __importDefault(require("ali-oss"));
/**
 * 文件上传控制器 - 强制上传到OSS
 * 必须配置OSS，不使用base64降级
 */
// OSS客户端配置 - 强制要求
const ossAccessKeyId = process.env.OSS_ACCESS_KEY_ID;
const ossAccessKeySecret = process.env.OSS_ACCESS_KEY_SECRET;
const ossBucket = process.env.OSS_BUCKET;
if (!ossAccessKeyId || ossAccessKeyId === 'your-access-key-id' ||
    !ossAccessKeySecret || ossAccessKeySecret === 'your-access-key-secret') {
    logger_1.default.error('❌ 未配置OSS凭证！文件上传功能将不可用');
    logger_1.default.error('请在.env中配置: OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET, OSS_BUCKET');
    throw new Error('文件上传功能需要配置OSS凭证');
}
const ossClient = new ali_oss_1.default({
    region: 'oss-cn-chengdu',
    accessKeyId: ossAccessKeyId,
    accessKeySecret: ossAccessKeySecret,
    bucket: ossBucket || 'qicheng-files',
});
logger_1.default.info('✅ OSS客户端初始化成功');
/**
 * 上传单个图片 - 强制上传到OSS
 */
async function uploadSingleImage(req, res) {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ success: false, error: '未上传文件' });
        }
        logger_1.default.info('开始上传图片到OSS:', {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            userId: req.user?.userId,
        });
        // 强制上传到OSS
        const filename = `images/${Date.now()}-${file.originalname}`;
        const result = await ossClient.put(filename, file.buffer);
        const fileUrl = result.url;
        logger_1.default.info('✅ 文件已上传到OSS:', fileUrl);
        res.json({
            success: true,
            data: {
                url: fileUrl,
                filename: file.originalname,
                size: file.size,
                mimetype: file.mimetype,
            },
        });
    }
    catch (error) {
        logger_1.default.error('上传图片到OSS失败:', error);
        res.status(500).json({
            success: false,
            error: '上传失败: ' + error.message
        });
    }
}
/**
 * 上传多个图片 - 强制上传到OSS
 */
async function uploadMultipleImages(req, res) {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ success: false, error: '未上传文件' });
        }
        logger_1.default.info('开始批量上传图片到OSS:', {
            count: files.length,
            userId: req.user?.userId,
        });
        const uploadedFiles = [];
        for (const file of files) {
            const filename = `images/${Date.now()}-${file.originalname}`;
            const result = await ossClient.put(filename, file.buffer);
            const fileUrl = result.url;
            uploadedFiles.push({
                url: fileUrl,
                filename: file.originalname,
                size: file.size,
                mimetype: file.mimetype,
            });
        }
        logger_1.default.info(`✅ 成功上传${uploadedFiles.length}个文件到OSS`);
        res.json({
            success: true,
            data: uploadedFiles,
        });
    }
    catch (error) {
        logger_1.default.error('批量上传图片到OSS失败:', error);
        res.status(500).json({
            success: false,
            error: '上传失败: ' + error.message
        });
    }
}
/**
 * 上传文档 - 强制上传到OSS
 */
async function uploadDocument(req, res) {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ success: false, error: '未上传文件' });
        }
        logger_1.default.info('开始上传文档到OSS:', {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            userId: req.user?.userId,
        });
        // 强制上传到OSS
        const filename = `documents/${Date.now()}-${file.originalname}`;
        const result = await ossClient.put(filename, file.buffer);
        const fileUrl = result.url;
        logger_1.default.info('✅ 文档已上传到OSS:', fileUrl);
        res.json({
            success: true,
            data: {
                url: fileUrl,
                filename: file.originalname,
                size: file.size,
                mimetype: file.mimetype,
            },
        });
    }
    catch (error) {
        logger_1.default.error('上传文档到OSS失败:', error);
        res.status(500).json({
            success: false,
            error: '上传失败: ' + error.message
        });
    }
}
//# sourceMappingURL=controller.js.map