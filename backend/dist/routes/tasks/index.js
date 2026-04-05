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
 * 指令4: 任务系统全流程
 * GET  /tasks/recommended          — 学生: 获取定向推送任务(2-3个)
 * POST /tasks/:id/accept           — 学生: 接单
 * GET  /tasks/:id/steps            — 学生: 获取任务步骤
 * POST /tasks/:id/steps/:num/done  — 学生: 完成一个子步骤
 * POST /tasks/:id/submit           — 学生: 提交交付物
 * POST /company/tasks              — 企业: 发布任务
 * GET  /company/tasks              — 企业: 获取任务列表
 * POST /company/tasks/:id/approve  — 企业: 验收通过
 * POST /company/tasks/:id/reject   — 企业: 验收打回
 */
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const studentCtrl = __importStar(require("./studentController"));
const companyCtrl = __importStar(require("./companyController"));
const router = (0, express_1.Router)();
// 学生端 (需学生角色)
router.get('/recommended', auth_1.authenticate, (0, auth_1.requireRole)('student'), studentCtrl.getRecommendedTasks);
router.post('/:id/accept', auth_1.authenticate, (0, auth_1.requireRole)('student'), studentCtrl.acceptTask);
router.get('/:id/steps', auth_1.authenticate, (0, auth_1.requireRole)('student'), studentCtrl.getTaskSteps);
router.post('/:id/steps/:num/done', auth_1.authenticate, (0, auth_1.requireRole)('student'), studentCtrl.completeStep);
router.post('/:id/submit', auth_1.authenticate, (0, auth_1.requireRole)('student'), studentCtrl.submitTask);
// 企业端
router.post('/company', auth_1.authenticate, (0, auth_1.requireRole)('company'), companyCtrl.createTask);
router.get('/company', auth_1.authenticate, (0, auth_1.requireRole)('company'), companyCtrl.getCompanyTasks);
router.post('/company/:id/approve', auth_1.authenticate, (0, auth_1.requireRole)('company'), companyCtrl.approveTask);
router.post('/company/:id/reject', auth_1.authenticate, (0, auth_1.requireRole)('company'), companyCtrl.rejectTask);
exports.default = router;
//# sourceMappingURL=index.js.map