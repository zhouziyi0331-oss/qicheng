"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
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
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const adminLogger_1 = require("../../middleware/adminLogger");
const controller = __importStar(require("./controller"));
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, (0, auth_1.requireRole)('admin'));
// M1 数据看板 (所有管理员)
router.get('/dashboard', controller.getDashboard);
// M2 企业需求管理
router.get('/company-tasks', (0, auth_1.requireAdminRole)('super', 'ops'), controller.getCompanyTasks);
router.post('/company-tasks/:id/takedown', (0, auth_1.requireAdminRole)('super', 'ops'), (0, adminLogger_1.adminOperationLogger)('task_takedown', 'task'), controller.takedownTask);
router.post('/companies/:id/blacklist', (0, auth_1.requireAdminRole)('super', 'ops'), (0, adminLogger_1.adminOperationLogger)('company_blacklist', 'company'), controller.blacklistCompany);
// M3 学生身份数据
router.get('/students', (0, auth_1.requireAdminRole)('super', 'ops', 'cs'), controller.listStudents);
router.get('/students/:userId', (0, auth_1.requireAdminRole)('super', 'ops', 'cs'), controller.getStudentDetail);
router.get('/students/:userId/export', (0, auth_1.requireAdminRole)('super'), (0, adminLogger_1.adminOperationLogger)('student_data_export', 'user'), controller.exportStudentData);
// M4 客服工具
router.get('/support/tasks/:taskId/messages', controller.getTaskMessages);
router.post('/support/tasks/:taskId/intervene', (0, adminLogger_1.adminOperationLogger)('task_intervene', 'task'), controller.interveneTask);
router.post('/support/users/:userId/notify', (0, adminLogger_1.adminOperationLogger)('send_notification', 'user'), controller.sendAdminNotification);
// M5 标签管理 (super + ops)
router.get('/tags', (0, auth_1.requireAdminRole)('super', 'ops'), controller.getTags);
router.put('/tags/users/:userId', (0, auth_1.requireAdminRole)('super', 'ops'), (0, adminLogger_1.adminOperationLogger)('tag_update', 'user'), controller.updateUserTag);
// M6 财务管理
router.get('/finance/payments', (0, auth_1.requireAdminRole)('super', 'ops'), controller.getPayments);
router.get('/finance/withdrawals', (0, auth_1.requireAdminRole)('super', 'ops'), controller.getWithdrawals);
router.post('/finance/withdrawals/:id/approve', (0, auth_1.requireAdminRole)('super'), (0, adminLogger_1.adminOperationLogger)('withdrawal_approve', 'withdrawal'), controller.approveWithdrawal);
router.get('/finance/first-task-advances', (0, auth_1.requireAdminRole)('super', 'ops'), controller.getFirstTaskAdvances);
// M7 通知推送 (super + ops)
router.post('/notifications/broadcast', (0, auth_1.requireAdminRole)('super', 'ops'), (0, adminLogger_1.adminOperationLogger)('broadcast_notification', 'notification'), controller.broadcastNotification);
// M8 操作日志 (只读，所有管理员可查自己的，super可查全部)
router.get('/logs', controller.getAdminLogs);
// M9 系统配置 (仅超级管理员)
router.get('/config', (0, auth_1.requireAdminRole)('super'), controller.getSystemConfig);
router.put('/config/:key', (0, auth_1.requireAdminRole)('super'), (0, adminLogger_1.adminOperationLogger)('config_update', 'system_config'), controller.updateSystemConfig);
exports.default = router;
//# sourceMappingURL=index.js.map