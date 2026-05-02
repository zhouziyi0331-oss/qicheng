import { Router } from 'express';
import {
  getAdminList,
  createAdmin,
  updateAdmin,
  resetAdminPassword,
  deleteAdmin,
  getOperationLogs,
  getSystemConfig,
  updateSystemConfig
} from './systemController';

const router = Router();

// 管理员管理
router.get('/admins', getAdminList);
router.post('/admins', createAdmin);
router.put('/admins/:id', updateAdmin);
router.post('/admins/:id/reset-password', resetAdminPassword);
router.delete('/admins/:id', deleteAdmin);

// 操作日志
router.get('/logs', getOperationLogs);

// 系统配置
router.get('/config', getSystemConfig);
router.put('/config/:key', updateSystemConfig);

export default router;
