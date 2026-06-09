"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auditLogController_1 = require("./auditLogController");
const router = (0, express_1.Router)();
// 获取审计日志列表
router.get('/', auditLogController_1.getAuditLogList);
// 获取审计日志统计
router.get('/stats', auditLogController_1.getAuditLogStats);
exports.default = router;
//# sourceMappingURL=auditLogRoutes.js.map