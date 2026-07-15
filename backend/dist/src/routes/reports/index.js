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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 指令5: OPC成长报告系统 (永远收费)
 * GET  /reports              — 报告列表 + 预览钩子
 * POST /reports/order        — 购买报告
 * GET  /reports/:id          — 获取已购报告内容
 *
 * Phase R5: 企业查看学生报告
 * GET  /reports/enterprise/student/:studentId  — 企业查看学生报告
 * POST /reports/enterprise/purchase            — 企业购买报告访问权限
 * GET  /reports/enterprise/access-history      — 企业查看访问历史
 * GET  /reports/enterprise/purchases           — 企业查看购买记录
 *
 * Phase R5.2: 学生报告功能扩展
 * GET  /reports/student/my-report              — 学生查看自己报告
 * GET  /reports/student/who-viewed             — 学生查看谁看了报告
 * PUT  /reports/student/visibility             — 学生设置报告可见性
 * GET  /reports/student/stats                  — 学生查看报告统计
 * POST /reports/student/share-link             — 学生生成分享链接
 * GET  /reports/student/share-links            — 学生查看分享链接
 * DELETE /reports/student/share-links/:linkId  — 学生删除分享链接
 *
 * Phase R5.2: 公共分享访问
 * GET  /reports/shared/:shareToken             — 通过分享链接访问报告（无需认证）
 * GET  /reports/shared/:shareToken/validate    — 验证分享链接
 */
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const controller = __importStar(require("./controller"));
const enterpriseRoutes_1 = __importDefault(require("./enterpriseRoutes"));
const studentRoutes_1 = __importDefault(require("./studentRoutes"));
const sharedRoutes_1 = __importDefault(require("./sharedRoutes"));
const router = (0, express_1.Router)();
// Phase R5: 企业报告路由（必须在学生路由之前，避免requireRole冲突）
router.use('/enterprise', enterpriseRoutes_1.default);
// Phase R5.2: 学生报告扩展路由
router.use('/student', studentRoutes_1.default);
// Phase R5.2: 公共分享访问路由（无需认证）
router.use('/shared', sharedRoutes_1.default);
// 学生报告路由（原有功能）
router.use(auth_1.authenticate, (0, auth_1.requireRole)('student'));
router.get('/', controller.listReports);
router.post('/order', controller.orderReport);
router.get('/:id', controller.getReport);
router.get('/:id/pdf', controller.downloadReportPDF);
exports.default = router;
//# sourceMappingURL=index.js.map