"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const controller_1 = require("./controller");
const router = (0, express_1.Router)();
// 学生/企业端路由
router.post('/', auth_1.authenticate, controller_1.createDispute); // 创建申诉
router.get('/my', auth_1.authenticate, controller_1.getMyDisputes); // 获取我的申诉列表
router.get('/:disputeId', auth_1.authenticate, controller_1.getDisputeDetail); // 获取申诉详情
// 管理员端路由
router.get('/', auth_1.authenticate, controller_1.getAllDisputes); // 获取所有申诉列表（管理员）
router.post('/:disputeId/handle', auth_1.authenticate, controller_1.handleDispute); // 处理申诉（管理员）
exports.default = router;
//# sourceMappingURL=index.js.map