"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const companyController_1 = require("./companyController");
const router = (0, express_1.Router)();
// 企业列表
router.get('/', companyController_1.getCompanyList);
// 待审核企业列表
router.get('/pending-verifications', companyController_1.getPendingVerifications);
// 企业详情
router.get('/:id', companyController_1.getCompanyDetail);
// 审核企业认证
router.post('/:id/verify', companyController_1.verifyCompany);
// 企业需求管理
router.get('/:id/tasks', companyController_1.getCompanyTasks);
exports.default = router;
//# sourceMappingURL=companyRoutes.js.map