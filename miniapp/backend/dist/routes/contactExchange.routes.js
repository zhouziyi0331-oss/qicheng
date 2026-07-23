"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const contactExchange_controller_1 = require("../controllers/contactExchange.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// 获取可交换联系方式的合作伙伴列表
router.get('/partners', (req, res) => contactExchange_controller_1.contactExchangeController.getPartners(req, res));
// 请求交换联系方式
router.post('/request', (req, res) => contactExchange_controller_1.contactExchangeController.requestExchange(req, res));
// 确认交换
router.post('/confirm', (req, res) => contactExchange_controller_1.contactExchangeController.confirmExchange(req, res));
// 查询交换状态
router.get('/status/:partnerId', (req, res) => contactExchange_controller_1.contactExchangeController.getExchangeStatus(req, res));
// 获取已交换的联系方式
router.get('/contact/:partnerId', (req, res) => contactExchange_controller_1.contactExchangeController.getExchangedContact(req, res));
exports.default = router;
//# sourceMappingURL=contactExchange.routes.js.map