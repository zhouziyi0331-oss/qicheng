import multer from 'multer';
import path from 'path';
import { AppError } from './errorHandler';

/**
 * 文件上传安全中间件
 *
 * 功能：
 * 1. 文件类型白名单验证（扩展名 + 魔数）
 * 2. 文件大小限制
 * 3. 文件数量限制
 * 4. 防止路径遍历攻击
 */

// 文件魔数（Magic Number）签名 - 用于验证真实文件类型
const FILE_SIGNATURES: Record<string, number[]> = {
  // 图片
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  'image/gif': [0x47, 0x49, 0x46, 0x38],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF

  // 文档
  'application/pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
  'application/msword': [0xD0, 0xCF, 0x11, 0xE0], // DOC
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [0x50, 0x4B, 0x03, 0x04], // DOCX (ZIP)
  'application/vnd.ms-excel': [0xD0, 0xCF, 0x11, 0xE0], // XLS
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [0x50, 0x4B, 0x03, 0x04], // XLSX (ZIP)

  // 视频
  'video/mp4': [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], // ftyp
  'video/quicktime': [0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70], // MOV
};

/**
 * 验证文件魔数（文件头字节）
 */
function validateFileMagicNumber(buffer: Buffer, mimeType: string): boolean {
  const signature = FILE_SIGNATURES[mimeType];
  if (!signature) {
    return false;
  }

  // 检查文件头字节是否匹配
  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) {
      return false;
    }
  }

  return true;
}

/**
 * 配置：图片上传
 */
export const imageUploadConfig = {
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10, // 最多10个文件
  },
  fileFilter: (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (!allowedExts.includes(ext)) {
      return cb(new AppError(400, `不支持的文件类型: ${ext}`, 'INVALID_FILE_TYPE'));
    }

    // 验证MIME类型
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new AppError(400, `不支持的MIME类型: ${file.mimetype}`, 'INVALID_MIME_TYPE'));
    }

    cb(null, true);
  },
};

/**
 * 配置：文档上传
 */
export const documentUploadConfig = {
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
    files: 5,
  },
  fileFilter: (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (!allowedExts.includes(ext)) {
      return cb(new AppError(400, `不支持的文档类型: ${ext}`, 'INVALID_FILE_TYPE'));
    }

    cb(null, true);
  },
};

/**
 * 配置：视频上传
 */
export const videoUploadConfig = {
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB
    files: 3,
  },
  fileFilter: (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedExts = ['.mp4', '.mov'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (!allowedExts.includes(ext)) {
      return cb(new AppError(400, `不支持的视频类型: ${ext}`, 'INVALID_FILE_TYPE'));
    }

    const allowedMimes = ['video/mp4', 'video/quicktime'];
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new AppError(400, `不支持的视频MIME类型: ${file.mimetype}`, 'INVALID_MIME_TYPE'));
    }

    cb(null, true);
  },
};

/**
 * 中间件：上传后验证文件魔数
 * 在multer().array()之后使用
 */
export async function validateUploadedFiles(
  req: any,
  _res: any,
  next: any
): Promise<void> {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return next();
    }

    for (const file of files) {
      // 验证文件魔数
      if (!validateFileMagicNumber(file.buffer, file.mimetype)) {
        throw new AppError(
          400,
          `文件 ${file.originalname} 的实际类型与扩展名不匹配`,
          'FILE_SIGNATURE_MISMATCH'
        );
      }

      // 防止路径遍历攻击
      if (file.originalname.includes('..') || file.originalname.includes('/')) {
        throw new AppError(
          400,
          `文件名包含非法字符: ${file.originalname}`,
          'INVALID_FILENAME'
        );
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * 创建上传中间件
 * @param config 上传配置（imageUploadConfig | documentUploadConfig | videoUploadConfig）
 * @param fieldName 表单字段名
 * @param maxCount 最大文件数
 */
export function createUploadMiddleware(
  config: typeof imageUploadConfig,
  fieldName: string = 'files',
  maxCount: number = 10
) {
  const upload = multer(config);
  return [
    upload.array(fieldName, maxCount),
    validateUploadedFiles
  ];
}

// 导出常用的上传中间件
export const uploadImages = createUploadMiddleware(imageUploadConfig, 'images', 10);
export const uploadDocuments = createUploadMiddleware(documentUploadConfig, 'documents', 5);
export const uploadVideos = createUploadMiddleware(videoUploadConfig, 'videos', 3);
