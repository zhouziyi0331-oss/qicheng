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
 * 企业端路由
 * GET  /company/profile  — 获取企业档案
 * POST /company/profile  — 更新企业信息
 * GET  /company/report   — 获取数据报告
 * GET  /company/students/:studentId/profile — 查看学生资料
 * GET  /company/tasks/:taskId/progress — 查看任务进度
 * GET  /company/favorites — 获取收藏的学生列表
 * POST /company/favorites — 收藏学生
 * DELETE /company/favorites/:studentId — 取消收藏学生
 * GET  /company/tasks/:taskId/supplements — 获取追加需求历史
 */
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const controller = __importStar(require("./controller"));
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, (0, auth_1.requireRole)('company'));
router.get('/profile', controller.getProfile);
router.patch('/profile', controller.updateProfile);
router.get('/report', controller.getReport);
router.get('/students/:studentId/profile', controller.getStudentProfile);
router.get('/tasks/:taskId/progress', controller.getTaskProgress);
router.get('/favorites', controller.getFavoriteStudents);
router.post('/favorites', controller.addFavoriteStudent);
router.delete('/favorites/:studentId', controller.removeFavoriteStudent);
router.get('/tasks/:taskId/supplements', controller.getRequirementSupplements);
exports.default = router;
//# sourceMappingURL=index.js.map