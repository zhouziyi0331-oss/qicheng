import OSS from 'ali-oss';
import logger from './logger';

interface OSSConfig {
  region: string;
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
}

/**
 * 上传文件到阿里云OSS
 * 文档: https://help.aliyun.com/document_detail/111265.html
 */
export async function uploadToOSS(
  file: Express.Multer.File,
  folder: string = 'uploads'
): Promise<string> {
  const region = process.env.OSS_REGION;
  const accessKeyId = process.env.OSS_ACCESS_KEY_ID;
  const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET;
  const bucket = process.env.OSS_BUCKET;

  // 开发模式或未配置：使用本地存储
  if (process.env.NODE_ENV === 'development' || !accessKeyId || !accessKeySecret) {
    logger.info('OSS dev mode - using local storage');
    return `/uploads/${file.filename}`;
  }

  try {
    const client = new OSS({
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

    logger.info('File uploaded to OSS', {
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
  } catch (err) {
    logger.error('OSS upload error', { error: (err as Error).message });
    // 失败时降级到本地存储
    return `/uploads/${file.filename}`;
  }
}

/**
 * 删除OSS文件
 */
export async function deleteFromOSS(ossPath: string): Promise<boolean> {
  const accessKeyId = process.env.OSS_ACCESS_KEY_ID;
  const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET;

  if (!accessKeyId || !accessKeySecret) {
    logger.info('OSS not configured - skip delete');
    return true;
  }

  try {
    const client = new OSS({
      region: process.env.OSS_REGION || 'oss-cn-hangzhou',
      accessKeyId,
      accessKeySecret,
      bucket: process.env.OSS_BUCKET || 'qicheng-prod',
    });

    await client.delete(ossPath);
    logger.info('File deleted from OSS', { ossPath });
    return true;
  } catch (err) {
    logger.error('OSS delete error', { error: (err as Error).message });
    return false;
  }
}

/**
 * 生成OSS签名URL (用于私有文件访问)
 */
export async function getSignedUrl(
  ossPath: string,
  expiresInSeconds: number = 3600
): Promise<string> {
  const accessKeyId = process.env.OSS_ACCESS_KEY_ID;
  const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET;

  if (!accessKeyId || !accessKeySecret) {
    return ossPath; // 开发模式直接返回路径
  }

  try {
    const client = new OSS({
      region: process.env.OSS_REGION || 'oss-cn-hangzhou',
      accessKeyId,
      accessKeySecret,
      bucket: process.env.OSS_BUCKET || 'qicheng-prod',
    });

    const url = client.signatureUrl(ossPath, {
      expires: expiresInSeconds,
    });

    return url;
  } catch (err) {
    logger.error('OSS signed URL error', { error: (err as Error).message });
    return ossPath;
  }
}
