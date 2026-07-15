"use strict";
/**
 * 任务邀约路由
 *
 * 定向邀约系统的API端点
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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const invitationController = __importStar(require("../controllers/invitationController"));
const router = (0, express_1.Router)();
// ==========================================
// 学生端接口
// ==========================================
/**
 * 获取我的邀约列表
 * GET /api/v1/invitations/my-invitations
 */
router.get('/my-invitations', auth_1.authenticate, invitationController.getMyInvitations);
/**
 * 获取邀约详情
 * GET /api/v1/invitations/:invitationId
 */
router.get('/:invitationId', auth_1.authenticate, invitationController.getInvitationDetail);
/**
 * 接受邀约
 * POST /api/v1/invitations/:invitationId/accept
 */
router.post('/:invitationId/accept', auth_1.authenticate, invitationController.acceptInvitation);
/**
 * AI能力核验
 * POST /api/v1/invitations/:invitationId/verify
 */
router.post('/:invitationId/verify', auth_1.authenticate, invitationController.verifyCapability);
/**
 * 拒绝邀约
 * POST /api/v1/invitations/:invitationId/decline
 */
router.post('/:invitationId/decline', auth_1.authenticate, invitationController.declineInvitation);
// ==========================================
// 管理员接口
// ==========================================
/**
 * 手动触发过期检查
 * POST /api/v1/invitations/expire-old
 */
router.post('/expire-old', auth_1.authenticate, invitationController.expireOldInvitations);
// ==========================================
// 内部接口（供匹配引擎调用）
// ==========================================
/**
 * 创建单个邀约
 * POST /api/v1/invitations/create
 */
router.post('/create', auth_1.authenticate, invitationController.createInvitation);
/**
 * 批量创建邀约
 * POST /api/v1/invitations/batch-create
 */
router.post('/batch-create', auth_1.authenticate, invitationController.batchCreateInvitations);
exports.default = router;
//# sourceMappingURL=invitations.js.map