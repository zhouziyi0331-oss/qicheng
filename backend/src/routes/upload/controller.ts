import { Request, Response } from 'express';
import { authenticate } from '../../middleware/auth';
import { uploadImages, uploadDocuments } from '../../middleware/fileUpload';
import logger from '../../utils/logger';

// 真实的OSS上传（如果配置）
import OSS from 'ali-oss';

// OSS客户端配置
let ossClient: OSS | null = null;

if (process.env.OSS_ACCESS_KEY_ID && process.env.OSS_ACCESS_KEY_ID !== 'your-access-key-id') {
  ossClient = new OSS({
    region: 'oss-cn-chengdu',
    accessKeyId: process.env.OSS_ACCESS_KEY_ID,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
    bucket: process.env.OSS_BUCKET || 'qicheng-files',
  });
  logger.info('✅ OSS客户端初始化成功');
} else {
  logger.warn('⚠️  未配置OSS，文件上传将保存到本地');
}

/**
 * 上传单个图片 - 真实上传到OSS或本地
 */
export async function uploadSingleImage(req: Request, res: Response) {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, error: '未上传文件' });
    }

    logger.info('开始上传图片:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      userId: req.user?.userId,
    });

    let fileUrl: string;

    // 真实上传到OSS
    if (ossClient) {
      const filename = `${Date.now()}-${file.originalname}`;
      const result = await ossClient.put(filename, file.buffer);
      fileUrl = result.url;
      logger.info('✅ 文件已上传到OSS:', fileUrl);
    }
    // 开发环境：返回base64
    else {
      fileUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      logger.warn('⚠️  开发环境：文件转为base64');
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
  } catch (error) {
    logger.error('上传图片失败:', error);
    res.status(500).json({ success: false, error: '上传失败' });
  }
}

/**
 * 上传多个图片 - 真实上传
 */
export async function uploadMultipleImages(req: Request, res: Response) {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: '未上传文件' });
    }

    logger.info('开始上传多个图片:', {
      count: files.length,
      userId: req.user?.userId,
    });

    const uploadedFiles = [];

    for (const file of files) {
      let fileUrl: string;

      if (ossClient) {
        const filename = `${Date.now()}-${file.originalname}`;
        const result = await ossClient.put(filename, file.buffer);
        fileUrl = result.url;
      } else {
        fileUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      }

      uploadedFiles.push({
        url: fileUrl,
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      });
    }

    logger.info(`✅ 成功上传${uploadedFiles.length}个文件`);

    res.json({
      success: true,
      data: uploadedFiles,
    });
  } catch (error) {
    logger.error('上传多个图片失败:', error);
    res.status(500).json({ success: false, error: '上传失败' });
  }
}

/**
 * 上传文档 - 真实上传
 */
export async function uploadDocument(req: Request, res: Response) {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, error: '未上传文件' });
    }

    logger.info('开始上传文档:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      userId: req.user?.userId,
    });

    let fileUrl: string;

    if (ossClient) {
      const filename = `documents/${Date.now()}-${file.originalname}`;
      const result = await ossClient.put(filename, file.buffer);
      fileUrl = result.url;
      logger.info('✅ 文档已上传到OSS:', fileUrl);
    } else {
      fileUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      logger.warn('⚠️  开发环境：文档转为base64');
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
  } catch (error) {
    logger.error('上传文档失败:', error);
    res.status(500).json({ success: false, error: '上传失败' });
  }
}

// 导出带安全验证的路由处理器
export { authenticate, uploadImages, uploadDocuments };
