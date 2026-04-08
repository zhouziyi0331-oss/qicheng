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
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_1 = require("../../middleware/auth");
const controller = __importStar(require("./adminController"));
const router = (0, express_1.Router)();
// 所有管理后台路由都需要管理员权限
router.use(auth_1.authenticate, controller.requireAdmin);
// ============================================================
// GET /admin/dashboard - 数据看板
// ============================================================
router.get('/dashboard', controller.getDashboard);
// ============================================================
// GET /admin/users - 用户列表
// ============================================================
router.get('/users', controller.getUsers);
// ============================================================
// POST /admin/users/:id/ban - 封禁用户
// ============================================================
router.post('/users/:id/ban', [
    (0, express_validator_1.param)('id').isUUID().withMessage('用户ID格式错误'),
    (0, express_validator_1.body)('reason').isString().isLength({ min: 10 }).withMessage('封禁理由至少10字'),
    (0, express_validator_1.body)('duration').optional().isInt({ min: 1 }).withMessage('封禁时长必须为正整数'),
], controller.banUser);
// ============================================================
// POST /admin/users/:id/unban - 解封用户
// ============================================================
router.post('/users/:id/unban', [(0, express_validator_1.param)('id').isUUID().withMessage('用户ID格式错误')], controller.unbanUser);
// ============================================================
// GET /admin/tasks - 任务列表
// ============================================================
router.get('/tasks', controller.getTasks);
// ============================================================
// POST /admin/tasks/:id/review - 审核任务
// ============================================================
router.post('/tasks/:id/review', [
    (0, express_validator_1.param)('id').isUUID().withMessage('任务ID格式错误'),
    (0, express_validator_1.body)('action').isIn(['approve', 'reject']).withMessage('操作必须是approve或reject'),
    (0, express_validator_1.body)('notes').optional().isString().withMessage('备注必须是字符串'),
], controller.reviewTask);
// ============================================================
// GET /admin/withdrawals - 提现申请列表
// ============================================================
router.get('/withdrawals', controller.getWithdrawals);
// ============================================================
// POST /admin/withdrawals/:id/process - 处理提现申请
// ============================================================
router.post('/withdrawals/:id/process', [
    (0, express_validator_1.param)('id').isUUID().withMessage('提现ID格式错误'),
    (0, express_validator_1.body)('action').isIn(['approve', 'reject']).withMessage('操作必须是approve或reject'),
    (0, express_validator_1.body)('notes').optional().isString().withMessage('备注必须是字符串'),
], controller.processWithdrawal);
// ============================================================
// GET /admin/logs - 操作日志
// ============================================================
router.get('/logs', controller.getLogs);
exports.default = router;
//# sourceMappingURL=adminRoutes.js.map