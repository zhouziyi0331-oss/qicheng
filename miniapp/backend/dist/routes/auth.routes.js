"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const router = (0, express_1.Router)();
// 微信小程序登录
router.post('/wechat-login', (req, res) => auth_controller_1.authController.wechatLogin(req, res));
// 刷新Token
router.post('/refresh-token', (req, res) => auth_controller_1.authController.refreshToken(req, res));
// 获取用户信息
router.get('/profile', (req, res) => auth_controller_1.authController.getProfile(req, res));
// 更新用户信息
router.put('/profile', (req, res) => auth_controller_1.authController.updateProfile(req, res));
exports.default = router;
//# sourceMappingURL=auth.routes.js.map