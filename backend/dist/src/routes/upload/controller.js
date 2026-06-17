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
// 真实的OSS上传（如果配置）
const ali_oss_1 = __importDefault(require("ali-oss"));
// OSS客户端配置
let ossClient = null;
if (process.env.OSS_ACCESS_KEY_ID && process.env.OSS_ACCESS_KEY_ID !== 'your-access-key-id') {
    ossClient = new ali_oss_1.default({
        region: 'oss-cn-chengdu',
        accessKeyId: process.env.OSS_ACCESS_KEY_ID,
        accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
        bucket: process.env.OSS_BUCKET || 'qicheng-files',
    });
    logger_1.default.info('✅ OSS客户端初始化成功');
}
else {
    logger_1.default.warn('⚠️  未配置OSS，文件上传将保存到本地');
}
/**
 * 上传单个图片 - 真实上传到OSS或本地
 */
async function uploadSingleImage(req, res) {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ success: false, error: '未上传文件' });
        }
        logger_1.default.info('开始上传图片:', {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            userId: req.user?.userId,
        });
        let fileUrl;
        // 真实上传到OSS
        if (ossClient) {
            const filename = `${Date.now()}-${file.originalname}`;
            const result = await ossClient.put(filename, file.buffer);
            fileUrl = result.url;
            logger_1.default.info('✅ 文件已上传到OSS:', fileUrl);
        }
        // 开发环境：返回base64
        else {
            fileUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
            logger_1.default.warn('⚠️  开发环境：文件转为base64');
        }
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
        logger_1.default.error('上传图片失败:', error);
        res.status(500).json({ success: false, error: '上传失败' });
    }
}
/**
 * 上传多个图片 - 真实上传
 */
async function uploadMultipleImages(req, res) {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ success: false, error: '未上传文件' });
        }
        logger_1.default.info('开始上传多个图片:', {
            count: files.length,
            userId: req.user?.userId,
        });
        const uploadedFiles = [];
        for (const file of files) {
            let fileUrl;
            if (ossClient) {
                const filename = `${Date.now()}-${file.originalname}`;
                const result = await ossClient.put(filename, file.buffer);
                fileUrl = result.url;
            }
            else {
                fileUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
            }
            uploadedFiles.push({
                url: fileUrl,
                filename: file.originalname,
                size: file.size,
                mimetype: file.mimetype,
            });
        }
        logger_1.default.info(`✅ 成功上传${uploadedFiles.length}个文件`);
        res.json({
            success: true,
            data: uploadedFiles,
        });
    }
    catch (error) {
        logger_1.default.error('上传多个图片失败:', error);
        res.status(500).json({ success: false, error: '上传失败' });
    }
}
/**
 * 上传文档 - 真实上传
 */
async function uploadDocument(req, res) {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ success: false, error: '未上传文件' });
        }
        logger_1.default.info('开始上传文档:', {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            userId: req.user?.userId,
        });
        let fileUrl;
        if (ossClient) {
            const filename = `documents/${Date.now()}-${file.originalname}`;
            const result = await ossClient.put(filename, file.buffer);
            fileUrl = result.url;
            logger_1.default.info('✅ 文档已上传到OSS:', fileUrl);
        }
        else {
            fileUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
            logger_1.default.warn('⚠️  开发环境：文档转为base64');
        }
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
        logger_1.default.error('上传文档失败:', error);
        res.status(500).json({ success: false, error: '上传失败' });
    }
}
//# sourceMappingURL=controller.js.map