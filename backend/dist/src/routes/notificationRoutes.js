"use strict";
/**
 * 通知消息路由
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
const notificationController = __importStar(require("../controllers/notificationController"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// =====================================================
// 所有路由都需要认证
// =====================================================
router.use(auth_1.authenticate);
// =====================================================
// 通知管理路由
// =====================================================
/**
 * 发送通知（管理员）
 * POST /api/v1/notifications/send
 */
router.post('/send', notificationController.sendNotification);
/**
 * 批量发送通知（管理员）
 * POST /api/v1/notifications/send-bulk
 */
router.post('/send-bulk', notificationController.sendBulkNotifications);
/**
 * 获取用户通知列表
 * GET /api/v1/notifications
 * Query: ?isRead=false&category=chat&limit=20&offset=0
 */
router.get('/', notificationController.getUserNotifications);
/**
 * 获取未读消息统计
 * GET /api/v1/notifications/unread-count
 */
router.get('/unread-count', notificationController.getUnreadCount);
/**
 * 标记通知已读
 * PUT /api/v1/notifications/:notificationId/read
 */
router.put('/:notificationId/read', notificationController.markAsRead);
/**
 * 批量标记已读
 * PUT /api/v1/notifications/read-all
 */
router.put('/read-all', notificationController.markAllAsRead);
/**
 * 删除通知
 * DELETE /api/v1/notifications/:notificationId
 */
router.delete('/:notificationId', notificationController.deleteNotification);
// =====================================================
// 通知设置路由
// =====================================================
/**
 * 获取用户通知设置
 * GET /api/v1/notifications/settings
 */
router.get('/settings', notificationController.getUserSettings);
/**
 * 更新用户通知设置
 * PUT /api/v1/notifications/settings
 */
router.put('/settings', notificationController.updateUserSettings);
// =====================================================
// 通知模板路由
// =====================================================
/**
 * 获取通知模板
 * GET /api/v1/notifications/templates/:templateKey
 */
router.get('/templates/:templateKey', notificationController.getTemplate);
/**
 * 获取所有模板
 * GET /api/v1/notifications/templates
 * Query: ?userType=student
 */
router.get('/templates', notificationController.getAllTemplates);
exports.default = router;
//# sourceMappingURL=notificationRoutes.js.map