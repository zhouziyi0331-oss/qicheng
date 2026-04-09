"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const controller_1 = require("./controller");
const router = (0, express_1.Router)();
// 所有路由都需要认证
router.use(auth_1.authenticate);
// 获取通知列表
router.get('/', controller_1.getNotifications);
// 获取未读数量
router.get('/unread-count', controller_1.getUnreadCountHandler);
// 标记单个通知为已读
router.put('/:notificationId/read', controller_1.markNotificationAsRead);
// 标记所有通知为已读
router.put('/read-all', controller_1.markAllNotificationsAsRead);
// 删除通知
router.delete('/:notificationId', controller_1.deleteNotification);
// 获取通知偏好设置
router.get('/preferences', controller_1.getNotificationPreferences);
// 更新通知偏好设置
router.put('/preferences', controller_1.updateNotificationPreferences);
exports.default = router;
//# sourceMappingURL=index.js.map