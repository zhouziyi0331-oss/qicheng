"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
exports.uploadFile = uploadFile;
exports.uploadMultiple = uploadMultiple;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const oss_1 = require("../../utils/oss");
const logger_1 = __importDefault(require("../../utils/logger"));
// 配置文件存储
const uploadDir = path_1.default.join(__dirname, '../../../uploads/temp');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        const filename = `${(0, uuid_1.v4)()}${ext}`;
        cb(null, filename);
    },
});
const fileFilter = (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|zip|rar/;
    const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
        cb(null, true);
    }
    else {
        cb(new Error('不支持的文件类型'));
    }
};
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
// POST /upload - 单文件上传
async function uploadFile(req, res, next) {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, code: 'NO_FILE', message: '未上传文件' });
            return;
        }
        // 上传到OSS (如果配置了) 或使用本地存储
        const fileUrl = await (0, oss_1.uploadToOSS)(req.file, 'task-files');
        // 删除临时文件 (如果已上传到OSS)
        if (process.env.OSS_ACCESS_KEY_ID && fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
        }
        logger_1.default.info('File uploaded', {
            filename: req.file.originalname,
            size: req.file.size,
            url: fileUrl
        });
        res.json({
            success: true,
            data: {
                url: fileUrl,
                filename: req.file.originalname,
                size: req.file.size,
                mimetype: req.file.mimetype,
            },
        });
    }
    catch (err) {
        next(err);
    }
}
// POST /upload/multiple - 多文件上传
async function uploadMultiple(req, res, next) {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            res.status(400).json({ success: false, code: 'NO_FILES', message: '未上传文件' });
            return;
        }
        const fileData = await Promise.all(files.map(async (file) => {
            const url = await (0, oss_1.uploadToOSS)(file, 'task-files');
            // 删除临时文件
            if (process.env.OSS_ACCESS_KEY_ID && fs_1.default.existsSync(file.path)) {
                fs_1.default.unlinkSync(file.path);
            }
            return {
                url,
                filename: file.originalname,
                size: file.size,
                mimetype: file.mimetype,
            };
        }));
        res.json({ success: true, data: fileData });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=controller.js.map