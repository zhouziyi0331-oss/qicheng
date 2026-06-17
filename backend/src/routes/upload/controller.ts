import { Request, Response } from 'express';
import { authenticate } from '../../middleware/auth';
import { uploadImages, uploadDocuments } from '../../middleware/fileUpload';
import logger from '../../utils/logger';
import OSS from 'ali-oss';

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
  logger.error('❌ 未配置OSS凭证！文件上传功能将不可用');
  logger.error('请在.env中配置: OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET, OSS_BUCKET');
  throw new Error('文件上传功能需要配置OSS凭证');
}

const ossClient = new OSS({
  region: 'oss-cn-chengdu',
  accessKeyId: ossAccessKeyId,
  accessKeySecret: ossAccessKeySecret,
  bucket: ossBucket || 'qicheng-files',
});

logger.info('✅ OSS客户端初始化成功');

/**
 * 上传单个图片 - 强制上传到OSS
 */
export async function uploadSingleImage(req: Request, res: Response) {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, error: '未上传文件' });
    }

    logger.info('开始上传图片到OSS:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      userId: req.user?.userId,
    });

    // 强制上传到OSS
    const filename = `images/${Date.now()}-${file.originalname}`;
    const result = await ossClient.put(filename, file.buffer);
    const fileUrl = result.url;

    logger.info('✅ 文件已上传到OSS:', fileUrl);

    res.json({
      success: true,
      data: {
        url: fileUrl,
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      },
    });
  } catch (error) {
    logger.error('上传图片到OSS失败:', error);
    res.status(500).json({
      success: false,
      error: '上传失败: ' + (error as Error).message
    });
  }
}

/**
 * 上传多个图片 - 强制上传到OSS
 */
export async function uploadMultipleImages(req: Request, res: Response) {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: '未上传文件' });
    }

    logger.info('开始批量上传图片到OSS:', {
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

    logger.info(`✅ 成功上传${uploadedFiles.length}个文件到OSS`);

    res.json({
      success: true,
      data: uploadedFiles,
    });
  } catch (error) {
    logger.error('批量上传图片到OSS失败:', error);
    res.status(500).json({
      success: false,
      error: '上传失败: ' + (error as Error).message
    });
  }
}

/**
 * 上传文档 - 强制上传到OSS
 */
export async function uploadDocument(req: Request, res: Response) {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, error: '未上传文件' });
    }

    logger.info('开始上传文档到OSS:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      userId: req.user?.userId,
    });

    // 强制上传到OSS
    const filename = `documents/${Date.now()}-${file.originalname}`;
    const result = await ossClient.put(filename, file.buffer);
    const fileUrl = result.url;

    logger.info('✅ 文档已上传到OSS:', fileUrl);

    res.json({
      success: true,
      data: {
        url: fileUrl,
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      },
    });
  } catch (error) {
    logger.error('上传文档到OSS失败:', error);
    res.status(500).json({
      success: false,
      error: '上传失败: ' + (error as Error).message
    });
  }
}

export { authenticate, uploadImages, uploadDocuments };
