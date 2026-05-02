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
const authController = __importStar(require("./authController"));
const router = (0, express_1.Router)();
// 管理员登录（无需认证）
router.post('/login', [
    (0, express_validator_1.body)('username').notEmpty().withMessage('用户名不能为空'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('密码不能为空')
], authController.login);
// 获取当前管理员信息（需要认证）
router.get('/me', auth_1.authenticate, authController.getCurrentAdmin);
// 修改密码（需要认证）
router.post('/change-password', [
    auth_1.authenticate,
    (0, express_validator_1.body)('oldPassword').notEmpty().withMessage('原密码不能为空'),
    (0, express_validator_1.body)('newPassword').isLength({ min: 6 }).withMessage('新密码至少6位')
], authController.changePassword);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map