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
const controller = __importStar(require("./controller"));
const router = (0, express_1.Router)();
// ============================================================
// POST /challenge/start - 开始跳级挑战测试
// ============================================================
router.post('/start', auth_1.authenticate, [
    (0, express_validator_1.body)('targetLevel').isInt({ min: 1, max: 5 }).withMessage('目标等级必须在1-5之间'),
], controller.startChallenge);
// ============================================================
// POST /challenge/submit - 提交跳级挑战答案
// ============================================================
router.post('/submit', auth_1.authenticate, [
    (0, express_validator_1.body)('challengeId').isUUID().withMessage('挑战ID格式错误'),
    (0, express_validator_1.body)('answers').isArray({ min: 10, max: 10 }).withMessage('必须提交10道题的答案'),
], controller.submitChallenge);
// ============================================================
// GET /challenge/history - 获取挑战历史
// ============================================================
router.get('/history', auth_1.authenticate, controller.getChallengeHistory);
exports.default = router;
//# sourceMappingURL=index.js.map