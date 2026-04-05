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
 * 指令8: 支付与提现系统
 * POST /payments/withdraw     — 学生申请提现
 * GET  /payments/balance      — 获取余额
 * GET  /payments/history      — 收支历史
 * POST /payments/notify/wechat — 微信支付回调
 * POST /payments/notify/alipay — 支付宝回调
 */
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const controller = __importStar(require("./controller"));
const router = (0, express_1.Router)();
// 学生端
router.get('/balance', auth_1.authenticate, (0, auth_1.requireRole)('student'), controller.getBalance);
router.get('/history', auth_1.authenticate, (0, auth_1.requireRole)('student'), controller.getHistory);
router.post('/withdraw', auth_1.authenticate, (0, auth_1.requireRole)('student'), controller.requestWithdrawal);
// 支付回调 (不需要 JWT 认证, 由支付平台签名验证)
router.post('/notify/wechat', controller.wechatNotify);
router.post('/notify/alipay', controller.alipayNotify);
exports.default = router;
//# sourceMappingURL=index.js.map