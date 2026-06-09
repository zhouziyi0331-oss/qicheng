import { Router } from 'express';
import { getAuditLogList, getAuditLogStats } from './auditLogController';

const router = Router();

// 获取审计日志列表
router.get('/', getAuditLogList);

// 获取审计日志统计
router.get('/stats', getAuditLogStats);

export default router;
