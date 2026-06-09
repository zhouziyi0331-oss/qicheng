"use strict";
/**
 * 平台管理增强路由
 *
 * 定义提现审核、用户认证、任务审核、风险预警等管理功能的API路由
 */
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
const express_1 = __importDefault(require("express"));
const platformAdminController = __importStar(require("../../controllers/platformAdminController"));
const auth_1 = require("../../middleware/auth");
const router = express_1.default.Router();
// =====================================================
// 所有路由都需要管理员认证
// =====================================================
router.use(auth_1.authenticate);
// =====================================================
// 提现审核路由
// =====================================================
/**
 * 获取待审核提现列表
 * GET /api/v1/admin/platform/withdrawals/pending
 */
router.get('/withdrawals/pending', platformAdminController.getPendingWithdrawals);
/**
 * 批准提现
 * POST /api/v1/admin/platform/withdrawals/:id/approve
 */
router.post('/withdrawals/:id/approve', platformAdminController.approveWithdrawal);
/**
 * 拒绝提现
 * POST /api/v1/admin/platform/withdrawals/:id/reject
 */
router.post('/withdrawals/:id/reject', platformAdminController.rejectWithdrawal);
// =====================================================
// 用户认证审核路由
// =====================================================
/**
 * 获取待审核用户认证列表
 * GET /api/v1/admin/platform/verifications/pending
 */
router.get('/verifications/pending', platformAdminController.getPendingVerifications);
/**
 * 批准用户认证
 * POST /api/v1/admin/platform/verifications/:id/approve
 */
router.post('/verifications/:id/approve', platformAdminController.approveVerification);
/**
 * 拒绝用户认证
 * POST /api/v1/admin/platform/verifications/:id/reject
 */
router.post('/verifications/:id/reject', platformAdminController.rejectVerification);
// =====================================================
// 任务审核路由
// =====================================================
/**
 * 审核任务
 * POST /api/v1/admin/platform/tasks/:id/review
 */
router.post('/tasks/:id/review', platformAdminController.reviewTask);
// =====================================================
// 评价管理路由
// =====================================================
/**
 * 隐藏评价
 * POST /api/v1/admin/platform/ratings/:id/hide
 */
router.post('/ratings/:id/hide', platformAdminController.hideRating);
// =====================================================
// 风险预警路由
// =====================================================
/**
 * 创建风险预警
 * POST /api/v1/admin/platform/risk-alerts
 */
router.post('/risk-alerts', platformAdminController.createRiskAlert);
/**
 * 获取风险预警列表
 * GET /api/v1/admin/platform/risk-alerts
 */
router.get('/risk-alerts', platformAdminController.getRiskAlerts);
// =====================================================
// 平台指标路由
// =====================================================
/**
 * 获取平台指标
 * GET /api/v1/admin/platform/metrics
 */
router.get('/metrics', platformAdminController.getPlatformMetrics);
/**
 * 计算每日指标
 * POST /api/v1/admin/platform/metrics/calculate
 */
router.post('/metrics/calculate', platformAdminController.calculateDailyMetrics);
// =====================================================
// 系统配置路由
// =====================================================
/**
 * 获取系统配置
 * GET /api/v1/admin/platform/config/:key
 */
router.get('/config/:key', platformAdminController.getSystemConfig);
/**
 * 更新系统配置
 * PUT /api/v1/admin/platform/config/:key
 */
router.put('/config/:key', platformAdminController.updateSystemConfig);
// =====================================================
// 待审核项目汇总路由
// =====================================================
/**
 * 获取所有待审核项目
 * GET /api/v1/admin/platform/pending-reviews
 */
router.get('/pending-reviews', platformAdminController.getPendingReviews);
exports.default = router;
//# sourceMappingURL=platformRoutes.js.map