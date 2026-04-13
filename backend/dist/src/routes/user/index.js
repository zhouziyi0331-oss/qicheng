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
 * 用户个人资料路由
 * GET /user/profile              — 获取当前用户资料
 * PUT /user/profile              — 更新完整资料
 * PUT /user/profile/nickname     — 更新昵称
 * PUT /user/profile/avatar       — 更新头像
 * POST /user/profile/upload-avatar — 获取头像上传URL
 * POST /user/bind-phone          — 绑定手机号
 */
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_1 = require("../../middleware/auth");
const profileController = __importStar(require("./profileController"));
const router = (0, express_1.Router)();
// 所有路由都需要认证
router.use(auth_1.authenticate);
// 获取个人资料
router.get('/profile', profileController.getProfile);
// 更新昵称
router.put('/profile/nickname', (0, express_validator_1.body)('nickname').notEmpty().withMessage('昵称不能为空'), profileController.updateNickname);
// 更新头像
router.put('/profile/avatar', (0, express_validator_1.body)('avatar').notEmpty().withMessage('头像URL不能为空'), profileController.updateAvatar);
// 更新完整资料
router.put('/profile', profileController.updateProfile);
// 获取头像上传URL
router.post('/profile/upload-avatar', profileController.getAvatarUploadUrl);
// 绑定手机号
router.post('/bind-phone', (0, express_validator_1.body)('phone').notEmpty().withMessage('手机号不能为空'), (0, express_validator_1.body)('code').notEmpty().withMessage('验证码不能为空'), profileController.bindPhone);
exports.default = router;
//# sourceMappingURL=index.js.map