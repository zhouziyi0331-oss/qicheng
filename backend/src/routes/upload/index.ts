import { Router } from 'express';
import { authenticate, uploadImages, uploadDocuments } from './controller';
import { uploadSingleImage, uploadMultipleImages, uploadDocument } from './controller';

const router = Router();

// 所有上传接口都需要认证
router.use(authenticate);

// POST /api/v1/upload/image - 上传单个图片（带安全验证）
router.post('/image', uploadImages[0], uploadImages[1], uploadSingleImage);

// POST /api/v1/upload/images - 上传多个图片（带安全验证）
router.post('/images', uploadImages[0], uploadImages[1], uploadMultipleImages);

// POST /api/v1/upload/document - 上传文档（带安全验证）
router.post('/document', uploadDocuments[0], uploadDocuments[1], uploadDocument);

export default router;
