import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { uploadToOSS } from '../../utils/oss';
import logger from '../../utils/logger';

// 配置文件存储
const uploadDir = path.join(__dirname, '../../../uploads/temp');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|zip|rar/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// POST /upload - 单文件上传
export async function uploadFile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, code: 'NO_FILE', message: '未上传文件' });
      return;
    }

    // 上传到OSS (如果配置了) 或使用本地存储
    const fileUrl = await uploadToOSS(req.file, 'task-files');

    // 删除临时文件 (如果已上传到OSS)
    if (process.env.OSS_ACCESS_KEY_ID && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    logger.info('File uploaded', {
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
  } catch (err) {
    next(err);
  }
}

// POST /upload/multiple - 多文件上传
export async function uploadMultiple(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ success: false, code: 'NO_FILES', message: '未上传文件' });
      return;
    }

    const fileData = await Promise.all(
      files.map(async (file) => {
        const url = await uploadToOSS(file, 'task-files');

        // 删除临时文件
        if (process.env.OSS_ACCESS_KEY_ID && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }

        return {
          url,
          filename: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
        };
      })
    );

    res.json({ success: true, data: fileData });
  } catch (err) {
    next(err);
  }
}
