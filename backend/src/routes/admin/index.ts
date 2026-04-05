/**
 * 指令7: 后台管理系统 9大模块
 * 所有操作通过 adminOperationLogger 写入不可删除的日志
 *
 * M1 /admin/dashboard         — 数据看板
 * M2 /admin/company-tasks     — 企业需求管理
 * M3 /admin/students          — 学生身份数据
 * M4 /admin/support           — 客服工具
 * M5 /admin/tags              — 标签管理
 * M6 /admin/finance           — 财务管理
 * M7 /admin/notifications     — 通知推送
 * M8 /admin/logs              — 操作日志 (只读)
 * M9 /admin/config            — 系统配置 (超级管理员)
 */
import { Router } from 'express';
import { authenticate, requireRole, requireAdminRole } from '../../middleware/auth';
import { adminOperationLogger } from '../../middleware/adminLogger';
import * as controller from './controller';

const router = Router();
router.use(authenticate, requireRole('admin'));

// M1 数据看板 (所有管理员)
router.get('/dashboard', controller.getDashboard);

// M2 企业需求管理
router.get('/company-tasks', requireAdminRole('super', 'ops'), controller.getCompanyTasks);
router.post('/company-tasks/:id/takedown',
  requireAdminRole('super', 'ops'),
  adminOperationLogger('task_takedown', 'task'),
  controller.takedownTask
);
router.post('/companies/:id/blacklist',
  requireAdminRole('super', 'ops'),
  adminOperationLogger('company_blacklist', 'company'),
  controller.blacklistCompany
);

// M3 学生身份数据
router.get('/students', requireAdminRole('super', 'ops', 'cs'), controller.listStudents);
router.get('/students/:userId', requireAdminRole('super', 'ops', 'cs'), controller.getStudentDetail);
router.get('/students/:userId/export',
  requireAdminRole('super'),
  adminOperationLogger('student_data_export', 'user'),
  controller.exportStudentData
);

// M4 客服工具
router.get('/support/tasks/:taskId/messages', controller.getTaskMessages);
router.post('/support/tasks/:taskId/intervene',
  adminOperationLogger('task_intervene', 'task'),
  controller.interveneTask
);
router.post('/support/users/:userId/notify',
  adminOperationLogger('send_notification', 'user'),
  controller.sendAdminNotification
);

// M5 标签管理 (super + ops)
router.get('/tags', requireAdminRole('super', 'ops'), controller.getTags);
router.put('/tags/users/:userId',
  requireAdminRole('super', 'ops'),
  adminOperationLogger('tag_update', 'user'),
  controller.updateUserTag
);

// M6 财务管理
router.get('/finance/payments', requireAdminRole('super', 'ops'), controller.getPayments);
router.get('/finance/withdrawals', requireAdminRole('super', 'ops'), controller.getWithdrawals);
router.post('/finance/withdrawals/:id/approve',
  requireAdminRole('super'),
  adminOperationLogger('withdrawal_approve', 'withdrawal'),
  controller.approveWithdrawal
);
router.get('/finance/first-task-advances', requireAdminRole('super', 'ops'), controller.getFirstTaskAdvances);

// M7 通知推送 (super + ops)
router.post('/notifications/broadcast',
  requireAdminRole('super', 'ops'),
  adminOperationLogger('broadcast_notification', 'notification'),
  controller.broadcastNotification
);

// M8 操作日志 (只读，所有管理员可查自己的，super可查全部)
router.get('/logs', controller.getAdminLogs);

// M9 系统配置 (仅超级管理员)
router.get('/config', requireAdminRole('super'), controller.getSystemConfig);
router.put('/config/:key',
  requireAdminRole('super'),
  adminOperationLogger('config_update', 'system_config'),
  controller.updateSystemConfig
);

export default router;
