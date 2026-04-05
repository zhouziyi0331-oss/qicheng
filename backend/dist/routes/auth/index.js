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
 * 指令1: 用户注册登录模块
 * POST /auth/register       — 注册 (学生/企业角色注册时锁定，不可更改)
 * POST /auth/login          — 登录
 * POST /auth/send-code      — 发送手机验证码
 * POST /auth/refresh        — 刷新 access token
 * POST /auth/logout         — 登出 (撤销 refresh token)
 */
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_1 = require("../../middleware/auth");
const controller = __importStar(require("./controller"));
const router = (0, express_1.Router)();
// 发送验证码
router.post('/send-code', (0, express_validator_1.body)('phone').matches(/^1[3-9]\d{9}$/).withMessage('手机号格式不正确'), controller.sendVerificationCode);
// 注册
router.post('/register', (0, express_validator_1.body)('phone').matches(/^1[3-9]\d{9}$/).withMessage('手机号格式不正确'), (0, express_validator_1.body)('code').isLength({ min: 4, max: 6 }).withMessage('验证码格式不正确'), (0, express_validator_1.body)('role').isIn(['student', 'company']).withMessage('角色必须是 student 或 company'), (0, express_validator_1.body)('password').isLength({ min: 8 }).withMessage('密码至少8位'), controller.register);
// 登录
router.post('/login', (0, express_validator_1.body)('phone').matches(/^1[3-9]\d{9}$/).withMessage('手机号格式不正确'), controller.login);
// 刷新令牌
router.post('/refresh', (0, express_validator_1.body)('refreshToken').notEmpty(), controller.refreshToken);
// 登出
router.post('/logout', auth_1.authenticate, controller.logout);
exports.default = router;
//# sourceMappingURL=index.js.map