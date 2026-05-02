"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const systemController_1 = require("./systemController");
const router = (0, express_1.Router)();
// 管理员管理
router.get('/admins', systemController_1.getAdminList);
router.post('/admins', systemController_1.createAdmin);
router.put('/admins/:id', systemController_1.updateAdmin);
router.post('/admins/:id/reset-password', systemController_1.resetAdminPassword);
router.delete('/admins/:id', systemController_1.deleteAdmin);
// 操作日志
router.get('/logs', systemController_1.getOperationLogs);
// 系统配置
router.get('/config', systemController_1.getSystemConfig);
router.put('/config/:key', systemController_1.updateSystemConfig);
exports.default = router;
//# sourceMappingURL=systemRoutes.js.map