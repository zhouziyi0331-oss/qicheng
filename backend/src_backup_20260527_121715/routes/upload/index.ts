import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as ctrl from './controller';

const router = Router();

router.use(authenticate);

// POST /upload - 单文件上传
router.post('/', ctrl.upload.single('file'), ctrl.uploadFile);

// POST /upload/multiple - 多文件上传
router.post('/multiple', ctrl.upload.array('files', 5), ctrl.uploadMultiple);

export default router;
